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

namespace Modules\ModuleUsersUI\Lib;

use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Users;
use Modules\ModuleUsersUI\Models\AccessGroupCDRFilter;
use Phalcon\Di;

class UsersUICDRFilter extends \Phalcon\Di\Injectable
{

    /**
     * Applies CDR filter rules based on the given access group ID.
     *
     * @param string $accessGroupId           The access group ID.
     * @param array  $cdrRequestParameters    The CDR request parameters (passed by reference).
     *
     * @return void
     */
    public static function applyCDRFilterRules(string $accessGroupId, array &$cdrRequestParameters):void
    {
        $di = Di::getDefault();

        $modelsManager = $di->get('modelsManager');

        // Get filtered users based on the access group ID
        $parameters = [
            'models' => [
                'AccessGroupCDRFilter' => AccessGroupCDRFilter::class,
            ],
            'columns' => [
                'user_id'
            ],
            'conditions' => 'group_id=:group_id:',
            'binds' => [
                'group_id' => $accessGroupId,
            ],
        ];
        $filteredUsers = $modelsManager->createBuilder($parameters)->getQuery()->execute();

        // Get filtered extensions based on the filtered users
        $parameters = [
            'models' => [
                'Extensions' => Extensions::class,
            ],
            'columns' => [
                'number' => 'Extensions.extension',
            ],
            'conditions' => 'Users.id IN ({ids:array})',
            'binds' => [
                'ids' => array_column($filteredUsers, 'user_id'),
            ],
            'joins' => [
                'Users' => [
                    0 => Users::class,
                    1 => 'Users.id = Extensions.userid',
                    2 => 'Users',
                    3 => 'INNER',
                ],
            ],
        ];

        $filteredExtensions = $modelsManager->createBuilder($parameters)->getQuery()->execute()->toArray();
       if (count(array_column($filteredExtensions, 'number') )>0){
           // Update CDR request parameters with filtered extensions
           $cdrRequestParameters['bind']['filteredExtensions'] = array_column($filteredExtensions, 'number');
           $cdrRequestParameters['conditions']='(src_num = IN ({filteredExtensions:array}) OR dst_num = IN ({filteredExtensions:array})) AND (' .$cdrRequestParameters['conditions'].')';
       }
    }
}