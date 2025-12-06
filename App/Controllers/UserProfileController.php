<?php

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
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

use MikoPBX\AdminCabinet\Providers\AssetProvider;
use MikoPBX\Common\Providers\JwtProvider;
use Modules\ModuleUsersUI\Lib\MikoPBXVersion;
use Modules\ModuleUsersUI\Models\UsersCredentials;

/**
 * User Profile Controller
 *
 * Allows authenticated users to manage their own password and passkeys.
 * This controller should be added to CoreACL::getAlwaysAllowed() for self-service access.
 */
class UserProfileController extends ModuleUsersUIBaseController
{
    /**
     * Display user profile page with password change form and passkeys management.
     *
     * @return void
     */
    public function indexAction(): void
    {
        $footerCollection = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerCollection
            ->addJs('js/pbx/main/form.js', true)
            ->addJs('js/pbx/PbxAPI/passkeys-api.js', true)
            ->addJs('js/pbx/GeneralSettings/general-settings-passkeys.js', true)
            ->addJs('js/cache/' . $this->moduleUniqueID . '/module-users-ui-profile.js', true);

        // Get current user from JWT refresh token (stored in Redis)
        $userName = $this->extractCurrentUserName();

        // Redirect to login if not authenticated
        if ($userName === null) {
            $this->response->redirect('/admin-cabinet/session/end');
            return;
        }

        // Find user credentials
        $userCredentials = UsersCredentials::findFirst([
            'conditions' => 'user_login = :login:',
            'bind' => ['login' => $userName]
        ]);

        // Check if user uses LDAP authentication
        $useLdapAuth = '0';
        if ($userCredentials !== null) {
            $useLdapAuth = $userCredentials->use_ldap_auth ?? '0';
        }

        // Pass to view
        $this->view->useLdapAuth = $useLdapAuth;
        $this->view->userName = $userName;
    }

    /**
     * Handle password change request.
     *
     * Validates current password and updates with new password.
     * Only works for non-LDAP users.
     *
     * @return void
     */
    public function changePasswordAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();
        $userName = $this->extractCurrentUserName();

        // Find user credentials
        $userCredentials = UsersCredentials::findFirst([
            'conditions' => 'user_login = :login:',
            'bind' => ['login' => $userName]
        ]);

        if ($userCredentials === null) {
            $this->view->success = false;
            $this->view->message = $this->translation->_('module_usersui_UserNotFound');
            return;
        }

        // Check if user uses LDAP - cannot change password
        if ($userCredentials->use_ldap_auth === '1') {
            $this->view->success = false;
            $this->view->message = $this->translation->_('module_usersui_PasswordManagedByLDAP');
            return;
        }

        // Validate input
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            $this->view->success = false;
            $this->view->message = $this->translation->_('module_usersui_PasswordFieldsRequired');
            return;
        }

        // Verify current password
        $securityClass = MikoPBXVersion::getSecurityClass();
        $security = new $securityClass();

        if (!$security->checkHash($currentPassword, $userCredentials->user_password)) {
            $this->view->success = false;
            $this->view->message = $this->translation->_('module_usersui_CurrentPasswordIncorrect');
            return;
        }

        // Hash and save new password
        $userCredentials->user_password = $security->hash($newPassword);

        if ($userCredentials->save()) {
            $this->view->success = true;
            $this->view->message = $this->translation->_('module_usersui_PasswordChangedSuccessfully');
        } else {
            $this->view->success = false;
            $this->view->message = implode('<br>', $userCredentials->getMessages());
        }
    }

    /**
     * Extract current user name from JWT refresh token stored in Redis.
     *
     * With JWT authentication, user data is stored in Redis along with the refresh token,
     * not in PHP session. This method retrieves the userName using JwtProvider.
     *
     * @return string|null User name (login) or null if not authenticated
     */
    private function extractCurrentUserName(): ?string
    {
        try {
            $cookies = $this->di->get('cookies');
            if (!$cookies->has('refreshToken')) {
                return null;
            }

            $refreshToken = $cookies->get('refreshToken')->getValue();
            if (empty($refreshToken)) {
                return null;
            }

            // Use JwtProvider to extract userName from Redis
            $jwt = $this->di->getShared(JwtProvider::SERVICE_NAME);
            return $jwt->extractUserIdFromRefreshToken($refreshToken);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
