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

use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Common\Models\PbxExtensionModules;
use Modules\ModuleUsersUI\Lib\ACL\AutoLinkedActionsResolver;
use Modules\ModuleUsersUI\Lib\ACL\CoreACL;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;
use Phalcon\Mvc\Model\Query;
use Phalcon\Di\Injectable;

use function MikoPBX\Common\Config\appPath;

class UsersUIACL extends Injectable
{
    /**
     * Modifies the ACL list based on the database query result.
     *
     * @param AclList $aclList The ACL list to modify.
     * @return void
     */
    public static function modify(AclList $aclList): void
    {
        $query = self::buildAclQuery();
        $aclSettings = $query->execute();

        $previousRole = null;
        $actionsArray = [];
        $linkedControllerActions = self::getLinkedControllerActions();
        foreach ($aclSettings as $index => $aclFromModule) {
            $role = Constants::MODULE_ROLE_PREFIX . $aclFromModule->accessGroupId;
            $isLastAcl = $index === count($aclSettings) - 1;

            if ($previousRole !== $role) {
                // Add components and allow access for previous role
                if ($previousRole !== null) {
                    foreach ($actionsArray as $controller => $actions) {
                        $aclList->addComponent(new Component($controller), $actions);
                        $aclList->allow($previousRole, $controller, $actions);
                    }
                }
                $previousRole = $role;

                // Add a new role to the ACL list
                $aclList->addRole(new AclRole($role, $aclFromModule->name));

                if ($aclFromModule->fullAccess) {
                    // If full access is granted, allow all actions
                    $aclList->allow($role, '*', '*');
                    continue;
                }
                $actionsArray = self::getAlwaysAllowed();
            }
            if (!$aclFromModule->fullAccess && isset($aclFromModule->actions)) {
                $allowedActions = json_decode($aclFromModule->actions, true);

                if (array_key_exists($aclFromModule->controller, $actionsArray)
                    && is_array($actionsArray[$aclFromModule->controller])) {
                    // Merge allowed actions with existing actions for the controller
                    $actionsArray[$aclFromModule->controller] = array_merge($actionsArray[$aclFromModule->controller], $allowedActions);
                    $actionsArray[$aclFromModule->controller] = array_unique($actionsArray[$aclFromModule->controller]);
                } else {
                    // Set allowed actions for the controller
                    $actionsArray[$aclFromModule->controller] = $allowedActions;
                }

                // Process linked controllers and their actions
                if (array_key_exists($aclFromModule->controller, $linkedControllerActions)) {
                    foreach ($linkedControllerActions[$aclFromModule->controller] as $mainAction => $linkedControllers) {
                        if ($allowedActions === '*'
                            || is_array($allowedActions) && in_array($mainAction, $allowedActions)) {
                            foreach ($linkedControllers as $linkedController => $linkedActions) {
                                if (array_key_exists($linkedController, $actionsArray)
                                    && is_array($actionsArray[$linkedController])) {
                                    // Merge linked actions with existing actions for the linked actions
                                    $actionsArray[$linkedController] = array_merge($actionsArray[$linkedController], $linkedActions);
                                    $actionsArray[$linkedController] = array_unique($actionsArray[$linkedController]);
                                } else {
                                    // Set linked actions for the controller
                                    $actionsArray[$linkedController] = $linkedActions;
                                }
                            }
                        }
                    }
                }
            }

            if ($isLastAcl && !$aclFromModule->fullAccess) {
                // Add components and allow access for the last role
                // Role was already added on line 67, just need to apply permissions
                foreach ($actionsArray as $controller => $actions) {
                    $aclList->addComponent(new Component($controller), $actions);
                    $aclList->allow($role, $controller, $actions);
                }
            }
        }
    }

