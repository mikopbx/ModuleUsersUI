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

use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Users;
use Modules\ModuleUsersUI\Models\AccessGroupCDRFilter;

use function MikoPBX\Common\Config\appPath;

class AccessGroupCDRFilterController extends ModuleUsersUIBaseController
{
    /**
     * Retrieves the list of users for display in the filter.
     *
     * @return array The list of users.
     */
    public function getTheListOfUsersForCDRFilter(string $group_id): array
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

        // Get list of allowed to see and listen cdr users
        $parameters = [
            'models' => [
                'AccessGroupCDRFilter' => AccessGroupCDRFilter::class,
            ],
            'columns' => [
                'user_id',
            ],
            'conditions' => 'group_id = :group_id:',
            'bind' => [
                'group_id' => $group_id,
            ],
        ];
        $query = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery();
        $groupMembers = $query->execute()->toArray();

        $allowedUsers = array_column($groupMembers, 'user_id');
        $extensionTable = [];
        foreach ($extensions as $extension) {
            switch ($extension->type) {
                case 'SIP':
                    $extensionTable[$extension->userid]['userid'] = $extension->userid;
                    $extensionTable[$extension->userid]['number'] = $extension->number;
                    $extensionTable[$extension->userid]['id'] = $extension->id;
                    $extensionTable[$extension->userid]['username'] = $extension->username;
                    $extensionTable[$extension->userid]['email'] = $extension->email;

                    if (in_array($extension->userid, $allowedUsers, true)) {
                        $extensionTable[$extension->userid]['selected'] = true;
                    } else {
                        $extensionTable[$extension->userid]['selected'] = false;
                    }

                    if (!array_key_exists('mobile', $extensionTable[$extension->userid])) {
                        $extensionTable[$extension->userid]['mobile'] = '';
                    }

                    $extensionTable[$extension->userid]['avatar'] = $this->url->get() . 'assets/img/unknownPerson.jpg';
                    if ($extension->avatar) {
                        $filename = md5($extension->avatar);
                        $imgCacheDir = appPath('sites/admin-cabinet/assets/img/cache');
                        $imgFile = "{$imgCacheDir}/{$filename}.jpg";
                        if (file_exists($imgFile)) {
                            $extensionTable[$extension->userid]['avatar'] = $this->url->get() . "assets/img/cache/{$filename}.jpg";
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

    /**
     * Saves the CDR filter for the given access group.
     *
     * @param string $accessGroupId       The access group ID.
     * @param array  $cdrFilterUsers      The array of CDR filter users.
     *
     * @return bool True if the CDR filter is saved successfully, false otherwise.
     */
    public function saveCdrFilter(string $accessGroupId, array $cdrFilterUsers): bool
    {
        // Delete previous group filter
        $parameters = [
            'conditions' => 'group_id = :group_id:',
            'bind' => [
                'group_id' => $accessGroupId,
            ],
        ];
        $records = AccessGroupCDRFilter::find($parameters);
        foreach ($records as $record) {
            if (!$record->delete()) {
                return false;
            }
        }

        // Save new group filter
        foreach ($cdrFilterUsers as $user) {
            $record = new AccessGroupCDRFilter();
            $record->group_id = intval($accessGroupId);
            $record->user_id = $user;
            if (!$this->saveEntity($record)) {
                return false;
            }
        }
        return true;
    }
}
