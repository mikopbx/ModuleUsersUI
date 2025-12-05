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
 * If AccessGroups->cdrFilterMode is set to 'all' the group can see and listen all users
 * If AccessGroups->cdrFilterMode is set to 'selected' the group can see and listen only users from the list
 * If AccessGroups->cdrFilterMode is set to 'not-selected' the group can see and listen all users except users from the list
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
    public $group_id;

    /**
     * Additional condition for the CDR request filter
     *
     * @Column(type="integer", nullable=false)
     */
    public $user_id;


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
            $calledModelObject->hasMany(
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

    /**
     * Cleans orphan records from AccessGroupCDRFilter table.
     * Removes records where user_id references a non-existent user in the main Users table.
     *
     * @return int Number of deleted orphan records.
     */
    public static function cleanOrphanRecords(): int
    {
        $deletedCount = 0;

        // Get all existing user IDs from the main Users table
        $existingUserIds = Users::find(['columns' => 'id'])->toArray();
        $existingUserIds = array_column($existingUserIds, 'id');

        // Find and delete orphan CDR filter records
        $allFilters = self::find();
        foreach ($allFilters as $filter) {
            if (!in_array($filter->user_id, $existingUserIds, false)) {
                if ($filter->delete()) {
                    $deletedCount++;
                }
            }
        }

        return $deletedCount;
    }
}