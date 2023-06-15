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
namespace Modules\ModuleUsersUI\App\Forms;

use MikoPBX\AdminCabinet\Forms\BaseForm;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Select;


class AccessGroupForm extends BaseForm
{

    public function initialize($entity = null, $options = null) :void
    {

        // id
        $this->add(new Hidden('id'));

        // Name
        $this->add(new Text('name'));

        // Description
        $this->addTextArea('description',$entity->description, 80);

        // HomePage
        $parameters = [
            'columns'=>[
                'homepage'=>'CONCAT(AccessGroupsRights.controller,"/",AccessGroupsRights.action)',
            ],
            'models'=>[
                'AccessGroupsRights'=>AccessGroupsRights::class,
            ],
           'conditions'=>'AccessGroupsRights.group_id = :group_id:',
            'binds'=>[
                'group_id'=>$entity->id,
            ],
            'group'     => 'AccessGroups.id',
            'order'     => 'homepage'
        ];
        $homepages = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery()->execute();
        $homepagesForSelect = [];
        foreach ($homepages as $homepage) {
            $homepagesForSelect[$homepage]=$homepage;
        }
        if (empty($homepagesForSelect)) {
            $homepagesForSelect['session/end']='session/end';
        }
        $providers = new Select('home_page', $homepagesForSelect, [
            'using'    => [
                'id',
                'name',
            ],
            'useEmpty' => false,
            'class'    => 'ui selection dropdown',
        ]);
        $this->add($providers);
    }
}