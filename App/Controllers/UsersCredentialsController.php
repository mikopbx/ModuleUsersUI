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
use MikoPBX\Common\Models\Sip;
use MikoPBX\Common\Models\Users;
use Modules\ModuleUsersUI\Models\UsersCredentials;

class UsersCredentialsController extends ModuleUsersUIBaseController
{
    /**
     * Save the users associated with the group.
     *
     * @param string $accessGroupId The access group ID.
     * @param array $members The set of members of the group.
     * @return bool True if the saving process is successful, false otherwise.
     */
    public function saveUsersCredentials(string $accessGroupId, array $members): bool
    {
        $parameters = [
            'conditions' => 'user_access_group_id=:groupId:',
            'bind'       => [
                'groupId' => $accessGroupId,
            ],
        ];

        // 1. Disable all current users before update
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
        if (count($members) === 0) {
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
            'conditions' => 'Users.id IN ({usersIDS:array})',
            'bind'       => [
                'usersIDS' => $members,
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
            $groupMember->user_access_group_id = $accessGroupId;
            $groupMember->enabled = '1';
            if ($groupMember->save() === false) {
                $errors = $groupMember->getMessages();
                $this->flash->error(implode('<br>', $errors));

                return false;
            }
        }

        return true;
    }
}
