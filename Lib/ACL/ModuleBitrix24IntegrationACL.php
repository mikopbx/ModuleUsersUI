<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2024 Alexey Portnov and Nikolay Beketov
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

use Modules\ModuleBitrix24Integration\App\Controllers\ModuleBitrix24IntegrationController;
use Modules\ModuleUsersUI\Lib\RestEndpointsConstants;

class ModuleBitrix24IntegrationACL implements ACLInterface
{
    const API_MODULE_BITRIX24_INTEGRATION = '/pbxcore/api/modules/module-bitrix24-integration';
    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * @return array[]
     */
    public static function getLinkedControllerActions(): array
    {
        return [
            ModuleBitrix24IntegrationController::class=>[
                RestEndpointsConstants::ACTION_INDEX=>[
                    ModuleBitrix24IntegrationController::class=>[
                        'activateCode',
                        'getAppId',
                        'save',
                        'enable',
                        'deleteExternalLine',
                        'getExternalLines'
                    ],
                    self::API_MODULE_BITRIX24_INTEGRATION=>'*'
                ]
            ]

        ];
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
        return [];
    }
}