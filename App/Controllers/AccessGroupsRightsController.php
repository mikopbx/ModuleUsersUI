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

use MikoPBX\Common\Models\PbxExtensionModules;
use MikoPBX\Common\Providers\PBXConfModulesProvider;
use MikoPBX\Modules\Config\RestAPIConfigInterface;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Lib\UsersUIACL;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Annotations\Reader;
use Phalcon\Annotations\Reflection;
use Phalcon\Text;
use ReflectionClass;
use Throwable;
use function MikoPBX\Common\Config\appPath;

class AccessGroupsRightsController extends ModuleUsersUIBaseController
{
    /**
     * Retrieves the group rights based on the provided access group ID.
     * The rights include UI controller actions, REST controller actions, and module controller actions.
     *
     * @return array  An array containing the group rights.
     */
    public function getGroupRights(string $accessGroupId): array
    {
        $parameters = [
            'conditions' => 'group_id = :group_id:',
            'bind' => [
                'group_id' => $accessGroupId
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
        $availableModulesRESTControllersActions = $this->getAvailableRESTActionsInModules();

        // Combine all available actions
        $combined = array_merge_recursive(
            $availableUiControllersActions,
            $availableRESTControllersActions,
            $availableModulesControllersActions,
            $availableModulesRESTControllersActions
        );

        return $this->fillAllowed($combined, $allowedRights);
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

        // Get the list of controllers and actions which we hide from settings
        [$excludedControllers, $excludedActions] = $this->getExclusionsActionsControllers();

        foreach ($controllerFiles as $file) {

            $className = pathinfo($file)['filename'];
            $controllerClass = 'MikoPBX\AdminCabinet\Controllers\\' . $className;

            if (in_array($controllerClass, $excludedControllers)) {
                continue;
            }

            $publicMethods = $this->getControllersActions($controllerClass, $excludedActions);

            if (count($publicMethods) > 0) {
                $controllers[Constants::ADMIN_CABINET]['APP'][$controllerClass] = $publicMethods;
            }

        }
        // Sort the controllers array by translated controller name
        uksort($controllers[Constants::ADMIN_CABINET]['APP'], function ($a, $b) {
            $controllerAParts = explode('\\', $a);
            $controllerAName = end($controllerAParts);
            $controllerAName = str_replace("Controller", "", $controllerAName);
            $controllerANameTranslation = $this->translation->_('mm_' . $controllerAName);

            $controllerBParts = explode('\\', $b);
            $controllerBName = end($controllerBParts);
            $controllerBName = str_replace("Controller", "", $controllerBName);
            $controllerBNameTranslation = $this->translation->_('mm_' . $controllerBName);

            return strcmp($controllerANameTranslation, $controllerBNameTranslation);
        });

        return $controllers;
    }

    /**
     * Get the list of controllers and actions which we hide from settings
     *
     * @return array An array containing the excluded controllers and actions.
     */
    private function getExclusionsActionsControllers(): array
    {
        $excludedControllers = [];
        $excludedActions = [];
        $arrayOfExclusions = [];

        // Get the list of linked controllers and actions which we hide from settings
        foreach (UsersUIACL::getLinkedControllerActions() as $controllerClass=> $actions) {
            // Iterate through the main controllers actions
            foreach ($actions as $action=>$linkedControllers) {
                // Iterate through the linked controllers actions
                foreach ($linkedControllers as $linkedController=>$linkedActions) {
                    if (array_key_exists($linkedController, $arrayOfExclusions)) {
                        $arrayOfExclusions[$linkedController] = array_merge($arrayOfExclusions[$linkedController], $linkedActions);
                        $arrayOfExclusions[$linkedController] = array_unique($arrayOfExclusions[$linkedController]);
                    } else {
                        $arrayOfExclusions[$linkedController] = $linkedActions;
                    }
                }
            }
        }

        $arrayOfExclusions = array_merge_recursive(UsersUIACL::getAlwaysAllowed(), UsersUIACL::getAlwaysDenied(), $arrayOfExclusions);
        // Iterate through the always allowed and disallowed controllers and actions
        foreach ($arrayOfExclusions as $controllerClass => $actions) {
            if ($actions === '*'
                || (is_array($actions) && in_array('*', $actions))) {
                // Add the controller with all actions to the excluded from settings array
                $excludedControllers[] = $controllerClass;
            } elseif (is_array($actions)){
                // Add the controller with defined actions to the excluded from settings array
                $excludedActions[$controllerClass] = $actions;
            }
        }

        return [$excludedControllers, $excludedActions];
    }

    /**
     * Get the actions for a given controller class, excluding specified actions which are always allowed.
     *
     * @param string $controllerClass The controller class.
     * @param array $excludedActions Actions to be allowed or disallowed for the controller class without user settings.
     *
     * @return array The public methods of the controller class, filtered by allowed actions.
     */
    private function getControllersActions(string $controllerClass, array $excludedActions = []): array
    {
        try {
            $reflection = new ReflectionClass($controllerClass);
            // If the controller class is abstract, return an empty array
            if ($reflection->isAbstract()) {
                return [];
            }
        } catch (Throwable $exception) {
            return [];
        }

        $publicMethods = [];

        // Get all public methods ending with "Action"
        foreach ($reflection->getMethods() as $method) {
            $actionName = $method->getName();
            if ($method->isPublic() && substr($actionName, -6) === 'Action') {
                // Remove "Action" from the action name
                $actionName = substr($actionName, 0, -6);
                // Remove always allowed or always disallowed actions
                if (!in_array($actionName, $excludedActions[$controllerClass])) {
                    $publicMethods[$actionName] = false;
                }
            }
        }

        return $publicMethods;
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

        // Get the list of controllers and actions which we hide from settings
        [$excludedControllers, $excludedActions] = $this->getExclusionsActionsControllers();

        foreach ($controllerFiles as $file) {

            $className = pathinfo($file)['filename'];
            $subClassName = basename(pathinfo($file)['dirname']);
            $controllerClass = 'MikoPBX\PBXCoreREST\Controllers\\' . $subClassName . '\\' . $className;

            $reader = new Reader();
            $parsedClass = $reader->parse($controllerClass);

            // Create a reflection of the controller class
            $reflection = new Reflection($parsedClass);

            $controllerName = $subClassName . '\\' . $className;
            foreach ($reflection->getClassAnnotations() as $classAnnotation) {
                if ($classAnnotation->getName() === 'RoutePrefix') {
                    $controllerName = $classAnnotation->getArgument(0) ?? $controllerName;
                    if (in_array($controllerName, $excludedControllers)) {
                        continue 2;
                    }
                    break;
                }
            }

            // Get the actions of the controller if they are defined in the method description
            $actions = [];
            $possibleHTTPMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Head', 'Options', 'Trace'];
            foreach ($reflection->getMethodsAnnotations() as $methodAnnotations) {
                foreach ($methodAnnotations as $annotation) {
                    if (in_array($annotation->getName(), $possibleHTTPMethods)) {
                        $actionName = $annotation->getArgument(0);
                        // Remove always allowed or always disallowed actions
                        if (!empty($actionName) and !in_array($actionName, $excludedActions[$controllerName])) {
                            $actions[$actionName] = false;
                        }
                    }
                }
            }

            if (count($actions) > 0) {
                $currentContext = &$controllers[Constants::PBX_CORE_REST]['REST'][$controllerName];
                $currentContext = array_merge_recursive($currentContext ?? [], $actions);
            }
        }

        return $controllers;
    }

    /**
     * Retrieves the available controller actions for modules.
     *
     * @return array An array containing the available controller actions for modules.
     */
    private function getAvailableModulesControllerActions(): array
    {

        // Get the list of controllers and actions which we hide from settings
        [$excludedControllers, $excludedActions] = $this->getExclusionsActionsControllers();

        $controllers = [];
        $modules = PbxExtensionModules::find('disabled=0');
        $modulesDir = $this->getDI()->getShared('config')->path('core.modulesDir');
        foreach ($modules as $module) {
            $controllersDir = "{$modulesDir}/{$module->uniqid}/App/Controllers";
            // Check if the controllers directory exists
            if (is_dir($controllersDir)) {
                $controllerFiles = glob("{$controllersDir}/*.php", GLOB_NOSORT);

                foreach ($controllerFiles as $file) {
                    $className = pathinfo($file)['filename'];
                    $controllerClass = "Modules\\{$module->uniqid}\\App\\Controllers\\{$className}";
                    if (in_array($controllerClass, $excludedControllers)) {
                        continue;
                    }
                    $publicMethods = $this->getControllersActions($controllerClass, $excludedActions);
                    if (count($publicMethods) > 0) {
                        $controllers[$module->uniqid]['APP'][$controllerClass] = $publicMethods;
                    }
                }
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
        // Get the list of controllers and actions which we hide from settings
        [$excludedControllers, $excludedActions] = $this->getExclusionsActionsControllers();

        $controllers = [];
        $configObjects = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);

        // Parse additional REST API endpoints
        foreach ($configObjects as $configObject) {
            if (method_exists($configObject, RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK)) {
                $reader = new Reader();
                $parsedClass = $reader->parse(get_class($configObject));

                // Create a reflection of the controller class
                $reflection = new Reflection($parsedClass);

                $controllerName = '/pbxcore/api/modules/' . Text::uncamelize($configObject->moduleUniqueId, '-');

                // Get the actions of the controller if they are defined in the method description
                $actions = [];
                $possibleHTTPMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Head', 'Options', 'Trace'];
                foreach ($reflection->getMethodsAnnotations() as $method => $methodAnnotations) {
                    if ($method !== RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK) {
                        continue;
                    }
                    foreach ($methodAnnotations as $annotation) {
                        if (in_array($annotation->getName(), $possibleHTTPMethods)) {
                            $actionName = $annotation->getArgument(0);
                            // filter always allowed or always disallowed actions
                            if (!empty($actionName) and !in_array($actionName, $excludedActions[$controllerName])) {
                                $actions[$actionName] = false;
                            }
                        }
                    }
                }
                if (empty($actions)) {
                    $actions['*'] = false;
                }
                if (in_array($controllerName, $excludedControllers)) {
                    continue;
                }
                $currentContext = &$controllers[$configObject->moduleUniqueId]['REST'][$controllerName];
                $currentContext = array_merge($currentContext ?? [], $actions);
            }

            // Parse custom REST API endpoints described in modules
            if (method_exists($configObject, RestAPIConfigInterface::GET_PBXCORE_REST_ADDITIONAL_ROUTES)) {
                $reader = new Reader();
                $parsedClass = $reader->parse(get_class($configObject));

                // Create a reflection of the controller class
                $reflection = new Reflection($parsedClass);

                // Get the actions of the controller if they are defined in the method description
                $actions = [];
                $possibleHTTPMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Head', 'Options', 'Trace'];
                foreach ($reflection->getMethodsAnnotations() as $method => $methodAnnotations) {
                    if ($method !== RestAPIConfigInterface::GET_PBXCORE_REST_ADDITIONAL_ROUTES) {
                        continue;
                    }
                    foreach ($methodAnnotations as $annotation) {
                        if (in_array($annotation->getName(), $possibleHTTPMethods)) {
                            $actionName = $annotation->getArgument(0);
                            if (!empty($actionName)) {
                                $actions[$actionName] = false;
                            }
                        }
                        if ($annotation->getName() === 'RoutePrefix') {
                            $controllerName = $annotation->getArgument(0);
                        }
                    }
                }
                if (!empty($controllerName) && !in_array($controllerName, $excludedControllers)) {
                    if (is_array($actions)) {
                        // Remove always allowed or always disallowed actions
                        foreach ($actions as $index => $action) {
                            if (in_array($action, $excludedActions[$controllerName])) {
                                unset($actions[$index]);
                            }
                        }
                    }

                    if (empty($actions)) {
                        $actions['*'] = false;
                    }
                    $currentContext = &$controllers[$configObject->moduleUniqueId]['REST'][$controllerName];
                    $currentContext = array_merge($currentContext ?? [], $actions);
                }
            }

        }
        return $controllers;
    }

    /**
     * Fills the combined actions with allowed rights and marks them as true.
     *
     * @param array $combined The combined actions array.
     * @param array $allowedRights The allowed rights array.
     *
     * @return array The updated combined actions array.
     */
    public function fillAllowed(array $combined, array $allowedRights): array
    {
        // Check if allowed rights exist for the combined actions and mark them as true
        foreach ($combined as $moduleId => $types) {
            foreach ($types as $type => $controllers) {
                foreach ($controllers as $controllerClass => $actions) {
                    foreach ($actions as $actionName => $value) {
                        foreach ($allowedRights as $allowedRight) {
                            $allowedActions = json_decode($allowedRight['actions'], true);
                            if ($allowedRight['module_id'] === $moduleId
                                && $allowedRight['controller'] === $controllerClass
                                && in_array($actionName, $allowedActions)
                            ) {
                                $combined[$moduleId][$type][$controllerClass][$actionName] = true;
                            }
                        }
                    }
                }
            }
        }
        return $combined;
    }

    /**
     * Saves access group rights for a given access group entity.
     *
     * @param string $accessGroupId The access group ID.
     * @param array $accessGroupRightsFromPost The user set of access group rights.
     * @return bool Returns true on success, false on failure.
     */
    public function saveAccessGroupRights(string $accessGroupId, array $accessGroupRightsFromPost): bool
    {
        // Delete existing access group rights for the given access group entity
        $accessGroupRights = AccessGroupsRights::find("group_id={$accessGroupId}");
        foreach ($accessGroupRights as $accessGroupRight) {
            if ($accessGroupRight->delete() === false) {
                $errors = $accessGroupRight->getMessages();
                $this->flash->error(implode('<br>', $errors));

                return false;
            }
        }

        foreach ($accessGroupRightsFromPost as $modules) {
            foreach ($modules['controllers'] as $controller) {
                // Create a new access group right object
                $accessGroupRight = new AccessGroupsRights();
                $accessGroupRight->group_id = intval($accessGroupId);
                $accessGroupRight->module_id = $modules['module'];
                $accessGroupRight->controller = $controller['controller'];
                $accessGroupRight->actions = json_encode($controller['actions']);

                // Save the access group right object
                if ($this->saveEntity($accessGroupRight) === false) {
                    // If there are validation errors, display them and return false
                    return false;
                }

            }

        }
        return true;
    }
}
