<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2024 Alexey Portnov and Nikolay Beketov
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

namespace Modules\ModuleUsersUI\App\Providers;


use Phalcon\Di\DiInterface;
use Phalcon\Di\ServiceProviderInterface;
use Phalcon\Mvc\View;
use function MikoPBX\Common\Config\appPath;

/**
 * The URL component is used to generate all kind of urls in the application
 */
class ViewProvider implements ServiceProviderInterface
{
    public const SERVICE_NAME = 'view';

    /**
     * Register view service provider
     *
     * @param DiInterface $di The DI container.
     */
    public function register(DiInterface $di): void
    {
        $di->setShared(
            self::SERVICE_NAME,
            function () {
                $viewsDir = appPath('App/Views');
                $view = new View();
                $view->setViewsDir($viewsDir);
                $view->registerEngines(
                    [
                        '.volt' => 'volt',
                    ]
                );

                return $view;
            }
        );
    }
}