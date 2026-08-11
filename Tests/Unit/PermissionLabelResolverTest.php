<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit;

use Modules\ModuleUsersUI\Lib\PermissionLabelResolver;
use PHPUnit\Framework\TestCase;

class PermissionLabelResolverTest extends TestCase
{
    public function testRestEndpointKeepsSpecificApiDescription(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            'Phrase catalogue',
            PermissionLabelResolver::controller(
                'ModulePhraseStudio',
                '/pbxcore/api/v3/module-phrase-studio/phrases',
                'Phrase catalogue',
                static fn(string $key): string => $key
            )
        );
    }

    public function testRestEndpointWithoutDescriptionFallsBackToFullPath(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            '/pbxcore/api/v3/module-phrase-studio/voices',
            PermissionLabelResolver::controller(
                'ModulePhraseStudio',
                '/pbxcore/api/v3/module-phrase-studio/voices',
                '',
                static fn(string $key): string => $key
            )
        );
    }

    public function testRestEndpointRejectsModuleBreadcrumbAsGenericDescription(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            '/pbxcore/api/v3/module-monitor-active-calls/status',
            PermissionLabelResolver::controller(
                'ModuleMonitorActiveCalls',
                '/pbxcore/api/v3/module-monitor-active-calls/status',
                'Мониторинг активных вызовов',
                static fn(string $key): string => $key === 'BreadcrumbModuleMonitorActiveCalls'
                    ? 'Мониторинг активных вызовов'
                    : $key
            )
        );
    }

    public function testRestEndpointRejectsUnresolvedTranslationKey(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            '/pbxcore/api/v3/example/items',
            PermissionLabelResolver::controller(
                'ModuleExample',
                '/pbxcore/api/v3/example/items',
                'rest_example_items_description',
                static fn(string $key): string => $key
            )
        );
    }

    public function testLegacyRestRootRejectsModuleBreadcrumbAsGenericDescription(): void
    {
        self::assertSame(
            '/',
            PermissionLabelResolver::controller(
                'ModuleExtendedCDRs',
                '/',
                'Расширенная история вызовов',
                static fn(string $key): string => $key === 'BreadcrumbModuleExtendedCDRs'
                    ? 'Расширенная история вызовов'
                    : $key
            )
        );
    }

    public function testMvcControllerKeepsControllerBreadcrumbFallback(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            'Настройки телефонии',
            PermissionLabelResolver::controller(
                'ModuleExample',
                'Settings',
                '',
                static fn(string $key): string => $key === 'BreadcrumbSettings'
                    ? 'Настройки телефонии'
                    : $key
            )
        );
    }

    public function testMvcControllerKeepsModuleBreadcrumbFallback(): void
    {
        self::assertTrue(class_exists(PermissionLabelResolver::class));

        self::assertSame(
            'Example module',
            PermissionLabelResolver::controller(
                'ModuleExample',
                'Unknown',
                '',
                static fn(string $key): string => $key === 'BreadcrumbModuleExample'
                    ? 'Example module'
                    : $key
            )
        );
    }
}
