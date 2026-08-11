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

namespace Modules\ModuleUsersUI\Lib;

class PermissionLabelResolver
{
    /**
     * Resolve a meaningful label for an MVC controller or REST endpoint.
     *
     * @param callable(string): string $translate
     */
    public static function controller(
        string $module,
        string $controllerName,
        mixed $apiLabel,
        callable $translate
    ): string {
        $moduleBreadcrumbKey = "Breadcrumb{$module}";
        $moduleBreadcrumb = $translate($moduleBreadcrumbKey);
        $isRestController = str_starts_with($controllerName, '/');

        if (
            self::isUsableApiLabel($apiLabel)
            && (!$isRestController || trim($apiLabel) !== trim($moduleBreadcrumb))
        ) {
            return $apiLabel;
        }

        if ($isRestController) {
            return $controllerName;
        }

        $translationTemplate = "mm_{$controllerName}";
        $controllerTranslation = $translate($translationTemplate);
        if ($controllerTranslation !== $translationTemplate) {
            return $controllerTranslation;
        }

        $controllerBreadcrumbKey = "Breadcrumb{$controllerName}";
        $controllerBreadcrumb = $translate($controllerBreadcrumbKey);
        if ($controllerBreadcrumb !== $controllerBreadcrumbKey) {
            return $controllerBreadcrumb;
        }

        if ($moduleBreadcrumb !== $moduleBreadcrumbKey) {
            return $moduleBreadcrumb;
        }

        return $controllerName;
    }

    /**
     * Check that Core returned translated text rather than an unresolved key.
     */
    public static function isUsableApiLabel(mixed $label): bool
    {
        if (!is_string($label) || $label === '') {
            return false;
        }

        return preg_match('/^(?:module_|rest_)[A-Za-z0-9_]+$/', $label) !== 1;
    }
}
