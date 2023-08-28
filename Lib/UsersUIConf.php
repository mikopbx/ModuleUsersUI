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
use MikoPBX\AdminCabinet\Controllers\SessionController;
use MikoPBX\AdminCabinet\Forms\ExtensionEditForm;
use MikoPBX\AdminCabinet\Providers\AssetProvider;
use MikoPBX\AdminCabinet\Providers\SecurityPluginProvider;
use MikoPBX\Common\Providers\AclProvider;
use MikoPBX\Common\Providers\SessionProvider;
use MikoPBX\Core\System\System;
use MikoPBX\Modules\Config\ConfigClass;
use Modules\ModuleBackup\Models\BackupRules;
use Modules\ModuleUsersUI\App\Controllers\UsersCredentialsController;
use Modules\ModuleUsersUI\App\Forms\ExtensionEditAdditionalForm;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Assets\Manager;
use Phalcon\Forms\Form;
use Phalcon\Mvc\Controller;
use Phalcon\Mvc\Dispatcher;
use Phalcon\Mvc\Micro;
use Phalcon\Mvc\View;

class UsersUIConf extends ConfigClass
{
    /**
     * Clears the ACL cache after the module is disabled.
     */
    public function onAfterModuleDisable():void{
        AclProvider::clearCache();
    }

    /**
     * Clears the ACL cache after the module is enabled.
     */
    public function onAfterModuleEnable():void
    {
        AclProvider::clearCache();
    }

    /**
     * Handles the event when data in certain models is changed and clears the ACL cache accordingly.
     *
     * @param array $data The data related to the event.
     */
    public function modelsEventChangeData($data): void
    {
        // Define models that are interfere on ACL cache.
        $cacheInterfereModels = [
            AccessGroups::class,
            AccessGroupsRights::class,
        ];

        // Check if the changed model is in the cache-interfere models array.
        if (in_array($data['model'],  $cacheInterfereModels)) {
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
        return $authenticator->authenticate()??[];
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
    public function onBeforeExecuteRoute(Dispatcher $dispatcher):void{
        $controller = $dispatcher->getActiveController();
        if (is_a($controller, ExtensionsController::class)
            && $dispatcher->getActionName() === 'modify'
        ) {
            $controller->view->addCustomTabFromModuleUsersUI =
                $this->di->get(SecurityPluginProvider::SERVICE_NAME, [UsersCredentialsController::class,'changeUserCredentials']);
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
        $calledUrl = $app->request->get('_url');
        if ($calledUrl!=='/api/extensions/saveRecord') {
            return;
        }
        $isAllowed = $this->di->get(SecurityPluginProvider::SERVICE_NAME, [UsersCredentialsController::class,'changeUserCredentials']);
        if ($isAllowed) {
            $userController = new UsersCredentialsController();
            $postData = $app->request->getPost();
            $userController->saveUserCredential($postData);
        }
    }


    /**
     * Adds an extra filters before execute request to CDR table.
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#applyaclfilterstocdrquery
     *
     * @param array $parameters The array of parameters prepared for execute query.
     *
     * @return void
     */
    public function applyACLFiltersToCDRQuery(array &$parameters): void
    {
        $session = $this->getDI()->get(SessionProvider::SERVICE_NAME)->get(SessionController::SESSION_ID);
        if (is_array($session) and isset($session[SessionController::ROLE])) {
            $role = $session[SessionController::ROLE];
            $accessGroupId = str_replace(Constants::MODULE_ROLE_PREFIX, "", $role);
            if (!empty($accessGroupId) and $role !== $accessGroupId) {
                UsersUICDRFilter::applyCDRFilterRules($accessGroupId, $parameters);
            }
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
    public function onAfterAssetsPrepared(Manager $assets, Dispatcher $dispatcher):void
    {
        $currentController = $dispatcher->getControllerName();
        $currentAction = $dispatcher->getActionName();
        if ($currentController==='Extensions' and $currentAction==='modify') {
            $isAllowed = $this->di->get(SecurityPluginProvider::SERVICE_NAME, [UsersCredentialsController::class,'changeUserCredentials']);
            if ($isAllowed){
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
}