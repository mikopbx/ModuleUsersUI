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

/** global: globalRootUrl */

/**
 * ExtensionCredentialsTab module for managing extension credentials tab.
 *
 * Note: visibility of the LDAP checkbox itself is decided server-side
 * (volt template), so this module only handles in-form interactions.
 *
 * @module ExtensionCredentialsTab
 */
const ExtensionCredentialsTab = {
    $useLdapCheckbox: null,
    $loginField: null,
    $passwordField: null,
    $accessGroupDropdown: null,
    $disableIfNoAccess: null,

    /**
     * Initializes the ExtensionCredentialsTab module.
     */
    initialize: function () {
        ExtensionCredentialsTab.$useLdapCheckbox = $('#module_users_ui_use_ldap_auth');
        ExtensionCredentialsTab.$loginField = $('#module_users_ui_login');
        ExtensionCredentialsTab.$passwordField = $('#module_users_ui_password');
        ExtensionCredentialsTab.$accessGroupDropdown = $('#module_users_ui_access_group');
        ExtensionCredentialsTab.$disableIfNoAccess = $('.disable-if-no-access');

        // The LDAP checkbox is only rendered when an LDAP server is configured.
        if (ExtensionCredentialsTab.$useLdapCheckbox.length > 0) {
            // Apply initial checked state from a server-rendered hidden field.
            // Phalcon Check element rendering of `checked` differs across MikoPBX
            // versions; using a hidden mirror keeps Form.js dirty state correct.
            const initialLdapAuth = $('#module_users_ui_use_ldap_auth_initial').val();
            const $checkboxWrap = ExtensionCredentialsTab.$useLdapCheckbox.parent('.checkbox');
            if (initialLdapAuth === '1') {
                $checkboxWrap.checkbox('set checked');
            } else {
                $checkboxWrap.checkbox('set unchecked');
            }
            $checkboxWrap.checkbox({
                onChange: ExtensionCredentialsTab.showHidePasswordInput,
            });
        }

        ExtensionCredentialsTab.showHideAuthFields();
        ExtensionCredentialsTab.showHidePasswordInput();
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
     * Returns true if the LDAP checkbox is rendered and currently checked.
     */
    isLdapChecked() {
        const $cb = ExtensionCredentialsTab.$useLdapCheckbox;
        return $cb && $cb.length > 0 && $cb.parent('.checkbox').checkbox('is checked');
    },

    /**
     * Shows or hides the password input based on the LDAP checkbox status.
     */
    showHidePasswordInput: function (){
        if (ExtensionCredentialsTab.isLdapChecked()) {
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
        if (ExtensionCredentialsTab.isLdapChecked()){
            const $inputField = ExtensionCredentialsTab.$loginField;
            const $search = $inputField.parent('.ui.search');
            $search.search({
                apiSettings: {
                    url: `${globalRootUrl}module-users-u-i/ldap-config/search-ldap-user/{query}`
                },
            });
            $search.data('moduleSearch', true);
            // Handle Enter key press event
            $inputField.on('keydown', function(event) {
                if (event.key === 'Enter') {
                    // Prevent default action (if form, prevent submission)
                    event.preventDefault();
                    const $searchResults = $inputField.closest('div').find('.results .result');
                    // If there is one result, insert it into the field
                    if ($searchResults.length === 1) {
                        const result = $searchResults.first().data('result');
                        $inputField.val(result.title);
                    }
                }
            });
        } else {
            const $search = ExtensionCredentialsTab.$loginField.parent('.ui.search');
            if ($search.length > 0 && $search.data('moduleSearch') === true) {
                $search.search('hide results').search('destroy');
                $search.removeData('moduleSearch');
            }
        }

    },
}
$(document).ready(() => {
    ExtensionCredentialsTab.initialize();
});
