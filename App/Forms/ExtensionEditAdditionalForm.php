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
use MikoPBX\AdminCabinet\Forms\ExtensionEditForm;
use Modules\ModuleUsersUI\Lib\Constants;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\LdapConfig;
use Modules\ModuleUsersUI\Models\UsersCredentials;
use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Select;
use Phalcon\Forms\Element\Text;


class ExtensionEditAdditionalForm extends BaseForm
{
  public static function prepareAdditionalFields(ExtensionEditForm $form, \stdClass $entity, /** @scrutinizer ignore-unused */ array $options = []){
      // Set parameters for the database query
      $parameters = [
          'conditions' => 'user_id = :user_id:',
          'bind' => [
              'user_id' => $entity->user_id,
          ]
      ];

      // Find the user credentials based on the parameters
      $credentials = UsersCredentials::findFirst($parameters);

      // Get the access group ID from the credentials, or set it to null if not found
      $accessGroupId = $credentials->enabled==='1'?$credentials->user_access_group_id ?? null:Constants::NO_ACCESS_GROUP_ID;

      // Get the user login from the credentials, or set it to an empty string if not found
      $userLogin = $credentials->user_login ?? '';

      // Get the user password from the credentials, or set it to an empty string if not found or XXX if its hash was saved
      $userPassword = empty($credentials->user_password)?'':Constants::HIDDEN_PASSWORD;

      // Get the ldap auth value from the credentials, or set it to false if not found
      $useLdapAuth = $credentials->use_ldap_auth ?? false;

      // Create a new Text form element for user login and set its value
      $login = new Text('module_users_ui_login', [
          'value' => $userLogin,
          'placeholder' => $form->translation->_('module_usersui_UserLoginPlaceholder'),
          'class'=>'prompt'
      ]);
      $form->add($login);

      // Create a new Password form element for user password and set its value
      $password = new Password('module_users_ui_password', [
          'value' => $userPassword,
          'placeholder' => $form->translation->_('module_usersui_UserPasswordPlaceholder'),
      ]);
      $form->add($password);

      // Crete a new Checkbox element on the user form
      $cheskArr = [];
      if ($useLdapAuth === '1') {
          $cheskArr['checked'] = 'checked';
      }
      $form->add(new Check('module_users_ui_use_ldap_auth', $cheskArr));

      // Retrieve all access groups from the database
      $accessGroups = AccessGroups::find();
      $accessGroupsForSelect = [];
      $accessGroupsForSelect[Constants::NO_ACCESS_GROUP_ID] = $form->translation->_('module_usersui_NoAccessGroupName');

      // Prepare the access groups data for a Select form element
      foreach ($accessGroups as $accessGroup) {
          $accessGroupsForSelect[$accessGroup->id] = $accessGroup->name;
      }

      // Create a new Select form element for user access group and set its properties
      $accessGroup = new Select(
          'module_users_ui_access_group', $accessGroupsForSelect, [
              'using' => [
                  'id',
                  'name',
              ],
              'useEmpty' => false,
              'value' => $accessGroupId,
              'emptyValue' => Constants::NO_ACCESS_GROUP_ID,
              'class' => 'ui selection dropdown',
          ]
      );
      $form->add($accessGroup);

      // Save if LDAP is enabled info to show or hide the LDAP checkbox
      $ldapEnabled = LdapConfig::findFirst()->useLdapAuthMethod??'0'==='1';
      $form->add(new Hidden('module_users_ui_ldap_enabled', ['value' => $ldapEnabled]));
  }

}