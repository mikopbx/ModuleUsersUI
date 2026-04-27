"use strict";

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
var moduleUsersUiIndexLdap = {
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
   * jQuery object for the LDAP sub-tabs menu (Connection / Certificate).
   * @type {jQuery}
   */
  $subTabsMenu: $('#module-users-ui-ldap-sub-tabs'),

  /**
   * jQuery object for the Certificate sub-tab item in the menu.
   * @type {jQuery}
   */
  $certificateTab: $('.ldap-cert-tab'),

  /**
   * Validation rules for the form fields.
   * @type {Object}
   */
  validateRules: {
    serverName: {
      identifier: 'serverName',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateServerNameIsEmpty
      }]
    },
    serverPort: {
      identifier: 'serverPort',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateServerPortIsEmpty
      }]
    },
    administrativeLogin: {
      identifier: 'administrativeLogin',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateAdministrativeLoginIsEmpty
      }]
    },
    administrativePasswordHidden: {
      identifier: 'administrativePasswordHidden',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateAdministrativePasswordIsEmpty
      }]
    },
    baseDN: {
      identifier: 'baseDN',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateBaseDNIsEmpty
      }]
    },
    userIdAttribute: {
      identifier: 'userIdAttribute',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateUserIdAttributeIsEmpty
      }]
    }
  },

  /**
   * Initializes the module.
   */
  initialize: function initialize() {
    moduleUsersUiIndexLdap.initializeForm(); // Handle get users list button click

    moduleUsersUiIndexLdap.$checkGetUsersButton.on('click', function (e) {
      e.preventDefault();
      moduleUsersUiIndexLdap.apiCallGetLdapUsers();
    }); // Handle check button click

    moduleUsersUiIndexLdap.$checkAuthButton.on('click', function (e) {
      e.preventDefault();
      moduleUsersUiIndexLdap.apiCallCheckAuth();
    }); // General ldap switcher

    moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox({
      onChange: moduleUsersUiIndexLdap.onChangeLdapCheckbox
    });
    moduleUsersUiIndexLdap.onChangeLdapCheckbox();
    moduleUsersUiIndexLdap.$ldapTypeDropdown.dropdown({
      onChange: moduleUsersUiIndexLdap.onChangeLdapType
    }); // Handle change TLS protocol — three-way selector (none / starttls / ldaps).

    var currentTlsMode = moduleUsersUiIndexLdap.$formObj.form('get value', 'tlsMode') || 'none';
    moduleUsersUiIndexLdap.$useTlsDropdown.dropdown({
      values: [{
        name: 'ldap://',
        value: 'none',
        selected: currentTlsMode === 'none'
      }, {
        name: 'ldap:// + STARTTLS',
        value: 'starttls',
        selected: currentTlsMode === 'starttls'
      }, {
        name: 'ldaps://',
        value: 'ldaps',
        selected: currentTlsMode === 'ldaps'
      }],
      onChange: function onChange(value) {
        moduleUsersUiIndexLdap.$formObj.form('set value', 'tlsMode', value);
        moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
      }
    }); // Certificate validation toggle — refresh UX state on flip.

    moduleUsersUiIndexLdap.$verifyCertCheckbox.on('change', function () {
      moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
    }); // Typing into the CA textarea clears the "missing CA" warning.

    moduleUsersUiIndexLdap.$caCertTextarea.on('input', function () {
      moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
    });
    moduleUsersUiIndexLdap.refreshTlsSectionVisibility(); // Handle test-bind icon button click

    moduleUsersUiIndexLdap.$testBindButton.on('click', function (e) {
      e.preventDefault();
      moduleUsersUiIndexLdap.apiCallTestBind();
    }); // Initialize Fomantic sub-tabs (Connection / Certificate). Scoped to
    // the LDAP form's menu so it doesn't collide with the page-level tabs.

    moduleUsersUiIndexLdap.$subTabsMenu.find('.item').tab({
      context: moduleUsersUiIndexLdap.$formObj
    });
  },

  /**
   * Recomputes visibility of TLS-related UI based on tlsMode / verifyCert / caCertificate.
   *  - The TLS settings block (verify-cert toggle + insecure banner) lives
   *    on the Connection sub-tab and shows only for encrypted modes.
   *  - The Certificate sub-tab item is visible only when LDAP authorization
   *    is enabled AND the verifyCert toggle is on. This is the gate the
   *    operator asked for: the tab appears precisely when a CA actually
   *    matters. If the user was on the Certificate tab and toggles either
   *    off, snap back to the Connection tab so they aren't stranded on a
   *    hidden segment.
   *  - Warning triangle on the Certificate tab header lights up when
   *    verification is on but the CA textarea is empty.
   *  - Insecure-TLS banner lights up only for ldaps:// without verification:
   *    traffic is encrypted but server identity is unverified.
   */
  refreshTlsSectionVisibility: function refreshTlsSectionVisibility() {
    var tlsMode = moduleUsersUiIndexLdap.$formObj.form('get value', 'tlsMode') || 'none';
    var verify = moduleUsersUiIndexLdap.$verifyCertCheckbox.is(':checked');
    var encrypted = tlsMode === 'starttls' || tlsMode === 'ldaps';
    var caEmpty = (moduleUsersUiIndexLdap.$caCertTextarea.val() || '').trim() === '';
    var ldapEnabled = moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked');

    if (encrypted) {
      moduleUsersUiIndexLdap.$tlsSettingsBlock.show();
    } else {
      moduleUsersUiIndexLdap.$tlsSettingsBlock.hide();
    } // Certificate sub-tab: gate strictly on LDAP-on + verify-on, regardless
    // of tlsMode. If the operator turned validation on but stayed on plain
    // LDAP, we still let them paste a CA — switching to STARTTLS/LDAPS later
    // shouldn't lose the work.


    var showCertTab = ldapEnabled && verify;

    if (showCertTab) {
      moduleUsersUiIndexLdap.$certificateTab.show();
    } else {
      moduleUsersUiIndexLdap.$certificateTab.hide(); // Snap back to Connection if Certificate was the active tab.

      if (moduleUsersUiIndexLdap.$certificateTab.hasClass('active')) {
        moduleUsersUiIndexLdap.$subTabsMenu.find('.item[data-tab="ldap-connection"]').tab('change tab', 'ldap-connection');
      }
    }

    if (showCertTab && caEmpty) {
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
  apiCallTestBind: function apiCallTestBind() {
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/ldap-config/test-bind"),
      on: 'now',
      method: 'POST',
      beforeSend: function beforeSend(settings) {
        moduleUsersUiIndexLdap.$testBindButton.addClass('loading disabled');
        moduleUsersUiIndexLdap.$testBindResult.removeClass('positive negative').hide();
        settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
        return settings;
      },
      successTest: function successTest(response) {
        return response.success;
      },
      onSuccess: function onSuccess(response) {
        moduleUsersUiIndexLdap.$testBindButton.removeClass('loading disabled');
        var text = globalTranslate.module_usersui_TestBindSuccess;

        if (response && response.message) {
          var detail = Array.isArray(response.message) ? response.message.join(' ') : response.message;

          if (detail) {
            text = detail;
          }
        }

        moduleUsersUiIndexLdap.$testBindResult.removeClass('negative').addClass('positive').text(text).show();
      },
      onFailure: function onFailure(response) {
        moduleUsersUiIndexLdap.$testBindButton.removeClass('loading disabled');
        var text = globalTranslate.module_usersui_TestBindFailure;

        if (response && response.message) {
          var detail = Array.isArray(response.message) ? response.message.join(' ') : response.message;

          if (detail) {
            text = "".concat(text, ": ").concat(detail);
          }
        }

        moduleUsersUiIndexLdap.$testBindResult.removeClass('positive').addClass('negative').text(text).show();
      }
    });
  },

  /**
   * Handles change LDAP dropdown.
   */
  onChangeLdapType: function onChangeLdapType(value) {
    if (value === 'OpenLDAP') {
      moduleUsersUiIndexLdap.$formObj.form('set value', 'userIdAttribute', 'uid');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'administrativeLogin', 'cn=admin,dc=example,dc=com');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'userFilter', '(objectClass=inetOrgPerson)');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'baseDN', 'dc=example,dc=com');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'organizationalUnit', 'ou=users, dc=domain, dc=com');
    } else if (value === 'ActiveDirectory') {
      moduleUsersUiIndexLdap.$formObj.form('set value', 'administrativeLogin', 'admin');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'userIdAttribute', 'samaccountname');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'userFilter', '(&(objectClass=user)(objectCategory=PERSON))');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'baseDN', 'dc=example,dc=com');
      moduleUsersUiIndexLdap.$formObj.form('set value', 'organizationalUnit', 'ou=users, dc=domain, dc=com');
    }
  },

  /**
   * Handles get LDAP users list button click.
   */
  apiCallGetLdapUsers: function apiCallGetLdapUsers() {
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/ldap-config/get-available-ldap-users"),
      on: 'now',
      method: 'POST',
      beforeSend: function beforeSend(settings) {
        moduleUsersUiIndexLdap.$checkGetUsersButton.addClass('loading disabled');
        settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
        return settings;
      },
      successTest: function successTest(response) {
        return response.success;
      },

      /**
       * Handles the successful response of the 'get-available-ldap-users' API request.
       * @param {object} response - The response object.
       */
      onSuccess: function onSuccess(response) {
        moduleUsersUiIndexLdap.$checkGetUsersButton.removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        var html = '<ul class="ui list">';

        if (response.data.length === 0) {
          html += "<li class=\"item\">".concat(globaltranslate.module_usersui_EmptyServerResponse, "</li>");
        } else {
          $.each(response.data, function (index, user) {
            html += "<li class=\"item\">".concat(user.name, " (").concat(user.login, ")</li>");
          });
        }

        html += '</ul>';
        moduleUsersUiIndexLdap.$ldapCheckGetUsersSegment.after("<div class=\"ui icon message ajax positive\">".concat(html, "</div>"));
      },

      /**
       * Handles the failure response of the 'get-available-ldap-users' API request.
       * @param {object} response - The response object.
       */
      onFailure: function onFailure(response) {
        moduleUsersUiIndexLdap.$checkGetUsersButton.removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        moduleUsersUiIndexLdap.$ldapCheckGetUsersSegment.after("<div class=\"ui icon message ajax negative\"><i class=\"icon exclamation circle\"></i>".concat(response.message, "</div>"));
      }
    });
  },

  /**
   * Handles check LDAP authentication button click.
   */
  apiCallCheckAuth: function apiCallCheckAuth() {
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/ldap-config/check-auth"),
      on: 'now',
      method: 'POST',
      beforeSend: function beforeSend(settings) {
        moduleUsersUiIndexLdap.$checkAuthButton.addClass('loading disabled');
        settings.data = moduleUsersUiIndexLdap.$formObj.form('get values');
        return settings;
      },
      successTest: function successTest(response) {
        return response.success;
      },

      /**
       * Handles the successful response of the 'check-ldap-auth' API request.
       * @param {object} response - The response object.
       */
      onSuccess: function onSuccess(response) {
        moduleUsersUiIndexLdap.$checkAuthButton.removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        moduleUsersUiIndexLdap.$ldapCheckSegment.after("<div class=\"ui icon message ajax positive\"><i class=\"icon check\"></i> ".concat(response.message, "</div>"));
      },

      /**
       * Handles the failure response of the 'check-ldap-auth' API request.
       * @param {object} response - The response object.
       */
      onFailure: function onFailure(response) {
        moduleUsersUiIndexLdap.$checkAuthButton.removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        moduleUsersUiIndexLdap.$ldapCheckSegment.after("<div class=\"ui icon message ajax negative\"><i class=\"icon exclamation circle\"></i>".concat(response.message, "</div>"));
      }
    });
  },

  /**
   * Handles the change of the LDAP checkbox.
   */
  onChangeLdapCheckbox: function onChangeLdapCheckbox() {
    if (moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked')) {
      moduleUsersUiIndexLdap.$formFieldsForLdapSettings.removeClass('disabled');
      moduleUsersUiIndexLdap.$formElementsAvailableIfLdapIsOn.show();
    } else {
      moduleUsersUiIndexLdap.$formFieldsForLdapSettings.addClass('disabled');
      moduleUsersUiIndexLdap.$formElementsAvailableIfLdapIsOn.hide();
    } // The Certificate sub-tab is gated on LDAP-on + verifyCert; recompute
    // visibility every time the master toggle flips so it disappears when
    // LDAP is turned off and reappears (with prior verify state) when on.


    if (typeof moduleUsersUiIndexLdap.refreshTlsSectionVisibility === 'function') {
      moduleUsersUiIndexLdap.refreshTlsSectionVisibility();
    }
  },

  /**
   * Callback function before sending the form.
   * @param {object} settings - The settings object.
   * @returns {object} - The modified settings object.
   */
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = moduleUsersUiIndexLdap.$formObj.form('get values');

    if (moduleUsersUiIndexLdap.$useLdapCheckbox.checkbox('is checked')) {
      result.data.useLdapAuthMethod = '1';
    } else {
      result.data.useLdapAuthMethod = '0';
    }

    return result;
  },

  /**
   * Callback function after sending the form.
   */
  cbAfterSendForm: function cbAfterSendForm() {// Callback implementation
  },

  /**
   * Initializes the form.
   */
  initializeForm: function initializeForm() {
    Form.$formObj = moduleUsersUiIndexLdap.$formObj;
    Form.url = "".concat(globalRootUrl, "module-users-u-i/ldap-config/save");
    Form.validateRules = moduleUsersUiIndexLdap.validateRules;
    Form.cbBeforeSendForm = moduleUsersUiIndexLdap.cbBeforeSendForm;
    Form.cbAfterSendForm = moduleUsersUiIndexLdap.cbAfterSendForm;
    Form.initialize();
  }
};
$(document).ready(function () {
  moduleUsersUiIndexLdap.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXgtbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwIiwiJHVzZUxkYXBDaGVja2JveCIsIiQiLCIkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncyIsIiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uIiwiJGxkYXBDaGVja1NlZ21lbnQiLCIkZm9ybU9iaiIsIiRjaGVja0F1dGhCdXR0b24iLCIkY2hlY2tHZXRVc2Vyc0J1dHRvbiIsIiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQiLCIkdXNlVGxzRHJvcGRvd24iLCIkbGRhcFR5cGVEcm9wZG93biIsIiR2ZXJpZnlDZXJ0Q2hlY2tib3giLCIkY2FDZXJ0VGV4dGFyZWEiLCIkdGxzU2V0dGluZ3NCbG9jayIsIiRjYUNlcnRpZmljYXRlRmllbGQiLCIkaW5zZWN1cmVUbHNXYXJuaW5nIiwiJGNhTWlzc2luZ1dhcm5pbmciLCIkdGVzdEJpbmRCdXR0b24iLCIkdGVzdEJpbmRSZXN1bHQiLCIkc3ViVGFic01lbnUiLCIkY2VydGlmaWNhdGVUYWIiLCJ2YWxpZGF0ZVJ1bGVzIiwic2VydmVyTmFtZSIsImlkZW50aWZpZXIiLCJydWxlcyIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5Iiwic2VydmVyUG9ydCIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZUxvZ2luIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSIsImFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4iLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5IiwiYmFzZUROIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5IiwidXNlcklkQXR0cmlidXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5IiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVGb3JtIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJhcGlDYWxsR2V0TGRhcFVzZXJzIiwiYXBpQ2FsbENoZWNrQXV0aCIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImRyb3Bkb3duIiwib25DaGFuZ2VMZGFwVHlwZSIsImN1cnJlbnRUbHNNb2RlIiwiZm9ybSIsInZhbHVlcyIsIm5hbWUiLCJ2YWx1ZSIsInNlbGVjdGVkIiwicmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5IiwiYXBpQ2FsbFRlc3RCaW5kIiwiZmluZCIsInRhYiIsImNvbnRleHQiLCJ0bHNNb2RlIiwidmVyaWZ5IiwiaXMiLCJlbmNyeXB0ZWQiLCJjYUVtcHR5IiwidmFsIiwidHJpbSIsImxkYXBFbmFibGVkIiwic2hvdyIsImhpZGUiLCJzaG93Q2VydFRhYiIsImhhc0NsYXNzIiwiYXBpIiwidXJsIiwiZ2xvYmFsUm9vdFVybCIsIm1ldGhvZCIsImJlZm9yZVNlbmQiLCJzZXR0aW5ncyIsImFkZENsYXNzIiwicmVtb3ZlQ2xhc3MiLCJkYXRhIiwic3VjY2Vzc1Rlc3QiLCJyZXNwb25zZSIsInN1Y2Nlc3MiLCJvblN1Y2Nlc3MiLCJ0ZXh0IiwibW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRTdWNjZXNzIiwibWVzc2FnZSIsImRldGFpbCIsIkFycmF5IiwiaXNBcnJheSIsImpvaW4iLCJvbkZhaWx1cmUiLCJtb2R1bGVfdXNlcnN1aV9UZXN0QmluZEZhaWx1cmUiLCJyZW1vdmUiLCJodG1sIiwibGVuZ3RoIiwiZ2xvYmFsdHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfRW1wdHlTZXJ2ZXJSZXNwb25zZSIsImVhY2giLCJpbmRleCIsInVzZXIiLCJsb2dpbiIsImFmdGVyIiwiY2JCZWZvcmVTZW5kRm9ybSIsInJlc3VsdCIs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O0FBZ2dCM0I7QUFDSjtBQUNBO0FBQ0lFLEVBQUFBLGVBbmdCMkIsNkJBbWdCVCxDQUNkO0FBQ0gsR0FyZ0IwQjs7QUF1Z0IzQjtBQUNKO0FBQ0E7QUFDSXJFLEVBQUFBLGNBMWdCMkIsNEJBMGdCVjtBQUNic0UsSUFBQUEsSUFBSSxDQUFDekcsUUFBTCxHQUFnQk4sc0JBQXNCLENBQUNNLFFBQXZDO0FBQ0F5RyxJQUFBQSxJQUFJLENBQUNuQyxHQUFMLGFBQWNDLGFBQWQ7QUFDQWtDLElBQUFBLElBQUksQ0FBQ3pGLGFBQUwsR0FBcUJ0QixzQkFBc0IsQ0FBQ3NCLGFBQTVDO0FBQ0F5RixJQUFBQSxJQUFJLENBQUNKLGdCQUFMLEdBQXdCM0csc0JBQXNCLENBQUMyRyxnQkFBL0M7QUFDQUksSUFBQUEsSUFBSSxDQUFDRCxlQUFMLEdBQXVCOUcsc0JBQXNCLENBQUM4RyxlQUE5QztBQUNBQyxJQUFBQSxJQUFJLENBQUN2RSxVQUFMO0FBQ0g7QUFqaEIwQixDQUEvQjtBQW9oQkF0QyxDQUFDLENBQUM4RyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3BCakgsRUFBQUEsc0JBQXNCLENBQUN3QyxVQUF2QjtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsVHJhbnNsYXRlLCBGb3JtLCBQYnhBcGkqL1xuXG5cbmNvbnN0IG1vZHVsZVVzZXJzVWlJbmRleExkYXAgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja2JveCBmb3IgTERBUCBhdXRoZW50aWNhdGlvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJHVzZUxkYXBDaGVja2JveDogJCgnI3VzZS1sZGFwLWF1dGgtbWV0aG9kJyksXG5cbiAgICAvKipcbiAgICAgKiBTZXQgb2YgZm9ybSBmaWVsZHMgdG8gdXNlIGZvciBMREFQIGF1dGhlbnRpY2F0aW9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5nczogJCgnLmRpc2FibGUtaWYtbm8tbGRhcCcpLFxuXG4gICAgLyoqXG4gICAgICogU2V0IG9mIGVsZW1lbnRzIG9mIHRoZSBmb3JtIGFkaGVyZWQgdG8gbGRhcCBhdXRoIG1ldGhvZC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZvcm1FbGVtZW50c0F2YWlsYWJsZUlmTGRhcElzT246ICQoJy5zaG93LW9ubHktaWYtbGRhcC1lbmFibGVkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbGRhcCBjaGVjayBzZWdtZW50LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGxkYXBDaGVja1NlZ21lbnQ6ICQoJyNsZGFwLWNoZWNrLWF1dGgnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBmb3JtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGZvcm1PYmo6ICQoJyNtb2R1bGUtdXNlcnMtdWktbGRhcC1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgY2hlY2sgY3JlZGVudGlhbHMgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQXV0aEJ1dHRvbjogJCgnLmNoZWNrLWxkYXAtY3JlZGVudGlhbHMuYnV0dG9uJyksXG5cblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBnZXR0aW5nIExEQVAgdXNlcnMgbGlzdCBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tHZXRVc2Vyc0J1dHRvbjogJCgnLmNoZWNrLWxkYXAtZ2V0LXVzZXJzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbGRhcCBjaGVjayBzZWdtZW50LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGxkYXBDaGVja0dldFVzZXJzU2VnbWVudDogJCgnI2xkYXAtY2hlY2stZ2V0LXVzZXJzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgVExTIHRyYW5zcG9ydC1tb2RlIHNlbGVjdG9yIChsZGFwIC8gc3RhcnR0bHMgLyBsZGFwcykuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdXNlVGxzRHJvcGRvd246ICQoJy51c2UtdGxzLWRyb3Bkb3duJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgc2VydmVyIHR5cGUgZHJvcGRvd24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcFR5cGVEcm9wZG93bjogJCgnLnNlbGVjdC1sZGFwLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgY2VydGlmaWNhdGUtdmFsaWRhdGlvbiB0b2dnbGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdmVyaWZ5Q2VydENoZWNrYm94OiAkKCdpbnB1dFtuYW1lPVwidmVyaWZ5Q2VydFwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGN1c3RvbSBDQSBQRU0gdGV4dGFyZWEuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2FDZXJ0VGV4dGFyZWE6ICQoJ3RleHRhcmVhW25hbWU9XCJjYUNlcnRpZmljYXRlXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgVExTLXNwZWNpZmljIGJsb2NrICh2ZXJpZnktY2VydCB0b2dnbGUgKyBpbnNlY3VyZSBiYW5uZXIpLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHRsc1NldHRpbmdzQmxvY2s6ICQoJy50bHMtc2V0dGluZ3MnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDQSBjZXJ0aWZpY2F0ZSBzZWdtZW50IHNob3duIHdoZW4gZW5jcnlwdGlvbiBpcyBvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjYUNlcnRpZmljYXRlRmllbGQ6ICQoJy5jYS1jZXJ0aWZpY2F0ZS1maWVsZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIFwiaW5zZWN1cmUgVExTXCIgd2FybmluZyAobGRhcHMgd2l0aG91dCB2ZXJpZmljYXRpb24pLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGluc2VjdXJlVGxzV2FybmluZzogJCgnLmluc2VjdXJlLXRscy13YXJuaW5nJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgXCJDQSBub3QgcHJvdmlkZWRcIiB3YXJuaW5nIGljb24gbmV4dCB0byB0aGUgQ0EgaGVhZGVyLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNhTWlzc2luZ1dhcm5pbmc6ICQoJy5jYS1taXNzaW5nLXdhcm5pbmcnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB0ZXN0LWJpbmQgaWNvbiBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdGVzdEJpbmRCdXR0b246ICQoJy50ZXN0LWxkYXAtYmluZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGlubGluZSB0ZXN0LWJpbmQgcmVzdWx0IGJhbm5lci5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR0ZXN0QmluZFJlc3VsdDogJCgnLnRlc3QtYmluZC1yZXN1bHQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBMREFQIHN1Yi10YWJzIG1lbnUgKENvbm5lY3Rpb24gLyBDZXJ0aWZpY2F0ZSkuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc3ViVGFic01lbnU6ICQoJyNtb2R1bGUtdXNlcnMtdWktbGRhcC1zdWItdGFicycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENlcnRpZmljYXRlIHN1Yi10YWIgaXRlbSBpbiB0aGUgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZXJ0aWZpY2F0ZVRhYjogJCgnLmxkYXAtY2VydC10YWInKSxcblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRpb24gcnVsZXMgZm9yIHRoZSBmb3JtIGZpZWxkcy5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhbGlkYXRlUnVsZXM6IHtcbiAgICAgICAgc2VydmVyTmFtZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3NlcnZlck5hbWUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyTmFtZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlclBvcnQ6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdzZXJ2ZXJQb3J0JyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlclBvcnRJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBhZG1pbmlzdHJhdGl2ZUxvZ2luOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYWRtaW5pc3RyYXRpdmVMb2dpbicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRtaW5pc3RyYXRpdmVQYXNzd29yZEhpZGRlbjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2FkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQWRtaW5pc3RyYXRpdmVQYXNzd29yZElzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGJhc2VETjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2Jhc2VETicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB1c2VySWRBdHRyaWJ1dGU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICd1c2VySWRBdHRyaWJ1dGUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlVXNlcklkQXR0cmlidXRlSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZHVsZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmluaXRpYWxpemVGb3JtKCk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGdldCB1c2VycyBsaXN0IGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmFwaUNhbGxHZXRMZGFwVXNlcnMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuYXBpQ2FsbENoZWNrQXV0aCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBHZW5lcmFsIGxkYXAgc3dpdGNoZXJcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLm9uQ2hhbmdlTGRhcENoZWNrYm94LFxuICAgICAgICB9KTtcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5vbkNoYW5nZUxkYXBDaGVja2JveCgpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBUeXBlRHJvcGRvd24uZHJvcGRvd24oe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVWlJbmRleExkYXAub25DaGFuZ2VMZGFwVHlwZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNoYW5nZSBUTFMgcHJvdG9jb2wg4oCUIHRocmVlLXdheSBzZWxlY3RvciAobm9uZSAvIHN0YXJ0dGxzIC8gbGRhcHMpLlxuICAgICAgICBjb25zdCBjdXJyZW50VGxzTW9kZSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywgJ3Rsc01vZGUnKSB8fCAnbm9uZSc7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZVRsc0Ryb3Bkb3duLmRyb3Bkb3duKHtcbiAgICAgICAgICAgIHZhbHVlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2xkYXA6Ly8nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogY3VycmVudFRsc01vZGUgPT09ICdub25lJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbGRhcDovLyArIFNUQVJUVExTJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdzdGFydHRscycsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkOiBjdXJyZW50VGxzTW9kZSA9PT0gJ3N0YXJ0dGxzJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbGRhcHM6Ly8nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2xkYXBzJyxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGN1cnJlbnRUbHNNb2RlID09PSAnbGRhcHMnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9uQ2hhbmdlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCAndGxzTW9kZScsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2VydGlmaWNhdGUgdmFsaWRhdGlvbiB0b2dnbGUg4oCUIHJlZnJlc2ggVVggc3RhdGUgb24gZmxpcC5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdmVyaWZ5Q2VydENoZWNrYm94Lm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gVHlwaW5nIGludG8gdGhlIENBIHRleHRhcmVhIGNsZWFycyB0aGUgXCJtaXNzaW5nIENBXCIgd2FybmluZy5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FDZXJ0VGV4dGFyZWEub24oJ2lucHV0JywgKCkgPT4ge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG5cbiAgICAgICAgLy8gSGFuZGxlIHRlc3QtYmluZCBpY29uIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5hcGlDYWxsVGVzdEJpbmQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBGb21hbnRpYyBzdWItdGFicyAoQ29ubmVjdGlvbiAvIENlcnRpZmljYXRlKS4gU2NvcGVkIHRvXG4gICAgICAgIC8vIHRoZSBMREFQIGZvcm0ncyBtZW51IHNvIGl0IGRvZXNuJ3QgY29sbGlkZSB3aXRoIHRoZSBwYWdlLWxldmVsIHRhYnMuXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHN1YlRhYnNNZW51LmZpbmQoJy5pdGVtJykudGFiKHtcbiAgICAgICAgICAgIGNvbnRleHQ6IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmosXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWNvbXB1dGVzIHZpc2liaWxpdHkgb2YgVExTLXJlbGF0ZWQgVUkgYmFzZWQgb24gdGxzTW9kZSAvIHZlcmlmeUNlcnQgLyBjYUNlcnRpZmljYXRlLlxuICAgICAqICAtIFRoZSBUTFMgc2V0dGluZ3MgYmxvY2sgKHZlcmlmeS1jZXJ0IHRvZ2dsZSArIGluc2VjdXJlIGJhbm5lcikgbGl2ZXNcbiAgICAgKiAgICBvbiB0aGUgQ29ubmVjdGlvbiBzdWItdGFiIGFuZCBzaG93cyBvbmx5IGZvciBlbmNyeXB0ZWQgbW9kZXMuXG4gICAgICogIC0gVGhlIENlcnRpZmljYXRlIHN1Yi10YWIgaXRlbSBpcyB2aXNpYmxlIG9ubHkgd2hlbiBMREFQIGF1dGhvcml6YXRpb25cbiAgICAgKiAgICBpcyBlbmFibGVkIEFORCB0aGUgdmVyaWZ5Q2VydCB0b2dnbGUgaXMgb24uIFRoaXMgaXMgdGhlIGdhdGUgdGhlXG4gICAgICogICAgb3BlcmF0b3IgYXNrZWQgZm9yOiB0aGUgdGFiIGFwcGVhcnMgcHJlY2lzZWx5IHdoZW4gYSBDQSBhY3R1YWxseVxuICAgICAqICAgIG1hdHRlcnMuIElmIHRoZSB1c2VyIHdhcyBvbiB0aGUgQ2VydGlmaWNhdGUgdGFiIGFuZCB0b2dnbGVzIGVpdGhlclxuICAgICAqICAgIG9mZiwgc25hcCBiYWNrIHRvIHRoZSBDb25uZWN0aW9uIHRhYiBzbyB0aGV5IGFyZW4ndCBzdHJhbmRlZCBvbiBhXG4gICAgICogICAgaGlkZGVuIHNlZ21lbnQuXG4gICAgICogIC0gV2FybmluZyB0cmlhbmdsZSBvbiB0aGUgQ2VydGlmaWNhdGUgdGFiIGhlYWRlciBsaWdodHMgdXAgd2hlblxuICAgICAqICAgIHZlcmlmaWNhdGlvbiBpcyBvbiBidXQgdGhlIENBIHRleHRhcmVhIGlzIGVtcHR5LlxuICAgICAqICAtIEluc2VjdXJlLVRMUyBiYW5uZXIgbGlnaHRzIHVwIG9ubHkgZm9yIGxkYXBzOi8vIHdpdGhvdXQgdmVyaWZpY2F0aW9uOlxuICAgICAqICAgIHRyYWZmaWMgaXMgZW5jcnlwdGVkIGJ1dCBzZXJ2ZXIgaWRlbnRpdHkgaXMgdW52ZXJpZmllZC5cbiAgICAgKi9cbiAgICByZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKSB7XG4gICAgICAgIGNvbnN0IHRsc01vZGUgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsICd0bHNNb2RlJykgfHwgJ25vbmUnO1xuICAgICAgICBjb25zdCB2ZXJpZnkgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR2ZXJpZnlDZXJ0Q2hlY2tib3guaXMoJzpjaGVja2VkJyk7XG4gICAgICAgIGNvbnN0IGVuY3J5cHRlZCA9IHRsc01vZGUgPT09ICdzdGFydHRscycgfHwgdGxzTW9kZSA9PT0gJ2xkYXBzJztcbiAgICAgICAgY29uc3QgY2FFbXB0eSA9IChtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYUNlcnRUZXh0YXJlYS52YWwoKSB8fCAnJykudHJpbSgpID09PSAnJztcbiAgICAgICAgY29uc3QgbGRhcEVuYWJsZWQgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VMZGFwQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKTtcblxuICAgICAgICBpZiAoZW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0bHNTZXR0aW5nc0Jsb2NrLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRsc1NldHRpbmdzQmxvY2suaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2VydGlmaWNhdGUgc3ViLXRhYjogZ2F0ZSBzdHJpY3RseSBvbiBMREFQLW9uICsgdmVyaWZ5LW9uLCByZWdhcmRsZXNzXG4gICAgICAgIC8vIG9mIHRsc01vZGUuIElmIHRoZSBvcGVyYXRvciB0dXJuZWQgdmFsaWRhdGlvbiBvbiBidXQgc3RheWVkIG9uIHBsYWluXG4gICAgICAgIC8vIExEQVAsIHdlIHN0aWxsIGxldCB0aGVtIHBhc3RlIGEgQ0Eg4oCUIHN3aXRjaGluZyB0byBTVEFSVFRMUy9MREFQUyBsYXRlclxuICAgICAgICAvLyBzaG91bGRuJ3QgbG9zZSB0aGUgd29yay5cbiAgICAgICAgY29uc3Qgc2hvd0NlcnRUYWIgPSBsZGFwRW5hYmxlZCAmJiB2ZXJpZnk7XG4gICAgICAgIGlmIChzaG93Q2VydFRhYikge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2VydGlmaWNhdGVUYWIuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2VydGlmaWNhdGVUYWIuaGlkZSgpO1xuICAgICAgICAgICAgLy8gU25hcCBiYWNrIHRvIENvbm5lY3Rpb24gaWYgQ2VydGlmaWNhdGUgd2FzIHRoZSBhY3RpdmUgdGFiLlxuICAgICAgICAgICAgaWYgKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNlcnRpZmljYXRlVGFiLmhhc0NsYXNzKCdhY3RpdmUnKSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHN1YlRhYnNNZW51XG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCcuaXRlbVtkYXRhLXRhYj1cImxkYXAtY29ubmVjdGlvblwiXScpXG4gICAgICAgICAgICAgICAgICAgIC50YWIoJ2NoYW5nZSB0YWInLCAnbGRhcC1jb25uZWN0aW9uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvd0NlcnRUYWIgJiYgY2FFbXB0eSkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FNaXNzaW5nV2FybmluZy5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYU1pc3NpbmdXYXJuaW5nLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0bHNNb2RlID09PSAnbGRhcHMnICYmICF2ZXJpZnkpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGluc2VjdXJlVGxzV2FybmluZy5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRpbnNlY3VyZVRsc1dhcm5pbmcuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIGEgbGlnaHR3ZWlnaHQgYmluZCBjaGVjayBhZ2FpbnN0IHRoZSBjdXJyZW50IGZvcm0gdmFsdWVzLlxuICAgICAqIFNob3dzIGEgZ3JlZW4gc3VjY2VzcyBtZXNzYWdlIG9yIGEgcmVkIGVycm9yIG1lc3NhZ2UgaW5saW5lIHVuZGVyXG4gICAgICogdGhlIGFkbWluLWNyZWRlbnRpYWxzIHJvdy5cbiAgICAgKi9cbiAgICBhcGlDYWxsVGVzdEJpbmQoKSB7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL3Rlc3QtYmluZGAsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5hZGRDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncG9zaXRpdmUgbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VjY2Vzc1Rlc3QocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1Rlc3RCaW5kU3VjY2VzcztcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWwgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLm1lc3NhZ2UpID8gcmVzcG9uc2UubWVzc2FnZS5qb2luKCcgJykgOiByZXNwb25zZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gZGV0YWlsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bvc2l0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQodGV4dClcbiAgICAgICAgICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1Rlc3RCaW5kRmFpbHVyZTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWwgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLm1lc3NhZ2UpID8gcmVzcG9uc2UubWVzc2FnZS5qb2luKCcgJykgOiByZXNwb25zZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYCR7dGV4dH06ICR7ZGV0YWlsfWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRSZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwb3NpdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAudGV4dCh0ZXh0KVxuICAgICAgICAgICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGNoYW5nZSBMREFQIGRyb3Bkb3duLlxuICAgICAqL1xuICAgIG9uQ2hhbmdlTGRhcFR5cGUodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZT09PSdPcGVuTERBUCcpe1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCd1c2VySWRBdHRyaWJ1dGUnLCd1aWQnKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYWRtaW5pc3RyYXRpdmVMb2dpbicsJ2NuPWFkbWluLGRjPWV4YW1wbGUsZGM9Y29tJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJGaWx0ZXInLCcob2JqZWN0Q2xhc3M9aW5ldE9yZ1BlcnNvbiknKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYmFzZUROJywnZGM9ZXhhbXBsZSxkYz1jb20nKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnb3JnYW5pemF0aW9uYWxVbml0Jywnb3U9dXNlcnMsIGRjPWRvbWFpbiwgZGM9Y29tJyk7XG4gICAgICAgIH0gZWxzZSBpZih2YWx1ZT09PSdBY3RpdmVEaXJlY3RvcnknKXtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYWRtaW5pc3RyYXRpdmVMb2dpbicsJ2FkbWluJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJJZEF0dHJpYnV0ZScsJ3NhbWFjY291bnRuYW1lJylcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywndXNlckZpbHRlcicsJygmKG9iamVjdENsYXNzPXVzZXIpKG9iamVjdENhdGVnb3J5PVBFUlNPTikpJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ2Jhc2VETicsJ2RjPWV4YW1wbGUsZGM9Y29tJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ29yZ2FuaXphdGlvbmFsVW5pdCcsJ291PXVzZXJzLCBkYz1kb21haW4sIGRjPWNvbScpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGdldCBMREFQIHVzZXJzIGxpc3QgYnV0dG9uIGNsaWNrLlxuICAgICAqL1xuICAgIGFwaUNhbGxHZXRMZGFwVXNlcnMoKXtcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzYCxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYmVmb3JlU2VuZChzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIHN1Y2Nlc3NmdWwgcmVzcG9uc2Ugb2YgdGhlICdnZXQtYXZhaWxhYmxlLWxkYXAtdXNlcnMnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGxldCBodG1sID0gJzx1bCBjbGFzcz1cInVpIGxpc3RcIj4nO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9IGA8bGkgY2xhc3M9XCJpdGVtXCI+JHtnbG9iYWx0cmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfRW1wdHlTZXJ2ZXJSZXNwb25zZX08L2xpPmA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmRhdGEsIChpbmRleCwgdXNlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBgPGxpIGNsYXNzPVwiaXRlbVwiPiR7dXNlci5uYW1lfSAoJHt1c2VyLmxvZ2lufSk8L2xpPmA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L3VsPic7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggcG9zaXRpdmVcIj4ke2h0bWx9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBmYWlsdXJlIHJlc3BvbnNlIG9mIHRoZSAnZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uRmFpbHVyZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja0dldFVzZXJzU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IG5lZ2F0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGV4Y2xhbWF0aW9uIGNpcmNsZVwiPjwvaT4ke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGNoZWNrIExEQVAgYXV0aGVudGljYXRpb24gYnV0dG9uIGNsaWNrLlxuICAgICAqL1xuICAgIGFwaUNhbGxDaGVja0F1dGgoKXtcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvY2hlY2stYXV0aGAsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIHN1Y2Nlc3NmdWwgcmVzcG9uc2Ugb2YgdGhlICdjaGVjay1sZGFwLWF1dGgnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggcG9zaXRpdmVcIj48aSBjbGFzcz1cImljb24gY2hlY2tcIj48L2k+ICR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIGZhaWx1cmUgcmVzcG9uc2Ugb2YgdGhlICdjaGVjay1sZGFwLWF1dGgnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25GYWlsdXJlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggbmVnYXRpdmVcIj48aSBjbGFzcz1cImljb24gZXhjbGFtYXRpb24gY2lyY2xlXCI+PC9pPiR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgdGhlIGNoYW5nZSBvZiB0aGUgTERBUCBjaGVja2JveC5cbiAgICAgKi9cbiAgICBvbkNoYW5nZUxkYXBDaGVja2JveCgpe1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgQ2VydGlmaWNhdGUgc3ViLXRhYiBpcyBnYXRlZCBvbiBMREFQLW9uICsgdmVyaWZ5Q2VydDsgcmVjb21wdXRlXG4gICAgICAgIC8vIHZpc2liaWxpdHkgZXZlcnkgdGltZSB0aGUgbWFzdGVyIHRvZ2dsZSBmbGlwcyBzbyBpdCBkaXNhcHBlYXJzIHdoZW5cbiAgICAgICAgLy8gTERBUCBpcyB0dXJuZWQgb2ZmIGFuZCByZWFwcGVhcnMgKHdpdGggcHJpb3IgdmVyaWZ5IHN0YXRlKSB3aGVuIG9uLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGJlZm9yZSBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZXR0aW5ncyAtIFRoZSBzZXR0aW5ncyBvYmplY3QuXG4gICAgICogQHJldHVybnMge29iamVjdH0gLSBUaGUgbW9kaWZpZWQgc2V0dGluZ3Mgb2JqZWN0LlxuICAgICAqL1xuICAgIGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gc2V0dGluZ3M7XG4gICAgICAgIHJlc3VsdC5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VMZGFwQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS51c2VMZGFwQXV0aE1ldGhvZCA9ICcxJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLnVzZUxkYXBBdXRoTWV0aG9kID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBjYkFmdGVyU2VuZEZvcm0oKSB7XG4gICAgICAgIC8vIENhbGxiYWNrIGltcGxlbWVudGF0aW9uXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVGb3JtKCkge1xuICAgICAgICBGb3JtLiRmb3JtT2JqID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iajtcbiAgICAgICAgRm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvc2F2ZWA7XG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAudmFsaWRhdGVSdWxlcztcbiAgICAgICAgRm9ybS5jYkJlZm9yZVNlbmRGb3JtID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5jYkJlZm9yZVNlbmRGb3JtO1xuICAgICAgICBGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuY2JBZnRlclNlbmRGb3JtO1xuICAgICAgICBGb3JtLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=