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
     * Allows to use LDAP authentication method
     *
     * @Column(type="string", nullable=false, default='0')
     */
    public $useLdapAuthMethod;

    /**
     * Ldap server host name or IP
     *
     * @Column(type="string", nullable=false)
     */
    public $serverName;


    /**
     * Ldap server port
     *
     * @Column(type="string", nullable=false)
     */
    public $serverPort;

    /**
     * Deprecated TLS flag. Superseded by $tlsMode; data migrated on upgrade
     * by Setup/PbxExtensionSetup. Column kept for safe upgrade path — runtime
     * code never reads it.
     *
     * @Column(type="string", length=1, nullable=false, default="0")
     * @deprecated use $tlsMode instead.
     */
    public ?string $useTLS = '0';

    /**
     * TLS transport mode: 'none' | 'starttls' | 'ldaps'.
     *  - none:     plain LDAP (port 389)
     *  - starttls: plain LDAP (port 389) upgraded via STARTTLS
     *  - ldaps:    implicit TLS from connect (port 636)
     *
     * @Column(type="string", length=16, nullable=false, default="none")
     */
    public ?string $tlsMode = 'none';

    /**
     * Whether to enforce server certificate validation.
     * '0' = LDAP_OPT_X_TLS_ALLOW (accept any cert, warn-only)
     * '1' = LDAP_OPT_X_TLS_HARD  (reject invalid/self-signed)
     *
     * @Column(type="string", length=1, nullable=false, default="0")
     */
    public ?string $verifyCert = '0';

    /**
     * Custom CA certificate bundle in PEM format. Used when verifyCert='1'.
     * Multiple concatenated PEM blocks are supported (intermediate + root).
     *
     * @Column(type="text", nullable=true)
     */
    public ?string $caCertificate = null;

    /**
     * Login of user with read rights on the domain
     *
     * @Column(type="string", nullable=false)
     */
    public $administrativeLogin;

    /**
     * Password of user with read rights on the domain
     *
     * @Column(type="string", nullable=false)
     */
    public $administrativePassword;

    /**
     * Tree root (base DN)
     *
     * @Column(type="string", nullable=false)
     */
    public $baseDN;

    /**
     * User filter  i.e. s (&(objectClass=user)(objectCategory=PERSON))
     *
     * @Column(type="string", nullable=true)
     */
    public $userFilter;

    /**
     * User id attribute i.e. samaccountname
     *
     * @Column(type="string", nullable=false)
     */
    public $userIdAttribute;

    /**
     * Organizational unit filter  i.e. s OU=Accounting,DC=miko,DC=ru
     *
     * @Column(type="string", nullable=true)
     */
    public $organizationalUnit;

    /**
     * Type of ldap server {ActiveDirectory, OpenLDAP, FreeIPA, DirectoryServer}
     *
     * @Column(type="string", nullable=false, default="ActiveDirectory")
     */
    public ?string $ldapType = 'ActiveDirectory';


    public function initialize(): void
    {
        $this->setSource('m_ModuleUsersUI_LDAP_Config');
        parent::initialize();
    }
}
