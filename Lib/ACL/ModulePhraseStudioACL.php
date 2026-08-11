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

class ModulePhraseStudioACL implements ACLInterface
{
    public const API_MODULE_PHRASE_STUDIO = '/pbxcore/api/modules/module-phrase-studio';
    public const API_V3_ENGINE = '/pbxcore/api/v3/module-phrase-studio/engine';
    public const API_V3_VOICES = '/pbxcore/api/v3/module-phrase-studio/voices';
    public const API_V3_PHRASES = '/pbxcore/api/v3/module-phrase-studio/phrases';
    private const CONTROLLER = 'Modules\ModulePhraseStudio\App\Controllers\ModulePhraseStudioController';

    public static function getLinkedControllerActions(): array
    {
        return [
            self::CONTROLLER => [
                E::ACTION_INDEX => [
                    self::API_V3_ENGINE => [E::ACTION_GET_LIST],
                    self::API_V3_VOICES => [E::ACTION_GET_LIST],
                    self::API_V3_PHRASES => [E::ACTION_GET_LIST, 'download'],
                ],
                'generate' => [
                    self::API_V3_PHRASES => ['create', 'generate', 'promoteToTmp', E::ACTION_DELETE],
                ],
                'manageEngineAndVoices' => [
                    self::API_V3_ENGINE => ['install', E::ACTION_DELETE],
                    self::API_V3_VOICES => ['install', E::ACTION_DELETE],
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
            self::API_MODULE_PHRASE_STUDIO => '*',
        ];
    }
}
