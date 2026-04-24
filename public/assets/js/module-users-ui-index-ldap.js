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
  refreshTlsSectionVisibility: function refreshTlsSectionVisibility() {
    var tlsMode = moduleUsersUiIndexLdap.$formObj.form('get value', 'tlsMode') || 'none';
    var verify = moduleUsersUiIndexLdap.$verifyCertCheckbox.is(':checked');
    var encrypted = tlsMode === 'starttls' || tlsMode === 'ldaps';
    var caEmpty = (moduleUsersUiIndexLdap.$caCertTextarea.val() || '').trim() === '';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXgtbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwIiwiJHVzZUxkYXBDaGVja2JveCIsIiQiLCIkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncyIsIiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uIiwiJGxkYXBDaGVja1NlZ21lbnQiLCIkZm9ybU9iaiIsIiRjaGVja0F1dGhCdXR0b24iLCIkY2hlY2tHZXRVc2Vyc0J1dHRvbiIsIiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQiLCIkdXNlVGxzRHJvcGRvd24iLCIkbGRhcFR5cGVEcm9wZG93biIsIiR2ZXJpZnlDZXJ0Q2hlY2tib3giLCIkY2FDZXJ0VGV4dGFyZWEiLCIkdGxzU2V0dGluZ3NCbG9jayIsIiRjYUNlcnRpZmljYXRlRmllbGQiLCIkaW5zZWN1cmVUbHNXYXJuaW5nIiwiJGNhTWlzc2luZ1dhcm5pbmciLCIkdGVzdEJpbmRCdXR0b24iLCIkdGVzdEJpbmRSZXN1bHQiLCJ2YWxpZGF0ZVJ1bGVzIiwic2VydmVyTmFtZSIsImlkZW50aWZpZXIiLCJydWxlcyIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5Iiwic2VydmVyUG9ydCIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZUxvZ2luIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSIsImFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4iLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5IiwiYmFzZUROIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5IiwidXNlcklkQXR0cmlidXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5IiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVGb3JtIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJhcGlDYWxsR2V0TGRhcFVzZXJzIiwiYXBpQ2FsbENoZWNrQXV0aCIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImRyb3Bkb3duIiwib25DaGFuZ2VMZGFwVHlwZSIsImN1cnJlbnRUbHNNb2RlIiwiZm9ybSIsInZhbHVlcyIsIm5hbWUiLCJ2YWx1ZSIsInNlbGVjdGVkIiwicmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5IiwiYXBpQ2FsbFRlc3RCaW5kIiwidGxzTW9kZSIsInZlcmlmeSIsImlzIiwiZW5jcnlwdGVkIiwiY2FFbXB0eSIsInZhbCIsInRyaW0iLCJzaG93IiwiaGlkZSIsImFwaSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJtZXRob2QiLCJiZWZvcmVTZW5kIiwic2V0dGluZ3MiLCJhZGRDbGFzcyIsInJlbW92ZUNsYXNzIiwiZGF0YSIsInN1Y2Nlc3NUZXN0IiwicmVzcG9uc2UiLCJzdWNjZXNzIiwib25TdWNjZXNzIiwidGV4dCIsIm1vZHVsZV91c2Vyc3VpX1Rlc3RCaW5kU3VjY2VzcyIsIm1lc3NhZ2UiLCJkZXRhaWwiLCJBcnJheSIsImlzQXJyYXkiLCJqb2luIiwib25GYWlsdXJlIiwibW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRGYWlsdXJlIiwicmVtb3ZlIiwiaHRtbCIsImxlbmd0aCIsImdsb2JhbHRyYW5zbGF0ZSIsIm1vZHVsZV91c2Vyc3VpX0VtcHR5U2VydmVyUmVzcG9uc2UiLCJlYWNoIiwiaW5kZXgiLCJ1c2VyIiwibG9naW4iLCJhZnRlciIsImNiQmVmb3JlU2VuZEZvcm0iLCJyZXN1bHQiLCJ1c2VMZGFwQXV0aE1ldGhvZCIsImNiQWZ0ZXJTZW5kRm9ybSIsIkZvcm0iLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtB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T0QsTUFBUDtBQUNILEdBamQwQjs7QUFtZDNCO0FBQ0o7QUFDQTtBQUNJRSxFQUFBQSxlQXRkMkIsNkJBc2RULENBQ2Q7QUFDSCxHQXhkMEI7O0FBMGQzQjtBQUNKO0FBQ0E7QUFDSS9ELEVBQUFBLGNBN2QyQiw0QkE2ZFY7QUFDYmdFLElBQUFBLElBQUksQ0FBQ2pHLFFBQUwsR0FBZ0JOLHNCQUFzQixDQUFDTSxRQUF2QztBQUNBaUcsSUFBQUEsSUFBSSxDQUFDbkMsR0FBTCxhQUFjQyxhQUFkO0FBQ0FrQyxJQUFBQSxJQUFJLENBQUNuRixhQUFMLEdBQXFCcEIsc0JBQXNCLENBQUNvQixhQUE1QztBQUNBbUYsSUFBQUEsSUFBSSxDQUFDSixnQkFBTCxHQUF3Qm5HLHNCQUFzQixDQUFDbUcsZ0JBQS9DO0FBQ0FJLElBQUFBLElBQUksQ0FBQ0QsZUFBTCxHQUF1QnRHLHNCQUFzQixDQUFDc0csZUFBOUM7QUFDQUMsSUFBQUEsSUFBSSxDQUFDakUsVUFBTDtBQUNIO0FBcGUwQixDQUEvQjtBQXVlQXBDLENBQUMsQ0FBQ3NHLFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDcEJ6RyxFQUFBQSxzQkFBc0IsQ0FBQ3NDLFVBQXZCO0FBQ0gsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIFBieEFwaSovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVaUluZGV4TGRhcCA9IHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGZvciBMREFQIGF1dGhlbnRpY2F0aW9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkdXNlTGRhcENoZWNrYm94OiAkKCcjdXNlLWxkYXAtYXV0aC1tZXRob2QnKSxcblxuICAgIC8qKlxuICAgICAqIFNldCBvZiBmb3JtIGZpZWxkcyB0byB1c2UgZm9yIExEQVAgYXV0aGVudGljYXRpb24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzOiAkKCcuZGlzYWJsZS1pZi1uby1sZGFwJyksXG5cbiAgICAvKipcbiAgICAgKiBTZXQgb2YgZWxlbWVudHMgb2YgdGhlIGZvcm0gYWRoZXJlZCB0byBsZGFwIGF1dGggbWV0aG9kLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbjogJCgnLnNob3ctb25seS1pZi1sZGFwLWVuYWJsZWQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrU2VnbWVudDogJCgnI2xkYXAtY2hlY2stYXV0aCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1sZGFwLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjaGVjayBjcmVkZW50aWFscyBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tBdXRoQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1jcmVkZW50aWFscy5idXR0b24nKSxcblxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdldHRpbmcgTERBUCB1c2VycyBsaXN0IGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0dldFVzZXJzQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50OiAkKCcjbGRhcC1jaGVjay1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBUTFMgdHJhbnNwb3J0LW1vZGUgc2VsZWN0b3IgKGxkYXAgLyBzdGFydHRscyAvIGxkYXBzKS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR1c2VUbHNEcm9wZG93bjogJCgnLnVzZS10bHMtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBzZXJ2ZXIgdHlwZSBkcm9wZG93bi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRsZGFwVHlwZURyb3Bkb3duOiAkKCcuc2VsZWN0LWxkYXAtZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjZXJ0aWZpY2F0ZS12YWxpZGF0aW9uIHRvZ2dsZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR2ZXJpZnlDZXJ0Q2hlY2tib3g6ICQoJ2lucHV0W25hbWU9XCJ2ZXJpZnlDZXJ0XCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgY3VzdG9tIENBIFBFTSB0ZXh0YXJlYS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjYUNlcnRUZXh0YXJlYTogJCgndGV4dGFyZWFbbmFtZT1cImNhQ2VydGlmaWNhdGVcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBUTFMtc3BlY2lmaWMgYmxvY2sgKHZlcmlmeS1jZXJ0IHRvZ2dsZSArIGluc2VjdXJlIGJhbm5lcikuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdGxzU2V0dGluZ3NCbG9jazogJCgnLnRscy1zZXR0aW5ncycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENBIGNlcnRpZmljYXRlIHNlZ21lbnQgc2hvd24gd2hlbiBlbmNyeXB0aW9uIGlzIG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNhQ2VydGlmaWNhdGVGaWVsZDogJCgnLmNhLWNlcnRpZmljYXRlLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgXCJpbnNlY3VyZSBUTFNcIiB3YXJuaW5nIChsZGFwcyB3aXRob3V0IHZlcmlmaWNhdGlvbikuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkaW5zZWN1cmVUbHNXYXJuaW5nOiAkKCcuaW5zZWN1cmUtdGxzLXdhcm5pbmcnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBcIkNBIG5vdCBwcm92aWRlZFwiIHdhcm5pbmcgaWNvbiBuZXh0IHRvIHRoZSBDQSBoZWFkZXIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2FNaXNzaW5nV2FybmluZzogJCgnLmNhLW1pc3Npbmctd2FybmluZycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHRlc3QtYmluZCBpY29uIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR0ZXN0QmluZEJ1dHRvbjogJCgnLnRlc3QtbGRhcC1iaW5kJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgaW5saW5lIHRlc3QtYmluZCByZXN1bHQgYmFubmVyLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHRlc3RCaW5kUmVzdWx0OiAkKCcudGVzdC1iaW5kLXJlc3VsdCcpLFxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGlvbiBydWxlcyBmb3IgdGhlIGZvcm0gZmllbGRzLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFsaWRhdGVSdWxlczoge1xuICAgICAgICBzZXJ2ZXJOYW1lOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnc2VydmVyTmFtZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVTZXJ2ZXJOYW1lSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyUG9ydDoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3NlcnZlclBvcnQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkbWluaXN0cmF0aXZlTG9naW46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdhZG1pbmlzdHJhdGl2ZUxvZ2luJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlTG9naW5Jc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBhZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSGlkZGVuOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYWRtaW5pc3RyYXRpdmVQYXNzd29yZEhpZGRlbicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYmFzZUROOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYmFzZUROJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUJhc2VETklzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHVzZXJJZEF0dHJpYnV0ZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3VzZXJJZEF0dHJpYnV0ZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuaW5pdGlhbGl6ZUZvcm0oKTtcblxuICAgICAgICAvLyBIYW5kbGUgZ2V0IHVzZXJzIGxpc3QgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuYXBpQ2FsbEdldExkYXBVc2VycygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5hcGlDYWxsQ2hlY2tBdXRoKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEdlbmVyYWwgbGRhcCBzd2l0Y2hlclxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VMZGFwQ2hlY2tib3guY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVWlJbmRleExkYXAub25DaGFuZ2VMZGFwQ2hlY2tib3gsXG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLm9uQ2hhbmdlTGRhcENoZWNrYm94KCk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcFR5cGVEcm9wZG93bi5kcm9wZG93bih7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5vbkNoYW5nZUxkYXBUeXBlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hhbmdlIFRMUyBwcm90b2NvbCDigJQgdGhyZWUtd2F5IHNlbGVjdG9yIChub25lIC8gc3RhcnR0bHMgLyBsZGFwcykuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRUbHNNb2RlID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAndGxzTW9kZScpIHx8ICdub25lJztcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlVGxzRHJvcGRvd24uZHJvcGRvd24oe1xuICAgICAgICAgICAgdmFsdWVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbGRhcDovLycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkOiBjdXJyZW50VGxzTW9kZSA9PT0gJ25vbmUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsZGFwOi8vICsgU1RBUlRUTFMnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3N0YXJ0dGxzJyxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGN1cnJlbnRUbHNNb2RlID09PSAnc3RhcnR0bHMnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsZGFwczovLycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbGRhcHMnLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogY3VycmVudFRsc01vZGUgPT09ICdsZGFwcydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgb25DaGFuZ2UodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsICd0bHNNb2RlJywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDZXJ0aWZpY2F0ZSB2YWxpZGF0aW9uIHRvZ2dsZSDigJQgcmVmcmVzaCBVWCBzdGF0ZSBvbiBmbGlwLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR2ZXJpZnlDZXJ0Q2hlY2tib3gub24oJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUeXBpbmcgaW50byB0aGUgQ0EgdGV4dGFyZWEgY2xlYXJzIHRoZSBcIm1pc3NpbmcgQ0FcIiB3YXJuaW5nLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYUNlcnRUZXh0YXJlYS5vbignaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcblxuICAgICAgICAvLyBIYW5kbGUgdGVzdC1iaW5kIGljb24gYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmFwaUNhbGxUZXN0QmluZCgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVjb21wdXRlcyB2aXNpYmlsaXR5IG9mIFRMUy1yZWxhdGVkIFVJIGJhc2VkIG9uIHRsc01vZGUgLyB2ZXJpZnlDZXJ0IC8gY2FDZXJ0aWZpY2F0ZS5cbiAgICAgKiAgLSB2ZXJpZnktY2VydCB0b2dnbGUgYW5kIGluc2VjdXJlIGJhbm5lciBsaXZlIGluc2lkZSAudGxzLXNldHRpbmdzIGFuZFxuICAgICAqICAgIHNob3cgb25seSBmb3IgZW5jcnlwdGVkIG1vZGVzIChzdGFydHRsc3xsZGFwcykuXG4gICAgICogIC0gQ0EgY2VydGlmaWNhdGUgc2VnbWVudCBhcHBlYXJzIG9ubHkgZm9yIGVuY3J5cHRlZCBtb2Rlcy5cbiAgICAgKiAgLSBXYXJuaW5nIHRyaWFuZ2xlIG9uIHRoZSBDQSBoZWFkZXIgbGlnaHRzIHVwIHdoZW4gdmVyaWZpY2F0aW9uIGlzIG9uXG4gICAgICogICAgYnV0IHRoZSBDQSB0ZXh0YXJlYSBpcyBlbXB0eS5cbiAgICAgKiAgLSBJbnNlY3VyZS1UTFMgYmFubmVyIGxpZ2h0cyB1cCBvbmx5IGZvciBsZGFwczovLyB3aXRob3V0IHZlcmlmaWNhdGlvbjpcbiAgICAgKiAgICB0cmFmZmljIGlzIGVuY3J5cHRlZCBidXQgc2VydmVyIGlkZW50aXR5IGlzIHVudmVyaWZpZWQuXG4gICAgICovXG4gICAgcmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCkge1xuICAgICAgICBjb25zdCB0bHNNb2RlID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAndGxzTW9kZScpIHx8ICdub25lJztcbiAgICAgICAgY29uc3QgdmVyaWZ5ID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdmVyaWZ5Q2VydENoZWNrYm94LmlzKCc6Y2hlY2tlZCcpO1xuICAgICAgICBjb25zdCBlbmNyeXB0ZWQgPSB0bHNNb2RlID09PSAnc3RhcnR0bHMnIHx8IHRsc01vZGUgPT09ICdsZGFwcyc7XG4gICAgICAgIGNvbnN0IGNhRW1wdHkgPSAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FDZXJ0VGV4dGFyZWEudmFsKCkgfHwgJycpLnRyaW0oKSA9PT0gJyc7XG5cbiAgICAgICAgaWYgKGVuY3J5cHRlZCkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGxzU2V0dGluZ3NCbG9jay5zaG93KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYUNlcnRpZmljYXRlRmllbGQuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGxzU2V0dGluZ3NCbG9jay5oaWRlKCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYUNlcnRpZmljYXRlRmllbGQuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVuY3J5cHRlZCAmJiB2ZXJpZnkgJiYgY2FFbXB0eSkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FNaXNzaW5nV2FybmluZy5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYU1pc3NpbmdXYXJuaW5nLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0bHNNb2RlID09PSAnbGRhcHMnICYmICF2ZXJpZnkpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGluc2VjdXJlVGxzV2FybmluZy5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRpbnNlY3VyZVRsc1dhcm5pbmcuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIGEgbGlnaHR3ZWlnaHQgYmluZCBjaGVjayBhZ2FpbnN0IHRoZSBjdXJyZW50IGZvcm0gdmFsdWVzLlxuICAgICAqIFNob3dzIGEgZ3JlZW4gc3VjY2VzcyBtZXNzYWdlIG9yIGEgcmVkIGVycm9yIG1lc3NhZ2UgaW5saW5lIHVuZGVyXG4gICAgICogdGhlIGFkbWluLWNyZWRlbnRpYWxzIHJvdy5cbiAgICAgKi9cbiAgICBhcGlDYWxsVGVzdEJpbmQoKSB7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL3Rlc3QtYmluZGAsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5hZGRDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncG9zaXRpdmUgbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VjY2Vzc1Rlc3QocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1Rlc3RCaW5kU3VjY2VzcztcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWwgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLm1lc3NhZ2UpID8gcmVzcG9uc2UubWVzc2FnZS5qb2luKCcgJykgOiByZXNwb25zZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gZGV0YWlsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3Bvc2l0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQodGV4dClcbiAgICAgICAgICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1Rlc3RCaW5kRmFpbHVyZTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWwgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLm1lc3NhZ2UpID8gcmVzcG9uc2UubWVzc2FnZS5qb2luKCcgJykgOiByZXNwb25zZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYCR7dGV4dH06ICR7ZGV0YWlsfWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRSZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwb3NpdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnbmVnYXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAudGV4dCh0ZXh0KVxuICAgICAgICAgICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGNoYW5nZSBMREFQIGRyb3Bkb3duLlxuICAgICAqL1xuICAgIG9uQ2hhbmdlTGRhcFR5cGUodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZT09PSdPcGVuTERBUCcpe1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCd1c2VySWRBdHRyaWJ1dGUnLCd1aWQnKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYWRtaW5pc3RyYXRpdmVMb2dpbicsJ2NuPWFkbWluLGRjPWV4YW1wbGUsZGM9Y29tJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJGaWx0ZXInLCcob2JqZWN0Q2xhc3M9aW5ldE9yZ1BlcnNvbiknKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYmFzZUROJywnZGM9ZXhhbXBsZSxkYz1jb20nKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnb3JnYW5pemF0aW9uYWxVbml0Jywnb3U9dXNlcnMsIGRjPWRvbWFpbiwgZGM9Y29tJyk7XG4gICAgICAgIH0gZWxzZSBpZih2YWx1ZT09PSdBY3RpdmVEaXJlY3RvcnknKXtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYWRtaW5pc3RyYXRpdmVMb2dpbicsJ2FkbWluJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJJZEF0dHJpYnV0ZScsJ3NhbWFjY291bnRuYW1lJylcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywndXNlckZpbHRlcicsJygmKG9iamVjdENsYXNzPXVzZXIpKG9iamVjdENhdGVnb3J5PVBFUlNPTikpJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ2Jhc2VETicsJ2RjPWV4YW1wbGUsZGM9Y29tJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ29yZ2FuaXphdGlvbmFsVW5pdCcsJ291PXVzZXJzLCBkYz1kb21haW4sIGRjPWNvbScpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGdldCBMREFQIHVzZXJzIGxpc3QgYnV0dG9uIGNsaWNrLlxuICAgICAqL1xuICAgIGFwaUNhbGxHZXRMZGFwVXNlcnMoKXtcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzYCxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYmVmb3JlU2VuZChzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIHN1Y2Nlc3NmdWwgcmVzcG9uc2Ugb2YgdGhlICdnZXQtYXZhaWxhYmxlLWxkYXAtdXNlcnMnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGxldCBodG1sID0gJzx1bCBjbGFzcz1cInVpIGxpc3RcIj4nO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9IGA8bGkgY2xhc3M9XCJpdGVtXCI+JHtnbG9iYWx0cmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfRW1wdHlTZXJ2ZXJSZXNwb25zZX08L2xpPmA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmRhdGEsIChpbmRleCwgdXNlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBgPGxpIGNsYXNzPVwiaXRlbVwiPiR7dXNlci5uYW1lfSAoJHt1c2VyLmxvZ2lufSk8L2xpPmA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L3VsPic7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggcG9zaXRpdmVcIj4ke2h0bWx9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBmYWlsdXJlIHJlc3BvbnNlIG9mIHRoZSAnZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uRmFpbHVyZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja0dldFVzZXJzU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IG5lZ2F0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGV4Y2xhbWF0aW9uIGNpcmNsZVwiPjwvaT4ke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGNoZWNrIExEQVAgYXV0aGVudGljYXRpb24gYnV0dG9uIGNsaWNrLlxuICAgICAqL1xuICAgIGFwaUNhbGxDaGVja0F1dGgoKXtcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvY2hlY2stYXV0aGAsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIHN1Y2Nlc3NmdWwgcmVzcG9uc2Ugb2YgdGhlICdjaGVjay1sZGFwLWF1dGgnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggcG9zaXRpdmVcIj48aSBjbGFzcz1cImljb24gY2hlY2tcIj48L2k+ICR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIGZhaWx1cmUgcmVzcG9uc2Ugb2YgdGhlICdjaGVjay1sZGFwLWF1dGgnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25GYWlsdXJlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggbmVnYXRpdmVcIj48aSBjbGFzcz1cImljb24gZXhjbGFtYXRpb24gY2lyY2xlXCI+PC9pPiR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgdGhlIGNoYW5nZSBvZiB0aGUgTERBUCBjaGVja2JveC5cbiAgICAgKi9cbiAgICBvbkNoYW5nZUxkYXBDaGVja2JveCgpe1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgLSBUaGUgc2V0dGluZ3Mgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IC0gVGhlIG1vZGlmaWVkIHNldHRpbmdzIG9iamVjdC5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICByZXN1bHQuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEudXNlTGRhcEF1dGhNZXRob2QgPSAnMSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS51c2VMZGFwQXV0aE1ldGhvZCA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKCkge1xuICAgICAgICAvLyBDYWxsYmFjayBpbXBsZW1lbnRhdGlvblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL3NhdmVgO1xuICAgICAgICBGb3JtLnZhbGlkYXRlUnVsZXMgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnZhbGlkYXRlUnVsZXM7XG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmNiQWZ0ZXJTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5pbml0aWFsaXplKCk7XG4gICAgfSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmluaXRpYWxpemUoKTtcbn0pO1xuIl19