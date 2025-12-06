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

namespace Modules\ModuleUsersUI\Lib\ACL;

use MikoPBX\Common\Library\Text;
use Modules\ModuleUsersUI\Lib\EndpointConstants as E;

/**
 * Automatic linking of AdminCabinet controller actions to REST API endpoints.
 *
 * This resolver automatically creates ACL links between AdminCabinet MVC controllers
 * and their corresponding REST API v3 endpoints based on naming conventions.
 *
 * Naming convention:
 * - AdminCabinet: CallQueuesController → REST API: /pbxcore/api/v3/call-queues
 * - AdminCabinet: IvrMenuController → REST API: /pbxcore/api/v3/ivr-menu
 *
 * Standard CRUD mapping:
 * - index → getList (view list)
 * - modify → getRecord (view single record)
 * - save → saveRecord + delete (edit and remove combined)
 *
 * Usage:
 * Explicit rules in CoreACL::getLinkedControllerActions() take priority.
 * Auto-linking is applied only when no explicit rule exists.
 */
class AutoLinkedActionsResolver
{
    /**
     * Standard CRUD action mapping from AdminCabinet to REST API.
     *
     * Key: AdminCabinet action name
     * Value: REST API action name(s) - string for single action, array for multiple
     *
     * UI simplified to 3 categories:
     * 1. View list (index) → getList
     * 2. View record (modify) → getRecord + getDefault (for new record defaults)
     * 3. Edit/Delete (save) → all modification actions
     */
    private const STANDARD_CRUD_MAPPING = [
        E::ACTION_INDEX => E::ACTION_GET_LIST,
        E::ACTION_MODIFY => [E::ACTION_GET_RECORD, E::ACTION_GET_DEFAULT],
        E::ACTION_SAVE => [
            E::ACTION_SAVE_RECORD,
            E::ACTION_DELETE,
            E::ACTION_CREATE,
            E::ACTION_UPDATE,
            E::ACTION_PATCH,
            E::ACTION_COPY,
        ],
    ];

    /**
     * Controllers that should NOT use automatic linking.
     * These have complex or non-standard REST API patterns.
     */
    private const EXCLUDED_CONTROLLERS = [
        'MikoPBX\\AdminCabinet\\Controllers\\ProvidersController',      // Has modifysip/modifyiax
        'MikoPBX\\AdminCabinet\\Controllers\\SessionController',       // Auth-related
        'MikoPBX\\AdminCabinet\\Controllers\\ErrorsController',        // System errors
        'MikoPBX\\AdminCabinet\\Controllers\\BaseController',          // Abstract base
        'MikoPBX\\AdminCabinet\\Controllers\\AclController',           // ACL management
    ];

    /**
     * Explicit controller-to-endpoint mapping for non-standard names.
     * Key: Controller class name (without namespace)
     * Value: REST API endpoint path
     */
    private const EXPLICIT_ENDPOINT_MAPPING = [
        'CallDetailRecords' => E::API_V3_CDR,
        'IvrMenu' => E::API_V3_IVR_MENU,
        'OutOffWorkTime' => E::API_V3_OFF_WORK_TIMES,
        'SoundFiles' => E::API_V3_SOUND_FILES,
        'OffWorkTimes' => E::API_V3_OFF_WORK_TIMES,
    ];

    /**
     * Cached list of available REST API endpoints.
     * Populated on first use.
     *
     * @var array<string>|null
     */
    private static ?array $availableEndpoints = null;

    /**
     * Get automatic linked actions for all AdminCabinet controllers.
     *
     * Returns a map of controller → action → linked endpoints/actions
     * that can be merged with explicit rules from CoreACL.
     *
     * @param array<string> $adminCabinetControllers List of controller class names
     * @return array<string, array<string, array<string, array<string>>>>
     */
    public static function getAutoLinkedActions(array $adminCabinetControllers): array
    {
        $result = [];

        foreach ($adminCabinetControllers as $controllerClass) {
            // Skip excluded controllers
            if (in_array($controllerClass, self::EXCLUDED_CONTROLLERS, true)) {
                continue;
            }

            $endpoint = self::controllerToEndpoint($controllerClass);
            if ($endpoint === null) {
                continue;
            }

            // Check if endpoint actually exists
            if (!self::endpointExists($endpoint)) {
                continue;
            }

            // Build linked actions for this controller
            $controllerLinks = self::buildControllerLinks($endpoint);
            if (!empty($controllerLinks)) {
                $result[$controllerClass] = $controllerLinks;
            }
        }

        return $result;
    }

    /**
     * Get auto-linked actions for a single controller.
     *
     * @param string $controllerClass Full controller class name
     * @return array<string, array<string, array<string>>> Action links or empty array
     */
    public static function getAutoLinkedActionsForController(string $controllerClass): array
    {
        if (in_array($controllerClass, self::EXCLUDED_CONTROLLERS, true)) {
            return [];
        }

        $endpoint = self::controllerToEndpoint($controllerClass);
        if ($endpoint === null || !self::endpointExists($endpoint)) {
            return [];
        }

        return self::buildControllerLinks($endpoint);
    }

