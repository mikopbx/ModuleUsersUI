<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use MikoPBX\AdminCabinet\Controllers\CallDetailRecordsController;
use MikoPBX\AdminCabinet\Controllers\IncomingRoutesController;
use Modules\ModuleUsersUI\Lib\ACL\CoreACL;
use Modules\ModuleUsersUI\Lib\EndpointConstants as E;
use PHPUnit\Framework\TestCase;

class CoreACLTest extends TestCase
{
    public function testCdrIndexOwnsProviderStatistics(): void
    {
        $links = CoreACL::getLinkedControllerActions();

        self::assertContains(
            'getStatsByProvider',
            $links[CallDetailRecordsController::class][E::ACTION_INDEX][E::API_V3_CDR] ?? []
        );
    }

    public function testIncomingRouteEditorOwnsUniqueDidLookup(): void
    {
        $links = CoreACL::getLinkedControllerActions();

        self::assertContains(
            'getUniqueDIDs',
            $links[IncomingRoutesController::class][E::ACTION_MODIFY][E::API_V3_INCOMING_ROUTES] ?? []
        );
    }

    public function testFirewallBouncerIsUnavailableToLimitedRoles(): void
    {
        self::assertSame(
            '*',
            CoreACL::getAlwaysDenied()['/pbxcore/api/v3/firewall-bouncer'] ?? null
        );
    }

    public function testClientIpVisibilityCheckIsUnavailableToLimitedRoles(): void
    {
        self::assertContains(
            'checkClientIpVisibility',
            CoreACL::getAlwaysDenied()[E::API_V3_SYSTEM] ?? []
        );
    }
}
