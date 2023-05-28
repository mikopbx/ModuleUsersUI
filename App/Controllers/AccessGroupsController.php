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
use Modules\ModuleUsersUI\App\Forms\AccessGroupForm;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;

class AccessGroupsController extends BaseController
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
     * Modify access group page controller
     *
     * @param string|null $id The ID of the access group being modified.
     */
    public function modifyAction(string $id = null): void
    {
        $accessGroupEntity = AccessGroups::findFirst("id={$id}");
        if ($accessGroupEntity===null) {
            $accessGroupEntity=new AccessGroups();
        }

        $this->view->pick("{$this->moduleDir}/App/Views/AccessGroups/modify");
        $this->view->setVar('form', new AccessGroupForm($accessGroupEntity));
    }

    /**
     * Save access group
     *
     * @return void Parameters are placed in the view and processed through ControllerBase::afterExecuteRoute()
     */
    public function saveAction(): void
    {
        if (!$this->request->isPost()) {
           return;
        }
        $data = $this->request->getPost();

        $this->db->begin();

        $accessGroupEntity = null;
        if (array_key_exists('id', $data)) {
            $accessGroupEntity = AccessGroups::findFirstByUniqid($data['id']);
        }
        if ($accessGroupEntity===null) {
            $accessGroupEntity=new AccessGroups();
            $accessGroupEntity->id = $data['id'];
        }
        $accessGroupEntity->name = $data['name'];
        $accessGroupEntity->description = $data['description'];
        $accessGroupEntity->save();

        // Access group rights
        $accessGroupRights = AccessGroupsRights::find("group_id={$accessGroupEntity->id}");
        foreach ($accessGroupRights as $accessGroupRight){
            $accessGroupRight->delete();
        }

        $accessGroupRightsFromPost = json_decode($data['access_group_rights'],true);
        foreach ($accessGroupRightsFromPost as $accessGroupRightFromPost) {
            $accessGroupRight = new AccessGroupsRights();
            $accessGroupRight->group_id = $accessGroupEntity->id;
            $accessGroupRight->controller = $accessGroupRightFromPost['controller'];
            $accessGroupRight->actions = json_encode($accessGroupRightFromPost['actions']);
            $accessGroupRight->save();
        }

        $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
        $this->view->success = true;
        $this->db->commit();

        // If it was creating a new card, reload the page with the specified ID
        if (empty($data['id'])) {
            $this->view->reload = "module-users-u-i/module-users-u-i/access-groups/modify/{$data['id']}";
        }

    }
}