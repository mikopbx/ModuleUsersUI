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
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Select;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Form;
use Phalcon\Mvc\Controller;
use Phalcon\Mvc\Router;
use Phalcon\Mvc\View;
use function Sentry\trace;

class UsersUIConf extends ConfigClass
{

    /**
     * Prepares list of additional ACL roles and rules
     *
     * @param  AclList $aclList
     * @return void
     */
    public function onAfterACLPrepared(AclList $aclList): void
    {
        $parameters = [
            'columns'=>[
                'role'=>'CONCAT("UsersUIRoleID", AccessGroups.id)',
                'name'=>'AccessGroups.name',
                'controller'=>'AccessGroupsRights.controller',
                'actions'=>'AccessGroupsRights.actions',
            ],
            'models'=>[
                'AccessGroupsRights'=>AccessGroupsRights::class,
            ],
            'joins'      => [
                'AccessGroups' => [
                    0 => AccessGroups::class,
                    1 => 'AccessGroups.id = UsersCredentials.user_access_group_id',
                    2 => 'AccessGroups',
                    3 => 'INNER',
                ],
            ],
            'group'     => 'AccessGroups.id, AccessGroupsRights.controller',
            'order'      => 'AccessGroups.id, AccessGroupsRights.controller'
        ];

        $aclFromModule = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery()->execute();

        $previousRole = null;
        foreach ($aclFromModule as $acl) {
            if ($previousRole!==$acl->role){
                $previousRole = $acl->role;
                $aclList->addRole(new AclRole($acl->role, $acl->name));
            }

            $actionsArray = json_decode($acl->actions, true);
            $aclList->addComponent(new Component($acl->controller), $actionsArray);
            $aclList->allow($acl->role, $acl->controller, $actionsArray);
        }
    }

    /**
     * Authenticates user over external module
     *
     * @param string $login
     * @param string $password
     * @return array session data
     */
    public function authenticateUser(string $login, string $password): array
    {
        $parameters = [
            'columns'=>[
                'homePage'=>'AccessGroups.home_page',
                'role'=>'CONCAT("UsersUIRoleID",AccessGroups.id)'
            ],
            'models'=>[
                'UsersCredentials'=>UsersCredentials::class,
            ],
            'conditions' => 'user_login=:login: AND user_password=:password: and enabled=1',
            'binds' => [
                'login' => $login,
                'password' => $password
            ],
            'joins'      => [
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
            return [
                'role' => $userData->role,
                'homePage'=> $userData->homePage??'call-detail-records/index'
            ];
        }
       return [];
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
                'bind'=>[
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
            $password = new Text('module_users_ui_password', ['value'=>$userPassword,'class'=>'confidential-field']);
            $form->add( $password);

            // Retrieve all access groups from the database
            $accessGroups = AccessGroups::find();
            $accessGroupsForSelect['No access'] = $this->translation->_('module_usersui_NoAccess');

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
                    'useEmpty' => false,
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


}