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

/* global globalRootUrl, globalTranslate, Form, PbxApi*/


const moduleUsersUiIndexLdap = {

    /**
     * Checkbox for LDAP authentication.
     * @type {jQuery}
     * @private
     */
    $useLdapCheckbox: $('#use-ldap-auth-method'),

    /**
     * Set of form fields to use for LDAP authentication.
     * @type {jQuery}
     * @private
     */
    $formFieldsForLdapSettings: $('.disable-if-no-ldap'),

    /**
     * Set of elements of the form adhered to ldap auth method.
     * @type {jQuery}
     * @private
     */
    $formElementsAvailableIfLdapIsOn: $('.show-only-if-ldap-enabled'),

    /**
     * jQuery object for the ldap check segment.
     * @type {jQuery}
     */
    $ldapCheckSegment: $('#ldap-check-auth'),

    /**
     * jQuery object for the form.
     * @type {jQuery}
     */
    $formObj: $('#module-users-ui-ldap-form'),

    /**
     * jQuery object for the check credentials button.
     * @type {jQuery}
     */
    $checkAuthButton: $('.check-ldap-credentials.button'),


    /**
     * jQuery object for the getting LDAP users list button.
     * @type {jQuery}
     */
    $checkGetUsersButton: $('.check-ldap-get-users'),

    /**
     * jQuery object for the ldap check segment.
     * @type {jQuery}
     */
    $ldapCheckGetUsersSegment: $('#ldap-check-get-users'),

    /**
     * jQuery object for the use TLS selector
     * @type {jQuery}
     */
    $useTlsDropdown: $('.use-tls-dropdown'),

    /**
     * jQuery object for the server type dropdown.
     * @type {jQuery}
     */
    $ldapTypeDropdown: $('.select-ldap-field'),

    /**
     * Validation rules for the form fields.
     * @type {Object}
     */
    validateRules: {
        serverName: {
            identifier: 'serverName',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateServerNameIsEmpty,
                },
            ],
        },
        serverPort: {
            identifier: 'serverPort',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateServerPortIsEmpty,
                },
            ],
        },
        administrativeLogin: {
            identifier: 'administrativeLogin',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateAdministrativeLoginIsEmpty,
                },
            ],
        },
        administrativePasswordHidden: {
            identifier: 'administrativePasswordHidden',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateAdministrativePasswordIsEmpty,
                },
            ],
        },
        baseDN: {
            identifier: 'baseDN',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateBaseDNIsEmpty,
                },
            ],
        },
        userIdAttribute: {
            identifier: 'userIdAttribute',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_usersui_ValidateUserIdAttributeIsEmpty,
                },
            ],
        },
    },

    /**
     * Initializes the module.
     */
    initialize() {
        moduleUsersUiIndexLdap.initializeForm();

        // Handle get users list button click
        moduleUsersUiIndexLdap.$checkGetUsersButton.on('click', function(e) {
            e.preventDefault();
            moduleUsersUiIndexLdap.apiCallGetLdapUsers();
        });

        // Handle check button click
        moduleUsersUiIndexLdap.$checkAuthButton.on('click', function(e) {
            e.preventDefault();
            moduleUsersUiIndexLdap.apiCallCheckAuth();
        });

        // General ldap switcher
        moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox({
            onChange: moduleUsersUiIndexLdap.onChangeLdapCheckbox,
        });
        moduleUsersUiIndexLdap.onChangeLdapCheckbox();

        moduleUsersUiIndexLdap.$ldapTypeDropdown.dropdown();
        // Handle change TLS protocol
        moduleUsersUiIndexLdap.$useTlsDropdown.dropdown({
            values: [
                {
                    name: 'ldap://',
                    value: '0',
                    selected : moduleUsersUiIndexLdap.$formObj.form('get value','useTLS')==='0'
                },
                {
                    name     : 'ldaps://',
                    value    : '1',
                    selected : moduleUsersUiIndexLdap.$formObj.form('get value','useTLS')==='1'
                }
            ],
        });

    },

    /**
     * Handles get LDAP users list button click.
     */
    apiCallGetLdapUsers(){
        $.api({
            url: `${globalRootUrl}module-users-u-i/ldap-config/get-available-ldap-users`,
            on: 'now',
            method: 'POST',
            beforeSend(settings) {
                moduleUsersUiIndexLdap.$checkGetUsersButton.addClass('loading disabled');
                settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
                return settings;
            },
            successTest(response){
                return response.success;
            },
            /**
             * Handles the successful response of the 'get-available-ldap-users' API request.
             * @param {object} response - The response object.
             */
            onSuccess: function(response) {
                moduleUsersUiIndexLdap.$checkGetUsersButton.removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                let html = '<ul class="ui list">';
                $.each(response.data, (index, user) => {
                    html += `<li class="item">${user.name} (${user.login})</li>`;
                });
                html += '</ul>';
                moduleUsersUiIndexLdap.$ldapCheckGetUsersSegment.after(`<div class="ui icon message ajax positive">${html}</div>`);
            },
            /**
             * Handles the failure response of the 'get-available-ldap-users' API request.
             * @param {object} response - The response object.
             */
            onFailure: function(response) {
                moduleUsersUiIndexLdap.$checkGetUsersButton.removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                moduleUsersUiIndexLdap.$ldapCheckGetUsersSegment.after(`<div class="ui icon message ajax negative"><i class="icon exclamation circle"></i>${response.message}</div>`);
            },
        })
    },

    /**
     * Handles check LDAP authentication button click.
     */
    apiCallCheckAuth(){
        $.api({
            url: `${globalRootUrl}module-users-u-i/ldap-config/check-auth`,
            on: 'now',
            method: 'POST',
            beforeSend(settings) {
                moduleUsersUiIndexLdap.$checkAuthButton.addClass('loading disabled');
                settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
                return settings;
            },
            successTest(response){
                return response.success;
            },
            /**
             * Handles the successful response of the 'check-ldap-auth' API request.
             * @param {object} response - The response object.
             */
            onSuccess: function(response) {
                moduleUsersUiIndexLdap.$checkAuthButton.removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                moduleUsersUiIndexLdap.$ldapCheckSegment.after(`<div class="ui icon message ajax positive"><i class="icon check"></i> ${response.message}</div>`);
            },
            /**
             * Handles the failure response of the 'check-ldap-auth' API request.
             * @param {object} response - The response object.
             */
            onFailure: function(response) {
                moduleUsersUiIndexLdap.$checkAuthButton.removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                moduleUsersUiIndexLdap.$ldapCheckSegment.after(`<div class="ui icon message ajax negative"><i class="icon exclamation circle"></i>${response.message}</div>`);
            },
        })
    },

    /**
     * Handles the change of the LDAP checkbox.
     */
    onChangeLdapCheckbox(){
        if (moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked')) {
            moduleUsersUiIndexLdap.$formFieldsForLdapSettings.removeClass('disabled');
            moduleUsersUiIndexLdap.$formElementsAvailableIfLdapIsOn.show();
        } else {
            moduleUsersUiIndexLdap.$formFieldsForLdapSettings.addClass('disabled');
            moduleUsersUiIndexLdap.$formElementsAvailableIfLdapIsOn.hide();
        }
    },

    /**
     * Callback function before sending the form.
     * @param {object} settings - The settings object.
     * @returns {object} - The modified settings object.
     */
    cbBeforeSendForm(settings) {
        const result = settings;
        result.data = moduleUsersUiIndexLdap.$formObj.form('get values');
        if (moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked')){
            result.data.useLdapAuthMethod = '1';
        } else {
            result.data.useLdapAuthMethod = '0';
        }

        return result;
    },

    /**
     * Callback function after sending the form.
     */
    cbAfterSendForm() {
        // Callback implementation
    },

    /**
     * Initializes the form.
     */
    initializeForm() {
        Form.$formObj = moduleUsersUiIndexLdap.$formObj;
        Form.url = `${globalRootUrl}module-users-u-i/ldap-config/save`;
        Form.validateRules = moduleUsersUiIndexLdap.validateRules;
        Form.cbBeforeSendForm = moduleUsersUiIndexLdap.cbBeforeSendForm;
        Form.cbAfterSendForm = moduleUsersUiIndexLdap.cbAfterSendForm;
        Form.initialize();
    },
};

$(document).ready(() => {
    moduleUsersUiIndexLdap.initialize();
});
