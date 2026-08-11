<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use Modules\ModuleUsersUI\Lib\ACL\ModuleLocalSpeechToTextACL;
use Modules\ModuleUsersUI\Lib\ACL\ModuleMonitorActiveCallsACL;
use Modules\ModuleUsersUI\Lib\ACL\ModulePhraseStudioACL;
use Modules\ModuleUsersUI\Lib\ACL\ModuleRoutingMapACL;
use PHPUnit\Framework\TestCase;

class NewModuleACLTest extends TestCase
{
    public function testMonitorSeparatesObservationFromCallControl(): void
    {
        self::assertTrue(class_exists(ModuleMonitorActiveCallsACL::class));

        $controller = 'Modules\ModuleMonitorActiveCalls\App\Controllers\ModuleMonitorActiveCallsController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        $controller => ['getActiveChannels', 'getActiveChannelsV2'],
                        '/pbxcore/api/modules/module-monitor-active-calls' => '*',
                    ],
                    'save' => [
                        $controller => ['backandEnable', 'saveUser', 'executeCall'],
                    ],
                ],
            ],
            ModuleMonitorActiveCallsACL::getLinkedControllerActions()
        );
    }

    public function testRoutingMapPageOwnsBothReadOnlyGraphs(): void
    {
        self::assertTrue(class_exists(ModuleRoutingMapACL::class));

        $controller = 'Modules\ModuleRoutingMap\App\Controllers\ModuleRoutingMapController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        '/pbxcore/api/v3/module-routing-map/graph' => ['getIncoming', 'getOutgoing'],
                    ],
                ],
            ],
            ModuleRoutingMapACL::getLinkedControllerActions()
        );
    }

    public function testPhraseStudioSeparatesCatalogueReadsFromInstallationAndGeneration(): void
    {
        self::assertTrue(class_exists(ModulePhraseStudioACL::class));

        $controller = 'Modules\ModulePhraseStudio\App\Controllers\ModulePhraseStudioController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        '/pbxcore/api/v3/module-phrase-studio/engine' => ['getList'],
                        '/pbxcore/api/v3/module-phrase-studio/voices' => ['getList'],
                        '/pbxcore/api/v3/module-phrase-studio/phrases' => ['getList', 'download'],
                    ],
                    'save' => [
                        '/pbxcore/api/v3/module-phrase-studio/engine' => ['install', 'delete'],
                        '/pbxcore/api/v3/module-phrase-studio/voices' => ['install', 'delete'],
                        '/pbxcore/api/v3/module-phrase-studio/phrases' => ['generate', 'promoteToTmp', 'delete'],
                    ],
                ],
            ],
            ModulePhraseStudioACL::getLinkedControllerActions()
        );
    }

    public function testSpeechToTextOwnsTranscriptReadsAndDeniesWorkerApis(): void
    {
        self::assertTrue(class_exists(ModuleLocalSpeechToTextACL::class));

        $controller = 'Modules\ModuleLocalSpeechToText\App\Controllers\ModuleLocalSpeechToTextController';
        self::assertSame(
            [
                $controller => [
                    'transcripts' => [
                        '/pbxcore/api/v3/module-local-speech-to-text/call-transcripts/events' => ['getList'],
                        '/pbxcore/api/v3/module-local-speech-to-text/transcripts/events' => ['getList'],
                        '/pbxcore/api/v3/module-local-speech-to-text/transcripts' => ['getList'],
                    ],
                    'transcript' => [
                        '/pbxcore/api/v3/module-local-speech-to-text/call-transcripts' => ['getRecord'],
                        '/pbxcore/api/v3/module-local-speech-to-text/transcripts' => ['getRecord'],
                    ],
                ],
            ],
            ModuleLocalSpeechToTextACL::getLinkedControllerActions()
        );
        self::assertSame(
            [
                '/pbxcore/api/v3/module-local-speech-to-text/jobs' => '*',
                '/pbxcore/api/v3/module-local-speech-to-text/workers' => '*',
            ],
            ModuleLocalSpeechToTextACL::getAlwaysDenied()
        );
    }
}
