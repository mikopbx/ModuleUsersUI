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

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

class UsersUIConf extends ConfigClass
{

    /**
     * Receive information about mikopbx main database changes
     *
     * @param $data
     */
    public function modelsEventChangeData($data): void
    {
        // f.e. if somebody changes PBXLanguage, we will restart all workers
        if (
            $data['model'] === PbxSettings::class
            && $data['recordId'] === 'PBXLanguage'
        ) {
            $templateMain = new UsersUIMain();
            $templateMain->startAllServices(true);
        }
    }

    /**
     * Returns module workers to start it at WorkerSafeScriptCore
     *
     * @return array
     */
    public function getModuleWorkers(): array
    {
        return [
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_BEANSTALK,
                'worker' => WorkerUsersUIMain::class,
            ],
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_AMI,
                'worker' => WorkerUsersUIAMI::class,
            ],
        ];
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
    public function onVoltBlockCompile(string $controller, string $blockName, View $view):string
    {
        $result = '';
        // Check the controller and block name to determine the action
        switch ("$controller:$blockName"){
            case 'Extensions:TabularMenu':
                // Add additional tab to the Extension edit page
                $result = "{$this->moduleDir}/App/Views/Extensions/tabularmenu";
                break;
            case 'Extensions:AdditionalTab':
                // Add content for an additional tab on the Extension edit page
                $result = "{$this->moduleDir}/App/Views/Extensions/additionaltab";
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
    public function onBeforeFormInitialize(Form $form, $entity, $options):void
    {
        if (is_a($form, ExtensionEditForm::class)) {

            // Prepare saved data from module database
            $currentUserId= $entity->userid;

            // Set parameters for the database query
            $parameters = [
                'conditions' => 'user_id = :user_id:',
                'binds'=>[
                    'user_id'=>$currentUserId,
                ]
            ];

            // Find the user credentials based on the parameters
            $credentials = UsersCredentials::findFirst($parameters);

            // Get the access group ID from the credentials, or set it to null if not found
            $accessGroupId = $credentials->user_access_group_id??null;

            // Get the user login from the credentials, or set it to an empty string if not found
            $userLogin = $credentials->user_login??'';

            // Get the user password from the credentials, or set it to an empty string if not found
            $userPassword = $credentials->user_password??'';

            // Create a new Text form element for user login and set its value
            $login = new Text('module_users_ui_login', ['value'=>$userLogin]);
            $form->add( $login);

            // Create a new Password form element for user password and set its value
            $password = new Password('module_users_ui_password', ['value'=>$userPassword]);
            $form->add( $password);

            // Retrieve all access groups from the database
            $accessGroups = AccessGroups::find();
            $accessGroupsForSelect = [];

            // Prepare the access groups data for a Select form element
            foreach ($accessGroups as $accessGroup) {
                $accessGroupsForSelect[$accessGroup->id] = $accessGroup->name;
            }

            // Create a new Select form element for user access group and set its properties
            $accessGroup = new Select(
                'module_users_ui_access_group', $accessGroupsForSelect, [
                    'using' => [
                        'id',
                        'name',
                    ],
                    'useEmpty' => true,
                    'value' => $accessGroupId,
                    'emptyValue' => 'No access',
                    'placeholder' => 'Select access group',
                    'class' => 'ui selection dropdown',
                ]
            );
            $form->add($accessGroup);
        }
    }

    /**
     * This method is called from BaseController's onAfterExecuteRoute function.
     * It handles the form submission and updates the user credentials.
     *
     * @param Controller $controller The controller object.
     *
     * @return void
     */
    public function onAfterExecuteRoute(Controller $controller): void
    {
        // Intercept the form submission of Extensions
        if (is_a($controller, ExtensionsController::class)) {
            return;
        }

        // Get the current user ID from the request
        $currentUserId = $controller->request->getPost('user_id');

        // If the current user ID is not set, return
        if (!isset($currentUserId)) {
            return;
        }

        // Get the access group, user login, and user password from the request
        $accessGroup = $controller->request->getPost('module_users_ui_access_group');
        $userLogin = $controller->request->getPost('module_users_ui_login');
        $userPassword = $controller->request->getPost('module_users_ui_password');

        // Set parameters for the database query
        $parameters = [
            'conditions' => 'user_id = :user_id:',
            'binds' => [
                'user_id' => $currentUserId,
            ]
        ];

        // Find the user credentials based on the parameters
        $credentials = UsersCredentials::findFirst($parameters);

        // If no credentials found, create a new instance and set the user ID
        if (!$credentials) {
            $credentials = new UsersCredentials();
            $credentials->user_id = $currentUserId;
        }

        // Update the user login if it is not empty
        if (!empty($userLogin)) {
            $credentials->user_login = $userLogin;
        }

        // Update the user password if it is not empty
        if (!empty($userPassword)) {
            $credentials->user_password = $userPassword;
        }

        // Update the access group and enabled status based on the selected value
        if ($accessGroup === 'No access') {
            $credentials->enabled = '0';
        } else {
            $credentials->user_access_group_id = $accessGroup;
            $credentials->enabled = '1';
        }

        // Save the updated user credentials
        $credentials->save();
    }


//    /**
//     * Modifies system routes
//     *
//     * @param Router $router
//     * @return void
//     */
//    public function onAfterRoutesPrepared(Router $router):void
//    {
//        $router->add('/module-users-u-i/:controller/:action/:params', [
//            'module'     => 'admin-cabinet',
//            'controller' => 1,
//            'action'     => 2,
//            'params'     => 3,
//            'namespace'  => 'Modules\ModuleUsersUI\App\Controllers'
//        ]);
//
//    }

    /**
     * @param array $request
     * @return PBXApiResult
     *
     * @Get("/check")
     */
    public function moduleRestAPICallback(array $request): PBXApiResult
    {
        $res            = new PBXApiResult();
        $res->processor = __METHOD__;
        $action         = strtoupper($request['action']);
        switch ($action) {
            case 'CHECK':
                return $res;
            default:
                $res->success    = false;
                $res->messages[] = 'API action not found in moduleRestAPICallback ModuleUsersUI';
        }

        return $res;
    }

    /**
     * Returns array of additional routes for PBXCoreREST interface from module
     * [ControllerClass, ActionMethod, RequestTemplate, HttpMethod, RootUrl, NoAuth ]
     * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#getpbxcorerestadditionalroutes
     *
     * @RoutePrefix("/pbxcore/api/backup")
     * @Get("/something1")
     * @Get("/something2")
     * @Post("/something3")
     *
     * @return array
     * @example
     *  [[GetController::class, 'callAction', '/pbxcore/api/backup/{actionName}', 'get', '/', false],
     *  [PostController::class, 'callAction', '/pbxcore/api/backup/{actionName}', 'post', '/', false]]
     *
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [];
    }

}