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

use MikoPBX\AdminCabinet\Controllers\ExtensionsController;
use MikoPBX\AdminCabinet\Forms\ExtensionEditForm;
use MikoPBX\AdminCabinet\Providers\AssetProvider;
use MikoPBX\AdminCabinet\Providers\SecurityPluginProvider;
use MikoPBX\Common\Providers\AclProvider;
use MikoPBX\Modules\Config\ConfigClass;
use Modules\ModuleUsersUI\App\Controllers\UsersCredentialsController;
use Modules\ModuleUsersUI\App\Controllers\UserProfileController;
use Modules\ModuleUsersUI\App\Forms\ExtensionEditAdditionalForm;
use Modules\ModuleUsersUI\Models\AccessGroupCDRFilter;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Assets\Manager;
use Phalcon\Forms\Form;
use Phalcon\Mvc\Dispatcher;
use Phalcon\Mvc\Micro;
use Phalcon\Mvc\View;

class UsersUIConf extends ConfigClass
{
    private const API_V3_EMPLOYEES = '/pbxcore/api/v3/employees';
    private const MODULE_PREFIX = 'module_users_ui_';

    /**
     * Clears the ACL cache after the module is disabled.
     */
    public function onAfterModuleDisable(): void
    {
        AclProvider::clearCache();
    }

    /**
     * Clears the ACL cache and cleans orphan records after the module is enabled.
     */
    public function onAfterModuleEnable(): void
    {
        // Clean orphan records that reference deleted users
        UsersCredentials::cleanOrphanRecords();
        AccessGroupCDRFilter::cleanOrphanRecords();

        AclProvider::clearCache();
    }

    /**
     * Handles the event when data in certain models is changed and clears the ACL cache accordingly.
     *
     * @param mixed $data The data related to the event.
     */
    public function modelsEventChangeData($data): void
    {
        // Define models that are interfere on ACL cache.
        $cacheInterfereModels = [
            AccessGroups::class,
            AccessGroupsRights::class,
        ];

        // Check if the changed model is in the cache-interfere models array.
        if (in_array($data['model'], $cacheInterfereModels)) {
            AclProvider::clearCache();
        }
    }

    /**
     * Prepares list of additional ACL roles and rules
     *
     * @param AclList $aclList
     * @return void
     */
    public function onAfterACLPrepared(AclList $aclList): void
    {
        UsersUIACL::modify($aclList);
    }

    /**
     * Authenticate the user with the provided login and password.
     *
     * @param string $login The user login.
     * @param string $password The user password.
     * @return array The authentication result with role and homePage.
     */
    public function authenticateUser(string $login, string $password): array
    {
        $authenticator = new UsersUIAuthenticator($login, $password);
        return $authenticator->authenticate() ?? [];
    }

    /**
     * Returns session parameters for passkey authentication.
     * Called after successful WebAuthn verification when user logs in via passkey.
     *
     * Passkeys are stored centrally in Core's UserPasskeys table.
     * This method only provides user role and permissions based on login.
     *
     * @param string $login The user login from passkey credential.
     * @return array Session parameters (role, homePage, userName) or empty array if user not found.
     */
    public function getPasskeySessionData(string $login): array
    {
        $authenticator = new UsersUIAuthenticator($login, '');
        return $authenticator->getSessionParamsForLogin() ?? [];
    }

    /**
     * This method is called during Volt block compilation.
     * It handles the compilation of specific blocks and returns the compiled result.
     *
     * @param string $controller The controller name.
     * @param string $blockName The block name.
     * @param View $view The view object.
     *
     * @return string The compiled result.
     */
    public function onVoltBlockCompile(string $controller, string $blockName, View $view): string
    {
        $result = '';
        // Check the controller and block name to determine the action
        switch ("$controller:$blockName") {
            case 'Extensions:TabularMenu':
                // Add additional tab to the Extension edit page
                $result = "Modules/ModuleUsersUI/Extensions/tabularmenu";
                break;
            case 'Extensions:AdditionalTab':
                // Add content for an additional tab on the Extension edit page
                $result = "Modules/ModuleUsersUI/Extensions/additionaltab";
                break;
            default:
                // Default case when no specific action is required
        }

        return $result;
    }

    /**
     * Calls from BaseForm and handles the event before initializing the form.
     *
     * @param Form $form The form object.
     * @param mixed $entity The entity object.
     * @param mixed $options Additional options.
     *
     * @return void
     */
    public function onBeforeFormInitialize(Form $form, $entity, $options): void
    {
        if (is_a($form, ExtensionEditForm::class)) {
            ExtensionEditAdditionalForm::prepareAdditionalFields($form, $entity, $options);
        }
    }

    /**
     * Called from BaseController before executing a route.
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#onbeforeexecuteroute
     *
     * @param Dispatcher $dispatcher The dispatcher instance.
     *
     * @return void
     */
    public function onBeforeExecuteRoute(Dispatcher $dispatcher): void
    {
        $controller = $dispatcher->getActiveController();
        if (
            is_a($controller, ExtensionsController::class)
            && $dispatcher->getActionName() === 'modify'
        ) {
            $controller->view->addCustomTabFromModuleUsersUI =
                $this->di->get(
                    SecurityPluginProvider::SERVICE_NAME,
                    [
                        UsersCredentialsController::class, 'changeUserCredentials'
                    ]
                );
        }
    }

