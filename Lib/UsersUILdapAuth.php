<?php

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2023 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

namespace Modules\ModuleUsersUI\Lib;

use LdapRecord\Auth\Events\Failed;
use LdapRecord\Container;
use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Common\Providers\LoggerAuthProvider;
use Phalcon\Di\Injectable;

include_once __DIR__ . '/../vendor/autoload.php';

/**
 * @property \MikoPBX\Common\Providers\TranslationProvider translation
 */
class UsersUILdapAuth extends Injectable
{
    private string $serverName;
    private string $serverPort;
    private string $tlsMode;
    private bool $verifyCert;
    private string $caBundlePath = '';

    /**
     * True once this connector has mutated the process-wide libldap TLS
     * defaults via ldap_set_option(null, ...). Controls whether __destruct()
     * needs to reset those defaults so the next request served by this PHP-FPM
     * worker starts from a clean slate instead of inheriting our policy.
     */
    private bool $processWideOptionsDirty = false;

    private string $baseDN;
    private string $administrativeLogin;
    private string $administrativePassword;
    private string $userIdAttribute;
    private string $organizationalUnit;
    private string $userFilter;

    private \LdapRecord\Connection $connection;

    /**
     * The class of the user model based on LDAP type.
     *
     * @var string
     */
    private string $userModelClass;

    public function __construct(array $ldapCredentials)
    {
        $this->serverName = $ldapCredentials['serverName'];
        $this->serverPort = $ldapCredentials['serverPort'];
        $this->baseDN = $ldapCredentials['baseDN'];
        $this->administrativeLogin = $ldapCredentials['administrativeLogin'];
        $this->administrativePassword = $ldapCredentials['administrativePassword'];
        $this->userIdAttribute = $ldapCredentials['userIdAttribute'];
        $this->organizationalUnit = $ldapCredentials['organizationalUnit'];
        $this->userFilter = $ldapCredentials['userFilter'];

        // Back-compat: legacy deployments ship only `useTLS`. Map '1' onto STARTTLS.
        $tlsMode = $ldapCredentials['tlsMode'] ?? null;
        if ($tlsMode === null || $tlsMode === '') {
            $tlsMode = (($ldapCredentials['useTLS'] ?? '0') === '1') ? 'starttls' : 'none';
        }
        $this->tlsMode = in_array($tlsMode, ['none', 'starttls', 'ldaps'], true) ? $tlsMode : 'none';

        // HTML checkboxes submit "on" when checked; normalise that and any other
        // truthy form values so test-bind and save paths agree on meaning.
        $verifyRaw = strtolower((string)($ldapCredentials['verifyCert'] ?? '0'));
        $this->verifyCert = in_array($verifyRaw, ['1', 'on', 'true', 'yes'], true);

        $this->userModelClass = $this->getUserModelClass($ldapCredentials['ldapType']);

        $this->connection = $this->buildConnection($ldapCredentials['caCertificate'] ?? null);
    }

    /**
     * Cleans up the CA bundle written for this session and resets the
     * process-wide libldap TLS defaults so a later connector in the same
     * PHP-FPM / worker process doesn't inherit our REQUIRE_CERT policy or a
     * dangling pointer to our already-unlinked CA bundle. Called whether or
     * not a custom bundle was ever materialised — otherwise a single request
     * that enabled strict verification would silently tighten every
     * subsequent LDAP request handled by the same worker.
     */
    public function __destruct()
    {
        if ($this->caBundlePath !== '' && is_file($this->caBundlePath)) {
            @unlink($this->caBundlePath);
        }

        if (!$this->processWideOptionsDirty) {
            return;
        }

        // Repoint libldap at a permissive default (accept any cert) and the
        // detected system trust store. This matches the pre-module default on
        // MikoPBX and guarantees no per-request state leaks across binds.
        @ldap_set_option(null, LDAP_OPT_X_TLS_REQUIRE_CERT, LDAP_OPT_X_TLS_ALLOW);
        @ldap_set_option(null, LDAP_OPT_X_TLS_CACERTFILE, self::systemDefaultCaFile());
    }

