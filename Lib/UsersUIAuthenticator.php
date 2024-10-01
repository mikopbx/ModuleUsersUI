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


use MikoPBX\AdminCabinet\Controllers\SessionController;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use Phalcon\Di\Injectable;

class UsersUIAuthenticator extends Injectable
{
    private string $login;
    private string $password;

    public function __construct(string $login, string $password)
    {
        $this->login = $login;
        $this->password = $password;
    }

    public function authenticate(): array
    {
        $parameters = [
            'columns' => [
                'homePage' => 'AccessGroups.homePage',
                'accessGroupId' => 'AccessGroups.id',
                'enabled' => 'UsersCredentials.enabled',
                'useLdapAuth' => 'UsersCredentials.use_ldap_auth',
                'userPasswordHash' => 'UsersCredentials.user_password',
            ],
            'models' => [
                'UsersCredentials' => UsersCredentials::class,
            ],
            'conditions' => 'user_login=:login:',
            'bind' => [
                'login' => $this->login,
            ],
            'joins' => [
                'AccessGroups' => [
                    0 => AccessGroups::class,
                    1 => 'AccessGroups.id = UsersCredentials.user_access_group_id',
                    2 => 'AccessGroups',
                    3 => 'INNER',
                ],
            ],
        ];

        $userData = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery()->getSingleResult();
        if ($userData) {
            if ($userData->enabled === '0') {
                return [];
            }

            $successAuthData = [
                SessionController::ROLE => Constants::MODULE_ROLE_PREFIX.$userData->accessGroupId,
                SessionController::HOME_PAGE => $userData->homePage ?? $this->url->get('session/end'),
                SessionController::USER_NAME => $this->login,
            ];

            if ($userData->useLdapAuth == '1') {
                // Authenticate via LDAP
                $ldapCredentials = LdapConfig::findFirst();
                if ($ldapCredentials) {
                    $ldapAuth = new UsersUILdapAuth($ldapCredentials->toArray());
                    if ($ldapAuth->checkAuthViaLdap($this->login, $this->password)) {
                        return $successAuthData;
                    }
                }
            } else {
                // Authenticate via password
                $security = new (MikoPBXVersion::getSecurityClass());
                if ($security->checkHash($this->password, $userData->userPasswordHash)) {
                    return $successAuthData;
                }
            }
        }

        return [];
    }
}