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
 * ExtensionCredentialsTab module for managing extension credentials tab.
 * @module ExtensionCredentialsTab
 */
const ExtensionCredentialsTab = {
    /**
     * Hidden field for LDAP enabled status.
     * @type {jQuery}
     * @private
     */
    $ldapEnabledHiddenField: $('#module_users_ui_ldap_enabled'),

    /**
     * Checkbox for LDAP authentication.
     * @type {jQuery}
     * @private
     */
    $useLdapCheckbox: $('#module_users_ui_use_ldap_auth'),

    /**
     * Login input field.
     * @type {jQuery}
     * @private
     */
    $loginField: $('#module_users_ui_login'),

    /**
     * Password input field.
     * @type {jQuery}
     * @private
     */
    $passwordField: $('#module_users_ui_password'),

    /**
     * Access group dropdown.
     * @type {jQuery}
     * @private
     */
    $accessGroupDropdown: $('#module_users_ui_access_group'),

    /**
     * Fields, which we need to disable if selected access group is 'No access'.
     * @type {jQuery}
     * @private
     */
    $disableIfNoAccess: $('.disable-if-no-access'),

    /**
     * Initializes the ExtensionCredentialsTab module.
     */
    initialize: function () {
        ExtensionCredentialsTab.showHideAuthFields();
        ExtensionCredentialsTab.showHideUseLdapCheckbox();
        ExtensionCredentialsTab.showHidePasswordInput();
        ExtensionCredentialsTab.$useLdapCheckbox.parent('.checkbox').checkbox({
            onChange: ExtensionCredentialsTab.showHidePasswordInput,
        });
        ExtensionCredentialsTab.$accessGroupDropdown.parent('.dropdown').dropdown({
            onChange: ExtensionCredentialsTab.showHideAuthFields,
        });
    },

    /**
     * Shows or hides the authentication fields based on the selected access group.
     */
    showHideAuthFields(){
        if (ExtensionCredentialsTab.$accessGroupDropdown.val() === 'No access'){
            ExtensionCredentialsTab.$disableIfNoAccess.addClass('disabled');
        } else {
            ExtensionCredentialsTab.$disableIfNoAccess.removeClass('disabled');
        }
    },

    /**
     * Shows or hides the LDAP checkbox based on the LDAP enabled status.
     */
    showHideUseLdapCheckbox: function () {
        if (ExtensionCredentialsTab.$ldapEnabledHiddenField.val() === '1') {
            ExtensionCredentialsTab.$useLdapCheckbox.parent('.field').show();
        } else {
            ExtensionCredentialsTab.$useLdapCheckbox.parent('.field').hide();
            ExtensionCredentialsTab.$useLdapCheckbox.parent('.checkbox').checkbox('set unchecked');
        }
    },

    /**
     * Shows or hides the password input based on the LDAP checkbox status.
     */
    showHidePasswordInput: function (){
        if (ExtensionCredentialsTab.$useLdapCheckbox.parent('.checkbox').checkbox('is checked')) {
            ExtensionCredentialsTab.$passwordField.parent('.field').hide();
        } else {
            ExtensionCredentialsTab.$passwordField.parent('.field').show();
        }
        ExtensionCredentialsTab.activateLdapLoginSearch();
    },
    /**
     * Activate or disactivate ldap search feature
     */
    activateLdapLoginSearch(){
        if (ExtensionCredentialsTab.$useLdapCheckbox.parent('.checkbox').checkbox('is checked')){
            ExtensionCredentialsTab.$loginField.parent('.ui.search').search({
                apiSettings: {
                    url: `${globalRootUrl}module-users-u-i/ldap-config/search-ldap-user/{query}`
                },
            });
        } else {
            ExtensionCredentialsTab.$loginField.parent('.ui.search').search('hide results').search('destroy');
        }

    },
}
$(document).ready(() => {
    ExtensionCredentialsTab.initialize();
});
