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
            $ldapConfig->useTLS = '0';
        }

        // Update ldapConfig properties with the provided data
        foreach ($ldapConfig as $name => $value) {
            switch ($name) {
                case 'id':
                    break;
                case 'administrativePassword':
                    if (isset($data['administrativePasswordHidden'])
                        && $data['administrativePasswordHidden'] !== Constants::HIDDEN_PASSWORD) {
                        $ldapConfig->$name = $data['administrativePasswordHidden'];
                    }
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
     * Prepares the LDAP users list for dropdown fields for ajax requests
     *
     * @param string $pattern for search
     * @return void
     * @throws Exception
     */
    public function searchLdapUserAction(string $pattern=''): void
    {
        /** @var Redis $redis */
        $redis = $this->di->getShared(ManagedCacheProvider::SERVICE_NAME);
        $cacheKey = 'LdapConfigController:searchLdapUser1';
        if ($redis->has($cacheKey)) {
            $availableUsers = $redis->get($cacheKey, []);
        } else {
            $ldapCredentials = LdapConfig::findFirst()->toArray();
            $ldapAuth = new UsersUILdapAuth($ldapCredentials);
            // Get the list of available LDAP users
            $availableUsersResult = $ldapAuth->getUsersList();
            $availableUsers = $availableUsersResult->data;
            $redis->set($cacheKey, $availableUsers, 600);
            $this->view->message = $availableUsersResult->messages;
        }
        $pattern = urldecode($pattern);
        $usersForDropDown = [];
        foreach ($availableUsers as $user){
            if (    stripos($user['name'], $pattern)!==false
                || stripos($user['login'], $pattern)!==false){
                $usersForDropDown[]=[
                    'title'=>$user['login'],
                    'description'=>$user['name'],
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
        if (empty($postData['administrativePasswordHidden'])
            || $postData['administrativePasswordHidden'] === Constants::HIDDEN_PASSWORD) {
            $ldapConfig = LdapConfig::findFirst();
            $postData['administrativePassword'] = $ldapConfig->administrativePassword??'';
        } else {
            $postData['administrativePassword'] = $postData['administrativePasswordHidden'];
        }

       return [
            'serverName' => $postData['serverName'],
            'serverPort' => $postData['serverPort'],
            'baseDN' => $postData['baseDN'],
            'administrativeLogin' => $postData['administrativeLogin'],
            'administrativePassword' => $postData['administrativePassword'],
            'userIdAttribute' => $postData['userIdAttribute'],
            'organizationalUnit' => $postData['organizationalUnit'],
            'userFilter' => $postData['userFilter'],
            'useTLS' => $postData['useTLS'],
           'ldapType' => $postData['ldapType'],
        ];
    }
}