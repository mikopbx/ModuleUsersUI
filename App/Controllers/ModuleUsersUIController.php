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
use Modules\ModuleUsersUI\App\Forms\LdapConfigForm;
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
        $footerCollection = $this->assets->collection('footerJS');
        $footerCollection->addJs('js/vendor/datatable/dataTables.semanticui.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/module-users-ui-index.js", true);
        $footerCollection->addJs('js/pbx/main/form.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/module-users-ui-ldap.js", true);

        $headerCollectionCSS = $this->assets->collection('headerCSS');
        $headerCollectionCSS
            ->addCss('css/vendor/datatable/dataTables.semanticui.min.css', true)
            ->addCss("css/cache/{$this->moduleUniqueID}/module-users-ui.css", true);

        $parameters = [
            'models'     => [
                'AccessGroups' => AccessGroups::class,
            ],
            'columns'    => [
                'id' => 'AccessGroups.id',
                'name' => 'AccessGroups.name',
                'description' => 'AccessGroups.description',
                'countUsers'=> 'COUNT(UsersCredentials.id)',
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

        $this->view->pick("{$this->moduleDir}/App/Views/index");

        $this->view->members = $this->getTheListOfUsersForDisplayInTheFilter();

        $ldapConfig = LdapConfig::findFirst();
        $this->view->ldapForm = new LdapConfigForm($ldapConfig);
        $this->view->submitMode    = null;
    }

}