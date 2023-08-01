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


use MikoPBX\AdminCabinet\Controllers\ExtensionsController;
use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Sip;
use MikoPBX\Common\Models\Users;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use Phalcon\Security;

class UsersCredentialsController extends ModuleUsersUIBaseController
{
    /**
     * Save the users associated with the group.
     *
     * @param string $accessGroupId The access group ID.
     * @param array $members The set of members of the group.
     * @return bool True if the saving process is successful, false otherwise.
     */
    public function saveUsersCredentials(string $accessGroupId, array $members): bool
    {
        $parameters = [
            'conditions' => 'user_access_group_id=:groupId:',
            'bind' => [
                'groupId' => $accessGroupId,
            ],
        ];

        // 1. Disable all current users before update
        $membersForDisable = UsersCredentials::find($parameters);
        foreach ($membersForDisable as $oldMember) {
            $oldMember->enabled = '0';
            if ($oldMember->save() === false) {
                $errors = $membersForDisable->getMessages();
                $this->flash->error(implode('<br>', $errors));
                return false;
            }
        }

        // 2. If there are no users in the group, disable all and return
        if (count($members) === 0) {
            return true;
        }

        // 3. Move selected users from other groups and create new links for current group members
        $parameters = [
            'models' => [
                'Users' => Users::class,
            ],
            'columns' => [
                'id' => 'Users.id',
                'extension' => 'Sip.extension',
                'password' => 'Sip.secret'
            ],
            'conditions' => 'Users.id IN ({usersIDS:array})',
            'bind' => [
                'usersIDS' => $members,
            ],
            'joins' => [
                'Extensions' => [
                    0 => Extensions::class,
                    1 => 'Extensions.userid = Users.id',
                    2 => 'Extensions',
                    3 => 'INNER',
                ],
                'Sip' => [
                    0 => Sip::class,
                    1 => 'Sip.extension = Extensions.number',
                    2 => 'Sip',
                    3 => 'INNER',
                ],
            ],
        ];
        $query = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
        $newMembers = $query->execute();

        $ldapEnabled = LdapConfig::findFirst()->useLdapAuthMethod ?? '0' === '1';
        $security = new Security();

        foreach ($newMembers as $member) {
            // Find or create a new user credential
            $groupMember = $this->findCreateNewUserCredential($member->id);
            if (empty($groupMember->user_password)){
                $groupMember->user_password = $security->hash($member->password);
                if ($ldapEnabled) {
                    $groupMember->use_ldap_auth = '1';
                } else {
                    $groupMember->use_ldap_auth = '0';
                }
            }
            $groupMember->user_access_group_id = $accessGroupId;
            $groupMember->enabled = '1';
            // Save the updated user credentials
            $this->saveEntity($groupMember);
        }

        return true;
    }

    /**
     * This method is called from BaseController's onAfterExecuteRoute function and the next
     * on UsersUIConf method onAfterExecuteRoute
     *
     * It handles the parent form submission and updates the user credentials.
     *
     * @param ExtensionsController $controller The controller object.
     *
     * @return void
     */
    public function saveUserCredential(ExtensionsController $controller)
    {
        // Get the current user ID from the request
        $currentUserId = $controller->request->getPost('user_id');

        // If the current user ID is not set, return
        if (!isset($currentUserId)) {
            return;
        }

        // Get the access group, user login, and user password from the request
        $accessGroup = $controller->request->getPost('module_users_ui_access_group');
        $userLogin = $controller->request->getPost('module_users_ui_login');
        $userUseLdapAuth = $controller->request->getPost('module_users_ui_use_ldap_auth');
        $userPassword = $controller->request->getPost('module_users_ui_password');

        // Find the user credentials based on the parameters
        $groupMember = $this->findCreateNewUserCredential($currentUserId);

        // Update the user login if it is not empty
        if (!empty($userLogin)) {
            $groupMember->user_login = $userLogin;
        }

        // Update the user password hash if it is not empty
        if (!empty($userPassword) and ($userPassword !== Constants::HIDDEN_PASSWORD)) {
            $security = new Security();
            $groupMember->user_password = $security->hash($userPassword);
        }

        // Update the user use LDAP authentication if it is not empty
        if ($userUseLdapAuth === 'on') {
            $groupMember->use_ldap_auth = '1';
        } else {
            $groupMember->use_ldap_auth = '0';
        }

        // Update the access group and enabled status based on the selected value
        if ($accessGroup === Constants::NO_ACCESS_GROUP_ID) {
            $groupMember->enabled = '0';
        } else {
            $groupMember->user_access_group_id = $accessGroup;
            $groupMember->enabled = '1';
        }

        // Save the updated user credentials
        $this->saveEntity($groupMember);
    }

    /**
     * Handles the action for changing user group.
     *
     * @return void
     */
    public function changeUserUseLdapAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $data = $this->request->getPost();

        // Find or create a new user credential
        $groupMember = $this->findCreateNewUserCredential($data['user_id']);

        if ($data['useLdap'] === 'true') {
            $groupMember->use_ldap_auth = '1';
        } else {
            $groupMember->use_ldap_auth = '0';
        }
        $this->saveEntity($groupMember);
    }

    /**
     * Creates a new user credential entity.
     * @param string $userId
     * @return UsersCredentials
     */
    private function findCreateNewUserCredential(string $userId): UsersCredentials
    {
        $parameters = [
            'conditions' => 'user_id=:userID:',
            'bind' => [
                'userID' => $userId,
            ],
        ];
        $groupMember = UsersCredentials::findFirst($parameters);
        if ($groupMember === null) {
            $groupMember = new UsersCredentials();
            $groupMember->user_id = $userId;
            $groupMember->user_login = "User{$userId}";
        }
        return $groupMember;
    }

    /**
     * Handles the action for changing user group.
     *
     * @return void
     */
    public function changeUserGroupAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $data = $this->request->getPost();

        // Find or create a new user credential
        $groupMember = $this->findCreateNewUserCredential($data['user_id']);

        if ($data['group_id'] === Constants::NO_ACCESS_GROUP_ID) {
            $groupMember->enabled = '0';
        } else {
            $groupMember->user_access_group_id = $data['group_id'];
            $groupMember->enabled = '1';
        }

        $this->saveEntity($groupMember);
    }

    /**
     * Update user credentials action.
     */
    public function changeUserCredentialsAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $data = $this->request->getPost();
        $userLogin = $data['login'];
        $userPassword = $data['password'];

        // Find or create a new user credential
        $groupMember = $this->findCreateNewUserCredential($data['user_id']);

        // Update the user login if it is not empty
        if (!empty($userLogin)) {
            $groupMember->user_login = $userLogin;
        } else {
            $groupMember->user_login = $data['user_id'];
        }

        // Update the user password hash if it is not empty
        if (!empty($userPassword) and ($userPassword !== Constants::HIDDEN_PASSWORD)) {
            $security = new Security();
            $groupMember->user_password = $security->hash($userPassword);
        }

        $this->saveEntity($groupMember);
    }
}
