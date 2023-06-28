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
use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Sip;
use MikoPBX\Common\Models\Users;
use Modules\ModuleUsersUI\App\Forms\AccessGroupForm;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\UsersCredentials;

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
        } else {
            $this->view->members = $this->getTheListOfUsersForDisplayInTheFilter();
            $cdrFilterController = new AccessGroupCDRFilterController();
            $this->view->cdrFilterMembers = $cdrFilterController->getTheListOfUsersForCDRFilter($record->id);
        }
        $groupRightsController = new AccessGroupsRightsController();
        $groupRights = $groupRightsController->getGroupRights($record->id);
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
        $accessGroupEntity->name = $data['name'];
        $accessGroupEntity->description = $data['description'];

        // Save the access group object
        if ($accessGroupEntity->save()===false){
            // If there are validation errors, display them and return false
            $errors = $accessGroupEntity->getMessages();
            $this->flash->error(implode('<br>', $errors));
            $this->db->rollback();
            return;
        }

        // Save access group rights
        $accessGroupController = new AccessGroupsRightsController();
        if ($accessGroupController->saveAccessGroupRights($accessGroupEntity, $data['access_group_rights'])===false){
            $this->db->rollback();
            return;
        }

        // Save users credentials
        if ($this->saveUsersCredentials($data)===false){
            $this->db->rollback();
            return;
        }

        // Save CDR filter
        $cdrFilterController = new AccessGroupCDRFilterController();
        if ($cdrFilterController->saveCdrFilter($accessGroupEntity->id, $data['cdrFilter'])===false){
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
     * Save the users associated with the group.
     *
     * @param array $data The data containing the form inputs.
     *
     * @return bool True if the saving process is successful, false otherwise.
     */
    private function saveUsersCredentials(array $data): bool
    {
        // 1. Collect new users
        $savedExtensions = [];
        $arrMembers      = json_decode($data['members'], true);
        foreach ($arrMembers as $key => $value) {
            if (substr_count($value, 'ext-') > 0) {
                $savedExtensions[] = explode('ext-', $value)[1];
            }
        }

        $parameters = [
            'conditions' => 'user_access_group_id=:groupId:',
            'bind'       => [
                'groupId' => $data['id'],
            ],
        ];

        // 2. Disable all current users before update
        $membersForDisable = UsersCredentials::find($parameters);
        foreach ($membersForDisable as $oldMember){
            $oldMember->enabled = '0';
            if ($oldMember->save() === false) {
                $errors = $membersForDisable->getMessages();
                $this->flash->error(implode('<br>', $errors));
                return false;
            }
        }

        // 3. If there are no users in the group, disable all and return
        if (count($savedExtensions) === 0) {
            return true;
        }

        // 4. Move selected users from other groups and create new links for current group members
        $parameters = [
            'models'     => [
                'Users' => Users::class,
            ],
            'columns'    => [
                'id' => 'Users.id',
                'extension' => 'Sip.extension',
                'password'=> 'Sip.secret'
            ],
            'conditions' => 'Extensions.number IN ({ext:array})',
            'bind'       => [
                'ext' => $savedExtensions,
            ],
            'joins'      => [
                'Extensions' => [
                    0 => Extensions::class,
                    1 => 'Extensions.userid = Users.id',
                    2 => 'Extensions',
                    3 => 'INNER',
                ],
                'Sip' => [
                    0 => Sip::class,
                    1 => 'Sip.extension = Extensions.number',
                    2 => 'Sip',
                    3 => 'INNER',
                ],
            ],
        ];
        $query      = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
        $newMembers = $query->execute();

        foreach ($newMembers as $member) {
            $parameters  = [
                'conditions' => 'user_id=:userID:',
                'bind'       => [
                    'userID' => $member->id,
                ],
            ];
            $groupMember = UsersCredentials::findFirst($parameters);
            if ($groupMember === null) {
                $groupMember          = new UsersCredentials();
                $groupMember->user_id = $member->id;
                $groupMember->user_login = $member->extension;
                $groupMember->user_password = $member->password;
            }
            $groupMember->user_access_group_id = $data['id'];
            $groupMember->enabled = '1';
            if ($groupMember->save() === false) {
                $errors = $groupMember->getMessages();
                $this->flash->error(implode('<br>', $errors));

                return false;
            }
        }

        return true;
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