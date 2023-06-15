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

use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\AdminCabinet\Controllers\ConsoleController;
use MikoPBX\AdminCabinet\Controllers\ErrorsController;
use MikoPBX\AdminCabinet\Controllers\LocalizationController;
use MikoPBX\AdminCabinet\Controllers\SessionController;
use MikoPBX\AdminCabinet\Controllers\TopMenuSearchController;
use MikoPBX\AdminCabinet\Controllers\UpdateController;
use MikoPBX\AdminCabinet\Controllers\UsersController;
use MikoPBX\AdminCabinet\Controllers\WikiLinksController;
use MikoPBX\Common\Models\PbxExtensionModules;
use MikoPBX\Common\Providers\PBXConfModulesProvider;
use MikoPBX\Modules\Config\RestAPIConfigInterface;
use MikoPBX\Modules\PbxExtensionUtils;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Annotations\Reader;
use Phalcon\Annotations\Reflection;
use Phalcon\Text;
use ReflectionClass;
use function MikoPBX\Common\Config\appPath;

class AccessGroupsRightsController extends BaseController
{
    private $moduleUniqueID = 'ModuleUsersUI';
    private $moduleDir;

    public bool $showModuleStatusToggle = false;

    /**
     * Basic initial class
     */
    public function initialize(): void
    {
        $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
        $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.svg";
        $this->view->submitMode = null;
        parent::initialize();
    }

    /**
     * Retrieves the group rights based on the provided access group ID.
     * The rights include UI controller actions, REST controller actions, and module controller actions.
     *
     * @return void
     */
    public function getGroupRightsAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $parameters = [
            'columns' => [
                'module_id'=>'module_id',
                'controller_id'=>'controller_id',
                'action_id'=>'action_id',
            ],
            'conditions' => 'group_id = :group_id:',
            'binds'=>[
                ':group_id' => $this->request->getPost('accessGroupId')??null
            ]
        ];

        // Retrieve allowed rights based on the group ID
        $allowedRights = AccessGroupsRights::find($parameters)->toArray();

        // Get available UI controller actions
        $availableUiControllersActions = $this->getAvailableUIControllersActions();

        // Get available REST controller actions
        $availableRESTControllersActions = $this->getAvailableRESTControllersActions();

        // Get available module controller actions
        $availableModulesControllersActions = $this->getAvailableModulesControllerActions();

        // Get available REST controller actions from modules
        $availableModulesControllersActions = $this->getAvailableRESTActionsInModules();

        // Combine all available actions
        $combined = array_merge(
            $availableModulesControllersActions,
            $availableRESTControllersActions,
            $availableUiControllersActions
        );

        // Check if allowed rights exist for the combined actions and mark them as true
        foreach ($combined as $moduleId=>$ctrlActions)
        {
            foreach ($ctrlActions as $controllerId=>$actionId)
            {
                if (isset($allowedRights[$moduleId][$controllerId][$actionId])){
                    $combined[$moduleId][$controllerId][$actionId]=true;
                }
            }
        }

