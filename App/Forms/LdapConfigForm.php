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

use Modules\ModuleUsersUI\Lib\Constants;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Select;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Element\TextArea;

class LdapConfigForm extends ModuleBaseForm
{
    public function initialize($entity = null, $options = null): void
    {

        // UseLdapAuthMethod
        $this->addCheckBox('useLdapAuthMethod', intval($entity->useLdapAuthMethod) === 1);

        // ServerHost
        $this->add(new Text('serverName', ['placeholder' => 'dc1.domain.com']));

        // ServerPort
        $this->add(new Text('serverPort', [
            'placeholder' => '389',
            'value' => $entity->serverPort ?? '389'
        ]));

        // TLS transport mode: 'none' | 'starttls' | 'ldaps'.
        // Rendered as a Fomantic dropdown label attached to the server name field.
        $tlsModeValue = $entity->tlsMode ?? null;
        if ($tlsModeValue === null || $tlsModeValue === '') {
            $tlsModeValue = (($entity->useTLS ?? '0') === '1') ? 'starttls' : 'none';
        }
        $this->add(new Hidden('tlsMode', ['value' => $tlsModeValue]));

        // Certificate validation toggle.
        $this->addCheckBox('verifyCert', ($entity->verifyCert ?? '0') === '1');

        // Custom CA bundle (PEM) — optional; only used when verifyCert is enabled.
        $caCertificate = new TextArea('caCertificate', [
            'placeholder'  => "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
            'value'        => $entity->caCertificate ?? '',
            'rows'         => 18,
            'spellcheck'   => 'false',
            'autocomplete' => 'off',
        ]);
        $this->add($caCertificate);

        // AdministrativeLogin
        $this->add(new Text('administrativeLogin', ['placeholder' => 'Domain admin login']));

        // AdministrativePassword
        $this->add(new Password(
            'administrativePasswordHidden',
            [
                'autocomplete' => 'off',
                'placeholder' => 'Domain admin password',
                'value' => Constants::HIDDEN_PASSWORD
            ]
        ));

        // BaseDN
        $this->add(new Text('baseDN', [
            'placeholder' => 'dc=domain, dc=com',
            'value' => $entity->baseDN ?? 'dc=domain, dc=com'
        ]));

        // UserFilter
        // skipEscaping is required because LDAP filter contains & which should not be HTML-escaped
        $this->addTextArea('userFilter', $entity->userFilter ?? '(&(objectClass=user)(objectCategory=PERSON))', 90, [
            'placeholder' => '(&(objectClass=user)(objectCategory=PERSON))',
            'skipEscaping' => true
        ]);

        // UserIdAttribute
        $this->add(new Text('userIdAttribute', [
            'placeholder' => 'samaccountname',
            'value' => $entity->userIdAttribute ?? 'samaccountname'
        ]));

        // OrganizationUnit
        $this->add(new Text('organizationalUnit', [
            'placeholder' => 'ou=users, dc=domain, dc=com',
            'value' => $entity->organizationalUnit ?? 'ou=users, dc=domain, dc=com'
        ]));

        // Select server type
        $types = [
            'ActiveDirectory' => 'ActiveDirectory',
            'OpenLDAP' => 'OpenLDAP',
//            'DirectoryServer' => 'DirectoryServer',
//            'FreeIPA' => 'FreeIPA',
        ];
        $ldapType = new Select(
            'ldapType',
            $types,
            [
                'using' => [
                    'id',
                    'name',
                ],
                'emptyValue' => 'ActiveDirectory',
                'useEmpty' => false,
                'class' => "ui selection dropdown select-ldap-field",
            ]
        );
        $this->add($ldapType);
    }
}