    /**
     * Builds the LdapRecord connection using the configured transport mode and
     * certificate-validation settings. Shared by auth and listing paths so the
     * TLS setup stays in one place.
     */
    private function buildConnection(?string $caCertificate): \LdapRecord\Connection
    {
        $tlsOptions = $this->buildTlsOptions($caCertificate);

        // libldap freezes its TLS context the moment ldap_connect() is called
        // for ldaps://. If REQUIRE_CERT / CACERTFILE are set afterwards on the
        // connection resource (which is what LdapRecord does via setOptions),
        // they apply only after an explicit LDAP_OPT_X_TLS_NEWCTX rebuild —
        // and even then not on every libldap build. To guarantee the chosen
        // verification policy actually takes effect we set these options as
        // PROCESS-WIDE defaults BEFORE the LdapRecord connection is created.
        foreach ($tlsOptions as $opt => $val) {
            @ldap_set_option(null, $opt, $val);
        }
        // Remember that we touched process-wide defaults so __destruct()
        // can restore benign values before the next request reuses this worker.
        $this->processWideOptionsDirty = true;

        // On builds where PHP exposes LDAP_OPT_X_TLS_NEWCTX (libldap 2.4+),
        // also queue a per-connection TLS context rebuild after LdapRecord
        // re-applies the same options on the resource.
        if (defined('LDAP_OPT_X_TLS_NEWCTX')) {
            $tlsOptions[constant('LDAP_OPT_X_TLS_NEWCTX')] = 0;
        }

        return new \LdapRecord\Connection([
            'hosts'    => [$this->serverName],
            'port'     => $this->serverPort,
            'base_dn'  => $this->baseDN,
            'username' => $this->administrativeLogin,
            'password' => $this->administrativePassword,
            'timeout'  => 15,
            'use_tls'  => $this->tlsMode === 'starttls',
            'use_ssl'  => $this->tlsMode === 'ldaps',
            'options'  => $tlsOptions,
        ]);
    }

    /**
     * Build the `options` array passed to LdapRecord\Connection.
     * Sets `LDAP_OPT_X_TLS_REQUIRE_CERT` based on the verifyCert flag and
     * always writes `LDAP_OPT_X_TLS_CACERTFILE` — either to the freshly
     * materialised custom bundle or to the system trust store. Explicitly
     * writing the option every time prevents a stale per-process CACERTFILE
     * (set by a previous connector that has since been destroyed) from
     * leaking into a later connection's TLS context.
     *
     * @return array<int,int|string>
     */
    private function buildTlsOptions(?string $caCertificate): array
    {
        $options = [
            LDAP_OPT_X_TLS_REQUIRE_CERT => $this->verifyCert
                ? LDAP_OPT_X_TLS_HARD
                : LDAP_OPT_X_TLS_ALLOW,
        ];

        $caFile = self::systemDefaultCaFile();
        if ($this->verifyCert && !empty($caCertificate)) {
            $path = $this->materializeCaBundle($caCertificate);
            if ($path !== '') {
                $this->caBundlePath = $path;
                $caFile = $path;
            }
        }
        $options[LDAP_OPT_X_TLS_CACERTFILE] = $caFile;

        return $options;
    }

