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

class LdapConfig extends ModulesModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * Ldap server host name or IP
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $serverName;

    /**
     * Ldap server port
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $serverPort;

    /**
     * Login of user with read rights on the domain
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $administrativeLogin;

    /**
     * Password of user with read rights on the domain
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $administrativePassword;

    /**
     * Tree root (base DN)
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $baseDN;

    /**
     * User filter  i.e. s (&(objectClass=user)(objectCategory=PERSON))
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $userFilter;

    /**
     * User id attribute i.e. samaccountname
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $userIdAttribute;

    /**
     * Organizational unit filter  i.e. s OU=Accounting,DC=miko,DC=ru
     *
     * @Column(type="string", nullable=false)
     */
    public ?string $organizationalUnit;


    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_LDAP_Config');
        parent::initialize();
    }

}