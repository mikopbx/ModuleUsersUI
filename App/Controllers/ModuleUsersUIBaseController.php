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

class ModuleUsersUIBaseController extends BaseController
{
    protected string $moduleUniqueID = 'ModuleUsersUI';
    protected string $moduleDir;

    public bool $showModuleStatusToggle = false;

    /**
     * Basic initial class
     */
    public function initialize(): void
    {
        if ($this->request->isAjax() === false) {
            $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
            $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.svg";
            $this->view->submitMode = null;
        }
        parent::initialize();
    }

    /**
     * Retrieves the list of users for display in the filter.
     *
     * @return array The list of users.
     */
    public function getTheListOfUsersForDisplayInTheFilter(string $group_id = ''): array
    {
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
                'userid' => 'Users.id',
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

        // Get the mapping of employees and access groups since join across different databases is not possible
        $parameters = [
            'models' => [
                'UsersCredentials' => UsersCredentials::class,
            ],
            'conditions' => 'enabled = 1',
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
                    $extensionTable[$extension->userid]['group'] = 'No access';
                    $extensionTable[$extension->userid]['email'] = $extension->email;
                    $key = array_search(
                        $extension->userid,
                        $groupMembersIds,
                        true
                    );
                    if ($key !== false) {
                        $extensionTable[$extension->userid]['group'] = $groupMembers[$key]['group']??'No access';
                        if ($group_id == $groupMembers[$key]['group_id']) {
                            $extensionTable[$extension->userid]['hidden'] = false;
                        } else {
                            $extensionTable[$extension->userid]['hidden'] = true;
                        }
                    } else {
                        $extensionTable[$extension->userid]['hidden'] = true;
                    }

                    if (!array_key_exists('mobile', $extensionTable[$extension->userid])) {
                        $extensionTable[$extension->userid]['mobile'] = '';
                    }

                    $extensionTable[$extension->userid]['avatar'] = "{$this->url->get()}assets/img/unknownPerson.jpg";
                    if ($extension->avatar) {
                        $filename = md5($extension->avatar);
                        $imgCacheDir = appPath('sites/admin-cabinet/assets/img/cache');
                        $imgFile = "{$imgCacheDir}/{$filename}.jpg";
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
        return $extensionTable;
    }

}