        $this->view->message = $combined;
        $this->view->success = true;
    }

    /**
     * Retrieves the available actions of UI controllers.
     *
     * @return array An array containing the available actions of UI controllers.
     */
    private function getAvailableUIControllersActions(): array
    {

        // Scan files in the controllers directory
        $controllersDir = appPath('src/AdminCabinet/Controllers');
        $controllerFiles = glob("{$controllersDir}/*.php", GLOB_NOSORT);

        $controllers = [];

        $excludedControllers = [
            ConsoleController::class,
            ErrorsController::class,
            LocalizationController::class,
            SessionController::class,
            TopMenuSearchController::class,
            UpdateController::class,
            UsersController::class,
            WikiLinksController::class
        ];

        foreach ($controllerFiles as $file) {

            $className = pathinfo($file)['filename'];
            $controllerClass = 'MikoPBX\AdminCabinet\Controllers\\' . $className;

            if (in_array($controllerClass, $excludedControllers)) {
                continue;
            }

           $publicMethods = $this->getControllersActions($controllerClass);;

            if (count($publicMethods) > 0) {
                $controllers[AccessGroupsRights::ADMIN_CABINET][$className] = $publicMethods;
            }

        }
        return $controllers;
    }

    /**
     * Retrieves the available controller actions for modules.
     *
     * @return array An array containing the available controller actions for modules.
     */
    private function getAvailableModulesControllerActions():array
    {
        $controllers = [];
        $modules = PbxExtensionModules::find('disabled=0');
        $modulesDir = $this->getDI()->getShared('config')->path('core.modulesDir');
        foreach ($modules as $module) {
            $controllersDir = "{$modulesDir}/{$module->uniqid}/App/Controllers";
            // Check if the controllers directory exists
            if ( is_dir($controllersDir)) {
                $controllerFiles = glob("{$controllersDir}/*.php", GLOB_NOSORT);

                foreach ($controllerFiles as $file) {
                    $className = pathinfo($file)['filename'];
                    $controllerClass = "Modules\\{$module->uniqid}\\App\\Controllers\\{$className}";
                    $publicMethods = $this->getControllersActions($controllerClass);
                    if (count($publicMethods) > 0) {
                        $controllers[$module->uniqid][$className] = $publicMethods;
                    }
                }
            }
        }

        return $controllers;
    }

    /**
     * Retrieves the available actions of REST controllers.
     *
     * @return array An array containing the available actions of REST controllers.
     */
    private function getAvailableRESTControllersActions(): array
    {
        // Scan files in the controllers directory
        $controllersDir = appPath('src/PBXCoreREST/Controllers');

        $controllerFiles = glob("{$controllersDir}/*/*.php", GLOB_NOSORT);

        $controllers = [];

        $excludedControllers = [
            // List of excluded controllers
        ];

        foreach ($controllerFiles as $file) {

            $className = pathinfo($file)['filename'];
            $subClassName = basename(pathinfo($file)['dirname']);
            $controllerClass = 'MikoPBX\PBXCoreREST\Controllers\\'.$subClassName.'\\'.$className;

            if (in_array($controllerClass, $excludedControllers)) {
                continue;
            }
            $reader = new Reader();
            $parsedClass = $reader->parse($controllerClass);

            // Create a reflection of the controller class
            $reflection = new Reflection($parsedClass);

            $controllerName = $subClassName.'\\'.$className;
            foreach ($reflection->getClassAnnotations() as $classAnnotation) {
                    if ($classAnnotation->getName() === 'RoutePrefix') {
                        $controllerName = $classAnnotation->getArgument(0)??$controllerName;
                        break;
                    }
            }

            // Get the actions of the controller if they are defined in the method description
            $actions = [];
            $possibleHTTPMethods = ['Get','Post','Put','Delete','Patch','Head','Options','Trace'];
            foreach ($reflection->getMethodsAnnotations() as $methodAnnotations) {
                foreach ($methodAnnotations as $annotation) {
                    if (in_array($annotation->getName() , $possibleHTTPMethods)) {
                        $actionName = $annotation->getArgument(0);
                        if (!empty($actionName)){
                            $actions[$actionName] = false;
                        }
                    }
                }
            }

            if (count($actions) > 0) {
                $controllers[AccessGroupsRights::PBX_CORE_REST][$controllerName] = $actions;
            }
        }

        return $controllers;
    }


    /**
     * Retrieves the available actions of external modules REST controllers.
     *
     * @return array An array containing the available actions of external modules REST actions.
     */
    private function getAvailableRESTActionsInModules(): array
    {
        $controllers = [];
        $configObjects = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);

        // Parse additional REST API endpoints
        foreach ($configObjects as $configObject) {
           if (method_exists($configObject, RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK)){
               $reader = new Reader();
               $parsedClass = $reader->parse(get_class($configObject));

               // Create a reflection of the controller class
               $reflection = new Reflection($parsedClass);

               // Get the actions of the controller if they are defined in the method description
               $actions = [];
               $possibleHTTPMethods = ['Get','Post','Put','Delete','Patch','Head','Options','Trace'];
               foreach ($reflection->getMethodsAnnotations() as $method => $methodAnnotations) {
                   if ($method !== RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK){
                       continue;
                   }
                   foreach ($methodAnnotations as $annotation) {
                       if (in_array($annotation->getName() , $possibleHTTPMethods)) {
                           $actionName = $annotation->getArgument(0);
                           if (!empty($actionName)){
                               $actions[$actionName] = false;
                           }
                       }
                   }
               }

               $controllerName = '/pbxcore/api/modules/'.Text::uncamelize($configObject->moduleUniqueId,'-');
               if (empty($actions)){
                   $actions['*']=false;
               }
               $controllers[$configObject->moduleUniqueId][$controllerName] = $actions;
           }

            // Parse custom REST API endpoints described in modules
           if (method_exists($configObject, RestAPIConfigInterface::GET_PBXCORE_REST_ADDITIONAL_ROUTES)){
               $reader = new Reader();
               $parsedClass = $reader->parse(get_class($configObject));

               // Create a reflection of the controller class
               $reflection = new Reflection($parsedClass);

               // Get the actions of the controller if they are defined in the method description
               $actions = [];
               $possibleHTTPMethods = ['Get','Post','Put','Delete','Patch','Head','Options','Trace'];
               foreach ($reflection->getMethodsAnnotations() as $method => $methodAnnotations) {
                   if ($method !== RestAPIConfigInterface::GET_PBXCORE_REST_ADDITIONAL_ROUTES){
                       continue;
                   }
                   foreach ($methodAnnotations as $annotation) {
                       if (in_array($annotation->getName() , $possibleHTTPMethods)) {
                           $actionName = $annotation->getArgument(0);
                           if (!empty($actionName)){
                               $actions[$actionName] = false;
                           }
                       }
                       if ($annotation->getName()==='RoutePrefix'){
                           $controllerName = $annotation->getArgument(0);
                       }
                   }
               }

               if (!empty($controllerName)){
                   if (empty($actions)){
                       $actions['*']=false;
                   }
                   $controllers[$configObject->moduleUniqueId][$controllerName] = $actions;
               }
           }

        }
        return $controllers;
    }

    /**
     * Retrieves the list of controller actions from a given controller class.
     *
     * @param string $controllerClass The class name of the controller.
     *
     * @return array An array containing the public methods ending with "Action" as keys, initialized with false values.
     */
    private function getControllersActions(string $controllerClass):array
    {
        try {
            $reflection = new ReflectionClass($controllerClass);
            // If the controller class is abstract, return an empty array
            if ($reflection->isAbstract()) {
                return [];
            }
        } catch (\Throwable $exception) {
            return [];
        }

        $publicMethods = [];

        // Get all public methods ending with "Action"
        foreach ($reflection->getMethods() as $method) {
            if ($method->isPublic() && substr($method->getName(), -6) === 'Action') {
                $publicMethods[$method->getName()] = false;
            }
        }

        return $publicMethods;
    }
}

