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

namespace Modules\ModuleUsersUI\Models;

use MikoPBX\Modules\Models\ModulesModelsBase;
use Modules\ModuleUsersUI\Lib\Constants;
use Phalcon\Mvc\Model\Relation;

class AccessGroups extends ModulesModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * Group name
     *
     * @Column(type="string", nullable=true)
     */
    public $name;

    /**
     * Group description
     *
     * @Column(type="string", nullable=true)
     */
    public $description;

    /**
     * Home page after user logs in
     *
     * @Column(type="string", nullable=true, default='/admin-cabinet/session/end')
     */
    public $homePage;

    /**
     * CDR filter mode
     *
     * If is set to 'all' the group can see and listen all users, the CDR filter is disabled
     * If is set to 'selected' the group can see and listen only users from the AccessGroupCDRFilter list
     * If is set to 'not-selected' the group can see and listen all users except users from the AccessGroupCDRFilter list
     *
     * @Column(type="string", default='all')
     */
    public  $cdrFilterMode;

    /**
     * If it is set to '1' the group has full access
     *
     * @Column(type="string", nullable=false, default='0')
     */
    public $fullAccess;


    /**
     * Initialize the AccessGroups model.
     *
     * @return void
     */
    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_AccessGroups');
        parent::initialize();
        $this->hasMany(
            'id',
            AccessGroupsRights::class,
            'group_id',
            [
                'alias'      => 'AccessGroupsRights',
                'foreignKey' => [
                    'allowNulls' => true,
                    'action'     => Relation::ACTION_CASCADE,
                    // When a group is deleted, delete the associated user-group mappings
                ],
            ]
        );

        $this->hasMany(
            'id',
            AccessGroupCDRFilter::class,
            'group_id',
            [
                'alias'      => 'AccessGroupCDRFilter',
                'foreignKey' => [
                    'allowNulls' => true,
                    'action'     => Relation::ACTION_CASCADE,
                    // When a group is deleted, delete the associated user-group mappings
                ],
            ]
        );

        $this->hasMany(
            'id',
            UsersCredentials::class,
            'user_access_group_id',
            [
                'alias'      => 'UsersCredentials',
            ]
        );
    }

    public function beforeDelete(): bool
    {
        $parameters = [
            'conditions' => 'user_access_group_id = :group_id:',
            'bind' => [
                'group_id' => $this->id
            ]
        ];
        foreach (UsersCredentials::find($parameters) as $userCredential){
            $userCredential->user_access_group_id = null;
            $userCredential->save();
        }
        return parent::beforeDelete();
    }

}