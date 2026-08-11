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

class LinkedActionOwnerResolver
{
    /**
     * Adds linked action owners that are not published by an MVC controller.
     *
     * @param array<string, bool> $publishedActions
     * @param array<string, array<string, array<string, array<string>>>> $linkedControllerActions
     * @param array<string> $excludedActions
     * @return array<string, bool>
     */
    public static function merge(
        array $publishedActions,
        string $controllerClass,
        array $linkedControllerActions,
        array $excludedActions = []
    ): array {
        $actions = $publishedActions;

        foreach ($linkedControllerActions[$controllerClass] ?? [] as $action => $_linkedControllers) {
            if (in_array($action, $excludedActions, true)) {
                unset($actions[$action]);
                continue;
            }

            if (!array_key_exists($action, $actions)) {
                $actions[$action] = false;
            }
        }

        return $actions;
    }
}