    /**
     * Builds the ACL database query.
     *
     * @return Query The built database query.
     */
    private static function buildAclQuery(): Query
    {
        $parameters = [
            'columns' => [
                'accessGroupId' => 'AccessGroups.id',
                'name' => 'AccessGroups.name',
                'controller' => 'AccessGroupsRights.controller',
                'actions' => 'AccessGroupsRights.actions',
                'fullAccess' => 'AccessGroups.fullAccess'
            ],
            'models' => [
                'AccessGroups' => AccessGroups::class,
            ],
            'joins' => [
                'AccessGroupsRights' => [
                    0 => AccessGroupsRights::class,
                    1 => 'AccessGroupsRights.group_id = AccessGroups.id',
                    2 => 'AccessGroupsRights',
                    3 => 'LEFT',
                ],
            ],
            'group' => 'AccessGroups.id, AccessGroupsRights.controller',
            'order' => 'AccessGroups.id, AccessGroupsRights.controller'
        ];

        return  MikoPBXVersion::getDefaultDi()->get('modelsManager')->createBuilder($parameters)->getQuery();
    }

    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * This method combines:
     * 1. Explicit rules from CoreACL (highest priority)
     * 2. Automatic rules from AutoLinkedActionsResolver (for standard CRUD)
     * 3. Module-specific rules
     *
     * Explicit rules take precedence over automatic ones.
     *
     * @return array[]
     */
    public static function getLinkedControllerActions(): array
    {
        // 1. Get explicit rules from CoreACL
        $explicitRules = CoreACL::getLinkedControllerActions();

        // 2. Get automatic CRUD rules for AdminCabinet controllers
        $adminCabinetControllers = self::getAdminCabinetControllers();
        $autoRules = AutoLinkedActionsResolver::getAutoLinkedActions($adminCabinetControllers);

        // 3. Merge: explicit rules override automatic rules
        $linkedActions = self::mergeLinkedActions($autoRules, $explicitRules);

        // 4. Add module-specific rules
        $linkedActionsModules = self::addRulesFromModules('getLinkedControllerActions');

        return array_merge($linkedActions, $linkedActionsModules);
    }

    /**
     * Get list of AdminCabinet controller class names.
     *
     * @return array<string>
     */
    private static function getAdminCabinetControllers(): array
    {
        $controllersDir = appPath('src/AdminCabinet/Controllers');
        if (!is_dir($controllersDir)) {
            return [];
        }

        $controllerFiles = glob("{$controllersDir}/*.php", GLOB_NOSORT);
        if ($controllerFiles === false) {
            return [];
        }

        $controllers = [];
        foreach ($controllerFiles as $file) {
            $className = pathinfo($file, PATHINFO_FILENAME);
            $controllers[] = 'MikoPBX\\AdminCabinet\\Controllers\\' . $className;
        }

        return $controllers;
    }

    /**
     * Merge two linked actions arrays with priority to explicit rules.
     *
     * @param array $autoRules Automatic rules (lower priority)
     * @param array $explicitRules Explicit rules (higher priority)
     * @return array Merged array
     */
    private static function mergeLinkedActions(array $autoRules, array $explicitRules): array
    {
        $result = $autoRules;

        foreach ($explicitRules as $controller => $actions) {
            if (!isset($result[$controller])) {
                $result[$controller] = $actions;
            } else {
                // Merge actions, explicit takes priority
                foreach ($actions as $action => $linkedEndpoints) {
                    $result[$controller][$action] = $linkedEndpoints;
                }
            }
        }

        return $result;
    }

    /**
     * Returns ACL methods from modules.
     *
     * @param $methodName string The name of the ACL method.
     * @return array
     */
    private static function addRulesFromModules(string $methodName): array
    {
        $rules = [];
        $modules = PbxExtensionModules::getEnabledModulesArray();
        foreach ($modules as $module) {
            // Call external module own ACL methods if exists
            $className = "Modules\\{$module['uniqid']}\\Lib\\{$module['uniqid']}ACL";
            $rulesFromModule = self::executeModuleMethod($className, $methodName);
            if (empty($rulesFromModule)) {
                // Call external module template methods
                $className = "Modules\\ModuleUsersUI\\Lib\\ACL\\{$module['uniqid']}ACL";
                $rulesFromModule = self::executeModuleMethod($className, $methodName);
            }
            $rules = array_merge($rules, $rulesFromModule);
        }
        return $rules;
    }

    /**
     *
     * Executes module ACL method.
     *
     * @param string $className Class name of module ACL class.
     * @param string $methodName Method name of module ACL class.
     * @return array
     */
    private static function executeModuleMethod(string $className, string $methodName): array
    {
        $result = [];
        if (class_exists($className) and method_exists($className, $methodName)) {
            try {
                $result = $className::$methodName();
            } catch (\Throwable $e) {
                CriticalErrorsHandler::handleException($e);
            }
        }
        return $result;
    }

    /**
     * Returns list of controllers that are always allowed
     * @return array
     */
    public static function getAlwaysAllowed(): array
    {
        $alwaysAllowed = CoreACL::getAlwaysAllowed();
        $alwaysAllowedModules = self::addRulesFromModules('getAlwaysAllowed');
        return array_merge($alwaysAllowed, $alwaysAllowedModules);
    }

    /**
     * The list of controllers that are always disallowed
     * only for superusers
     * @return array
     */
    public static function getAlwaysDenied(): array
    {
        $alwaysDenied = CoreACL::getAlwaysDenied();
        $alwaysDeniedFromModules = self::addRulesFromModules('getAlwaysDenied');
        return array_merge($alwaysDenied, $alwaysDeniedFromModules);
    }
}