    /**
     * Convert AdminCabinet controller class name to REST API endpoint path.
     *
     * Examples:
     * - MikoPBX\AdminCabinet\Controllers\CallQueuesController → /pbxcore/api/v3/call-queues
     * - MikoPBX\AdminCabinet\Controllers\IvrMenuController → /pbxcore/api/v3/ivr-menu
     *
     * @param string $controllerClass Full controller class name
     * @return string|null REST API endpoint path or null if can't convert
     */
    public static function controllerToEndpoint(string $controllerClass): ?string
    {
        // Extract controller name from class
        // MikoPBX\AdminCabinet\Controllers\CallQueuesController → CallQueues
        if (!preg_match('#\\\\([A-Za-z]+)Controller$#', $controllerClass, $matches)) {
            return null;
        }

        $controllerName = $matches[1];

        // Check explicit mapping first
        if (isset(self::EXPLICIT_ENDPOINT_MAPPING[$controllerName])) {
            return self::EXPLICIT_ENDPOINT_MAPPING[$controllerName];
        }

        // Convert CamelCase to kebab-case
        // CallQueues → call-queues
        $kebabName = Text::uncamelize($controllerName, '-');

        return '/pbxcore/api/v3/' . $kebabName;
    }

    /**
     * Convert REST API endpoint path to AdminCabinet controller class name.
     *
     * Examples:
     * - /pbxcore/api/v3/call-queues → MikoPBX\AdminCabinet\Controllers\CallQueuesController
     *
     * @param string $endpoint REST API endpoint path
     * @return string|null Controller class name or null if can't convert
     */
    public static function endpointToController(string $endpoint): ?string
    {
        // Check explicit mapping (reverse lookup)
        $explicitController = array_search($endpoint, self::EXPLICIT_ENDPOINT_MAPPING, true);
        if ($explicitController !== false) {
            return 'MikoPBX\\AdminCabinet\\Controllers\\' . $explicitController . 'Controller';
        }

        // Extract resource name from endpoint
        // /pbxcore/api/v3/call-queues → call-queues
        if (!preg_match('#/pbxcore/api/v3/([a-z0-9-]+)#', $endpoint, $matches)) {
            return null;
        }

        $resourceName = $matches[1];

        // Convert kebab-case to CamelCase
        // call-queues → CallQueues
        $controllerName = str_replace('-', '', ucwords($resourceName, '-'));

        return 'MikoPBX\\AdminCabinet\\Controllers\\' . $controllerName . 'Controller';
    }

    /**
     * Get standard CRUD mapping.
     *
     * @return array<string, string>
     */
    public static function getStandardCrudMapping(): array
    {
        return self::STANDARD_CRUD_MAPPING;
    }

    /**
     * Get virtual actions that should be added to AdminCabinet controllers.
     *
     * These are actions that don't exist in the controller but are needed
     * for proper ACL UI representation (save moved to REST API).
     *
     * Note: 'delete' is not shown separately - it's combined with 'save'
     * into a single "Edit/Delete" permission category.
     *
     * @return array<string>
     */
    public static function getVirtualActions(): array
    {
        return [E::ACTION_SAVE];
    }

    /**
     * Get REST API CRUD actions that should be hidden from UI.
     *
     * These actions are auto-linked to AdminCabinet actions and shouldn't
     * be configured separately.
     *
     * @return array<string>
     */
    public static function getHiddenRestApiActions(): array
    {
        $actions = [];
        foreach (self::STANDARD_CRUD_MAPPING as $restActions) {
            if (is_array($restActions)) {
                $actions = array_merge($actions, $restActions);
            } else {
                $actions[] = $restActions;
            }
        }
        return array_unique($actions);
    }

    /**
     * Check if a REST API endpoint exists.
     *
     * @param string $endpoint Endpoint path
     * @return bool
     */
    public static function endpointExists(string $endpoint): bool
    {
        $endpoints = self::getAvailableEndpoints();
        return in_array($endpoint, $endpoints, true);
    }

    /**
     * Get list of available REST API v3 endpoints.
     *
     * Uses EndpointConstants to get all defined API_V3_* constants.
     *
     * @return array<string>
     */
    public static function getAvailableEndpoints(): array
    {
        if (self::$availableEndpoints !== null) {
            return self::$availableEndpoints;
        }

        self::$availableEndpoints = [];

        // Get all API_V3_* constants from EndpointConstants
        $reflection = new \ReflectionClass(E::class);
        $constants = $reflection->getConstants();

        foreach ($constants as $name => $value) {
            if (str_starts_with($name, 'API_V3_') && is_string($value)) {
                self::$availableEndpoints[] = $value;
            }
        }

        return self::$availableEndpoints;
    }

    /**
     * Clear cached endpoints (for testing).
     */
    public static function clearCache(): void
    {
        self::$availableEndpoints = null;
    }

    /**
     * Build linked actions map for a controller given its REST API endpoint.
     *
     * @param string $endpoint REST API endpoint path
     * @return array<string, array<string, array<string>>>
     */
    private static function buildControllerLinks(string $endpoint): array
    {
        $links = [];

        foreach (self::STANDARD_CRUD_MAPPING as $adminAction => $restActions) {
            // Normalize to array (single action or multiple actions)
            $actionsArray = is_array($restActions) ? $restActions : [$restActions];
            $links[$adminAction] = [
                $endpoint => $actionsArray
            ];
        }

        return $links;
    }
}
