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
use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\Modules\PbxExtensionUtils;
use Phalcon\Annotations\Reader;
use Phalcon\Loader;
use Phalcon\Mvc\Controller\BindModelInterface;
use Phalcon\Annotations\Adapter\Memory as AnnotationsMemory;
use Phalcon\Annotations\Reflection;
use function MikoPBX\Common\Config\appPath;

class AccessGroupsRightsController extends BaseController
{
    private $moduleUniqueID = 'ModuleUsersUI';
    private $moduleDir;

    public bool $showModuleStatusToggle = false;

    /**
     * Basic initial class
     */
    public function initialize(): void
    {
        $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
        $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.svg";
        $this->view->submitMode = null;
        parent::initialize();
    }

    /**
     * Prepares ajax response with relevant data
     */
    public function getGroupRightsAction():void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $accessGroupRightFromPost = $this->request->getPost('accessGroupId');


    }

    /**
     * Готовит список всех доступных контроллеров и их actions
     * @return void
     */
    private function getAvailableControllersActionsAction():void
    {
        // Загружаем все классы контроллеров

        // Сканируем файлы в директории с контроллерами
        $controllersDir = appPath('src/AdminCabinet/Controllers');
        $controllerFiles = glob("{$controllersDir}/*.php", GLOB_NOSORT);

        $controllers = [];

        foreach ($controllerFiles as $file) {

                $className        = pathinfo($file)['filename'];
                $controllerClass = 'MikoPBX\AdminCabinet\Controllers\\' . $className;

                $reader = new Reader();
                $parsing = $reader->parse($controllerClass);

                // Создаем отражение (reflection) класса контроллера
                $reflection = new Reflection($parsing);
                $classAnnotations = $reflection->getClassAnnotations();

                // Получаем действия (actions) контроллера
                $actions = [];
                foreach ($reflection->getMethodsAnnotations() as $methodAnnotations) {
                    foreach ($methodAnnotations as $annotation) {
                        if ($annotation->getName() === 'Route') {
                            $actionName = $annotation->getArgument(0);
                            $actions[] = $actionName;
                        }
                    }
                }

//            // Получение всех публичных методов, оканчивающихся на "action"
//            foreach ($reflection->getMethods() as $method) {
//                if ($method->isPublic() && substr($method->getName(), -6) === 'action') {
//                    $publicMethods[] = $method->getName();
//                }
//            }

                $controllers[$className] = $actions;
        }

        // Выводим список контроллеров и действий
        $this->view->success = true;
        $this->view->results = $controllers;
    }

}

