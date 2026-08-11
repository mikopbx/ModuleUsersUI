<?php

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2026 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 */

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Lib\ACL;

use Modules\ModuleUsersUI\Lib\EndpointConstants as E;

class ModuleMonitorActiveCallsACL implements ACLInterface
{
    public const API_MODULE_MONITOR_ACTIVE_CALLS = '/pbxcore/api/modules/module-monitor-active-calls';
    private const CONTROLLER = 'Modules\ModuleMonitorActiveCalls\App\Controllers\ModuleMonitorActiveCallsController';

    public static function getLinkedControllerActions(): array
    {
        return [
            self::CONTROLLER => [
                E::ACTION_INDEX => [
                    self::CONTROLLER => [
                        'getActiveChannels',
                        'getActiveChannelsV2',
                    ],
                    self::API_MODULE_MONITOR_ACTIVE_CALLS => '*',
                ],
                E::ACTION_SAVE => [
                    self::CONTROLLER => [
                        'backandEnable',
                        'saveUser',
                        'executeCall',
                    ],
                ],
            ],
        ];
    }

    public static function getAlwaysAllowed(): array
    {
        return [];
    }

    public static function getAlwaysDenied(): array
    {
        return [];
    }
}
