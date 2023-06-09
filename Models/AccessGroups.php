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
     * @Column(type="string", nullable=true, default='session/end')
     */
    public $home_page;


    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_UsersGroups');
        parent::initialize();
        $this->hasMany(
            'id',
            AccessGroupsRights::class,
            'group_id',
            [
                'alias'      => 'UsersGroupsRights',
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
                'foreignKey' => [
                    'allowNulls' => true,
                    'action'     => Relation::ACTION_RESTRICT,
                    // When a group is deleted, prevent to delete the associated users
                ],
            ]
        );
    }

}