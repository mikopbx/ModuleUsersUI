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

/* global globalRootUrl,globalTranslate, Form, Extensions */


const moduleUsersUIModifyAG = {
    $formObj: $('#module-users-ui-form'),
    $selectUsersDropDown: $('.select-extension-field'),
    $dirrtyField: $('#dirrty'),
    $statusToggle: $('#module-status-toggle'),
    defaultExtension: '',
    validateRules: {
        name: {
            identifier: 'name',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateNameIsEmpty,
                },
            ],
        },
    },
    initialize() {
        moduleUsersUIModifyAG.checkStatusToggle();
        window.addEventListener('ModuleStatusChanged', moduleUsersUIModifyAG.checkStatusToggle);
        moduleUsersUIModifyAG.initializeForm();
        $('.avatar').each(() => {
            if ($(this).attr('src') === '') {
                $(this).attr('src', `${globalRootUrl}assets/img/unknownPerson.jpg`);
            }
        });
        $('#main-users-ui-tab-menu .item').tab()

        moduleUsersUIModifyAG.initializeUsersDropDown();

        $('body').on('click', 'div.delete-user-row', (e) => {
            e.preventDefault();
            moduleUsersUIModifyAG.deleteMemberFromTable(e.target);
        });

        $('#isolate').parent().checkbox({
            onChange: moduleUsersUIModifyAG.changeIsolate
        });
        moduleUsersUIModifyAG.changeIsolate();
    },

    changeIsolate(){
        if($('#isolate').parent().checkbox('is checked')){
            $("#isolatePickUp").parent().hide();
        }else{
            $("#isolatePickUp").parent().show();
        }
    },
    /**
     * Delete Group member from list
     * @param target - link to pushed button
     */
    deleteMemberFromTable(target) {
        const id = $(target).closest('div').attr('data-value');
        $(`#${id}`)
            .removeClass('selected-member')
            .hide();
        moduleUsersUIModifyAG.$dirrtyField.val(Math.random());
        moduleUsersUIModifyAG.$dirrtyField.trigger('change');
    },
    /**
     * Настройка выпадающего списка пользователей
     */
    initializeUsersDropDown() {
        const dropdownParams = Extensions.getDropdownSettingsOnlyInternalWithoutEmpty();
        dropdownParams.action = moduleUsersUIModifyAG.cbAfterUsersSelect;
        dropdownParams.templates = { menu: moduleUsersUIModifyAG.customDropdownMenu };
        moduleUsersUIModifyAG.$selectUsersDropDown.dropdown(dropdownParams);
    },
    /**
     * Change custom menu visualisation
     * @param response
     * @param fields
     * @returns {string}
     */
    customDropdownMenu(response, fields) {
        const values = response[fields.values] || {};
        let html = '';
        let oldType = '';
        $.each(values, (index, option) => {
            if (option.type !== oldType) {
                oldType = option.type;
                html += '<div class="divider"></div>';
                html += '	<div class="header">';
                html += '	<i class="tags icon"></i>';
                html += option.typeLocalized;
                html += '</div>';
            }
            const maybeText = (option[fields.text]) ? `data-text="${option[fields.text]}"` : '';
            const maybeDisabled = ($(`#ext-${option[fields.value]}`).hasClass('selected-member')) ? 'disabled ' : '';
            html += `<div class="${maybeDisabled}item" data-value="${option[fields.value]}"${maybeText}>`;
            html += option[fields.name];
            html += '</div>';
        });
        return html;
    },
    /**
     * Колбек после выбора пользователя в группу
     * @param value
     */
    cbAfterUsersSelect(text, value, $element) {
        $(`#ext-${value}`)
            .closest('tr')
            .addClass('selected-member')
            .show();
        $($element).addClass('disabled');
        moduleUsersUIModifyAG.$dirrtyField.val(Math.random());
        moduleUsersUIModifyAG.$dirrtyField.trigger('change');
    },
    /**
     * Изменение статуса кнопок при изменении статуса модуля
     */
    checkStatusToggle() {
        if (moduleUsersUIModifyAG.$statusToggle.checkbox('is checked')) {
            $('[data-tab = "general"] .disability').removeClass('disabled');
            $('[data-tab="rules"] .checkbox').removeClass('disabled');
            $('[data-tab = "users"] .disability').removeClass('disabled');
        } else {
            $('[data-tab = "general"] .disability').addClass('disabled');
            $('[data-tab="rules"] .checkbox').addClass('disabled');
            $('[data-tab = "users"] .disability').addClass('disabled');
        }
    },
    cbBeforeSendForm(settings) {
        const result = settings;
        result.data = moduleUsersUIModifyAG.$formObj.form('get values');
        const arrMembers = [];
        $('tr.selected-member').each((index, obj) => {
            if ($(obj).attr('id')) {
                arrMembers.push($(obj).attr('id'));
            }
        });

        result.data.members = JSON.stringify(arrMembers);
        return result;
    },
    cbAfterSendForm() {

    },
    initializeForm() {
        Form.$formObj = moduleUsersUIModifyAG.$formObj;
        Form.url = `${globalRootUrl}module-users-groups/save`;
        Form.validateRules = moduleUsersUIModifyAG.validateRules;
        Form.cbBeforeSendForm = moduleUsersUIModifyAG.cbBeforeSendForm;
        Form.cbAfterSendForm = moduleUsersUIModifyAG.cbAfterSendForm;
        Form.initialize();
    },
};

$(document).ready(() => {
    moduleUsersUIModifyAG.initialize();
});
