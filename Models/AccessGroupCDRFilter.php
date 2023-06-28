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

use MikoPBX\Common\Models\Users;
use MikoPBX\Modules\Models\ModulesModelsBase;
use Phalcon\Mvc\Model\Relation;

/*
 * If AccessGroups->useCDRFilter is set to '1' the group can see and listen only users from the list
 * If AccessGroups->useCDRFilter is set to '0' the group can see and listen all users
 */
class AccessGroupCDRFilter extends ModulesModelsBase
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
     * Additional condition for the CDR request filter
     *
     * @Column(type="integer", nullable=false)
     */
    public ?string $user_id;


    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_AccessGroupCDRFilter');
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

        $this->belongsTo(
            'user_id',
            Users::class,
            'id',
            [
                'alias' => 'Users',
                'foreignKey' => [
                    'allowNulls' => false,
                    'action' => Relation::NO_ACTION,
                ],
            ]
        );

    }

    /**
     * Returns dynamic relations between module models and common models
     * MikoPBX check it in ModelsBase after every call to keep data consistent
     *
     * There is example to describe the relation between Providers and ModuleTemplate models
     *
     * It is important to duplicate the relation alias on message field after Models\ word
     *
     * @param $calledModelObject
     *
     * @return void
     */
    public static function getDynamicRelations(&$calledModelObject): void
    {
        if (is_a($calledModelObject, Users::class)) {
            $calledModelObject->belongsTo(
                'id',
                AccessGroupCDRFilter::class,
                'user_id',
                [
                    'alias'      => 'ModuleUsersUIAccessGroupCDRFilter',
                    'foreignKey' => [
                        'allowNulls' => 0,
                        'message'    => 'Models\ModuleUsersUIAccessGroupCDRFilter',
                        'action'     => Relation::ACTION_CASCADE
                    ],
                ]
            );
        }
    }
}