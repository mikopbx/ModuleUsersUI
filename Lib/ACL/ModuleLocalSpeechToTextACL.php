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

class ModuleLocalSpeechToTextACL implements ACLInterface
{
    private const API_BASE = '/pbxcore/api/v3/module-local-speech-to-text';
    private const CONTROLLER = 'Modules\ModuleLocalSpeechToText\App\Controllers\ModuleLocalSpeechToTextController';

    public static function getLinkedControllerActions(): array
    {
        return [
            self::CONTROLLER => [
                'transcripts' => [
                    self::API_BASE . '/call-transcripts/events' => [E::ACTION_GET_LIST],
                    self::API_BASE . '/transcripts/events' => [E::ACTION_GET_LIST],
                    self::API_BASE . '/transcripts' => [E::ACTION_GET_LIST],
                ],
                'transcript' => [
                    self::API_BASE . '/call-transcripts' => [E::ACTION_GET_RECORD],
                    self::API_BASE . '/transcripts' => [E::ACTION_GET_RECORD],
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
            self::API_BASE . '/jobs' => '*',
            self::API_BASE . '/workers' => '*',
        ];
    }
}