    /**
     * This method is called from RouterProvider's onAfterExecuteRoute function.
     * It handles the form submission and updates the user credentials.
     *
     * @param Micro $app The micro application instance.
     *
     * @return void
     */
    public function onAfterExecuteRestAPIRoute(Micro $app): void
    {
        // Intercept the form submission of Extensions, only save action
        $router = $app->getRouter();
        $matchedRoute = $router->getMatchedRoute();
        $pattern = $matchedRoute->getPattern();
        $httpMethod = $app->request->getMethod();

        // Check if this is an employee-related request
        $isEmployeeRoute = strpos($pattern, self::API_V3_EMPLOYEES) === 0;
        if (!$isEmployeeRoute) {
            return;
        }

        // Handle POST/PUT requests - save group data
        if (in_array($httpMethod, ['POST', 'PUT'], true)) {
            /** @var \MikoPBX\PBXCoreREST\Http\Request $request */
            $request = $app->request;
         
            $response = json_decode($app->response->getContent(), false);

            if (!empty($response->result) and $response->result === true) {
                $userController = new UsersCredentialsController();
                $postData = $request->getData();
                
                if ($this->hasModuleData($postData)) {
                    $userController->saveUserCredential($postData, $response);
                }

                $app->response->setContent(json_encode($response));
            }
        }
    }


    /**
     * Adds an extra filter before executed request to the CDR table.
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#applyaclfilterstocdrquery
     *
     * Called from REST API context with sessionContext containing user role from JWT token.
     *
     * @param array $parameters The array of parameters prepared for execute query.
     * @param array $sessionContext Session context from REST API (role, user_name from JWT token).
     *
     * @return void
     */
    public function applyACLFiltersToCDRQuery(array &$parameters, array $sessionContext = []): void
    {
        // Get role from REST API sessionContext (JWT token)
        $role = $sessionContext['role'] ?? null;

        if ($role === null) {
            return;
        }

        // Extract access group ID from role (e.g., "ModuleUsersUI_123" -> "123")
        $accessGroupId = str_replace(Constants::MODULE_ROLE_PREFIX, "", $role);
        if (!empty($accessGroupId) && $role !== $accessGroupId) {
            UsersUICDRFilter::applyCDRFilterRules($accessGroupId, $parameters);
        }
    }

    /**
     * Modifies the system assets.
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#onafterassetsprepared
     *
     * @param Manager $assets The assets manager for additional modifications from module.
     * @param Dispatcher $dispatcher The dispatcher instance.
     *
     * @return void
     */
    public function onAfterAssetsPrepared(Manager $assets, Dispatcher $dispatcher): void
    {
        $currentController = $dispatcher->getControllerName();
        $currentAction = $dispatcher->getActionName();
        if ($currentController === 'Extensions' and $currentAction === 'modify') {
            $isAllowed = $this->di->get(
                SecurityPluginProvider::SERVICE_NAME,
                [
                    UsersCredentialsController::class, 'changeUserCredentials'
                ]
            );
            if ($isAllowed) {
                $assets->collection(AssetProvider::SEMANTIC_UI_CSS)
                    ->addCss('css/vendor/semantic/search.min.css', true);
                $assets->collection(AssetProvider::SEMANTIC_UI_JS)
                    ->addJs('js/vendor/semantic/search.min.js', true);
                $assets->collection(AssetProvider::FOOTER_JS)
                    ->addJs("js/cache/{$this->moduleUniqueId}/module-users-ui-extensions-modify.js", true);
            }
        }
    }

    /**
     * Returns array of additional routes for PBXCoreREST interface from module
     * [ControllerClass, ActionMethod, RequestTemplate, HttpMethod, RootUrl, NoAuth ]
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#getpbxcorerestadditionalroutes
     *
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [];
    }

    /**
     * Check if POST data contains module-specific fields
     *
     * @param array $postData The POST data array
     * @return bool True if module data exists
     */
    private function hasModuleData(array $postData): bool
    {
        foreach (array_keys($postData) as $key) {
            if (strpos($key, self::MODULE_PREFIX) === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds "My Profile" menu item for ModuleUsersUI users.
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#onbeforeheadermenushow
     *
     * This method hooks into the header menu display and adds a profile link
     * only for users who logged in via ModuleUsersUI (not admin).
     *
     * @param array $menuItems Reference to the menu items array.
     *
     * @return void
     */
    public function onBeforeHeaderMenuShow(array &$menuItems): void
    {
        $role = $this->extractUserRole();

        // Only show for ModuleUsersUI users (role starts with MODULE_ROLE_PREFIX)
        if ($role !== null && strpos($role, Constants::MODULE_ROLE_PREFIX) === 0) {
            // Add as direct menu item (no submenu) using controller class as key
            // Elements::getMenu() expects controller class for ACL check and link generation
            $menuItems[UserProfileController::class] = [
                'caption' => 'module_usersui_MyProfile',
                'iconclass' => 'user circle',
                'action' => 'index',
                'param' => '',
                'style' => '',
            ];
        }
    }

    /**
     * Extract user role from JWT refresh token stored in Redis.
     *
     * With JWT authentication, the role is stored in Redis along with the refresh token,
     * not in PHP session. This method retrieves the role using JwtProvider.
     *
     * @return string|null User role or null if not authenticated
     */
    private function extractUserRole(): ?string
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

            // Use JwtProvider to extract role from Redis
            $jwt = $this->di->getShared(\MikoPBX\Common\Providers\JwtProvider::SERVICE_NAME);
            return $jwt->extractRoleFromRefreshToken($refreshToken);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
