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

/* global globalRootUrl, globalTranslate, Form, Extensions, Datatable */


const moduleUsersUIModifyAG = {

    /**
     * jQuery object for the form.
     * @type {jQuery}
     */
    $formObj: $('#module-users-ui-form'),

    /**
     * Checkbox allows full access to the system.
     * @type {jQuery}
     * @private
     */
    $fullAccessCheckbox: $('#full-access-group'),

    /**
     * jQuery object for the select users dropdown.
     * @type {jQuery}
     */
    $selectUsersDropDown: $('[data-tab="users"] .select-extension-field'),

    /**
     * jQuery object for the module status toggle.
     * @type {jQuery}
     */
    $statusToggle: $('#module-status-toggle'),

    /**
     * jQuery object for the home page dropdown select.
     * @type {jQuery}
     */
    $homePageDropdown: $('#home-page-dropdown'),

    /**
     * jQuery object for the access settings tab menu.
     * @type {jQuery}
     */
    $accessSettingsTabMenu: $('#access-settings-tab-menu .item'),

    /**
     * jQuery object for the main tab menu.
     * @type {jQuery}
     */
    $mainTabMenu: $('#module-access-group-modify-menu .item'),

    /**
     * jQuery object for the CDR filter tab.
     * @type {jQuery}
     */
    $cdrFilterTab: $('#module-access-group-modify-menu .item[data-tab="cdr-filter"]'),

    /**
     * jQuery object for the group rights tab.
     * @type {jQuery}
     */
    $groupRightsTab: $('#module-access-group-modify-menu .item[data-tab="group-rights"]'),

    /**
     * Users table for CDR filter.
     * @type {jQuery}
     */
    $cdrFilterUsersTable: $('#cdr-filter-users-table'),

    /**
     * Users data table for CDR filter.
     * @type {Datatable}
     */
    cdrFilterUsersDataTable: null,

    /**
     * jQuery object for the CDR filter toggles.
     * @type {jQuery}
     */
    $cdrFilterToggles: $('div.cdr-filter-toggles'),

    /**
     * jQuery object for the CDR filter mode.
     * @type {jQuery}
     */
    $cdrFilterMode: $('div.cdr-filter-radio'),

    /**
     * jQuery object with all tabs in access-group-rights tab.
     * @type {jQuery}
     */
    $groupRightModulesTabs: $('#access-group-rights .ui.tab'),

    /**
     * Default extension.
     * @type {string}
     */
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

    /**
     * Validation rules for the form fields.
     * @type {Object}
     */
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

    /**
     * Initializes the module.
     */
    initialize() {
        moduleUsersUIModifyAG.checkStatusToggle();
        window.addEventListener('ModuleStatusChanged', moduleUsersUIModifyAG.checkStatusToggle);

        $('.avatar').each(() => {
            if ($(this).attr('src') === '') {
                $(this).attr('src', `${globalRootUrl}assets/img/unknownPerson.jpg`);
            }
        });

        moduleUsersUIModifyAG.$mainTabMenu.tab();
        moduleUsersUIModifyAG.$accessSettingsTabMenu.tab();
        moduleUsersUIModifyAG.initializeMembersDropDown();
        moduleUsersUIModifyAG.initializeRightsCheckboxes();

        moduleUsersUIModifyAG.cbAfterChangeFullAccessToggle();
        moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox({
            onChange: moduleUsersUIModifyAG.cbAfterChangeFullAccessToggle
        });

        moduleUsersUIModifyAG.$cdrFilterToggles.checkbox();
        moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
        moduleUsersUIModifyAG.$cdrFilterMode.checkbox({
            onChange: moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode
        });

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

        // Initialize CDR filter datatable
        moduleUsersUIModifyAG.initializeCDRFilterTable();

        moduleUsersUIModifyAG.initializeForm();
    },

    /**
     * Callback function after changing the full access toggle.
     */
    cbAfterChangeFullAccessToggle(){
        if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
            // Check all checkboxes
            moduleUsersUIModifyAG.$mainTabMenu.tab('change tab','general');
            moduleUsersUIModifyAG.$cdrFilterTab.hide();
            moduleUsersUIModifyAG.$groupRightsTab.hide();
        } else {
            moduleUsersUIModifyAG.$groupRightsTab.show();
            moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
        }
        moduleUsersUIModifyAG.$homePageDropdown.dropdown(moduleUsersUIModifyAG.getHomePagesForSelect());
    },

    /**
     * Callback function after changing the CDR filter mode.
     */
    cbAfterChangeCDRFilterMode(){
        const cdrFilterMode = moduleUsersUIModifyAG.$formObj.form('get value','cdrFilterMode');
        if (cdrFilterMode==='all') {
            $('#cdr-filter-users-table_wrapper').hide();
        } else {
            $('#cdr-filter-users-table_wrapper').show();
            if (moduleUsersUIModifyAG.cdrFilterUsersDataTable){
                const newPageLength = moduleUsersUIModifyAG.calculatePageLength();
                moduleUsersUIModifyAG.cdrFilterUsersDataTable.page.len(newPageLength).draw(false);
            }
        }
    },

    /**
     * Initializes the members dropdown for assigning current access group.
     */
    initializeMembersDropDown() {
        const dropdownParams = Extensions.getDropdownSettingsOnlyInternalWithoutEmpty();
        dropdownParams.action = moduleUsersUIModifyAG.cbAfterUsersSelect;
        dropdownParams.templates = { menu: moduleUsersUIModifyAG.customMembersDropdownMenu };
        moduleUsersUIModifyAG.$selectUsersDropDown.dropdown(dropdownParams);
    },

    /**
     * Customizes the members dropdown menu visualization.
     * @param {Object} response - The response object.
     * @param {Object} fields - The fields object.
     * @returns {string} - The HTML string for the dropdown menu.
     */
    customMembersDropdownMenu(response, fields) {
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
     * Callback function after selecting a user for the group.
     * @param {string} text - The text value.
     * @param {string} value - The selected value.
     * @param {jQuery} $element - The jQuery element.
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
     * Deletes a group member from the table.
     * @param {HTMLElement} target - The target element.
     */
    deleteMemberFromTable(target) {
        const id = $(target).closest('div').attr('data-value');
        $(`#${id}`)
            .removeClass('selected-member')
            .hide();
        Form.dataChanged();
    },

    /**
     * Initializes the rights checkboxes.
     */
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
                },
                onChange: function() {
                    moduleUsersUIModifyAG.$homePageDropdown.dropdown(moduleUsersUIModifyAG.getHomePagesForSelect());
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
                    // set parent checkbox state, but don't trigger its onChange callback
                    if(allChecked) {
                        $parentCheckbox.checkbox('set checked');
                    }
                    else if(allUnchecked) {
                        $parentCheckbox.checkbox('set unchecked');
                    }
                    else {
                        $parentCheckbox.checkbox('set indeterminate');
                    }
                    moduleUsersUIModifyAG.cdAfterChangeGroupRight();
                }
            })
        ;
    },

    /**
     * Callback function after changing the group right.
     */
    cdAfterChangeGroupRight(){
        const accessToCdr = moduleUsersUIModifyAG.$formObj.form('get value','MikoPBX\\AdminCabinet\\Controllers\\CallDetailRecordsController_main');
        if (accessToCdr==='on') {
            moduleUsersUIModifyAG.$cdrFilterTab.show();
            moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
        } else {
            moduleUsersUIModifyAG.$cdrFilterTab.hide();
        }

        // Show hide check icon close to module name
        moduleUsersUIModifyAG.$groupRightModulesTabs.each((index, obj) => {
            const moduleTab = $(obj).attr('data-tab');
            if ($(`div[data-tab="${moduleTab}"]  .access-group-checkbox`).parent('.checked').length>0){
                $(`a[data-tab='${moduleTab}'] i.icon`).addClass('angle right');
            } else {
                $(`a[data-tab='${moduleTab}'] i.icon`).removeClass('angle right');
            }
        });
    },

    /**
     * Changes the status of buttons when the module status changes.
     */
    checkStatusToggle() {
        if (moduleUsersUIModifyAG.$statusToggle.checkbox('is checked')) {
            $('[data-tab = "general"] .disability').removeClass('disabled');
            $('[data-tab = "users"] .disability').removeClass('disabled');
            $('[data-tab = "group-rights"] .disability').removeClass('disabled');
            $('[data-tab = "cdr-filter"] .disability').removeClass('disabled');
        } else {
            $('[data-tab = "general"] .disability').addClass('disabled');
            $('[data-tab = "users"] .disability').addClass('disabled');
            $('[data-tab = "group-rights"] .disability').addClass('disabled');
            $('[data-tab = "cdr-filter"] .disability').addClass('disabled');
        }
    },

    /**
     * Prepares list of possible home pages to select from
     */
    getHomePagesForSelect(){
        let valueSelected = false;
        const currentHomePage = moduleUsersUIModifyAG.$formObj.form('get value','homePage');
        let selectedRights = $('.checked .access-group-checkbox');
        if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')){
           selectedRights = $('.access-group-checkbox');
        }
        const values = [];
        selectedRights.each((index, obj) => {
            const module = $(obj).attr('data-module');
            const controllerName = $(obj).attr('data-controller-name');
            const action = $(obj).attr('data-action');
            if (controllerName.indexOf('pbxcore') === -1 && action.indexOf('index') > -1) {
                let url = moduleUsersUIModifyAG.convertCamelToDash(`/${module}/${controllerName}/${action}`);

                let nameTemplates = [
                    `mo_${module}`,
                    `mm_${controllerName}`,
                    `Breadcrumb${module}`,
                    `module_usersui_${module}_${controllerName}_${action}`
                ];

                let name = '';
                nameTemplates.some((nameTemplate) => {
                    // Попытка найти перевод
                    name = globalTranslate[nameTemplate];

                    // Если перевод найден (он не undefined), прекращаем перебор
                    if (name !== undefined && name !== nameTemplate) {
                        return true;  // Останавливаем перебор
                    }

                    // Если перевод не найден, продолжаем поиск
                    name = nameTemplate;  // Используем шаблон как значение по умолчанию
                    return false;
                });
                if (currentHomePage === url){
                    values.push( { name: name, value: url, selected: true });
                    valueSelected = true;
                } else {
                    values.push( { name: name, value: url });
                }
            }
        });
        if (values.length===0){
            const failBackHomePage =  `${globalRootUrl}session/end`;
            values.push( { name: failBackHomePage, value: failBackHomePage, selected: true });
            valueSelected = true;
        }
        if (!valueSelected){
            values[0].selected = true;
        }
        return {
            values:values,
            onChange: Form.dataChanged
        };

    },
    /**
     * Converts a string from camel case to dash case.
     * @param str
     * @returns {*}
     */
    convertCamelToDash(str) {
        return str.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    },
    /**
     * Callback function before sending the form.
     * @param {Object} settings - The form settings.
     * @returns {Object} - The modified form settings.
     */
    cbBeforeSendForm(settings) {
        const result = settings;
        const formValues = moduleUsersUIModifyAG.$formObj.form('get values');
        result.data = {
            id: formValues.id,
            name: formValues.name,
            description: formValues.description,
            cdrFilterMode:  formValues.cdrFilterMode,
        };
        // Group members
        const arrMembers = [];
        $('tr.selected-member').each((index, obj) => {
            if ($(obj).attr('data-value')) {
                arrMembers.push($(obj).attr('data-value'));
            }
        });

        result.data.members = JSON.stringify(arrMembers);

        // Group Rights
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

        // CDR Filter
        const arrCDRFilter = [];
        moduleUsersUIModifyAG.$cdrFilterToggles.each((index, obj) => {
            if ($(obj).checkbox('is checked')) {
                arrCDRFilter.push($(obj).attr('data-value'));
            }
        });
        result.data.cdrFilter = JSON.stringify(arrCDRFilter);

        // Full access group toggle
        if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')){
            result.data.fullAccess = '1';
        } else {
            result.data.fullAccess = '0';
        }

        // Home Page value
        const selectedHomePage = moduleUsersUIModifyAG.$homePageDropdown.dropdown('get value');
        const dropdownParams = moduleUsersUIModifyAG.getHomePagesForSelect();
        moduleUsersUIModifyAG.$homePageDropdown.dropdown('setup menu', dropdownParams);
        let homePage = '';
        $.each(dropdownParams.values, function(index, record) {
            if (record.value === selectedHomePage) {
                homePage = selectedHomePage;
                return true;
            }
        });
        if (homePage===''){
            result.data.homePage = dropdownParams.values[0].value;
            moduleUsersUIModifyAG.$homePageDropdown.dropdown('set selected', result.data.homePage);
        } else {
            result.data.homePage = selectedHomePage;
        }

        return result;
    },
    /**
     * Initializes the users table DataTable.
     */
    initializeCDRFilterTable() {

        moduleUsersUIModifyAG.$mainTabMenu.tab({
            onVisible(){
                if ($(this).data('tab')==='cdr-filter' && moduleUsersUIModifyAG.cdrFilterUsersDataTable!==null){
                    const newPageLength = moduleUsersUIModifyAG.calculatePageLength();
                    moduleUsersUIModifyAG.cdrFilterUsersDataTable.page.len(newPageLength).draw(false);
                }
            }
        });

        moduleUsersUIModifyAG.cdrFilterUsersDataTable = moduleUsersUIModifyAG.$cdrFilterUsersTable.DataTable({
            // destroy: true,
            lengthChange: false,
            paging: true,
            pageLength: moduleUsersUIModifyAG.calculatePageLength(),
            scrollCollapse: true,
            columns: [
                // CheckBox
                {
                    orderable: true,  // This column is not orderable
                    searchable: false,  // This column is not searchable
                    orderDataType: 'dom-checkbox'  // Use the custom sorting
                },
                // Username
                {
                    orderable: true,  // This column is orderable
                    searchable: true  // This column is searchable
                },
                // Extension
                {
                    orderable: true,  // This column is orderable
                    searchable: true  // This column is searchable
                },
                // Mobile
                {
                    orderable: true,  // This column is not orderable
                    searchable: true  // This column is not searchable
                },
                // Email
                {
                    orderable: true,  // This column is orderable
                    searchable: true  // This column is searchable
                },
            ],
            order: [0, 'desc'],
            language: SemanticLocalization.dataTableLocalisation,
        });
    },
    calculatePageLength() {
        // Calculate row height
        let rowHeight = moduleUsersUIModifyAG.$cdrFilterUsersTable.find('tr').first().outerHeight();
        // Calculate window height and available space for table
        const windowHeight = window.innerHeight;
        const headerFooterHeight = 580; // Estimate height for header, footer, and other elements

        // Calculate new page length
        return Math.max(Math.floor((windowHeight - headerFooterHeight) / rowHeight), 10);
    },
    /**
     * Callback function after sending the form.
     */
    cbAfterSendForm() {

    },

    /**
     * Initializes the form.
     */
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
    // Custom sorting for checkbox states
    $.fn.dataTable.ext.order['dom-checkbox'] = function  ( settings, col )
    {
        return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
            return $('input', td).prop('checked') ? '1' : '0';
        } );
    };

    moduleUsersUIModifyAG.initialize();
});
