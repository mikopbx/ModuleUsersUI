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

return [
    'repModuleUsersUI' => 'Управление доступом в систему - %repesent%',
    'mo_ModuleModuleUsersUI' => 'Управление доступом в систему ',
    'BreadcrumbModuleUsersUI' => 'Управление доступом в систему ',
    'SubHeaderModuleUsersUI' => 'Создание групп доступа, ограничение прав, доменная авторизация',
    'BreadcrumbAccessGroups' => 'Настройка группы доступа',
    'SubHeaderAccessGroups' => 'Детальная настройка прав на элементы интерфейса и REST API',
    'module_usersui_GeneralSettings' => 'Основные настройки группы',
    'module_usersui_UsersFilter' => 'Пользователи группы доступа',
    'module_usersui_GroupRights' => 'Настройка прав',
    'module_usersui_GroupCDRFilter' => 'Ограничения для истории разговоров',
    'module_usersui_ValidateNameIsEmpty' => 'Проверьте название группы, оно не заполнено',
    'module_usersuiConnected' => 'Модуль подключен',
    'module_usersuiDisconnected' => 'Модуль отключен',
    'module_usersuiUpdateStatus' => 'Обновление статуса',
    'module_usersui_ValidateServerNameIsEmpty' => 'Не заполнен адрес контроллера домена',
    'module_usersui_ValidateServerPortIsEmpty' => 'Не заполнен порт контроллера домена',
    'module_usersui_ValidateAdministrativeLoginIsEmpty' => 'Не заполнен логин для пользователя домена',
    'module_usersui_ValidateAdministrativePasswordIsEmpty' => 'Не заполнен пароль для пользователя домена',
    'module_usersui_ValidateBaseDNIsEmpty' => 'Не заполнен корень домена',
    'module_usersui_ValidateUserIdAttributeIsEmpty' => 'Не заполнен атрибут с именем пользователя в домене',
    'module_usersUiMainMenuItem' => 'Права пользователей',
    'module_usersUiAccessGroups' => 'Группы доступа',
    'module_usersui_GroupName' => 'Название группы',
    'module_usersui_FullAccessCheckbox' => 'Группа без ограничений доступа',
    'module_usersui_ColumnGroupName' => 'Группа доступа',
    'module_usersui_ColumnGroupMembersCount' => 'Количество участников',
    'module_usersui_ColumnGroupDescription' => 'Описание',
    'module_usersui_ColumnUserExtension' => 'Номер',
    'module_usersui_ColumnUserLogin' => 'Логин',
    'module_usersui_ColumnUseLdap' => 'LDAP',
    'module_usersui_ColumnUserPassword' => 'Пароль',
    'module_usersui_AddNewAccessGroup' => 'Добавить новую группу доступа',
    'module_usersui_Groups' => 'Группы доступа',
    'module_usersui_NoAccessGroupName' => 'Доступ запрещен',
    'module_usersui_Users' => 'Права на вход у сотрудников',
    'module_usersui_ExtensionTabName' => 'Права для входа в MikoPBX',
    'module_usersui_UserLoginAndPasswordLabel' => 'Данные для авторизации в системе',
    'module_usersui_LdapCheckbox' => 'Использовать доменную авторизацию',
    'module_usersui_AccessGroup' => 'Группа доступа',
    'module_usersui_HomePage' => 'Страница, куда попадет пользователь после входа',
    'module_usersui_UserLoginPlaceholder' => 'Логин пользователя',
    'module_usersui_UserPasswordPlaceholder' => 'Пароль пользователя',
    'module_usersui_CheckBox_AdminCabinet_AsteriskManagers_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_AsteriskManagers_modify' => 'просмотр деталей учетной записи',
    'module_usersui_CheckBox_AdminCabinet_AsteriskManagers_save' => 'создание и сохранение',
    'module_usersui_CheckBox_AdminCabinet_AsteriskManagers_delete' => 'удаление',
    'module_usersui_CheckBox_AdminCabinet_CallDetailRecords_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_CallDetailRecords_getNewRecords' => 'получение истории звонков',
    'module_usersui_CheckBox_AdminCabinet_CallQueues_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_CallQueues_modify' => 'просмотр настроек очереди',
    'module_usersui_CheckBox_AdminCabinet_CallQueues_save' => 'сохранить или создать новую',
    'module_usersui_CheckBox_AdminCabinet_CallQueues_delete' => 'удалить очередь',
    'module_usersui_CheckBox_AdminCabinet_ConferenceRooms_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_ConferenceRooms_modify' => 'просмотр настроек конференции',
    'module_usersui_CheckBox_AdminCabinet_ConferenceRooms_save' => 'создание и сохранение',
    'module_usersui_CheckBox_AdminCabinet_ConferenceRooms_delete' => 'удаление',
    'module_usersui_CheckBox_AdminCabinet_DialplanApplications_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_DialplanApplications_modify' => 'просмотр кода и настроек',
    'module_usersui_CheckBox_AdminCabinet_DialplanApplications_save' => 'сохранить или создать новое',
    'module_usersui_CheckBox_AdminCabinet_DialplanApplications_delete' => 'удалить приложение',
    'module_usersui_CheckBox_AdminCabinet_Extensions_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_Extensions_modify' => 'просмотр карточки сотрудника',
    'module_usersui_CheckBox_AdminCabinet_Extensions_save' => 'изменить или создать нового',
    'module_usersui_CheckBox_AdminCabinet_Extensions_delete' => 'удаление',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_modify' => 'открыть детали',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_save' => 'сохранить или создать новый',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_delete' => 'удалить',
    'module_usersui_CheckBox_AdminCabinet_IncomingRoutes_changePriority' => 'изменить порядок/приоритет',
    'module_usersui_CheckBox_AdminCabinet_IvrMenu_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_IvrMenu_modify' => 'открыть детали меню',
    'module_usersui_CheckBox_AdminCabinet_IvrMenu_save' => 'сохранить меню',
    'module_usersui_CheckBox_AdminCabinet_IvrMenu_delete' => 'удалить меню',
    'module_usersui_CheckBox_AdminCabinet_OutOffWorkTime_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_OutOffWorkTime_modify' => 'открыть детали',
    'module_usersui_CheckBox_AdminCabinet_OutOffWorkTime_save' => 'сохранить или создать новое расписание',
    'module_usersui_CheckBox_AdminCabinet_OutOffWorkTime_delete' => 'удалить',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_modify' => 'открыть детали',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_save' => 'сохранить или создать новый',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_delete' => 'удалить',
    'module_usersui_CheckBox_AdminCabinet_OutboundRoutes_changePriority' => 'изменить порядок/приоритет',
    'module_usersui_CheckBox_AdminCabinet_Providers_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_Providers_modifysip' => 'просмотр учетной записи SIP',
    'module_usersui_CheckBox_AdminCabinet_Providers_modifyiax' => 'просмотр учетной записи IAX',
    'module_usersui_CheckBox_AdminCabinet_Providers_enable' => 'включение провайдера',
    'module_usersui_CheckBox_AdminCabinet_Providers_disable' => 'выключение провайдера',
    'module_usersui_CheckBox_AdminCabinet_Providers_save' => 'сохранить параметры или создать нового',
    'module_usersui_CheckBox_AdminCabinet_Providers_delete' => 'удалить',
    'module_usersui_CheckBox_AdminCabinet_SoundFiles_index' => 'доступ к разделу',
    'module_usersui_CheckBox_AdminCabinet_SoundFiles_modify' => 'открыть карточку файла',
    'module_usersui_CheckBox_AdminCabinet_SoundFiles_save' => 'изменить или добавить аудио файл',
    'module_usersui_CheckBox_AdminCabinet_SoundFiles_delete' => 'удалить',
    'module_usersui_AppTypeREST' => 'Доступ к REST API',
    'module_usersui_AppTypeAPP' => 'Доступ к разделам интерфейса',
    'module_usersui_ldap_user_not_found' => 'Пользователь не найден',
    'module_usersui_ldap_successfully_authenticated' => 'Пользователь авторизован',
    'module_usersui_ldap_password_expired' => 'Пароль просрочен',
    'module_usersui_ldap_account_disabled' => 'Ваш аккаунт отключен',
    'module_usersui_ldap_account_expired' => 'Ваш аккаунт просрочен',
    'module_usersui_ldap_account_locked' => 'Ваш аккаунт заблокирован',
    'module_usersui_ldap_password_incorrect' => 'Имя пользователя или логин указаны неверно',
    'module_usersui_LdapConfigTab' => 'Настройка доменной авторизации',
    'module_usersui_LdapServerName' => 'Адрес контроллера домена',
    'module_usersui_LdapServerPort' => 'Порт',
    'module_usersui_LdapAdminLogin' => 'Имя пользователя и пароль с правами на чтение в домене',
    'module_usersui_LdapBaseDN' => 'Корень домена',
    'module_usersui_LdapPassword' => 'Пароль',
    'module_usersui_LdapUserAttribute' => 'Имя пользователя',
    'module_usersui_LdapUserFilter' => 'Дополнительный фильтр пользователей',
    'module_usersui_LdapUserIdAttribute' => 'Атрибут в котором хранится имя пользователя',
    'module_usersui_LdapOrganizationalUnit' => 'Подразделение',
    'module_usersui_LdapCheckGetListHeader' => '1. Получение списка LDAP пользователей',
    'module_usersui_LdapCheckGetUsersList' => 'Используя указанный параметры доступа и фильтры выполним запрос к LDAP/AD и получим список пользователей для авторизации',
    'module_usersui_LdapGetUsersButton' => 'Выполнить запрос',
    'module_usersui_LdapCheckLogin' => 'Введите любой доменный логин и пароль для проверки, если авторизация успешная, можно сохранить настройки подключения.',
    'module_usersui_LdapCheckHeader' => '2. Проверка параметров доменной авторизации',
    'module_usersui_LdapCheckButton' => 'Авторизоваться',
    'module_usersui_CDRFilterModeLabel' => 'Выберите режим фильтрации CDR записей',
    'module_usersui_CDRFilterModeOff' => 'Не фильтровать',
    'module_usersui_CDRFilterModeInList' => 'Показывать только разговоры выбранных сотрудников',
    'module_usersui_CDRFilterModeNotInList' => 'Показывать все, кроме записей выбранных сотрудников',
    'module_usersui_NoAnyAccessGroup' => 'В модуле еще не создано ни одной группы доступа',
    'module_usersui_AddNewAccessGroupShort' => 'Создать',
    'module_usersui_LoginNameNotUnique' => 'Не уникальное имя пользователя',
    'module_usersui_SelectMemberToAddToGroup' => 'Выберите сотрудника для добавления в текущую группу',
    'module_usersui_CheckBox_ZabbixAgent5_ModuleZabbixAgent5_index' => 'настройка Zabbix агента',
    'module_usersui_CheckBox_AmoCrm_ModuleAmoCrm_index' => 'настройка модуля',
    'module_usersui_CheckBox_CTIClient_ModuleCTIClient_index' => 'настройка модуля',
    'module_usersui_CheckBox_Docker_ModuleDocker_index' => 'настройка модуля',
    'module_usersui_CheckBox_PT1CCore_ModulePT1CCore_index' => 'настройка модуля',
    'module_usersui_CheckBox_PhoneBook_ModulePhoneBook_index' => 'просмотр телефонной книги',
    'module_usersui_CheckBox_PhoneBook_ModulePhoneBook_save' => 'изменение записей',
    'module_usersui_CheckBox_PhoneBook_ModulePhoneBook_delete' => 'удаление записей',
    'module_usersui_CheckBox_TelegramNotify_ModuleTelegramNotify_index' => 'настройка модуля',
    'module_usersui_CheckBox_GetSsl_ModuleGetSsl_index' => 'получение сертификатов',
    'module_usersui_CheckBox_Backup_ModuleBackup_index' => 'просмотр настроек резервного копирования',
    'module_usersui_CheckBox_Backup_ModuleBackup_create' => 'создание резервной копии',
    'module_usersui_CheckBox_Backup_ModuleBackup_delete' => 'удаление резервной копии',
    'module_usersui_CheckBox_Backup_ModuleBackup_restore' => 'восстановление резервной копии',
    'module_usersui_CheckBox_Backup_ModuleBackup_download' => 'скачать резервную копию',
    'module_usersui_CheckBox_Backup_ModuleBackup_save' => 'изменение настроек модуля',
    'module_usersui_CheckBox_Autoprovision_ModuleAutoprovision_index' => 'изменение настроек модуля',
    'module_usersui_CheckBox_Bitrix24Integration_ModuleBitrix24Integration_index' => 'изменение настроек модуля',
    'module_usersui_CheckBox_SmartIVR_ModuleSmartIVR_index' => 'изменение настроек модуля',
    'module_usersui_CheckBox_UsersGroups_ModuleUsersGroups_index' => 'просмотр настроек',
    'module_usersui_CheckBox_UsersGroups_ModuleUsersGroups_save' => 'изменение настроек',
    'module_usersui_CheckBox_LdapSync_ModuleLdapSync_index' => 'просмотр настроек',
    'module_usersui_CheckBox_LdapSync_ModuleLdapSync_save' => 'изменение настроек',
    'module_usersui_LdapType' => 'Тип сервера',
    'module_usersui_EmptyServerResponse' => 'Сервер вернул пустой список пользователей по вашему фильтру'
];
