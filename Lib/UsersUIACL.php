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


use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;
use Phalcon\Di;

class UsersUIACL extends \Phalcon\Di\Injectable
{
    /**
     * Prepares list of additional ACL roles and rules
     *
     * @param AclList $aclList
     * @return void
     */
    public static function modify(AclList $aclList): void
    {
        $parameters = [
            'columns' => [
                'role' => 'CONCAT("UsersUIRoleID", AccessGroups.id)',
                'name' => 'AccessGroups.name',
                'controller' => 'AccessGroupsRights.controller',
                'actions' => 'AccessGroupsRights.actions',
            ],
            'models' => [
                'AccessGroupsRights' => AccessGroupsRights::class,
            ],
            'joins' => [
                'AccessGroups' => [
                    0 => AccessGroups::class,
                    1 => 'AccessGroups.id = UsersCredentials.user_access_group_id',
                    2 => 'AccessGroups',
                    3 => 'INNER',
                ],
            ],
            'group' => 'AccessGroups.id, AccessGroupsRights.controller',
            'order' => 'AccessGroups.id, AccessGroupsRights.controller'
        ];

        $di            = Di::getDefault();
        $aclFromModule = $di->get('modelsManager')->createBuilder($parameters)->getQuery()->execute();

        $previousRole = null;
        foreach ($aclFromModule as $acl) {
            if ($previousRole !== $acl->role) {
                $previousRole = $acl->role;
                $aclList->addRole(new AclRole($acl->role, $acl->name));
            }

            $actionsArray = json_decode($acl->actions, true);
            $aclList->addComponent(new Component($acl->controller), $actionsArray);
            $aclList->allow($acl->role, $acl->controller, $actionsArray);
        }
    }
}