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
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use function MikoPBX\Common\Config\appPath;

class ModuleUsersUIController extends BaseController
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
     * The index action for displaying the users groups page.
     *
     * @return void
     */
    public function indexAction(): void
    {
        $footerCollection = $this->assets->collection('footerJS');
        $footerCollection->addJs('js/vendor/datatable/dataTables.semanticui.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/module-users-ui-index.js", true);

        $headerCollectionCSS = $this->assets->collection('headerCSS');
        $headerCollectionCSS
            ->addCss('css/vendor/datatable/dataTables.semanticui.min.css', true)
            ->addCss("css/cache/{$this->moduleUniqueID}/module-users-ui.css", true);

        $this->view->groups = AccessGroups::find();
        $this->view->pick("{$this->moduleDir}/App/Views/index");

        // Get the list of users for display in the filter
        $parameters = [
            'models'     => [
                'Extensions' => Extensions::class,
            ],
            'conditions' => 'Extensions.is_general_user_number = 1',
            'columns'    => [
                'id'       => 'Extensions.id',
                'username' => 'Users.username',
                'number'   => 'Extensions.number',
                'email'    => 'Users.email',
                'userid'   => 'Users.id',
                'type'     => 'Extensions.type',
                'avatar'   => 'Users.avatar',

            ],
            'order'      => 'number',
            'joins'      => [
                'Users' => [
                    0 => Users::class,
                    1 => 'Users.id = Extensions.userid',
                    2 => 'Users',
                    3 => 'INNER',
                ],
            ],
        ];
        $query      = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
        $extensions = $query->execute();

        // Get the mapping of employees and access groups since join across different databases is not possible
        $parameters      = [
            'models'     => [
                'UsersCredentials' => UsersCredentials::class,
            ],
            'columns' => [
                'user_id' => 'UsersCredentials.user_id',
                'group'   => 'AccessGroups.name',
                'group_id'   => 'AccessGroups.id',

            ],
            'joins'   => [
                'AccessGroups' => [
                    0 => AccessGroups::class,
                    1 => 'AccessGroups.id = UsersCredentials.user_access_group_id',
                    2 => 'AccessGroups',
                    3 => 'INNER',
                ],
            ],
        ];
        $query      = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
        $groupMembers = $query->execute()->toArray();

        $groupMembersIds = array_column($groupMembers, 'user_id');
        $extensionTable  = [];
        foreach ($extensions as $extension) {
            switch ($extension->type) {
                case 'SIP':
                    $extensionTable[$extension->userid]['userid']   = $extension->userid;
                    $extensionTable[$extension->userid]['number']   = $extension->number;
                    $extensionTable[$extension->userid]['id']       = $extension->id;
                    $extensionTable[$extension->userid]['username'] = $extension->username;
                    $extensionTable[$extension->userid]['group']    = null;
                    $extensionTable[$extension->userid]['email']    = $extension->email;
                    $key                                            = array_search(
                        $extension->userid,
                        $groupMembersIds,
                        true
                    );
                    if ($key !== false) {
                        $extensionTable[$extension->userid]['group'] = $groupMembers[$key]['group'];
                    }

                    if ( ! array_key_exists('mobile', $extensionTable[$extension->userid])) {
                        $extensionTable[$extension->userid]['mobile'] = '';
                    }

                    $extensionTable[$extension->userid]['avatar'] = "{$this->url->get()}assets/img/unknownPerson.jpg";
                    if ($extension->avatar) {
                        $filename = md5($extension->avatar);
                        $imgCacheDir = appPath('sites/admin-cabinet/assets/img/cache');
                        $imgFile  = "{$imgCacheDir}/{$filename}.jpg";
                        if (file_exists($imgFile)) {
                            $extensionTable[$extension->userid]['avatar'] = "{$this->url->get()}assets/img/cache/{$filename}.jpg";
                        }
                    }
                    break;
                case 'EXTERNAL':
                    $extensionTable[$extension->userid]['mobile'] = $extension->number;
                    break;
                default:
            }
        }
        $this->view->members = $extensionTable;
    }

    /**
     * Change the group of a user.
     */
    public function changeUserGroupAction(): void
    {
        if ( ! $this->request->isPost()) {
            return;
        }
        $data        = $this->request->getPost();
        $parameters  = [
            'conditions' => 'user_id=:userID:',
            'bind'       => [
                'userID' => $data['user_id'],
            ],
        ];
        $groupMember = UsersCredentials::findFirst($parameters);
        if ($groupMember === null) {
            $groupMember          = new UsersCredentials();
            $groupMember->user_id = $data['user_id'];
        }
        $groupMember->user_access_group_id = $data['group_id'];
        if ($groupMember->save() === false) {
            $errors = $groupMember->getMessages();
            $this->flash->error(implode('<br>', $errors));
            $this->view->success = false;
        } else {
            $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
            $this->view->success = true;
        }
    }

}