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
     * jQuery object for the TLS transport-mode selector (ldap / starttls / ldaps).
     * @type {jQuery}
     */
    $useTlsDropdown: $('.use-tls-dropdown'),

    /**
     * jQuery object for the server type dropdown.
     * @type {jQuery}
     */
    $ldapTypeDropdown: $('.select-ldap-field'),

    /**
     * jQuery object for the certificate-validation toggle.
     * @type {jQuery}
     */
    $verifyCertCheckbox: $('input[name="verifyCert"]'),

    /**
     * jQuery object for the custom CA PEM textarea.
     * @type {jQuery}
     */
    $caCertTextarea: $('textarea[name="caCertificate"]'),

    /**
     * jQuery object for the TLS-specific block (verify-cert toggle + insecure banner).
     * @type {jQuery}
     */
    $tlsSettingsBlock: $('.tls-settings'),

    /**
     * jQuery object for the CA certificate segment shown when encryption is on.
     * @type {jQuery}
     */
    $caCertificateField: $('.ca-certificate-field'),

    /**
     * jQuery object for the "insecure TLS" warning (ldaps without verification).
     * @type {jQuery}
     */
    $insecureTlsWarning: $('.insecure-tls-warning'),

    /**
     * jQuery object for the "CA not provided" warning icon next to the CA header.
     * @type {jQuery}
     */
    $caMissingWarning: $('.ca-missing-warning'),

    /**
     * jQuery object for the test-bind icon button.
     * @type {jQuery}
     */
    $testBindButton: $('.test-ldap-bind'),

    /**
     * jQuery object for the inline test-bind result banner.
     * @type {jQuery}
     */
    $testBindResult: $('.test-bind-result'),

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
        moduleUsersUiIndexLdap.$checkGetUsersButton.on('click', function (e) {
            e.preventDefault();
            moduleUsersUiIndexLdap.apiCallGetLdapUsers();
        });

        // Handle check button click
        moduleUsersUiIndexLdap.$checkAuthButton.on('click', function (e) {
            e.preventDefault();
            moduleUsersUiIndexLdap.apiCallCheckAuth();
        });

        // General ldap switcher
        moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox({
            onChange: moduleUsersUiIndexLdap.onChangeLdapCheckbox,
        });
        moduleUsersUiIndexLdap.onChangeLdapCheckbox();

        moduleUsersUiIndexLdap.$ldapTypeDropdown.dropdown({
            onChange: moduleUsersUiIndexLdap.onChangeLdapType,
        });

        // Handle change TLS protocol — three-way selector (none / starttls / ldaps).
        const currentTlsMode = moduleUsersUiIndexLdap.$formObj.form('get value', 'tlsMode') || 'none';
        moduleUsersUiIndexLdap.$useTlsDropdown.dropdown({
            values: [
                {
                    name: 'ldap://',
                    value: 'none',
                    selected: currentTlsMode === 'none'
                },
                {
                    name: 'ldap:// + STARTTLS',
                    value: 'starttls',
                    selected: currentTlsMode === 'starttls'
                },
                {
                    name: 'ldaps://',
                    value: 'ldaps',
                    selected: currentTlsMode === 'ldaps'
                }
            ],
            onChange(value) {
                moduleUsersUiIndexLdap.$formObj.form('set value', 'tlsMode', value);
                moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
            },
        });

        // Certificate validation toggle — refresh UX state on flip.
        moduleUsersUiIndexLdap.$verifyCertCheckbox.on('change', () => {
            moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
        });
        // Typing into the CA textarea clears the "missing CA" warning.
        moduleUsersUiIndexLdap.$caCertTextarea.on('input', () => {
            moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
        });
        moduleUsersUiIndexLdap.refreshTlsSectionVisibility();

        // Handle test-bind icon button click
        moduleUsersUiIndexLdap.$testBindButton.on('click', (e) => {
            e.preventDefault();
            moduleUsersUiIndexLdap.apiCallTestBind();
        });
    },

    /**
     * Recomputes visibility of TLS-related UI based on tlsMode / verifyCert / caCertificate.
     *  - verify-cert toggle and insecure banner live inside .tls-settings and
     *    show only for encrypted modes (starttls|ldaps).
     *  - CA certificate segment appears only for encrypted modes.
     *  - Warning triangle on the CA header lights up when verification is on
     *    but the CA textarea is empty.
     *  - Insecure-TLS banner lights up only for ldaps:// without verification:
     *    traffic is encrypted but server identity is unverified.
     */
    refreshTlsSectionVisibility() {
        const tlsMode = moduleUsersUiIndexLdap.$formObj.form('get value', 'tlsMode') || 'none';
        const verify = moduleUsersUiIndexLdap.$verifyCertCheckbox.is(':checked');
        const encrypted = tlsMode === 'starttls' || tlsMode === 'ldaps';
        const caEmpty = (moduleUsersUiIndexLdap.$caCertTextarea.val() || '').trim() === '';

        if (encrypted) {
            moduleUsersUiIndexLdap.$tlsSettingsBlock.show();
            moduleUsersUiIndexLdap.$caCertificateField.show();
        } else {
            moduleUsersUiIndexLdap.$tlsSettingsBlock.hide();
            moduleUsersUiIndexLdap.$caCertificateField.hide();
        }

        if (encrypted && verify && caEmpty) {
            moduleUsersUiIndexLdap.$caMissingWarning.show();
        } else {
            moduleUsersUiIndexLdap.$caMissingWarning.hide();
        }

        if (tlsMode === 'ldaps' && !verify) {
            moduleUsersUiIndexLdap.$insecureTlsWarning.show();
        } else {
            moduleUsersUiIndexLdap.$insecureTlsWarning.hide();
        }
    },

    /**
     * Fires a lightweight bind check against the current form values.
     * Shows a green success message or a red error message inline under
     * the admin-credentials row.
     */
    apiCallTestBind() {
        $.api({
            url: `${globalRootUrl}module-users-u-i/ldap-config/test-bind`,
            on: 'now',
            method: 'POST',
            beforeSend(settings) {
                moduleUsersUiIndexLdap.$testBindButton.addClass('loading disabled');
                moduleUsersUiIndexLdap.$testBindResult
                    .removeClass('positive negative')
                    .hide();
                settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
                return settings;
            },
            successTest(response) {
                return response.success;
            },
            onSuccess(response) {
                moduleUsersUiIndexLdap.$testBindButton.removeClass('loading disabled');
                let text = globalTranslate.module_usersui_TestBindSuccess;
                if (response && response.message) {
                    const detail = Array.isArray(response.message) ? response.message.join(' ') : response.message;
                    if (detail) {
                        text = detail;
                    }
                }
                moduleUsersUiIndexLdap.$testBindResult
                    .removeClass('negative')
                    .addClass('positive')
                    .text(text)
                    .show();
            },
            onFailure(response) {
                moduleUsersUiIndexLdap.$testBindButton.removeClass('loading disabled');
                let text = globalTranslate.module_usersui_TestBindFailure;
                if (response && response.message) {
                    const detail = Array.isArray(response.message) ? response.message.join(' ') : response.message;
                    if (detail) {
                        text = `${text}: ${detail}`;
                    }
                }
                moduleUsersUiIndexLdap.$testBindResult
                    .removeClass('positive')
                    .addClass('negative')
                    .text(text)
                    .show();
            },
        });
    },
    /**
     * Handles change LDAP dropdown.
     */
    onChangeLdapType(value){
        if(value==='OpenLDAP'){
            moduleUsersUiIndexLdap.$formObj.form('set value','userIdAttribute','uid');
            moduleUsersUiIndexLdap.$formObj.form('set value','administrativeLogin','cn=admin,dc=example,dc=com');
            moduleUsersUiIndexLdap.$formObj.form('set value','userFilter','(objectClass=inetOrgPerson)');
            moduleUsersUiIndexLdap.$formObj.form('set value','baseDN','dc=example,dc=com');
            moduleUsersUiIndexLdap.$formObj.form('set value','organizationalUnit','ou=users, dc=domain, dc=com');
        } else if(value==='ActiveDirectory'){
            moduleUsersUiIndexLdap.$formObj.form('set value','administrativeLogin','admin');
            moduleUsersUiIndexLdap.$formObj.form('set value','userIdAttribute','samaccountname')
            moduleUsersUiIndexLdap.$formObj.form('set value','userFilter','(&(objectClass=user)(objectCategory=PERSON))');
            moduleUsersUiIndexLdap.$formObj.form('set value','baseDN','dc=example,dc=com');
            moduleUsersUiIndexLdap.$formObj.form('set value','organizationalUnit','ou=users, dc=domain, dc=com');
        }
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
            onSuccess: function (response) {
                moduleUsersUiIndexLdap.$checkGetUsersButton.removeClass('loading disabled');
                $('.ui.message.ajax').remove();
                let html = '<ul class="ui list">';
                if (response.data.length === 0) {
                    html += `<li class="item">${globaltranslate.module_usersui_EmptyServerResponse}</li>`;
                } else {
                    $.each(response.data, (index, user) => {
                        html += `<li class="item">${user.name} (${user.login})</li>`;
                    });
                }
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
