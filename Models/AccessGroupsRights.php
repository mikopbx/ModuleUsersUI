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

class AccessGroupsRights extends ModulesModelsBase
{

    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * Link to the AccessGroups table
     *
     * @Column(type="integer", nullable=false)
     */
    public ?string $group_id;

    /**
     * Module id [AdminCabinet, REST API, ModuleID]
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $module_id;

    /**
     * Controller name
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $controller;

    /**
     * Actions array encoded as a string
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $actions;


    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_AccessGroupsRights');
        parent::initialize();

        $this->belongsTo(
            'group_id',
            AccessGroups::class,
            'id',
            [
                'alias' => 'AccessGroups',
                'foreignKey' => [
                    'allowNulls' => false,
                    'action' => Relation::NO_ACTION,
                ],
            ]
        );
    }
}