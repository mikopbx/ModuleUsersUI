<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use MikoPBX\AdminCabinet\Controllers\CallDetailRecordsController;
use MikoPBX\AdminCabinet\Controllers\CallQueuesController;
use MikoPBX\AdminCabinet\Controllers\ConferenceRoomsController;
use MikoPBX\AdminCabinet\Controllers\DialplanApplicationsController;
use MikoPBX\AdminCabinet\Controllers\IvrMenuController;
use MikoPBX\AdminCabinet\Controllers\SoundFilesController;
use Modules\ModuleUsersUI\Lib\ACL\AutoLinkedActionsResolver;
use Modules\ModuleUsersUI\Lib\ACL\CoreACL;
use Modules\ModuleUsersUI\Lib\EndpointConstants as E;
use Modules\ModuleUsersUI\Lib\UsersUIACL;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class LinkedActionsMergeTest extends TestCase
{
    public function testExplicitRuleKeepsAutomaticReadOnlyLinks(): void
    {
        $modify = $this->mergeCore(CallQueuesController::class, E::API_V3_CALL_QUEUES)[E::ACTION_MODIFY];

        self::assertContains(E::ACTION_GET_RECORD, $modify[E::API_V3_CALL_QUEUES]);
        self::assertContains(E::ACTION_GET_DEFAULT, $modify[E::API_V3_CALL_QUEUES]);
        self::assertContains(E::ACTION_SOUND_PLAYBACK, $modify[E::API_V3_SOUND_FILES]);
    }

    public function testExplicitSaveRuleStillNarrowsAutomaticWrites(): void
    {
        $soundFiles = $this->mergeCore(SoundFilesController::class, E::API_V3_SOUND_FILES);
        self::assertNotContains(E::ACTION_DELETE, $soundFiles[E::ACTION_SAVE][E::API_V3_SOUND_FILES]);
        self::assertSame([E::ACTION_DELETE], $soundFiles[E::ACTION_DELETE][E::API_V3_SOUND_FILES]);

        $cdr = $this->mergeCore(CallDetailRecordsController::class, E::API_V3_CDR);
        self::assertSame([E::ACTION_DELETE], $cdr[E::ACTION_SAVE][E::API_V3_CDR]);
    }

    /**
     * @return iterable<string, array{class-string, string}>
     */
    public static function recordEditorsProvider(): iterable
    {
        yield 'call queues' => [CallQueuesController::class, E::API_V3_CALL_QUEUES];
        yield 'ivr menu' => [IvrMenuController::class, E::API_V3_IVR_MENU];
        yield 'conference rooms' => [ConferenceRoomsController::class, E::API_V3_CONFERENCE_ROOMS];
        yield 'dialplan applications' => [DialplanApplicationsController::class, E::API_V3_DIALPLAN_APPLICATIONS];
    }

    /**
     * @dataProvider recordEditorsProvider
     */
    public function testViewingRecordDoesNotGrantDelete(string $controller, string $endpoint): void
    {
        $links = $this->mergeCore($controller, $endpoint);

        self::assertNotContains(E::ACTION_DELETE, $links[E::ACTION_MODIFY][$endpoint]);
        self::assertContains(E::ACTION_DELETE, $links[E::ACTION_SAVE][$endpoint]);
    }

    public function testExplicitWildcardIsNotMixedWithAutomaticActions(): void
    {
        $merged = $this->merge(
            ['C' => ['modify' => ['/e' => [E::ACTION_GET_RECORD]]]],
            ['C' => ['modify' => ['/e' => '*']]]
        );

        self::assertSame('*', $merged['C']['modify']['/e']);
    }

    /**
     * Merges CoreACL rules for one controller with the standard automatic CRUD links,
     * which AutoLinkedActionsResolver would build for an existing endpoint.
     */
    private function mergeCore(string $controller, string $endpoint): array
    {
        $autoLinks = [];
        foreach (AutoLinkedActionsResolver::getStandardCrudMapping() as $ownerAction => $restActions) {
            $autoLinks[$ownerAction][$endpoint] = (array)$restActions;
        }

        $explicit = CoreACL::getLinkedControllerActions();
        $explicit = isset($explicit[$controller]) ? [$controller => $explicit[$controller]] : [];

        return $this->merge([$controller => $autoLinks], $explicit)[$controller];
    }

    private function merge(array $autoRules, array $explicitRules): array
    {
        $method = new ReflectionMethod(UsersUIACL::class, 'mergeLinkedActions');
        return $method->invoke(null, $autoRules, $explicitRules);
    }
}