    /**
     * Probes a short list of well-known CA bundle locations and returns the
     * first readable one. The result is cached for the lifetime of the
     * process. Returns an empty string when no bundle is found — libldap
     * will then fall back to its compiled-in default.
     */
    private static function systemDefaultCaFile(): string
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }
        $candidates = [
            '/etc/ssl/certs/ca-certificates.crt',   // Debian / Alpine / MikoPBX
            '/etc/pki/tls/certs/ca-bundle.crt',     // RHEL / CentOS
            '/etc/ssl/cert.pem',                    // macOS / BSD
        ];
        foreach ($candidates as $path) {
            if (@is_readable($path)) {
                return $cached = $path;
            }
        }
        return $cached = '';
    }

    /**
     * Writes the PEM bundle into a process-private temp file (mode 0600) so
     * that libldap can load it. The file is removed in __destruct().
     */
    private function materializeCaBundle(string $pem): string
    {
        $tmpDir = sys_get_temp_dir();
        $path = tempnam($tmpDir, 'users-ui-ldap-ca-');
        if ($path === false) {
            return '';
        }
        if (file_put_contents($path, $pem) === false) {
            @unlink($path);
            return '';
        }
        @chmod($path, 0600);
        return $path;
    }

    /**
     * Check authentication via LDAP.
     *
     * @param string $username The username for authentication.
     * @param string $password The password for authentication.
     * @param string $message The error message.
     * @return bool The authentication result.
     */
    public function checkAuthViaLdap(string $username, string $password, string &$message = ''): bool
    {
        $success = false;
        $message = $this->translation->_('module_usersui_ldap_user_not_found');
        try {
            $this->connection->connect();
            Container::addConnection($this->connection);

            $dispatcher = Container::getEventDispatcher();

            // Listen for failed authentication event
            $dispatcher->listen(Failed::class, function (Failed $event) use (&$message) {
                $ldap = $event->getConnection();
                $error = $ldap->getDiagnosticMessage();

                // Update message based on error code
                if (strpos($error, '532') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_password_expired');
                } elseif (strpos($error, '533') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_disabled');
                } elseif (strpos($error, '701') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_expired');
                } elseif (strpos($error, '775') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_locked');
                } else {
                    $message = $this->translation->_('module_usersui_ldap_password_incorrect');
                }
            });

            // Query LDAP for the user
            $query = call_user_func([$this->userModelClass, 'query']);

            if ($this->userFilter !== '') {
                $query->rawFilter($this->userFilter);
            }
            if ($this->organizationalUnit !== '') {
                $query->in($this->organizationalUnit);
            }

            $user = $query->where($this->userIdAttribute, '=', $username)->first();

            if ($user) {
                if ($this->connection->auth()->attempt($user->getDN(), $password)) {
                    $message = $this->translation->_('module_usersui_ldap_successfully_authenticated');
                    $success = true;
                }
            }
        } catch (\Throwable $e) {
            CriticalErrorsHandler::handleExceptionWithSyslog($e);
            $message = $e->getMessage();
        }

        if (!$success) {
            $this->di->get(LoggerAuthProvider::SERVICE_NAME)->warning("LDAP authentication {$username} failed: {$message}");
        }

        return $success;
    }

    /**
     * Lightweight connectivity check. Opens the connection, performs the bind
     * using the configured administrative credentials and immediately returns.
     * Intended for a "Test bind" button — no queries.
     */
    public function testBind(): AnswerStructure
    {
        $res = new AnswerStructure();
        try {
            $this->connection->connect();
            $res->success = true;
            $res->messages[] = $this->translation->_('module_usersui_TestBindSuccess');
        } catch (\LdapRecord\Auth\BindException $e) {
            // Wrong admin credentials, account locked / disabled, etc.
            $res->success = false;
            $res->messages[] = self::flattenLdapException($e);
        } catch (\LdapRecord\LdapRecordException $e) {
            // Expected user-config failures (StartTLS handshake, server
            // unreachable, cert validation, port mismatch). Surface the
            // diagnostic to the user but DO NOT escalate to syslog/Sentry —
            // these are operator errors, not application crashes.
            $res->success = false;
            $res->messages[] = self::flattenLdapException($e);
        } catch (\Throwable $e) {
            // Unexpected: log it for ops, return the message to the user.
            CriticalErrorsHandler::handleExceptionWithSyslog($e);
            $res->success = false;
            $res->messages[] = $e->getMessage();
        }
        return $res;
    }

    /**
     * Concatenates the LdapRecord exception message with its detailed
     * diagnostic (when present) so a single string carries everything the
     * operator needs to fix their setup. `getDetailedError()` is defined on
     * LdapRecordException but may return null when libldap didn't populate
     * a structured diagnostic — guard against that.
     */
    private static function flattenLdapException(\LdapRecord\LdapRecordException $e): string
    {
        $message = $e->getMessage();
        $detail = $e->getDetailedError();
        if ($detail !== null) {
            $diag = $detail->getDiagnosticMessage();
            if ($diag !== null && $diag !== '') {
                $message .= ' — ' . $diag;
            }
        }
        return $message;
    }

    /**
     * Get the class of the user model based on LDAP type.
     *
     * @param string $ldapType The LDAP type.
     * @return string The user model class.
     */
    private function getUserModelClass(string $ldapType): string
    {
        switch ($ldapType) {
            case 'OpenLDAP':
                return \LdapRecord\Models\OpenLDAP\User::class;
            case 'DirectoryServer':
                return \LdapRecord\Models\DirectoryServer\User::class;
            case 'FreeIPA':
                return \LdapRecord\Models\FreeIPA\User::class;
            default:
                return \LdapRecord\Models\ActiveDirectory\User::class;
        }
    }

    /**
     * Get available users list via LDAP.
     *
     * @return AnswerStructure list of users.
     */
    public function getUsersList(): AnswerStructure
    {
        $res = new AnswerStructure();
        $res->success = true;

        $listOfAvailableUsers = [];
        try {
            $this->connection->connect();
            Container::addConnection($this->connection);

            $dispatcher = Container::getEventDispatcher();
            $dispatcher->listen(Failed::class, function (Failed $event) use (&$message) {
                $ldap = $event->getConnection();
                $message = $ldap->getDiagnosticMessage();
            });

            $query = call_user_func([$this->userModelClass, 'query']);

            if ($this->userFilter !== '') {
                $query->rawFilter($this->userFilter);
            }
            if ($this->organizationalUnit !== '') {
                $query->in($this->organizationalUnit);
            }
            $users = $query->get();
            foreach ($users as $user) {
                $record = [];
                if (
                    $user->hasAttribute($this->userIdAttribute)
                    && $user->getFirstAttribute($this->userIdAttribute) !== null
                ) {
                    $record['login'] = $user->getFirstAttribute($this->userIdAttribute);
                    $record['name'] = $user->getFirstAttribute($this->userIdAttribute);
                }
                if (
                    $user->hasAttribute('name')
                    && $user->getFirstAttribute('name') !== null
                ) {
                    $record['name'] = $user->getFirstAttribute('name');
                }
                if (!empty($record)) {
                    $listOfAvailableUsers[] = $record;
                }
            }
            usort($listOfAvailableUsers, function ($a, $b) {
                return strcmp($a['name'], $b['name']);
            });
        } catch (\LdapRecord\Auth\BindException $e) {
            $res->messages[] = $this->translation->_('module_usersui_ldap_user_not_found');
            $res->success = false;
        } catch (\Throwable $e) {
            CriticalErrorsHandler::handleExceptionWithSyslog($e);
            $res->messages[] = $e->getMessage();
            $res->success = false;
        }

        $res->data = $listOfAvailableUsers;
        return $res;
    }
}
