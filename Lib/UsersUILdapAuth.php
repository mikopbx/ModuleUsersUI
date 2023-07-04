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
use MikoPBX\Common\Providers\LoggerAuthProvider;
use MikoPBX\Core\System\Util;

include_once __DIR__.'/../vendor/autoload.php';

class UsersUILdapAuth extends \Phalcon\Di\Injectable
{
    private string $serverName;
    private string $serverPort;
    private string $baseDN;
    private string $administrativeLogin;
    private string $administrativePassword;
    private string $userIdAttribute;

    private string $organizationalUnit;

    public function __construct(array $ldapCredentials)
    {
        $this->serverName = $ldapCredentials['serverName'];
        $this->serverPort = $ldapCredentials['serverPort'];
        $this->baseDN = $ldapCredentials['baseDN'];
        $this->administrativeLogin = $ldapCredentials['administrativeLogin'];
        $this->administrativePassword = $ldapCredentials['administrativePassword'];
        $this->userIdAttribute = $ldapCredentials['userIdAttribute'];
        $this->organizationalUnit = $ldapCredentials['organizationalUnit'];
    }

    /**
     * Check authentication via LDAP.
     *
     * @param string $username The username for authentication.
     * @param string $password The password for authentication.
     * @param string $message The error message.
     * @return bool The authentication result.
     */
    public function checkAuthViaLdap(string $username, string $password, string &$message=''): bool
    {
        // Create a new LDAP connection
        $connection = new \LdapRecord\Connection([
            'hosts' => [$this->serverName],
            'port' => $this->serverPort,
            'base_dn' => $this->baseDN,
            'username' => $this->administrativeLogin,
            'password' => $this->administrativePassword,
        ]);

        $success = false;
        $message = $this->translation->_('module_usersui_ldap_user_not_found');
        try {
            $connection->connect();

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
            $query = $connection->query()
                ->where($this->userIdAttribute, '=', $username);
            if ($this->organizationalUnit!==''){
                $query->in($this->organizationalUnit);
            }
            $user = $query->first();

            if ($user) {
                // Continue with authentication if user is found and attempt authentication
                if ($connection->auth()->attempt($user['distinguishedname'][0], $password)) {
                    $message = $this->translation->_('module_usersui_ldap_successfully_authenticated');
                    $success = true;
                }
            }
        } catch (\Throwable $e) {
            global $errorLogger;
            $errorLogger->captureException($e);
            Util::sysLogMsg("UsersUILdapAuth_EXCEPTION", $e->getMessage(), LOG_ERR);
            $message = $e->getMessage();
        }

        if (!$success) {
            $this->di->get(LoggerAuthProvider::SERVICE_NAME)->warning("LDAP authentication {$username} failed: {$message}");
        }

        return $success;
    }
}