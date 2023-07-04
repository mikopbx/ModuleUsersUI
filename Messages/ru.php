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

/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 6 2018
 *
 */

return [
	'repModuleUsersUI'         => 'Модуль управление доступом в систему - %repesent%',
	'mo_ModuleModuleUsersUI'   => 'Модуль управление доступом в систему ',
    'BreadcrumbModuleUsersUI'  => 'Модуль управление доступом в систему ',
    'SubHeaderModuleUsersUI'   => 'Позволяет создавать группы доступа и присваивать их пользователям',
    'BreadcrumbAccessGroups'   => 'Настройка группы доступа',
    'SubHeaderAccessGroups'    => 'Детальная настройка прав на элементы интерфейса и REST API',

    'module_usersui_GeneralSettings' => 'Основные настройки группы',
    'module_usersui_UsersFilter' => 'Пользователи группы доступа',
    'module_usersui_GroupRights' => 'Настройка прав',
    'module_usersui_GroupCDRFilter'=>'Ограничения для истории разговоров',

    'module_usersui_ValidateNameIsEmpty'  => 'Проверьте название группы, оно не заполнено',
    'module_usersuiConnected'             => 'Модуль подключен',
    'module_usersuiDisconnected'          => 'Модуль отключен',
    'module_usersuiUpdateStatus'          => 'Обновление статуса',

    'module_usersui_ValidateServerNameIsEmpty'=>'Не заполнен адрес контроллера домена',
    'module_usersui_ValidateServerPortIsEmpty'=>'Не заполнен порт контроллера домена',
    'module_usersui_ValidateAdministrativeLoginIsEmpty'=>'Не заполнен логин для пользователя домена',
    'module_usersui_ValidateAdministrativePasswordIsEmpty'=>'Не заполнен пароль для пользователя домена',
    'module_usersui_ValidateBaseDNIsEmpty'=>'Не заполнен корень домена',
    'module_usersui_ValidateUserIdAttributeIsEmpty'=>'Не заполнен атрибут с именем пользователя в домене',

    'module_usersUiMainMenuItem'    => 'Права пользователей',
    'module_usersUiAccessGroups'    => 'Группы доступа',


    'module_usersui_GroupName'=> 'Название группы',
    'module_usersui_ColumnGroupName'=> 'Группа доступа',
    'module_usersui_ColumnGroupMembersCount'=> 'Количество участников',
    'module_usersui_ColumnGroupDescription' => 'Описание',
    'module_usersui_AddNewAccessGroup' =>   'Добавить новую группу доступа',
    'module_usersui_Groups'=>'Группы доступа',
    'module_usersui_NoAccessGroupName'=>'Доступ запрещен',
    'module_usersui_Users'=>'Права на вход у сотрудников',

    'module_usersui_ExtensionTabName'=>'Права для входа в MikoPBX',
    'module_usersui_Login'=>'Логин для авторизации',
    'module_usersui_Password'=> 'Пароль',
    'module_usersui_LdapCheckbox'=>'Использовать доменную авторизацию',
    'module_usersui_AccessGroup'=>'Группа доступа',
    'module_usersui_HomePage' =>'Страница, куда попадет пользователь после входа',

    'module_usersui_CheckBox_AdminCabinet_AsteriskManagers_index' => 'просмотр списка',
    'module_usersui_CheckBox_AdminCabinet_CallDetailRecords_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_CallQueues_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_ConferenceRooms_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_CustomFiles_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_DialplanApplications_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Fail2Ban_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Firewall_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_IvrMenu_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Extensions_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_OutOffWorkTime_index'=> 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_index'=> 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_PbxExtensionModules_index'=> 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Providers_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Restart_manage' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_SoundFiles_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_SystemDiagnostic_index' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_TimeSettings_modify' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_MailSettings_modify'=> 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_GeneralSettings_modify' => 'просмотр',
    'module_usersui_CheckBox_AdminCabinet_Network_modify'=> 'просмотр',
    'module_usersui_CheckBox_PBXCoreREST_/pbxcore/api/cdr_/getActiveChannels'=>'Получить список активных каналов',
    'module_usersui_CheckBox_PBXCoreREST__pbxcore_api_advices_getList'=>'Получать уведомления о состоянии системы',

    'module_usersui_CheckBox_save' => 'сохранение',
    'module_usersui_CheckBox_modify' => 'редактирование',
    'module_usersui_CheckBox_manage' => 'управление',
    'module_usersui_CheckBox_delete' => 'удаление',
    'module_usersui_CheckBox_enable' => 'включение',
    'module_usersui_CheckBox_disable' => 'выключение',
    'module_usersui_CheckBox_changePriority' => 'изменение порядка',
    'module_usersui_CheckBox_modifysip' => 'редактирование SIP',
    'module_usersui_CheckBox_modifyiax' => 'редактирование IAX',
    'module_usersui_CheckBox_getNewRecords' => 'получить набор данных',
    'module_usersui_CheckBox_available' => 'проверка доступности',
    'module_usersui_CheckBox_getPathById' => 'получить путь к файлу',
    'module_usersui_CheckBox_getForSelect' => 'получить список номеров для выбора',
    'module_usersui_CheckBox_getSoundFiles' => 'получить список звуковых файлов для выбора',

    'module_usersui_AppTypeREST' => 'Доступ к REST API',
    'module_usersui_AppTypeAPP' => 'Доступ к разделам интерфейса',

    'module_usersui_ldap_user_not_found'=>'Пользователь не найден',
    'module_usersui_ldap_successfully_authenticated'=>'Пользователь авторизован',
    'module_usersui_ldap_password_expired' => 'Пароль просрочен',
    'module_usersui_ldap_account_disabled' => 'Ваш аккаунт отключен',
    'module_usersui_ldap_account_expired' => 'Ваш аккаунт просрочен',
    'module_usersui_ldap_account_locked' => 'Ваш аккаунт заблокирован',
    'module_usersui_ldap_password_incorrect' => 'Имя пользователя или логин указаны неверно',

    'module_usersui_LdapConfigTab' => 'Настройка доменной авторизации',

    'module_usersui_LdapServerName'=>'Адрес контроллера домена',
    'module_usersui_LdapServerPort'=>'Порт',
    'module_usersui_LdapAdminLogin'=>'Имя пользователя и пароль с правами на чтение в домене',
    'module_usersui_LdapBaseDN'=>'Корень домена',
    'module_usersui_LdapPassword'=>'Пароль',
    'module_usersui_LdapUserAttribute'=>'Имя пользователя',
    'module_usersui_LdapUserFilter'=>'Дополнительный фильтр пользователей',
    'module_usersui_LdapUserIdAttribute'=>'Атрибут в котором хранится имя пользователя',
    'module_usersui_LdapOrganizationalUnit'=>'Подразделение',
    'module_usersui_LdapCheckLogin'=>'Введите любой доменный логин и пароль для проверки, если авторизация успешная, можно сохранить настройки подключения.',
    'module_usersui_LdapCheckHeader'=>'Проверка параметров доменной авторизации',
    'module_usersui_LdapCheckButton'=>'Авторизоваться',

    'module_usersui_CDRFilterModeLabel' => 'Выберите режим фильтрации CDR записей',
    'module_usersui_CDRFilterModeOff'   => 'Не фильтровать',
    'module_usersui_CDRFilterModeInList'=> 'Показывать только разговоры выбранных сотрудников',
    'module_usersui_CDRFilterModeNotInList'=> 'Показывать все, кроме записей выбранных сотрудников',

    'module_usersui_NoAnyAccessGroup'=>'В модуле еще не создано ни одной группы доступа',
    'module_usersui_AddNewAccessGroupShort'=>'Создать',

];