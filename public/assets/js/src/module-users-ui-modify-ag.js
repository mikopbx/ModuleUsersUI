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

/* global globalRootUrl, globalTranslate, Form, Extensions */


const moduleUsersUIModifyAG = {
    $formObj: $('#module-users-ui-form'),
    $selectUsersDropDown: $('.select-extension-field'),
    $statusToggle: $('#module-status-toggle'),
    $homePageDropdown: $('.home-page-dropdown'),
    $accessSettingsTabMenu: $('#access-settings-tab-menu .item'),
    $mainTabMenu: $('#module-users-group-modify-menu .item'),
    defaultExtension: '',

    /**
     * jQuery object for the uncheck button.
     * @type {jQuery}
     */
    $unCheckButton: $('.uncheck.button'),

    /**
     * jQuery object for the uncheck button.
     * @type {jQuery}
     */
    $checkButton: $('.check.button'),

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

        moduleUsersUIModifyAG.$mainTabMenu.tab();
        moduleUsersUIModifyAG.$accessSettingsTabMenu.tab();

        moduleUsersUIModifyAG.initializeUsersDropDown();

        moduleUsersUIModifyAG.initializeRightsCheckboxes();

        moduleUsersUIModifyAG.$homePageDropdown.dropdown();

        $('body').on('click', 'div.delete-user-row', (e) => {
            e.preventDefault();
            moduleUsersUIModifyAG.deleteMemberFromTable(e.target);
        });


        // Handle check button click
        moduleUsersUIModifyAG.$checkButton.on('click', (e) => {
            e.preventDefault();
            $(e.target).parent('.ui.tab').find('.ui.checkbox').checkbox('check');
        });

        // Handle uncheck button click
        moduleUsersUIModifyAG.$unCheckButton.on('click', (e) => {
            e.preventDefault();
            $(e.target).parent('.ui.tab').find('.ui.checkbox').checkbox('uncheck');
        });

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
       Form.dataChanged();
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

    initializeRightsCheckboxes() {
        $('#access-group-rights .list .master.checkbox')
            .checkbox({
                // check all children
                onChecked: function() {
                    let
                        $childCheckbox  = $(this).closest('.checkbox').siblings('.list').find('.checkbox')
                    ;
                    $childCheckbox.checkbox('check');
                },
                // uncheck all children
                onUnchecked: function() {
                    let
                        $childCheckbox  = $(this).closest('.checkbox').siblings('.list').find('.checkbox')
                    ;
                    $childCheckbox.checkbox('uncheck');
                }
            })
        ;
        $('#access-group-rights .list .child.checkbox')
            .checkbox({
                // Fire on load to set parent value
                fireOnInit : true,
                // Change parent state on each child checkbox change
                onChange   : function() {
                    let
                        $listGroup      = $(this).closest('.list'),
                        $parentCheckbox = $listGroup.closest('.item').children('.checkbox'),
                        $checkbox       = $listGroup.find('.checkbox'),
                        allChecked      = true,
                        allUnchecked    = true
                    ;
                    // check to see if all other siblings are checked or unchecked
                    $checkbox.each(function() {
                        if( $(this).checkbox('is checked') ) {
                            allUnchecked = false;
                        }
                        else {
                            allChecked = false;
                        }
                    });
                    // set parent checkbox state, but dont trigger its onChange callback
                    if(allChecked) {
                        $parentCheckbox.checkbox('set checked');
                    }
                    else if(allUnchecked) {
                        $parentCheckbox.checkbox('set unchecked');
                    }
                    else {
                        $parentCheckbox.checkbox('set indeterminate');
                    }
                }
            })
        ;
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
        Form.dataChanged();
    },
    /**
     * Изменение статуса кнопок при изменении статуса модуля
     */
    checkStatusToggle() {
        if (moduleUsersUIModifyAG.$statusToggle.checkbox('is checked')) {
            $('[data-tab = "general"] .disability').removeClass('disabled');
            $('[data-tab = "users"] .disability').removeClass('disabled');
        } else {
            $('[data-tab = "general"] .disability').addClass('disabled');
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

        const arrGroupRights = [];
        $('input.access-group-checkbox').each((index, obj) => {
            if ($(obj).parent('.checkbox').checkbox('is checked')) {
                const module = $(obj).attr('data-module');
                const controller = $(obj).attr('data-controller');
                const action = $(obj).attr('data-action');

                // Find the module in arrGroupRights or create a new entry
                let moduleIndex = arrGroupRights.findIndex(item => item.module === module);
                if (moduleIndex === -1) {
                    arrGroupRights.push({ module, controllers: [] });
                    moduleIndex = arrGroupRights.length - 1;
                }

                // Find the controller in the module or create a new entry
                const moduleControllers = arrGroupRights[moduleIndex].controllers;
                let controllerIndex = moduleControllers.findIndex(item => item.controller === controller);
                if (controllerIndex === -1) {
                    moduleControllers.push({ controller, actions: [] });
                    controllerIndex = moduleControllers.length - 1;
                }

                // Push the action into the controller's actions array
                moduleControllers[controllerIndex].actions.push(action);
            }
        });

        result.data.access_group_rights = JSON.stringify(arrGroupRights);
        return result;
    },
    cbAfterSendForm() {

    },
    initializeForm() {
        Form.$formObj = moduleUsersUIModifyAG.$formObj;
        Form.url = `${globalRootUrl}module-users-u-i/access-groups/save`;
        Form.validateRules = moduleUsersUIModifyAG.validateRules;
        Form.cbBeforeSendForm = moduleUsersUIModifyAG.cbBeforeSendForm;
        Form.cbAfterSendForm = moduleUsersUIModifyAG.cbAfterSendForm;
        Form.initialize();
    },
};

$(document).ready(() => {
    moduleUsersUIModifyAG.initialize();
});
