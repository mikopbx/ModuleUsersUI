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
use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Users;
use MikoPBX\Modules\PbxExtensionUtils;
use Modules\ModuleUsersUI\App\Forms\AccessGroupForm;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use function MikoPBX\Common\Config\appPath;

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
     * The modify action for creating or editing access group.
     *
     * @param string|null $id The ID of the user group (optional)
     *
     * @return void
     */
    public function modifyAction(string $id = null): void
    {
        $footerCollection = $this->assets->collection('footerJS');
        $footerCollection->addJs('js/pbx/main/form.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/module-users-ui-modify-ag.js", true);
        $record = AccessGroups::findFirstById($id);
        if ($record === null) {
            $record = new AccessGroups();
        } else {
            // Get the list of users for display in the filter
            $parameters = [
                'models' => [
                    'Extensions' => Extensions::class,
                ],
                'conditions' => 'Extensions.is_general_user_number = 1',
                'columns' => [
                    'id' => 'Extensions.id',
                    'username' => 'Users.username',
                    'number' => 'Extensions.number',
                    'email' => 'Users.email',
                    'userid' => 'Extensions.userid',
                    'type' => 'Extensions.type',
                    'avatar' => 'Users.avatar',

                ],
                'order' => 'number',
                'joins' => [
                    'Users' => [
                        0 => Users::class,
                        1 => 'Users.id = Extensions.userid',
                        2 => 'Users',
                        3 => 'INNER',
                    ],
                ],
            ];

            $query = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
            $extensions = $query->execute();


            // Get the mapping of employees and groups since join across different databases is not possible
            $parameters = [
                'models' => [
                    'UsersCredentials' => UsersCredentials::class,
                ],
                'columns' => [
                    'user_id' => 'UsersCredentials.user_id',
                    'group' => 'AccessGroups.name',
                    'group_id' => 'AccessGroups.id',

                ],
                'joins' => [
                    'AccessGroups' => [
                        0 => AccessGroups::class,
                        1 => 'AccessGroups.id = UsersCredentials.user_access_group_id',
                        2 => 'AccessGroups',
                        3 => 'INNER',
                    ],
                ],
            ];
            $query = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
            $groupMembers = $query->execute()->toArray();
            $groupMembersIds = array_column($groupMembers, 'user_id');
            $extensionTable = [];
            foreach ($extensions as $extension) {
                switch ($extension->type) {
                    case 'SIP':
                        $extensionTable[$extension->userid]['userid'] = $extension->userid;
                        $extensionTable[$extension->userid]['number'] = $extension->number;
                        $extensionTable[$extension->userid]['id'] = $extension->id;
                        $extensionTable[$extension->userid]['username'] = $extension->username;
                        $extensionTable[$extension->userid]['hidden'] = true;
                        $extensionTable[$extension->userid]['email'] = $extension->email;
                        if (!array_key_exists('mobile', $extensionTable[$extension->userid])) {
                            $extensionTable[$extension->userid]['mobile'] = '';
                        }
                        $extensionTable[$extension->userid]['avatar'] = "{$this->url->get()}assets/img/unknownPerson.jpg";
                        if ($extension->avatar) {
                            $filename = md5($extension->avatar);
                            $imgCacheDir = appPath('sites/admin-cabinet/assets/img/cache');
                            $imgFile = "{$imgCacheDir}/$filename.jpg";
                            if (file_exists($imgFile)) {
                                $extensionTable[$extension->userid]['avatar'] = "{$this->url->get()}assets/img/cache/{$filename}.jpg";
                            }
                        }
                        $key = array_search($extension->userid, $groupMembersIds, true);
                        if ($key !== false) {
                            $extensionTable[$extension->userid]['hidden'] = $id !== $groupMembers[$key]['group_id'];
                        }

                        break;
                    case 'EXTERNAL':
                        $extensionTable[$extension->userid]['mobile'] = $extension->number;
                        break;
                    default:
                }
            }
            $this->view->members = $extensionTable;


            $this->view->form = new AccessGroupForm($record);
            $this->view->represent = $record->getRepresent();
            $this->view->id = $id;
            $this->view->pick("{$this->moduleDir}/App/Views/AccessGroups/modify");
        }

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

        // Save the access group object
        if ($accessGroupEntity->save()===false){
            // If there are validation errors, display them and return false
            $errors = $accessGroupEntity->getMessages();
            $this->flash->error(implode('<br>', $errors));
            $this->db->rollback();
            return;
        }

        // Save access group rights
        if ($this->saveAccessGroupRights($accessGroupEntity, $data['access_group_rights'])===false){
            $this->db->rollback();
            return;
        }

        // Save users credentials
        if ($this->saveUsersCredentials($data)===false){
            $this->db->rollback();
            return;
        }

        $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
        $this->view->success = true;
        $this->db->commit();

        // If it was creating a new card, reload the page with the specified ID
        if (empty($data['id'])) {
            $this->view->reload = "module-users-u-i/module-users-u-i/access-groups/modify/{$data['id']}";
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
            'conditions' => 'group_id=:groupId:',
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

    /**
     * Saves access group rights for a given access group entity.
     *
     * @param AccessGroups $accessGroupEntity The access group entity.
     * @param string $access_group_rights The JSON string containing access group rights.
     * @return bool Returns true on success, false on failure.
     */
    private function saveAccessGroupRights(AccessGroups $accessGroupEntity, string $access_group_rights): bool
    {
        // Delete existing access group rights for the given access group entity
        $accessGroupRights = AccessGroupsRights::find("group_id={$accessGroupEntity->id}");
        foreach ($accessGroupRights as $accessGroupRight) {
            if ($accessGroupRight->delete()===false){
                $errors = $accessGroupRight->getMessages();
                $this->flash->error(implode('<br>', $errors));

                return false;
            }
        }
        // Parse access group rights from the posted JSON string
        $accessGroupRightsFromPost = json_decode($access_group_rights, true);

        foreach ($accessGroupRightsFromPost as $accessGroupRightFromPost) {
            // Create a new access group right object
            $accessGroupRight = new AccessGroupsRights();
            $accessGroupRight->group_id = $accessGroupEntity->id;
            $accessGroupRight->controller = $accessGroupRightFromPost['controller'];
            $accessGroupRight->actions = json_encode($accessGroupRightFromPost['actions']);

            // Save the access group right object
            if ($accessGroupRight->save()===false){
                // If there are validation errors, display them and return false
                $errors = $accessGroupRight->getMessages();
                $this->flash->error(implode('<br>', $errors));
                return false;
            }
        }

        return true;
    }
}