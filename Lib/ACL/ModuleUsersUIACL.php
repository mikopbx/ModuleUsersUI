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

namespace Modules\ModuleUsersUI\Lib\ACL;

use Modules\ModuleUsersUI\App\Controllers\AccessGroupsController;
use Modules\ModuleUsersUI\App\Controllers\LdapConfigController;
use Modules\ModuleUsersUI\App\Controllers\ModuleUsersUIController;
use Modules\ModuleUsersUI\App\Controllers\UsersCredentialsController;

class ModuleUsersUIACL implements ACLInterface
{
    const API_MODULE_USERS_UI = '/pbxcore/api/modules/module-users-u-i';
    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * @return array[]
     */
    public static function getLinkedControllerActions(): array
    {
        return [];
    }

    /**
     * Returns list of controllers that are always allowed
     * @return array
     */
    public static function getAlwaysAllowed(): array{
        return [];
    }

    /**
     * The list of controllers that are always disallowed
     * only for superusers
     * @return array
     */
    public static function getAlwaysDenied(): array
    {
        return [
            // Module UsersUI
            AccessGroupsController::class => '*',
            LdapConfigController::class => '*',
            ModuleUsersUIController::class => '*',
            UsersCredentialsController::class => '*',
            self::API_MODULE_USERS_UI => '*',
        ];
    }
}