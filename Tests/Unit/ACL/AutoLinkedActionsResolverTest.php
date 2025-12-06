<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use Modules\ModuleUsersUI\Lib\ACL\AutoLinkedActionsResolver;
use Modules\ModuleUsersUI\Lib\EndpointConstants as E;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for AutoLinkedActionsResolver class.
 *
 * Tests cover:
 * - Controller to endpoint name conversion
 * - Endpoint to controller name conversion
 * - Standard CRUD mapping
 * - Virtual actions generation
 * - Hidden REST API actions
 * - Auto-linked actions generation
 */
class AutoLinkedActionsResolverTest extends TestCase
{
    /**
     * Test controller to endpoint conversion with standard naming.
     *
     * @dataProvider controllerToEndpointProvider
     */
    public function testControllerToEndpoint(string $controller, ?string $expectedEndpoint): void
    {
        $result = AutoLinkedActionsResolver::controllerToEndpoint($controller);
        $this->assertSame($expectedEndpoint, $result);
    }

    /**
     * Data provider for controller to endpoint conversion tests.
     *
     * @return array<string, array{0: string, 1: string|null}>
     */
    public static function controllerToEndpointProvider(): array
    {
        return [
            'CallQueues controller' => [
                'MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController',
                '/pbxcore/api/v3/call-queues'
            ],
            'Extensions controller' => [
                'MikoPBX\\AdminCabinet\\Controllers\\ExtensionsController',
                '/pbxcore/api/v3/extensions'
            ],
            'ConferenceRooms controller' => [
                'MikoPBX\\AdminCabinet\\Controllers\\ConferenceRoomsController',
                '/pbxcore/api/v3/conference-rooms'
            ],
            'IvrMenu controller (explicit mapping)' => [
                'MikoPBX\\AdminCabinet\\Controllers\\IvrMenuController',
                E::API_V3_IVR_MENU
            ],
            'OutOffWorkTime controller (explicit mapping)' => [
                'MikoPBX\\AdminCabinet\\Controllers\\OutOffWorkTimeController',
                E::API_V3_OFF_WORK_TIMES
            ],
            'SoundFiles controller (explicit mapping)' => [
                'MikoPBX\\AdminCabinet\\Controllers\\SoundFilesController',
                E::API_V3_SOUND_FILES
            ],
            'Invalid class name' => [
                'SomeRandomClass',
                null
            ],
            'Missing Controller suffix' => [
                'MikoPBX\\AdminCabinet\\Controllers\\CallQueues',
                null
            ],
        ];
    }

    /**
     * Test endpoint to controller conversion.
     *
     * @dataProvider endpointToControllerProvider
     */
    public function testEndpointToController(string $endpoint, ?string $expectedController): void
    {
        $result = AutoLinkedActionsResolver::endpointToController($endpoint);
        $this->assertSame($expectedController, $result);
    }

    /**
     * Data provider for endpoint to controller conversion tests.
     *
     * @return array<string, array{0: string, 1: string|null}>
     */
    public static function endpointToControllerProvider(): array
    {
        return [
            'call-queues endpoint' => [
                '/pbxcore/api/v3/call-queues',
                'MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController'
            ],
            'extensions endpoint' => [
                '/pbxcore/api/v3/extensions',
                'MikoPBX\\AdminCabinet\\Controllers\\ExtensionsController'
            ],
            'conference-rooms endpoint' => [
                '/pbxcore/api/v3/conference-rooms',
                'MikoPBX\\AdminCabinet\\Controllers\\ConferenceRoomsController'
            ],
            'ivr-menu endpoint (explicit mapping)' => [
                E::API_V3_IVR_MENU,
                'MikoPBX\\AdminCabinet\\Controllers\\IvrMenuController'
            ],
            'Invalid endpoint format' => [
                '/some/random/path',
                null
            ],
        ];
    }

