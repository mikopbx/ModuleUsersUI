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


const moduleUsersUILdap = {

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
        moduleUsersUILdap.initializeForm();

        moduleUsersUILdap.$useLdapCheckbox.checkbox({
            onChange: moduleUsersUILdap.onChangeLdapCheckbox,
        });
        moduleUsersUILdap.onChangeLdapCheckbox();

        // Handle check button click
        moduleUsersUILdap.$checkAuthButton.api({
            url: `${globalRootUrl}module-users-u-i/ldap-config/check-auth`,
            method: 'POST',
            beforeSend(settings) {
                $(this).addClass('loading disabled');
                settings.data = moduleUsersUILdap.$formObj.form('get values');
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
                $(this).removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                moduleUsersUILdap.$ldapCheckSegment.after(`<div class="ui icon message ajax positive"><i class="icon check"></i> ${response.message}</div>`);
            },
            /**
             * Handles the failure response of the 'check-ldap-auth' API request.
             * @param {object} response - The response object.
             */
            onFailure: function(response) {
                $(this).removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                moduleUsersUILdap.$ldapCheckSegment.after(`<div class="ui icon message ajax negative"><i class="icon exclamation circle"></i>${response.message}</div>`);
            },
        });

    },

    /**
     * Handles the change of the LDAP checkbox.
     */
    onChangeLdapCheckbox(){
        if (moduleUsersUILdap.$useLdapCheckbox.checkbox('is checked')) {
            moduleUsersUILdap.$formFieldsForLdapSettings.removeClass('disabled');
            moduleUsersUILdap.$formElementsAvailableIfLdapIsOn.show();
        } else {
            moduleUsersUILdap.$formFieldsForLdapSettings.addClass('disabled');
            moduleUsersUILdap.$formElementsAvailableIfLdapIsOn.hide();
        }
    },

    /**
     * Callback function before sending the form.
     * @param {object} settings - The settings object.
     * @returns {object} - The modified settings object.
     */
    cbBeforeSendForm(settings) {
        const result = settings;
        result.data = moduleUsersUILdap.$formObj.form('get values');
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
        Form.$formObj = moduleUsersUILdap.$formObj;
        Form.url = `${globalRootUrl}module-users-u-i/ldap-config/save`;
        Form.validateRules = moduleUsersUILdap.validateRules;
        Form.cbBeforeSendForm = moduleUsersUILdap.cbBeforeSendForm;
        Form.cbAfterSendForm = moduleUsersUILdap.cbAfterSendForm;
        Form.initialize();
    },
};

$(document).ready(() => {
    moduleUsersUILdap.initialize();
});
