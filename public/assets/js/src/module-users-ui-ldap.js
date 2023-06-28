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

/* global globalRootUrl, globalTranslate, Form */


const moduleUsersUILdap = {
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
        administrativePassword: {
            identifier: 'administrativePassword',
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

    initialize() {
        moduleUsersUILdap.initializeForm();

        // Handle check button click
        moduleUsersUILdap.$checkAuthButton.api({
            url: `${globalRootUrl}module-users-u-i/ldap-config/check-auth`,
            method: 'POST',
            beforeSend(settings) {
                $(this).addClass('loading disabled');
                settings.data = moduleUsersUILdap.$formObj.form('get values');
                return settings;
            },

            /**
             * Handles the successful response of the 'check-ldap-auth' API request.
             * @param {object} response - The response object.
             */
            onSuccess(response) {
                $(this).removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                $.each(response.message, (index, value) => {
                    moduleUsersUILdap.$formObj.after(`<div class="ui ${index} message ajax">${value}</div>`);
                });
            },

            /**
             * Handles the failure response of the 'check-ldap-auth' API request.
             * @param {object} response - The response object.
             */
            onFailure(response) {
                $(this).removeClass('loading disabled');
                $('form').after(response);
            },
        });

    },

    cbBeforeSendForm(settings) {
        const result = settings;
        result.data = moduleUsersUILdap.$formObj.form('get values');
        return result;
    },
    cbAfterSendForm() {

    },
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
