<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use Modules\ModuleUsersUI\Lib\ACL\ModuleCallTrackingACL;
use Modules\ModuleUsersUI\Lib\ACL\ModuleExtendedCDRsACL;
use Modules\ModuleUsersUI\Lib\ACL\ModulePhoneBookACL;
use Modules\ModuleUsersUI\Lib\ACL\ModuleZabbixAgent5ACL;
use PHPUnit\Framework\TestCase;

class ExistingModuleACLTest extends TestCase
{
    public function testExtendedCdrFallbackIsDiscoverableAndSeparatesReadFromWrite(): void
    {
        self::assertTrue(class_exists(ModuleExtendedCDRsACL::class));

        $controller = 'Modules\ModuleExtendedCDRs\App\Controllers\ModuleExtendedCDRsController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        $controller => [
                            'getTablesDescription',
                            'getNewRecords',
                            'getState',
                            'getHistory',
                            'getCdrQueue',
                            'getOutgoingEmployeeCalls',
                        ],
                        '/pbxcore/api/modules/module-extended-c-d-rs' => '*',
                        '/' => [
                            'downloads',
                            'exportHistory',
                            'exportHistoryDetail',
                            'recordsAction',
                            'exportOutgoingEmployeeCalls',
                        ],
                    ],
                    'save' => [
                        $controller => [
                            'delete',
                            'saveTableData',
                            'changePriority',
                            'saveMainVariantReport',
                            'removeVariantReport',
                            'saveSearchSettings',
                        ],
                    ],
                ],
            ],
            ModuleExtendedCDRsACL::getLinkedControllerActions()
        );
    }

    public function testCallTrackingPageOwnsItsSaveAndLegacyApi(): void
    {
        $controller = 'Modules\ModuleCallTracking\App\Controllers\ModuleCallTrackingController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        $controller => ['save'],
                        '/pbxcore/api/modules/module-call-tracking' => '*',
                    ],
                ],
            ],
            ModuleCallTrackingACL::getLinkedControllerActions()
        );
    }

    public function testZabbixPageOwnsSaveStatusAndTemplateDownload(): void
    {
        $controller = 'Modules\ModuleZabbixAgent5\App\Controllers\ModuleZabbixAgent5Controller';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        $controller => ['save'],
                        '/pbxcore/api/modules/module-zabbix-agent5' => '*',
                        '/pbxcore/api/v3/module-zabbix-agent5/status' => [
                            'getStatus',
                            'downloadTemplate',
                        ],
                    ],
                ],
            ],
            ModuleZabbixAgent5ACL::getLinkedControllerActions()
        );
    }

    public function testPhoneBookKeepsBulkMutationsUnderMutationRights(): void
    {
        $controller = 'Modules\ModulePhoneBook\App\Controllers\ModulePhoneBookController';
        self::assertSame(
            [
                $controller => [
                    'index' => [
                        $controller => ['getNewRecords'],
                        '/pbxcore/api/modules/module-phone-book' => '*',
                    ],
                    'save' => [
                        $controller => ['saveSettings'],
                    ],
                    'delete' => [
                        $controller => ['deleteAllRecords'],
                    ],
                ],
            ],
            ModulePhoneBookACL::getLinkedControllerActions()
        );
    }
}
