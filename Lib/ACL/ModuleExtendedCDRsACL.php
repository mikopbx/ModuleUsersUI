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

class ModuleExtendedCDRsACL implements ACLInterface
{
    public const API_MODULE_EXTENDED_CDR = '/pbxcore/api/modules/module-extended-c-d-rs';

    private const CONTROLLER = 'Modules\ModuleExtendedCDRs\App\Controllers\ModuleExtendedCDRsController';
    private const API_ADDITIONAL_ROUTES = '/';

    public static function getLinkedControllerActions(): array
    {
        return [
            self::CONTROLLER => [
                E::ACTION_INDEX => [
                    self::CONTROLLER => [
                        'getTablesDescription',
                        E::ACTION_GET_NEW_RECORDS,
                        'getState',
                        'getHistory',
                        'getCdrQueue',
                        'getOutgoingEmployeeCalls',
                    ],
                    self::API_MODULE_EXTENDED_CDR => '*',
                    self::API_ADDITIONAL_ROUTES => [
                        'downloads',
                        'exportHistory',
                        'exportHistoryDetail',
                        'recordsAction',
                        'exportOutgoingEmployeeCalls',
                    ],
                ],
                E::ACTION_SAVE => [
                    self::CONTROLLER => [
                        E::ACTION_DELETE,
                        'saveTableData',
                        'changePriority',
                        'saveMainVariantReport',
                        'removeVariantReport',
                        'saveSearchSettings',
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
