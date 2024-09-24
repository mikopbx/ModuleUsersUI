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

/* global SemanticLocalization, globalRootUrl, moduleUsersUiIndexLdap, UserMessage, Datatable */

const ModuleUsersUIUsersTab = {

    /**
     * Users table.
     * @type {jQuery}
     */
    $usersTable: $('#users-table'),

    /**
     * User data table.
     * @type {Datatable}
     */
    userDataTable: null,

    /**
     * Select group dropdowns.
     * @type {jQuery}
     */
    $selectGroup: $('.select-group'),

    /**
     * User use LDAP table checkboxes.
     * @type {jQuery}
     */
    $userUseLdapTableCheckbox: $('.user-use-ldap-checkbox'),

    /**
     * Body.
     * @type {jQuery}
     */
    $body: $('body'),

    /**
     * Initializes the ModuleUsersUIIndex module.
     */
    initialize() {

        ModuleUsersUIUsersTab.initializeDataTable();

        ModuleUsersUIUsersTab.$selectGroup.each((index, obj) => {
            $(obj).dropdown({
                values: ModuleUsersUIUsersTab.makeDropdownList($(obj).attr('data-value')),
            });
        });
        ModuleUsersUIUsersTab.$selectGroup.dropdown({
            onChange: ModuleUsersUIUsersTab.changeGroupInList,
        });

        ModuleUsersUIUsersTab.$userUseLdapTableCheckbox.checkbox({
            onChange: ModuleUsersUIUsersTab.changeLdapInList,
        });

        // Double click on password or login input field in the table
        ModuleUsersUIUsersTab.$body.on('focusin', '.user-login-input, .user-password-input', (e) => {
            $(e.target).transition('glow');

            $(e.target).closest('div')
                .removeClass('transparent')
                .addClass('changed-field');
            $(e.target).attr('readonly', false);

            if (moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked')
                && $(e.target).closest('tr').find('.user-use-ldap-checkbox').checkbox('is checked')){
                $(e.target).closest('div').search({
                    // change search endpoint to a custom endpoint by manipulating apiSettings
                    apiSettings: {
                        url: `${globalRootUrl}module-users-u-i/ldap-config/search-ldap-user/{query}`
                    },
                });
            }
        });

        // Submit form on Enter or Tab
        $(document).on('keydown', (e) => {
            const keyCode = e.keyCode || e.which;
            if (keyCode === 13
                || (keyCode === 9 && !$(':focus').hasClass('.user-login-input'))
                || (keyCode === 9 && !$(':focus').hasClass('.user-password-input'))
            ) {
                const $el = $('.changed-field').closest('tr');
                $el.each((index, obj) => {
                    const currentRowId = $(obj).attr('id');
                    if (currentRowId !== undefined) {
                        ModuleUsersUIUsersTab.changeLoginPasswordInList(currentRowId);
                    }
                });
            }
        });

        // Submit form on focus out from password or login input field
        ModuleUsersUIUsersTab.$body.on('focusout', '.user-login-input, .user-password-input', (e) => {
            const $el = $('.changed-field').closest('tr');
            $el.each((index, obj) => {
                const currentRowId = $(obj).attr('id');
                if (currentRowId !== undefined) {
                    ModuleUsersUIUsersTab.changeLoginPasswordInList(currentRowId);
                }
            });
        });

    },

    /**
     * Initializes the users table DataTable.
     */
    initializeDataTable() {

        $('#main-users-ui-tab-menu .item').tab({
            onVisible(){
                if ($(this).data('tab')==='users' && ModuleUsersUIUsersTab.userDataTable!==null){
                    const newPageLength = ModuleUsersUIUsersTab.calculatePageLength();
                    ModuleUsersUIUsersTab.userDataTable.page.len(newPageLength).draw(false);
                }
            }
        });

        ModuleUsersUIUsersTab.userDataTable = ModuleUsersUIUsersTab.$usersTable.DataTable({
            // destroy: true,
            lengthChange: false,
            paging: true,
            pageLength: ModuleUsersUIUsersTab.calculatePageLength(),
            scrollCollapse: true,
            columns: [
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
                // Use LDAP
                {
                    orderable: false,  // This column is not orderable
                    searchable: false  // This column is not searchable
                },
                // Login
                {
                    orderable: true,  // This column is orderable
                    searchable: true  // This column is searchable
                },
                // Password
                {
                    orderable: false,  // This column is not orderable
                    searchable: false  // This column is not searchable
                },
                // Access group
                {
                    orderable: true,  // This column is orderable
                    searchable: true  // This column is searchable
                },
            ],
            order: [0, 'asc'],
            language: SemanticLocalization.dataTableLocalisation,
        });
    },

    /**
     * Creates a dropdown list for users.
     * @param {string} selected - The selected value.
     * @returns {Array} - The dropdown list.
     */
    makeDropdownList(selected) {
        const values = [];
        $('#users-groups-list option').each((index, obj) => {
            if (selected === obj.text || selected === obj.value) {
                values.push({
                    name: obj.text,
                    value: obj.value,
                    selected: true,
                });
            } else {
                values.push({
                    name: obj.text,
                    value: obj.value,
                });
            }
        });
        return values;
    },

    /**
     * Handles the change of group in the list.
     * @param {string} value - The selected value.
     * @param {string} text - The selected text.
     * @param {jQuery} $choice - The dropdown element.
     */
    changeGroupInList(value, text, $choice) {
        const rowId = $($choice).closest('tr').attr('id');
        ModuleUsersUIUsersTab.addProgressIcon(rowId);
        $.api({
            url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-group`,
            on: 'now',
            method: 'POST',
            data: {
                user_id: rowId,
                group_id: value,
            },
            successTest(response) {
                // test whether a JSON response is valid
                return response !== undefined
                    && Object.keys(response).length > 0
                    && response.success === true;
            },
            onSuccess() {
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
                $('.ui.message.ajax').remove();
            },
            onError(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
            onFailure(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
        });
    },

    /**
     * Handles the change of LDAP checkbox in the list.
     */
    changeLdapInList() {
        const rowId = $(this).closest('tr').attr('id');
        ModuleUsersUIUsersTab.addProgressIcon(rowId);
        $.api({
            url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-use-ldap`,
            on: 'now',
            method: 'POST',
            data: {
                user_id: rowId,
                useLdap: $(this).parent('.checkbox').checkbox('is checked'),
            },
            successTest(response) {
                // test whether a JSON response is valid
                return response !== undefined
                    && Object.keys(response).length > 0
                    && response.success === true;
            },
            onSuccess() {
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
                if ($(`tr#${rowId} .user-use-ldap-checkbox`).checkbox('is checked')){
                    $(`tr#${rowId} td.password`).hide();
                    $(`tr#${rowId} td.login`).attr('colspan',2);
                } else {
                    $(`tr#${rowId} td.password`).show();
                    $(`tr#${rowId} td.login`).attr('colspan',1);
                }
                $('.ui.message.ajax').remove();
            },
            onError(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
            onFailure(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
        });
    },

    /**
     * Changes the login and password in the list.
     * @param {string} rowId - The ID of the row.
     */
    changeLoginPasswordInList(rowId) {
        const login = $(`#${rowId} input.user-login-input`).val();
        const password = $(`#${rowId} input.user-password-input`).val();

        ModuleUsersUIUsersTab.addProgressIcon(rowId);

        $.api({
            url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-credentials`,
            on: 'now',
            method: 'POST',
            data: {
                user_id: rowId,
                login: login,
                password: password,
            },
            successTest(response) {
                // test whether a JSON response is valid
                return response !== undefined
                    && Object.keys(response).length > 0
                    && response.success === true;
            },
            onSuccess() {
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
                $(`tr#${rowId} .changed-field input`).attr('readonly', true);
                $(`tr#${rowId} div.changed-field`).removeClass('changed-field loading').addClass('transparent');
                $('.ui.message.ajax').remove();
            },
            onError(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
            onFailure(response) {
                if (response.message !== undefined) {
                    UserMessage.showMultiString(response.message);
                }
                ModuleUsersUIUsersTab.removeProgressIcon(rowId);
            },
        });
    },
    /**
     * Adds save icon from the row
     */
    addProgressIcon(rowId){
        $(`tr#${rowId} .changed-field`).find('.ui.spinner.loading.icon').show();
    },
    /**
     * Removes save icon from the row
     */
    removeProgressIcon(rowId) {
        $(`tr#${rowId} .changed-field`).find('.ui.spinner.loading.icon').hide();
        $(`tr#${rowId} .changed-field`).closest('div').search('hide results').search('destroy');
    },

    /**
     * Calculate data table page length
     *
     * @returns {number}
     */
    calculatePageLength() {
        // Calculate row height
        let rowHeight = ModuleUsersUIUsersTab.$usersTable.find('tr').first().outerHeight();
        // Calculate window height and available space for table
        const windowHeight = window.innerHeight;
        const headerFooterHeight = 400; // Estimate height for header, footer, and other elements

        // Calculate new page length
        return Math.max(Math.floor((windowHeight - headerFooterHeight) / rowHeight), 10);
    },
};

$(document).ready(() => {
    ModuleUsersUIUsersTab.initialize();
});

