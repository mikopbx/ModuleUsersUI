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

class ModuleRoutingMapACL implements ACLInterface
{
    public const API_MODULE_ROUTING_MAP = '/pbxcore/api/modules/module-routing-map';
    public const API_V3_MODULE_ROUTING_MAP_GRAPH = '/pbxcore/api/v3/module-routing-map/graph';
    private const CONTROLLER = 'Modules\ModuleRoutingMap\App\Controllers\ModuleRoutingMapController';

    public static function getLinkedControllerActions(): array
    {
        return [
            self::CONTROLLER => [
                E::ACTION_INDEX => [
                    self::API_V3_MODULE_ROUTING_MAP_GRAPH => [
                        'getIncoming',
                        'getOutgoing',
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
        return [
            self::API_MODULE_ROUTING_MAP => '*',
        ];
    }
}
