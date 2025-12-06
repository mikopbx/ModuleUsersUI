<?php

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2023 Alexey Portnov and Nikolay Beketov
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

namespace Modules\ModuleUsersUI\App\Controllers;

use MikoPBX\Common\Providers\PBXCoreRESTClientProvider;
use Modules\ModuleUsersUI\Lib\ACL\AutoLinkedActionsResolver;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Lib\UsersUIACL;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;

class AccessGroupsRightsController extends ModuleUsersUIBaseController
{
    /**
     * Retrieves the group rights based on the provided access group ID.
     * Uses Core API to get available controllers and actions.
     *
     * @param string $accessGroupId The access group ID.
     * @return array An array containing the group rights.
     */
    public function getGroupRights(string $accessGroupId): array
    {
        $parameters = [
            'conditions' => 'group_id = :group_id:',
            'bind' => [
                'group_id' => $accessGroupId
            ]
        ];

        // Retrieve allowed rights based on the group ID
        $allowedRights = AccessGroupsRights::find($parameters)->toArray();

        // Get available controllers and actions from Core API
        $combined = $this->getAvailableControllersFromApi();

        return $this->fillAllowed($combined, $allowedRights);
    }

    /**
     * Retrieves available controllers and actions from Core API.
     * Transforms API response to UI-expected format and applies exclusion rules.
     *
     * Also adds virtual actions (save, delete) for AdminCabinet controllers
     * that have corresponding REST API endpoints.
     *
     * @return array Controllers organized by module/category with actions as keys.
     */
    private function getAvailableControllersFromApi(): array
    {
        $result = $this->di->get(
            PBXCoreRESTClientProvider::SERVICE_NAME,
            [
                '/pbxcore/api/v3/openapi:getDetailedPermissions',
                PBXCoreRESTClientProvider::HTTP_METHOD_GET
            ]
        );

        if (!$result->success) {
            return [];
        }

        // Get exclusion rules (alwaysAllowed, alwaysDenied, linkedActions)
        [$excludedControllers, $excludedActions] = $this->getExclusionsActionsControllers();

        // Get virtual actions that should be added to AdminCabinet controllers
        $virtualActions = AutoLinkedActionsResolver::getVirtualActions();

        $controllers = [];
        $categories = $result->data['categories'] ?? [];

        foreach ($categories as $categoryId => $categoryData) {
            $type = $categoryData['type'] ?? 'APP';

            foreach ($categoryData['controllers'] ?? [] as $controllerClass => $controllerInfo) {
                // Skip controllers that are completely excluded
                if (in_array($controllerClass, $excludedControllers)) {
                    continue;
                }

                // Get excluded actions for this controller
                $controllerExcludedActions = $excludedActions[$controllerClass] ?? [];

                $actions = [];
                foreach ($controllerInfo['actions'] ?? [] as $actionName) {
                    // Skip excluded actions
                    if (in_array($actionName, $controllerExcludedActions)) {
                        continue;
                    }
                    $actions[$actionName] = false;
                }

                // Add virtual actions (save, delete) for AdminCabinet controllers
                // that have corresponding REST API endpoints
                if ($categoryId === Constants::ADMIN_CABINET) {
                    $endpoint = AutoLinkedActionsResolver::controllerToEndpoint($controllerClass);
                    if ($endpoint !== null && AutoLinkedActionsResolver::endpointExists($endpoint)) {
                        foreach ($virtualActions as $virtualAction) {
                            // Only add if not already present and not excluded
                            if (!isset($actions[$virtualAction])
                                && !in_array($virtualAction, $controllerExcludedActions)) {
                                $actions[$virtualAction] = false;
                            }
                        }
                    }
                }

                if (!empty($actions)) {
                    $controllers[$categoryId][$type][$controllerClass] = $actions;
                }
            }

            // Sort AdminCabinet controllers by translated name
            if ($categoryId === Constants::ADMIN_CABINET && isset($controllers[$categoryId][$type])) {
                uksort($controllers[$categoryId][$type], function ($a, $b) {
                    $controllerAParts = explode('\\', $a);
                    $controllerAName = end($controllerAParts);
                    $controllerAName = str_replace("Controller", "", $controllerAName);
                    $controllerANameTranslation = $this->translation->_('mm_' . $controllerAName);

                    $controllerBParts = explode('\\', $b);
                    $controllerBName = end($controllerBParts);
                    $controllerBName = str_replace("Controller", "", $controllerBName);
                    $controllerBNameTranslation = $this->translation->_('mm_' . $controllerBName);

                    return strcmp($controllerANameTranslation, $controllerBNameTranslation);
                });
            }
        }

        return $controllers;
    }

    /**
     * Fills the combined actions with allowed rights and marks them as true.
     *
     * @param array $combined The combined actions array.
     * @param array $allowedRights The allowed rights array.
     *
     * @return array The updated combined actions array.
     */
    public function fillAllowed(array $combined, array $allowedRights): array
    {
        // Check if allowed rights exist for the combined actions and mark them as true
        foreach ($combined as $moduleId => $types) {
            foreach ($types as $type => $controllers) {
                foreach ($controllers as $controllerClass => $actions) {
                    foreach ($actions as $actionName => $value) {
                        foreach ($allowedRights as $allowedRight) {
                            $allowedActions = json_decode($allowedRight['actions'], true);
                            if (
                                $allowedRight['module_id'] === $moduleId
                                && $allowedRight['controller'] === $controllerClass
                                && in_array($actionName, $allowedActions)
                            ) {
                                $combined[$moduleId][$type][$controllerClass][$actionName] = true;
                            }
                        }
                    }
                }
            }
        }
        return $combined;
    }

