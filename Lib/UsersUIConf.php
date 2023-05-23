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

/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 12 2019
 */


namespace Modules\ModuleUsersUI\Lib;

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

class UsersUIConf extends ConfigClass
{

    /**
     * Receive information about mikopbx main database changes
     *
     * @param $data
     */
    public function modelsEventChangeData($data): void
    {
        // f.e. if somebody changes PBXLanguage, we will restart all workers
        if (
            $data['model'] === PbxSettings::class
            && $data['recordId'] === 'PBXLanguage'
        ) {
            $templateMain = new UsersUIMain();
            $templateMain->startAllServices(true);
        }
    }

    /**
     * Returns module workers to start it at WorkerSafeScriptCore
     *
     * @return array
     */
    public function getModuleWorkers(): array
    {
        return [
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_BEANSTALK,
                'worker' => WorkerUsersUIMain::class,
            ],
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_AMI,
                'worker' => WorkerUsersUIAMI::class,
            ],
        ];
    }

    /**
     *  Process CoreAPI requests under root rights
     *
     * @param array $request
     *
     * @return PBXApiResult
     */
    public function moduleRestAPICallback(array $request): PBXApiResult
    {
        $res    = new PBXApiResult();
        $res->processor = __METHOD__;
        $action = strtoupper($request['action']);
        switch ($action) {
            case 'CHECK':
                $templateMain = new UsersUIMain();
                $res          = $templateMain->checkModuleWorkProperly();
                break;
            case 'RELOAD':
                $templateMain = new UsersUIMain();
                $templateMain->startAllServices(true);
                $res->success = true;
                break;
            default:
                $res->success    = false;
                $res->messages[] = 'API action not found in moduleRestAPICallback ModuleUsersUI';
        }

        return $res;
    }

    public function onAfterAssetsPrepared(\Phalcon\Assets\Manager $assetsManager):void
    {
 //       $assetsManager->collection('footerJS')->addJs("js/cache/{$this->moduleUniqueId}/module-usersui-index.js", true);
        $assetsManager->collection('headerCSS')->addCss("css/cache/{$this->moduleUniqueId}/module-usersui.css", true);
    }

    /**
     * Prepares include block within volt template
     *
     * @param string $controller
     * @param string $blockName
     * @param View $view
     * @return string
     */
    public function onVoltBlockCompile(string $controller, string $blockName, View $view):string
    {
        $result = '';
        if ($controller==='Extensions'){
            switch ($blockName){
                case "GeneralMainFields":
                    $result = "{$this->moduleDir}/App/Views/NewMenuItem/index";
                    break;
                case "GeneralAdvancedFields":
                    $result = "{$this->moduleDir}/App/Views/NewMenuItem2/index";
                    break;
                case "AdditionalTab":
                    $result = "{$this->moduleDir}/App/Views/Extensions/additionaltab";
                    break;
                case "TabularMenu":
                    $result = "{$this->moduleDir}/App/Views/Extensions/tabularmenu";
                    break;
                default:
            }
        }

        return $result;
    }

    /**
     * Calls from BaseForm before form initialized
     *
     * @param $form
     * @param $entity
     * @param $options
     * @return void
     */
    public function onBeforeFormInitialize(Form $form, $entity, $options):void
    {
        if (is_a($form, ExtensionEditForm::class)) {
            $arrDTMFType = [
                'auto' => $this->translation->_('auto'),
                'inband' => $this->translation->_('inband'),
                'info' => $this->translation->_('info'),
                'rfc4733' => $this->translation->_('rfc4733'),
                'auto_info' => $this->translation->_('auto_info'),
            ];

            $dtmfmode = new Select(
                'module_dtmfmode', $arrDTMFType, [
                    'using' => [
                        'id',
                        'name',
                    ],
                    'useEmpty' => false,
                    'value' => 'auto',
                    'class' => 'ui selection dropdown',
                ]
            );
            $form->add($dtmfmode);
        }
    }


    /**
     * Calls from BaseController on afterExecuteRoute function
     *
     * @param Controller $controller
     * @return void
     */
    public function onAfterExecuteRoute(Controller $controller):void
    {
    }
}