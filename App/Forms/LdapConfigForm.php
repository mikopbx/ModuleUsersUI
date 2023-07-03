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
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Text;


class LdapConfigForm extends BaseForm
{
    public function initialize($entity = null, $options = null): void
    {
        // ServerHost
        $this->add(new Text('serverName', ['placeholder' =>'dc1.domain.com']));

        // ServerPort
        $this->add(new Text('serverPort',['placeholder' =>'389']));

        // AdministrativeLogin
        $this->add(new Text('administrativeLogin'));

        // AdministrativePassword
        $this->add(new Password('administrativePassword', ['autocomplete'=>'off']));

        // BaseDN
        $this->add(new Text('baseDN', ['placeholder' =>'dc=domain,dc=com']));

        // UserFilter
        $this->addTextArea('userFilter', $entity->userFilter??'');

        // UserIdAttribute
        $this->add(new Text('userIdAttribute', ['placeholder' =>'samaccountname']));

        // OrganizationUnit
        $this->add(new Text('organizationalUnit', ['placeholder' =>'ou=users']));

    }
}