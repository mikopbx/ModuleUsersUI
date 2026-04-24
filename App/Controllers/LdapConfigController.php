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

namespace Modules\ModuleUsersUI\App\Controllers;

use MikoPBX\Common\Providers\ManagedCacheProvider;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Lib\UsersUILdapAuth;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Phalcon\Cache\Adapter\Redis;
use Phalcon\Storage\Exception;

class LdapConfigController extends ModuleUsersUIBaseController
{
    /**
     * Save LDAP configuration.
     *
     * @return void
     */
    public function saveAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();
        $ldapConfig = LdapConfig::findFirst();

        if (!$ldapConfig) {
            $ldapConfig = new LdapConfig();
        }

        $tlsMode = $data['tlsMode'] ?? 'none';
        if (!in_array($tlsMode, ['none', 'starttls', 'ldaps'], true)) {
            $tlsMode = 'none';
        }
        $data['tlsMode'] = $tlsMode;

        // Normalise the verifyCert checkbox — Fomantic omits the key when unchecked.
        $verifyRaw = strtolower((string)($data['verifyCert'] ?? ''));
        $data['verifyCert'] = in_array($verifyRaw, ['1', 'on', 'true', 'yes'], true) ? '1' : '0';

        // Reject malformed CA PEM before any DB writes so the user gets a clear
        // validation error instead of a cryptic LDAP bind failure later.
        // Only validate when TLS is actually going to be used — the CA textarea
        // is only hidden via CSS, so its previous contents still round-trip on
        // save even when the user flips back to plain LDAP. Blocking save on a
        // CA blob the code is about to ignore would be a regression.
        $caPem = trim((string)($data['caCertificate'] ?? ''));
        $tlsEncrypted = $tlsMode === 'starttls' || $tlsMode === 'ldaps';
        if ($tlsEncrypted && $caPem !== '' && !$this->isValidPem($caPem)) {
            $this->view->success = false;
            $this->view->message = $this->translation->_('module_usersui_InvalidPemCert');
            return;
        }
        // When TLS is off we persist whatever the user had in the textarea as-is
        // (including `''`) — it's unused, and clearing it automatically would
        // lose their paste when they later re-enable encryption.

        // Update ldapConfig properties with the provided data
        foreach ($ldapConfig as $name => $value) {
            switch ($name) {
                case 'id':
                    break;
                case 'useTLS':
                    // Deprecated column kept for upgrade compatibility only.
                    // Never overwrite — the form no longer posts this field and
                    // we want to preserve whatever value the migration wrote.
                    break;
                case 'administrativePassword':
                    if (
                        isset($data['administrativePasswordHidden'])
                        && $data['administrativePasswordHidden'] !== Constants::HIDDEN_PASSWORD
                    ) {
                        $ldapConfig->$name = $data['administrativePasswordHidden'];
                    }
                    break;
                case 'caCertificate':
                    $ldapConfig->$name = $caPem !== '' ? $caPem : null;
                    break;
                default:
                    if (isset($data[$name])) {
                        $ldapConfig->$name = $data[$name];
                    } else {
                        $ldapConfig->$name = '';
                    }
            }
        }