    /**
     * Test that standard CRUD mapping contains expected actions.
     *
     * UI simplified to 3 categories:
     * 1. View list (index → getList)
     * 2. View record (modify → getRecord)
     * 3. Edit/Delete (save → saveRecord + delete combined)
     */
    public function testGetStandardCrudMapping(): void
    {
        $mapping = AutoLinkedActionsResolver::getStandardCrudMapping();

        // Should have 3 categories (no separate delete)
        $this->assertCount(3, $mapping);
        $this->assertArrayHasKey(E::ACTION_INDEX, $mapping);
        $this->assertArrayHasKey(E::ACTION_MODIFY, $mapping);
        $this->assertArrayHasKey(E::ACTION_SAVE, $mapping);
        $this->assertArrayNotHasKey(E::ACTION_DELETE, $mapping);

        // index and modify map to single actions
        $this->assertSame(E::ACTION_GET_LIST, $mapping[E::ACTION_INDEX]);
        $this->assertSame(E::ACTION_GET_RECORD, $mapping[E::ACTION_MODIFY]);

        // save maps to array of actions (saveRecord + delete)
        $this->assertIsArray($mapping[E::ACTION_SAVE]);
        $this->assertContains(E::ACTION_SAVE_RECORD, $mapping[E::ACTION_SAVE]);
        $this->assertContains(E::ACTION_DELETE, $mapping[E::ACTION_SAVE]);
    }

    /**
     * Test that virtual actions returns only save (delete is combined with save).
     */
    public function testGetVirtualActions(): void
    {
        $virtualActions = AutoLinkedActionsResolver::getVirtualActions();

        $this->assertContains(E::ACTION_SAVE, $virtualActions);
        $this->assertNotContains(E::ACTION_DELETE, $virtualActions);
        $this->assertCount(1, $virtualActions);
    }

    /**
     * Test that hidden REST API actions contains all CRUD actions.
     *
     * These actions are flattened from STANDARD_CRUD_MAPPING values.
     */
    public function testGetHiddenRestApiActions(): void
    {
        $hiddenActions = AutoLinkedActionsResolver::getHiddenRestApiActions();

        // Should contain all REST API actions from the mapping
        $this->assertContains(E::ACTION_GET_LIST, $hiddenActions);
        $this->assertContains(E::ACTION_GET_RECORD, $hiddenActions);
        $this->assertContains(E::ACTION_SAVE_RECORD, $hiddenActions);
        $this->assertContains(E::ACTION_DELETE, $hiddenActions);

        // 4 unique actions: getList, getRecord, saveRecord, delete
        $this->assertCount(4, $hiddenActions);
    }

    /**
     * Test that available endpoints are populated from EndpointConstants.
     */
    public function testGetAvailableEndpoints(): void
    {
        // Clear cache to ensure fresh data
        AutoLinkedActionsResolver::clearCache();

        $endpoints = AutoLinkedActionsResolver::getAvailableEndpoints();

        // Should contain known endpoints
        $this->assertContains(E::API_V3_CALL_QUEUES, $endpoints);
        $this->assertContains(E::API_V3_EXTENSIONS, $endpoints);
        $this->assertContains(E::API_V3_IVR_MENU, $endpoints);
        $this->assertContains(E::API_V3_CONFERENCE_ROOMS, $endpoints);

        // Should not be empty
        $this->assertNotEmpty($endpoints);
    }

    /**
     * Test endpoint existence check.
     */
    public function testEndpointExists(): void
    {
        AutoLinkedActionsResolver::clearCache();

        $this->assertTrue(AutoLinkedActionsResolver::endpointExists(E::API_V3_CALL_QUEUES));
        $this->assertTrue(AutoLinkedActionsResolver::endpointExists(E::API_V3_EXTENSIONS));
        $this->assertFalse(AutoLinkedActionsResolver::endpointExists('/pbxcore/api/v3/non-existent'));
    }

