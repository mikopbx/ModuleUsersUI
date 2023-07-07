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

use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Lib\UsersUILdapAuth;
use Modules\ModuleUsersUI\Models\LdapConfig;

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
                case 'useLdapAuthMethod':
                    if (array_key_exists($name, $data)) {
                        $ldapConfig->$name = ($data[$name] === 'on') ? '1' : '0';
                    } else {
                        $ldapConfig->$name = '0';
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

        // Save the ldap config data
        if ($ldapConfig->save() === false) {
            // If there are validation errors, display them and return false
            $errors = $ldapConfig->getMessages();
            $this->flash->error(implode('<br>', $errors));
        }
    }

    /**
     * Check user authentication via LDAP.
     *
     * @return void
     */
    public function checkAuthAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();

        if ($data['administrativePasswordHidden'] === Constants::HIDDEN_PASSWORD) {
            $ldapConfig = LdapConfig::findFirst();
            $data['administrativePassword'] = $ldapConfig->administrativePassword;
        } else {
            $data['administrativePassword'] = $data['administrativePasswordHidden'];
        }

        $ldapCredentials = [
            'serverName' => $data['serverName'],
            'serverPort' => $data['serverPort'],
            'baseDN' => $data['baseDN'],
            'administrativeLogin' => $data['administrativeLogin'],
            'administrativePassword' => $data['administrativePassword'],
            'userIdAttribute' => $data['userIdAttribute'],
            'organizationalUnit' => $data['organizationalUnit'],

        ];
        $ldapAuth = new UsersUILdapAuth($ldapCredentials);
        $message = '';

        // Check authentication via LDAP
        $this->view->success = $ldapAuth->checkAuthViaLdap($data['testLogin'], $data['testPassword'], $message);
        $this->view->message = $message;
    }
}