        $this->saveEntity($ldapConfig);
    }

    /**
     * Lightweight validation of a PEM-encoded certificate bundle. Accepts one
     * or more concatenated CERTIFICATE blocks. openssl_x509_parse is used as
     * the authoritative check so garbage (truncated Base64, wrong header, etc.)
     * is rejected here rather than surfacing later as a vague LDAP error.
     */
    private function isValidPem(string $pem): bool
    {
        if (!preg_match_all(
            '/-----BEGIN CERTIFICATE-----.+?-----END CERTIFICATE-----/s',
            $pem,
            $blocks
        )) {
            return false;
        }
        foreach ($blocks[0] as $block) {
            if (openssl_x509_parse($block) === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * Lightweight LDAP bind check using the current form values (or stored
     * password fallback). Exposed so the "Test bind" button can confirm the
     * configured administrative credentials without running a full user sync.
     */
    public function testBindAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();
        $ldapCredentials = $this->prepareLdapCredentialsArrayFromPost($data);
        $ldapAuth = new UsersUILdapAuth($ldapCredentials);

        $result = $ldapAuth->testBind();
        $this->view->success = $result->success;
        $this->view->message = $result->messages;
    }

    /**
     * Prepares the LDAP users list for dropdown fields for ajax requests
     *
     * @param string $pattern for search
     * @return void
     * @throws Exception
     */
    public function searchLdapUserAction(string $pattern = ''): void
    {
        /** @var Redis $redis */
        $redis = $this->di->getShared(ManagedCacheProvider::SERVICE_NAME);
        $cacheKey = 'LdapConfigController:searchLdapUser1';
        if ($redis->has($cacheKey)) {
            $availableUsers = $redis->get($cacheKey, []);
        } else {
            $ldapConfig = LdapConfig::findFirst();
            if ($ldapConfig === null) {
                $this->view->results = [];
                return;
            }
            $ldapCredentials = $ldapConfig->toArray();
            $ldapAuth = new UsersUILdapAuth($ldapCredentials);
            // Get the list of available LDAP users
            $availableUsersResult = $ldapAuth->getUsersList();
            $availableUsers = $availableUsersResult->data;
            $redis->set($cacheKey, $availableUsers, 600);
            $this->view->message = $availableUsersResult->messages;
        }
        $pattern = urldecode($pattern);
        $usersForDropDown = [];
        foreach ($availableUsers as $user) {
            if (
                mb_stripos($user['name'], $pattern) !== false
                || mb_stripos($user['login'], $pattern) !== false
            ) {
                $usersForDropDown[] = [
                    'title' => $user['login'],
                    'description' => $user['name'],
                ];
            }
        }

        // Set the data to be passed to the view
        $this->view->results = $usersForDropDown;
        $this->view->success = count($availableUsers) > 0;
    }

    /**
     * Check user authentication via LDAP.
     *
     * @return void
     */
    public function checkAuthAction(): void
    {
        // Check if the request method is POST
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();

        $ldapCredentials = $this->prepareLdapCredentialsArrayFromPost($data);
        $ldapAuth = new UsersUILdapAuth($ldapCredentials);
        $message = '';

        // Check authentication via LDAP and set the data to be passed to the view
        $this->view->success = $ldapAuth->checkAuthViaLdap($data['testLogin'], $data['testPassword'], $message);
        $this->view->message = $message;
    }

    /**
     * Retrieves the available LDAP users.
     *
     * @return void
     */
    public function getAvailableLdapUsersAction(): void
    {
        // Check if the request method is POST
        if (!$this->request->isPost()) {
            return;
        }
        $data = $this->request->getPost();
        $ldapCredentials = $this->prepareLdapCredentialsArrayFromPost($data);
        $ldapAuth = new UsersUILdapAuth($ldapCredentials);

        // Get the list of available LDAP users
        $availableUsersResult = $ldapAuth->getUsersList();

        // Set the data to be passed to the view
        $this->view->data = $availableUsersResult->data;
        $this->view->success = $availableUsersResult->success;
        $this->view->message = $availableUsersResult->messages;
    }

    /**
     * Prepares the LDAP credentials array from the POST data.
     *
     * @param array $postData The POST data.
     *
     * @return array The prepared LDAP credentials array.
     */
    private function prepareLdapCredentialsArrayFromPost(array $postData): array
    {
        // Admin password can be stored in DB on the time, on this way it has only xxxxxx value.
        // It can be empty as well, if some password manager tried to fill it.
        if (
            empty($postData['administrativePasswordHidden'])
            || $postData['administrativePasswordHidden'] === Constants::HIDDEN_PASSWORD
        ) {
            $ldapConfig = LdapConfig::findFirst();
            $postData['administrativePassword'] = $ldapConfig->administrativePassword ?? '';
        } else {
            $postData['administrativePassword'] = $postData['administrativePasswordHidden'];
        }

        // The CA certificate textarea is only sent when the Certificate tab has
        // been rendered. For test-bind called from tabs that don't expose it,
        // fall back to the stored value so strict-verify connections still work.
        if (!array_key_exists('caCertificate', $postData)) {
            if (!isset($ldapConfig)) {
                $ldapConfig = LdapConfig::findFirst();
            }
            $postData['caCertificate'] = $ldapConfig->caCertificate ?? '';
        }

        return [
            'serverName' => $postData['serverName'] ?? '',
            'serverPort' => $postData['serverPort'] ?? '389',
            'baseDN' => $postData['baseDN'] ?? '',
            'administrativeLogin' => $postData['administrativeLogin'] ?? '',
            'administrativePassword' => $postData['administrativePassword'],
            'userIdAttribute' => $postData['userIdAttribute'] ?? '',
            'organizationalUnit' => $postData['organizationalUnit'] ?? '',
            'userFilter' => $postData['userFilter'] ?? '',
            'tlsMode' => $postData['tlsMode'] ?? 'none',
            'verifyCert' => $postData['verifyCert'] ?? '0',
            'caCertificate' => $postData['caCertificate'] ?? '',
            'ldapType' => $postData['ldapType'] ?? 'ActiveDirectory',
        ];
    }
}