    /**
     * Get the list of controllers and actions which we hide from settings.
     *
     * Collects exclusion rules from:
     * - linkedControllerActions: actions that are granted automatically with main action
     * - alwaysAllowed: public actions that don't require permission checks
     * - alwaysDenied: admin-only actions that regular users cannot access
     * - hiddenRestApiActions: standard CRUD actions on REST API (auto-linked to AdminCabinet)
     *
     * @return array{0: array<string>, 1: array<string, array<string>>}
     *         [0] - Controllers to exclude completely (all actions hidden)
     *         [1] - Specific actions to exclude per controller
     */
    private function getExclusionsActionsControllers(): array
    {
        $excludedControllers = [];
        $excludedActions = [];
        $arrayOfExclusions = [];

        // Get the list of linked controllers and actions which we hide from settings
        foreach (UsersUIACL::getLinkedControllerActions() as $controllerClass => $actions) {
            // Iterate through the main controllers actions
            foreach ($actions as $action => $linkedControllers) {
                // Iterate through the linked controllers actions
                foreach ($linkedControllers as $linkedController => $linkedActions) {
                    if (array_key_exists($linkedController, $arrayOfExclusions)) {
                        $arrayOfExclusions[$linkedController] = array_merge(
                            $arrayOfExclusions[$linkedController],
                            $linkedActions
                        );
                        $arrayOfExclusions[$linkedController] = array_unique($arrayOfExclusions[$linkedController]);
                    } else {
                        $arrayOfExclusions[$linkedController] = $linkedActions;
                    }
                }
            }
        }

        // Merge with always allowed and always denied rules
        $arrayOfExclusions = array_merge_recursive(
            UsersUIACL::getAlwaysAllowed(),
            UsersUIACL::getAlwaysDenied(),
            $arrayOfExclusions
        );

        // Hide standard CRUD actions on REST API endpoints that have corresponding AdminCabinet controllers
        // These actions are auto-linked and shouldn't be configured separately
        $hiddenRestApiActions = AutoLinkedActionsResolver::getHiddenRestApiActions();
        foreach (AutoLinkedActionsResolver::getAvailableEndpoints() as $endpoint) {
            // Check if this endpoint has a corresponding AdminCabinet controller
            $controller = AutoLinkedActionsResolver::endpointToController($endpoint);
            if ($controller !== null && class_exists($controller)) {
                // Hide standard CRUD actions for this endpoint
                if (isset($arrayOfExclusions[$endpoint])) {
                    $arrayOfExclusions[$endpoint] = array_merge(
                        $arrayOfExclusions[$endpoint],
                        $hiddenRestApiActions
                    );
                    $arrayOfExclusions[$endpoint] = array_unique($arrayOfExclusions[$endpoint]);
                } else {
                    $arrayOfExclusions[$endpoint] = $hiddenRestApiActions;
                }
            }
        }

        // Iterate through the always allowed and disallowed controllers and actions
        foreach ($arrayOfExclusions as $controllerClass => $actions) {
            if (
                $actions === '*'
                || (is_array($actions) && in_array('*', $actions))
            ) {
                // Add the controller with all actions to the excluded from settings array
                $excludedControllers[] = $controllerClass;
            } elseif (is_array($actions)) {
                // Add the controller with defined actions to the excluded from settings array
                $excludedActions[$controllerClass] = array_unique($actions);
            }
        }

        return [$excludedControllers, $excludedActions];
    }

    /**
     * Saves access group rights for a given access group entity.
     *
     * @param string $accessGroupId The access group ID.
     * @param array $accessGroupRightsFromPost The user set of access group rights.
     * @return bool Returns true on success, false on failure.
     */
    public function saveAccessGroupRights(string $accessGroupId, array $accessGroupRightsFromPost): bool
    {
        // Delete existing access group rights for the given access group entity
        $accessGroupRights = AccessGroupsRights::find("group_id={$accessGroupId}");
        foreach ($accessGroupRights as $accessGroupRight) {
            if ($accessGroupRight->delete() === false) {
                $errors = $accessGroupRight->getMessages();
                $this->flash->error(implode('<br>', $errors));

                return false;
            }
        }

        foreach ($accessGroupRightsFromPost as $modules) {
            foreach ($modules['controllers'] as $controller) {
                // Create a new access group right object
                $accessGroupRight = new AccessGroupsRights();
                $accessGroupRight->group_id = intval($accessGroupId);
                $accessGroupRight->module_id = $modules['module'];
                $accessGroupRight->controller = $controller['controller'];
                $accessGroupRight->actions = json_encode($controller['actions']);

                // Save the access group right object
                if ($this->saveEntity($accessGroupRight) === false) {
                    // If there are validation errors, display them and return false
                    return false;
                }
            }
        }
        return true;
    }
}