    /**
     * Test auto-linked actions generation for a single controller.
     */
    public function testGetAutoLinkedActionsForController(): void
    {
        AutoLinkedActionsResolver::clearCache();

        $controller = 'MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController';
        $links = AutoLinkedActionsResolver::getAutoLinkedActionsForController($controller);

        // Should have links for 3 UI actions (no separate delete)
        $this->assertArrayHasKey(E::ACTION_INDEX, $links);
        $this->assertArrayHasKey(E::ACTION_MODIFY, $links);
        $this->assertArrayHasKey(E::ACTION_SAVE, $links);
        $this->assertArrayNotHasKey(E::ACTION_DELETE, $links);

        $expectedEndpoint = '/pbxcore/api/v3/call-queues';

        // index links to getList
        $this->assertArrayHasKey($expectedEndpoint, $links[E::ACTION_INDEX]);
        $this->assertContains(E::ACTION_GET_LIST, $links[E::ACTION_INDEX][$expectedEndpoint]);

        // modify links to getRecord
        $this->assertArrayHasKey($expectedEndpoint, $links[E::ACTION_MODIFY]);
        $this->assertContains(E::ACTION_GET_RECORD, $links[E::ACTION_MODIFY][$expectedEndpoint]);

        // save links to both saveRecord and delete
        $this->assertArrayHasKey($expectedEndpoint, $links[E::ACTION_SAVE]);
        $this->assertContains(E::ACTION_SAVE_RECORD, $links[E::ACTION_SAVE][$expectedEndpoint]);
        $this->assertContains(E::ACTION_DELETE, $links[E::ACTION_SAVE][$expectedEndpoint]);
    }

    /**
     * Test that excluded controllers return empty links.
     */
    public function testExcludedControllersReturnEmpty(): void
    {
        $excludedControllers = [
            'MikoPBX\\AdminCabinet\\Controllers\\ProvidersController',
            'MikoPBX\\AdminCabinet\\Controllers\\CallDetailRecordsController',
            'MikoPBX\\AdminCabinet\\Controllers\\SessionController',
            'MikoPBX\\AdminCabinet\\Controllers\\ErrorsController',
            'MikoPBX\\AdminCabinet\\Controllers\\BaseController',
        ];

        foreach ($excludedControllers as $controller) {
            $links = AutoLinkedActionsResolver::getAutoLinkedActionsForController($controller);
            $this->assertEmpty($links, "Controller $controller should be excluded");
        }
    }

    /**
     * Test auto-linked actions for multiple controllers.
     */
    public function testGetAutoLinkedActions(): void
    {
        AutoLinkedActionsResolver::clearCache();

        $controllers = [
            'MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController',
            'MikoPBX\\AdminCabinet\\Controllers\\ExtensionsController',
            'MikoPBX\\AdminCabinet\\Controllers\\ProvidersController', // Excluded
        ];

        $result = AutoLinkedActionsResolver::getAutoLinkedActions($controllers);

        // CallQueues and Extensions should have links
        $this->assertArrayHasKey('MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController', $result);
        $this->assertArrayHasKey('MikoPBX\\AdminCabinet\\Controllers\\ExtensionsController', $result);

        // ProvidersController should be excluded
        $this->assertArrayNotHasKey('MikoPBX\\AdminCabinet\\Controllers\\ProvidersController', $result);
    }

    /**
     * Test bidirectional conversion consistency.
     *
     * Converting controller → endpoint → controller should return original controller.
     */
    public function testBidirectionalConversionConsistency(): void
    {
        $originalController = 'MikoPBX\\AdminCabinet\\Controllers\\CallQueuesController';

        $endpoint = AutoLinkedActionsResolver::controllerToEndpoint($originalController);
        $this->assertNotNull($endpoint);

        $backToController = AutoLinkedActionsResolver::endpointToController($endpoint);
        $this->assertSame($originalController, $backToController);
    }

    /**
     * Test cache clearing works correctly.
     */
    public function testClearCache(): void
    {
        // Populate cache
        $endpoints1 = AutoLinkedActionsResolver::getAvailableEndpoints();

        // Clear cache
        AutoLinkedActionsResolver::clearCache();

        // Get endpoints again - should still work
        $endpoints2 = AutoLinkedActionsResolver::getAvailableEndpoints();

        $this->assertEquals($endpoints1, $endpoints2);
    }
}
