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

namespace Modules\ModuleUsersUI\App\Controllers;

use MikoPBX\AdminCabinet\Providers\AssetProvider;
use Modules\ModuleUsersUI\App\Forms\ModuleBaseForm;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Modules\ModuleUsersUI\Models\UsersCredentials;

class ModuleUsersUIController extends ModuleUsersUIBaseController
{
    /**
     * The index action for displaying the users groups page.
     *
     * @return void
     */
    public function indexAction(): void
    {
        $this->showModuleStatusToggle = true;

        $semanticCollection = $this->assets->collection(AssetProvider::SEMANTIC_UI_JS);
        $semanticCollection->addJs('js/vendor/semantic/search.min.js', true);

        $semanticCSSCollection = $this->assets->collection(AssetProvider::SEMANTIC_UI_CSS);
        $semanticCSSCollection->addCss('css/vendor/semantic/search.min.css', true);

        $footerCollection = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerCollection
            ->addJs('js/vendor/datatable/dataTables.semanticui.js', true)
            ->addJs('js/cache/' . $this->moduleUniqueID . '/module-users-ui-index.js', true)
            ->addJs('js/cache/' . $this->moduleUniqueID . '/module-users-ui-index-users.js', true)
            ->addJs('js/pbx/main/form.js', true)
            ->addJs('js/cache/' . $this->moduleUniqueID . '/module-users-ui-index-ldap.js', true);

        $headerCollectionCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCollectionCSS
            ->addCss('css/vendor/datatable/dataTables.semanticui.min.css', true)
            ->addCss('css/cache/' . $this->moduleUniqueID . '/module-users-ui.css', true);

        $parameters = [
            'models'     => [
                'AccessGroups' => AccessGroups::class,
            ],
            'columns'    => [
                'id' => 'AccessGroups.id',
                'name' => 'AccessGroups.name',
                'fullAccess' => 'AccessGroups.fullAccess=1',
                'description' => 'AccessGroups.description',
                'countUsers' => 'COUNT(UsersCredentials.id)',
            ],
            'joins'      => [
                'UsersCredentials' => [
                    0 => UsersCredentials::class,
                    1 => 'UsersCredentials.user_access_group_id = AccessGroups.id and UsersCredentials.enabled = 1',
                    2 => 'UsersCredentials',
                    3 => 'LEFT',
                ],
            ],
            'group'      => 'AccessGroups.id',
        ];
        $groups      = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery()->execute()->toArray();
        $this->view->groups = $groups;
        $this->view->members = $this->getTheListOfUsersForDisplayInTheFilter();

        $ldapConfig = LdapConfig::findFirst();
        $this->view->ldapForm = new ModuleBaseForm($ldapConfig);
        $this->view->submitMode    = null;
    }
}
