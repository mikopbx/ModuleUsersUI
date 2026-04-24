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
namespace Modules\ModuleUsersUI\Setup;

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Modules\Setup\PbxExtensionSetupBase;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Throwable;

/**
 * Class PbxExtensionSetup
 * Module installer and uninstaller
 *
 * @package Modules\ModuleUsersUI\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
    /**
     * Runs schema upgrade via model annotations, then performs data migrations
     * for existing installations upgrading from the legacy useTLS flag.
     *
     * @return bool
     */
    public function installDB(): bool
    {
        $result = parent::installDB();

        if ($result) {
            $this->migrateLegacyTlsFlag();
        }

        return $result;
    }

    /**
     * Maps the legacy `useTLS` flag onto the new `tlsMode` column for rows
     * written by earlier versions. Idempotent — only touches rows that still
     * have the default `tlsMode='none'`.
     *
     * Old: useTLS='1' (StartTLS on port 389) → tlsMode='starttls'
     * Old: useTLS='0' (no encryption)        → tlsMode='none' (already default)
     */
    private function migrateLegacyTlsFlag(): void
    {
        try {
            $legacyRows = LdapConfig::find([
                'conditions' => 'useTLS = :useTLS: AND tlsMode = :defaultMode:',
                'bind'       => [
                    'useTLS'      => '1',
                    'defaultMode' => 'none',
                ],
            ]);

            foreach ($legacyRows as $row) {
                $row->tlsMode = 'starttls';
                $row->save();
            }
        } catch (Throwable $e) {
            // Do not block install on migration failure — schema is already in place.
            $this->messages[] = 'ModuleUsersUI TLS migration skipped: ' . $e->getMessage();
        }
    }

    /**
     * Adds the module to the sidebar menu.
     *
     * @return bool The result of the addition process.
     */
    public function addToSidebar(): bool
    {
        $menuSettingsKey           = "AdditionalMenuItem{$this->moduleUniqueID}";
        $menuSettings              = PbxSettings::findFirstByKey($menuSettingsKey);
        if ($menuSettings === null) {
            $menuSettings      = new PbxSettings();
            $menuSettings->key = $menuSettingsKey;
        }
        $value               = [
            'uniqid'        => $this->moduleUniqueID,
            'group'         => 'server',
            'iconClass'     => 'users cog',
            'caption'       => "Breadcrumb{$this->moduleUniqueID}",
            'showAtSidebar' => true,
        ];
        $menuSettings->value = json_encode($value);

        return $menuSettings->save();
    }

}