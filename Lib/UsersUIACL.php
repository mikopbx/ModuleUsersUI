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

use MikoPBX\Common\Models\PbxExtensionModules;
use MikoPBX\Common\Providers\PBXConfModulesProvider;
use Modules\ModuleUsersUI\Lib\ACL\CoreACL;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;
use Phalcon\Di;
use Phalcon\Mvc\Model\Query;

class UsersUIACL extends \Phalcon\Di\Injectable
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

            if ($isLastAcl) {
                // Add components and allow access for the last role
                if ($previousRole !== null) {
                    foreach ($actionsArray as $controller => $actions) {
                        $aclList->addComponent(new Component($controller), $actions);
                        $aclList->allow($previousRole, $controller, $actions);
                    }
                }
                // Add a new role to the ACL list
                $aclList->addRole(new AclRole($role, $aclFromModule->name));
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

        $di = Di::getDefault();
        $query = $di->get('modelsManager')->createBuilder($parameters)->getQuery();

        return $query;
    }

    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * @return array[]
     */
    public static function getLinkedControllerActions(): array
    {
        $linkedActions = CoreACL::getLinkedControllerActions();
        $linkedActionsModules = self::addRulesFromModules('getLinkedControllerActions');
        return array_merge($linkedActions, $linkedActionsModules);

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

    /**
     * Returns ACL methods from modules.
     *
     * @param $methodName string The name of the ACL method.
     * @return array
     */
    private static function addRulesFromModules(string $methodName):array
    {
        $rules = [];
        $modules = PbxExtensionModules::getEnabledModulesArray();
        foreach ($modules as $module) {
            $className =  "Modules\\ModuleUsersUI\\Lib\ACL\\{$module['uniqid']}ACL";
            if (class_exists($className) and method_exists($className, $methodName)) {
                $rules = array_merge($rules, $className::$methodName());
            }
        }
        return $rules;
    }
}