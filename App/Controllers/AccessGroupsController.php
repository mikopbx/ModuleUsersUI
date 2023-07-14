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
use MikoPBX\AdminCabinet\Providers\AssetProvider;
use Modules\ModuleUsersUI\App\Forms\AccessGroupForm;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Models\AccessGroups;

class AccessGroupsController extends ModuleUsersUIBaseController
{

    /**
     * The modify action for creating or editing access group.
     *
     * @param string|null $id The ID of the user group (optional)
     *
     * @return void
     */
    public function modifyAction(string $id = null): void
    {
        $headerCssCollection = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCssCollection->addCss('css/vendor/semantic/list.min.css', true);

        $footerCollection = $this->assets->collection('footerJS');
        $footerCollection->addJs('js/pbx/main/form.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/module-users-ui-modify-ag.js", true);
        $record = AccessGroups::findFirstById($id);
        if ($record === null) {
            $record = new AccessGroups();
            $record->cdrFilterMode = Constants::CDR_FILTER_DISABLED;
            $record->name = '';
            $record->description = '';
        } else {
            $this->view->members = $this->getTheListOfUsersForDisplayInTheFilter($record->id??'');
            $cdrFilterController = new AccessGroupCDRFilterController();
            $this->view->cdrFilterMembers = $cdrFilterController->getTheListOfUsersForCDRFilter($record->id);
        }
        $groupRightsController = new AccessGroupsRightsController();
        $groupRights = $groupRightsController->getGroupRights($record->id??'');
        $this->view->form = new AccessGroupForm($record,['groupRights'=>$groupRights]);
        $this->view->represent = $record->getRepresent();
        $this->view->id = $id;
        $this->view->groupRights = $groupRights;
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
            $accessGroupEntity = AccessGroups::findFirstById($data['id']);
        }
        if ($accessGroupEntity===null) {
            $accessGroupEntity=new AccessGroups();
            $accessGroupEntity->id = $data['id'];
        }
        if (empty($data['cdrFilterMode'])){
            $accessGroupEntity->cdrFilterMode = Constants::CDR_FILTER_DISABLED;
        } else {
            $accessGroupEntity->cdrFilterMode = $data['cdrFilterMode'];
        }

        if (empty($data['homePage'])){
            $accessGroupEntity->homePage = $this->url->get('session/end');
        } else {
            $accessGroupEntity->homePage = $data['homePage'];
        }

        $accessGroupEntity->name = $data['name'];
        $accessGroupEntity->description = $data['description'];
        $accessGroupEntity->fullAccess = $data['fullAccess'];

        // Save the access group object
        if ($this->saveEntity($accessGroupEntity)===false){
            // If there are validation errors, display them and return false
            $this->db->rollback();
            return;
        }

        // Save access group rights
        $accessGroupController = new AccessGroupsRightsController();
        // Parse access group rights from the posted JSON string
        $accessGroupRightsFromPost = json_decode($data['access_group_rights'], true);
        if ($accessGroupController->saveAccessGroupRights($accessGroupEntity->id, $accessGroupRightsFromPost)===false){
            $this->db->rollback();
            return;
        }

        // Save users credentials
        $usersCredentialsController = new UsersCredentialsController();
        // Parse group members from the posted JSON string
        $membersOfTheGroup = json_decode($data['members'], true);
        if ($usersCredentialsController->saveUsersCredentials($accessGroupEntity->id, $membersOfTheGroup)===false){
            $this->db->rollback();
            return;
        }

        // Save CDR filter
        $cdrFilterController = new AccessGroupCDRFilterController();
        // Parse cdr filter from the posted JSON string
        $cdrFilterUsers = json_decode($data['cdrFilter'], true);
        if ($cdrFilterController->saveCdrFilter($accessGroupEntity->id, $cdrFilterUsers)===false){
            $this->db->rollback();
            return;
        }

        $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
        $this->view->success = true;
        $this->db->commit();

        // If it was creating a new card, reload the page with the specified ID
        if (empty($data['id'])) {
            $this->view->reload = "module-users-u-i/access-groups/modify/{$accessGroupEntity->id}";
        }

    }

    /**
     * Delete a group.
     *
     * @param string $groupId The ID of the group to be deleted.
     */
    public function deleteAction(string $groupId): void
    {
        $group = AccessGroups::findFirstById($groupId);
        if ($group !== null && ! $group->delete()) {
            $errors = $group->getMessages();
            $this->flash->error(implode('<br>', $errors));
            $this->view->success = false;
        } else {
            $this->view->success = true;
        }

        $this->forward('module-users-u-i/index');
    }

}