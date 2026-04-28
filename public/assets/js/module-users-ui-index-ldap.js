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

/* global globalRootUrl, globalTranslate, Form, PbxApi, TooltipBuilder */
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
    }); // Field-level info tooltips (mirror of ModuleLdapSync UX).

    moduleUsersUiIndexLdap.initializeTooltips();
  },

  /**
   * Wires tooltips for every annotated field on the form. Uses the shared
   * TooltipBuilder helper from the admin cabinet so the popup structure
   * matches the rest of MikoPBX. Skips silently if TooltipBuilder hasn't
   * been loaded — the page still works, just without the hover hints.
   */
  initializeTooltips: function initializeTooltips() {
    if (typeof TooltipBuilder === 'undefined') {
      return;
    }

    var tooltipConfigs = {
      serverName: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_serverName_header,
        list: [{
          term: 'ldap://',
          definition: globalTranslate.module_usersui_tt_serverName_plain
        }, {
          term: 'ldap:// + STARTTLS',
          definition: globalTranslate.module_usersui_tt_serverName_starttls
        }, {
          term: 'ldaps://',
          definition: globalTranslate.module_usersui_tt_serverName_ldaps
        }]
      }),
      baseDN: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_baseDN_header,
        description: globalTranslate.module_usersui_tt_baseDN_desc,
        examples: ['dc=miko,dc=ru', 'dc=corp,dc=example,dc=com'],
        examplesHeader: globalTranslate.module_usersui_tt_baseDN_examplesHeader
      }),
      administrativeLogin: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_adminLogin_header,
        description: globalTranslate.module_usersui_tt_adminLogin_desc,
        list: ['mikopbx', 'mikopbx@miko.ru', 'MIKO\\mikopbx', 'CN=mikopbx,CN=Users,DC=miko,DC=ru'],
        note: globalTranslate.module_usersui_tt_adminLogin_note
      }),
      verifyCert: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_verify_header,
        description: globalTranslate.module_usersui_tt_verify_desc,
        warning: {
          header: globalTranslate.module_usersui_tt_verify_warning_header,
          text: globalTranslate.module_usersui_tt_verify_warning
        }
      }),
      userIdAttribute: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_userIdAttr_header,
        description: globalTranslate.module_usersui_tt_userIdAttr_desc,
        list: [{
          term: 'Active Directory',
          definition: 'samaccountname / userPrincipalName'
        }, {
          term: 'OpenLDAP / FreeIPA',
          definition: 'uid'
        }]
      }),
      organizationalUnit: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_orgUnit_header,
        description: globalTranslate.module_usersui_tt_orgUnit_desc,
        examples: ['OU=Sales,DC=miko,DC=ru', 'ou=people,dc=example,dc=com'],
        examplesHeader: globalTranslate.module_usersui_tt_orgUnit_examplesHeader,
        note: globalTranslate.module_usersui_tt_orgUnit_note
      }),
      userFilter: TooltipBuilder.buildContent({
        header: globalTranslate.module_usersui_tt_userFilter_header,
        description: globalTranslate.module_usersui_tt_userFilter_desc,
        examples: ['(&(objectClass=user)(objectCategory=PERSON))', '(&(objectClass=user)(memberOf=CN=PBX Users,OU=Groups,DC=miko,DC=ru))', '(objectClass=inetOrgPerson)'],
        examplesHeader: globalTranslate.module_usersui_tt_userFilter_examplesHeader,
        note: globalTranslate.module_usersui_tt_userFilter_note
      })
    };
    $('.field-info-icon').each(function (i, el) {
      var $icon = $(el);
      var content = tooltipConfigs[$icon.data('field')];

      if (!content) {
        return;
      }

      $icon.popup({
        html: content,
        position: 'top right',
        hoverable: true,
        delay: {
          show: 300,
          hide: 100
        },
        variation: 'flowing'
      });
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
          html += "<li class=\"item\">".concat(globalTranslate.module_usersui_EmptyServerResponse, "</li>");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXgtbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwIiwiJHVzZUxkYXBDaGVja2JveCIsIiQiLCIkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncyIsIiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uIiwiJGxkYXBDaGVja1NlZ21lbnQiLCIkZm9ybU9iaiIsIiRjaGVja0F1dGhCdXR0b24iLCIkY2hlY2tHZXRVc2Vyc0J1dHRvbiIsIiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQiLCIkdXNlVGxzRHJvcGRvd24iLCIkbGRhcFR5cGVEcm9wZG93biIsIiR2ZXJpZnlDZXJ0Q2hlY2tib3giLCIkY2FDZXJ0VGV4dGFyZWEiLCIkdGxzU2V0dGluZ3NCbG9jayIsIiRjYUNlcnRpZmljYXRlRmllbGQiLCIkaW5zZWN1cmVUbHNXYXJuaW5nIiwiJGNhTWlzc2luZ1dhcm5pbmciLCIkdGVzdEJpbmRCdXR0b24iLCIkdGVzdEJpbmRSZXN1bHQiLCIkc3ViVGFic01lbnUiLCIkY2VydGlmaWNhdGVUYWIiLCJ2YWxpZGF0ZVJ1bGVzIiwic2VydmVyTmFtZSIsImlkZW50aWZpZXIiLCJydWxlcyIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5Iiwic2VydmVyUG9ydCIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZUxvZ2luIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSIsImFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4iLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5IiwiYmFzZUROIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5IiwidXNlcklkQXR0cmlidXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5IiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVGb3JtIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJhcGlDYWxsR2V0TGRhcFVzZXJzIiwiYXBpQ2FsbENoZWNrQXV0aCIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImRyb3Bkb3duIiwib25DaGFuZ2VMZGFwVHlwZSIsImN1cnJlbnRUbHNNb2RlIiwiZm9ybSIsInZhbHVlcyIsIm5hbWUiLCJ2YWx1ZSIsInNlbGVjdGVkIiwicmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5IiwiYXBpQ2FsbFRlc3RCaW5kIiwiZmluZCIsInRhYiIsImNvbnRleHQiLCJpbml0aWFsaXplVG9vbHRpcHMiLCJUb29sdGlwQnVpbGRlciIsInRvb2x0aXBDb25maWdzIiwiYnVpbGRDb250ZW50IiwiaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9oZWFkZXIiLCJsaXN0IiwidGVybSIsImRlZmluaXRpb24iLCJtb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX3BsYWluIiwibW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9zdGFydHRscyIsIm1vZHVsZV91c2Vyc3VpX3R0X3NlcnZlck5hbWVfbGRhcHMiLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5faGVhZGVyIiwiZGVzY3JpcHRpb24iLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5fZGVzYyIsImV4YW1wbGVzIiwiZXhhbXBsZXNIZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5fZXhhbXBsZXNIZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX2hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X2FkbWluTG9naW5fZGVzYyIsIm5vdGUiLCJtb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX25vdGUiLCJ2ZXJpZnlDZXJ0IiwibW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X2hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3ZlcmlmeV9kZXNjIiwid2FybmluZyIsIm1vZHVsZV91c2Vyc3VpX3R0X3ZlcmlmeV93YXJuaW5nX2hlYWRlciIsInRleHQiLCJtb2R1bGVfdXNlcnN1aV90dF92ZXJpZnlfd2FybmluZyIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJJZEF0dHJfaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlcklkQXR0cl9kZXNjIiwib3JnYW5pemF0aW9uYWxVbml0IiwibW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9oZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2Rlc2MiLCJtb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2V4YW1wbGVzSGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9ub3RlIiwidXNlckZpbHRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9kZXNjIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9leGFtcGxlc0hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfbm90ZSIsImVhY2giLCJpIiwiZWwiLCIkaWNvbiIsImNvbnRlbnQiLCJkYXRhIiwicG9wdXAiLCJodG1sIiwicG9zaXRpb24iLCJob3ZlcmFibGUiLCJkZWxheSIsInNob3ciLCJoaWRlIiwidmFyaWF0aW9uIiwidGxzTW9kZSIsInZlcmlmeSIsImlzIiwiZW5jcnlwdGVkIiwiY2FFbXB0eSIsInZhbCIsInRyaW0iLCJsZGFwRW5hYmxlZCIsInNob3dDZXJ0VGFiIiwiaGFzQ2xhc3MiLCJhcGkiLCJ1cmwiLCJnbG9iYWxSb290VXJsIiwibWV0aG9kIiwiYmVmb3JlU2VuZCIsInNldHRpbmdzIiwiYWRkQ2xhc3MiLCJyZW1vdmVDbGFzcyIsInN1Y2Nlc3NUZXN0IiwicmVzcG9uc2UiLCJzdWNjZXNzIiwib25TdWNjZXNzIiwibW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRTdWNjZXNzIiwibWVzc2FnZSIsImRldGFpbCIsIkFycmF5IiwiaXNBcnJheSIsImpvaW4iLCJvbkZhaWx1cmUiLCJtb2R1bGVfdXNlcnN1aV9UZXN0QmluZEZhaWx1cmUiLCJyZW1vdmUiLCJsZW5ndGgiLCJtb2R1bGVfdXNlcnN1aV9FbXB0eVNlcnZlclJlc3BvbnNlIiwiaW5kZXgiLCJ1c2VyIiwibG9naW4iLCJhZnRlciIsImNiQmVmb3JlU2VuZEZvcm0iLCJyZXN1bHQiLCJ1c2VMZGFwQXV0aE1ldGhvZCIsImNiQWZ0ZXJTZW5kRm9ybSIsIkZvcm0iLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFHQSxJQUFNQSxzQkFBc0IsR0FBRztBQUUzQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGdCQUFnQixFQUFFQyxDQUFDLENBQUMsdUJBQUQsQ0FQUTs7QUFTM0I7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSwwQkFBMEIsRUFBRUQsQ0FBQyxDQUFDLHFCQUFELENBZEY7O0FBZ0IzQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lFLEVBQUFBLGdDQUFnQyxFQUFFRixDQUFDLENBQUMsNEJBQUQsQ0FyQlI7O0FBdUIzQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRyxFQUFBQSxpQkFBaUIsRUFBRUgsQ0FBQyxDQUFDLGtCQUFELENBM0JPOztBQTZCM0I7QUFDSjtBQUNBO0FBQ0E7QUFDSUksRUFBQUEsUUFBUSxFQUFFSixDQUFDLENBQUMsNEJBQUQsQ0FqQ2dCOztBQW1DM0I7QUFDSjtBQUNBO0FBQ0E7QUFDSUssRUFBQUEsZ0JBQWdCLEVBQUVMLENBQUMsQ0FBQyxnQ0FBRCxDQXZDUTs7QUEwQzNCO0FBQ0o7QUFDQTtB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bWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsVHJhbnNsYXRlLCBGb3JtLCBQYnhBcGksIFRvb2x0aXBCdWlsZGVyICovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVaUluZGV4TGRhcCA9IHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGZvciBMREFQIGF1dGhlbnRpY2F0aW9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkdXNlTGRhcENoZWNrYm94OiAkKCcjdXNlLWxkYXAtYXV0aC1tZXRob2QnKSxcblxuICAgIC8qKlxuICAgICAqIFNldCBvZiBmb3JtIGZpZWxkcyB0byB1c2UgZm9yIExEQVAgYXV0aGVudGljYXRpb24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzOiAkKCcuZGlzYWJsZS1pZi1uby1sZGFwJyksXG5cbiAgICAvKipcbiAgICAgKiBTZXQgb2YgZWxlbWVudHMgb2YgdGhlIGZvcm0gYWRoZXJlZCB0byBsZGFwIGF1dGggbWV0aG9kLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbjogJCgnLnNob3ctb25seS1pZi1sZGFwLWVuYWJsZWQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrU2VnbWVudDogJCgnI2xkYXAtY2hlY2stYXV0aCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1sZGFwLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjaGVjayBjcmVkZW50aWFscyBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tBdXRoQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1jcmVkZW50aWFscy5idXR0b24nKSxcblxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdldHRpbmcgTERBUCB1c2VycyBsaXN0IGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0dldFVzZXJzQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50OiAkKCcjbGRhcC1jaGVjay1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBUTFMgdHJhbnNwb3J0LW1vZGUgc2VsZWN0b3IgKGxkYXAgLyBzdGFydHRscyAvIGxkYXBzKS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR1c2VUbHNEcm9wZG93bjogJCgnLnVzZS10bHMtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBzZXJ2ZXIgdHlwZSBkcm9wZG93bi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRsZGFwVHlwZURyb3Bkb3duOiAkKCcuc2VsZWN0LWxkYXAtZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjZXJ0aWZpY2F0ZS12YWxpZGF0aW9uIHRvZ2dsZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR2ZXJpZnlDZXJ0Q2hlY2tib3g6ICQoJ2lucHV0W25hbWU9XCJ2ZXJpZnlDZXJ0XCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgY3VzdG9tIENBIFBFTSB0ZXh0YXJlYS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjYUNlcnRUZXh0YXJlYTogJCgndGV4dGFyZWFbbmFtZT1cImNhQ2VydGlmaWNhdGVcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBUTFMtc3BlY2lmaWMgYmxvY2sgKHZlcmlmeS1jZXJ0IHRvZ2dsZSArIGluc2VjdXJlIGJhbm5lcikuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdGxzU2V0dGluZ3NCbG9jazogJCgnLnRscy1zZXR0aW5ncycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENBIGNlcnRpZmljYXRlIHNlZ21lbnQgc2hvd24gd2hlbiBlbmNyeXB0aW9uIGlzIG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNhQ2VydGlmaWNhdGVGaWVsZDogJCgnLmNhLWNlcnRpZmljYXRlLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgXCJpbnNlY3VyZSBUTFNcIiB3YXJuaW5nIChsZGFwcyB3aXRob3V0IHZlcmlmaWNhdGlvbikuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkaW5zZWN1cmVUbHNXYXJuaW5nOiAkKCcuaW5zZWN1cmUtdGxzLXdhcm5pbmcnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBcIkNBIG5vdCBwcm92aWRlZFwiIHdhcm5pbmcgaWNvbiBuZXh0IHRvIHRoZSBDQSBoZWFkZXIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2FNaXNzaW5nV2FybmluZzogJCgnLmNhLW1pc3Npbmctd2FybmluZycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHRlc3QtYmluZCBpY29uIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR0ZXN0QmluZEJ1dHRvbjogJCgnLnRlc3QtbGRhcC1iaW5kJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgaW5saW5lIHRlc3QtYmluZCByZXN1bHQgYmFubmVyLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHRlc3RCaW5kUmVzdWx0OiAkKCcudGVzdC1iaW5kLXJlc3VsdCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIExEQVAgc3ViLXRhYnMgbWVudSAoQ29ubmVjdGlvbiAvIENlcnRpZmljYXRlKS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzdWJUYWJzTWVudTogJCgnI21vZHVsZS11c2Vycy11aS1sZGFwLXN1Yi10YWJzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ2VydGlmaWNhdGUgc3ViLXRhYiBpdGVtIGluIHRoZSBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNlcnRpZmljYXRlVGFiOiAkKCcubGRhcC1jZXJ0LXRhYicpLFxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGlvbiBydWxlcyBmb3IgdGhlIGZvcm0gZmllbGRzLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFsaWRhdGVSdWxlczoge1xuICAgICAgICBzZXJ2ZXJOYW1lOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnc2VydmVyTmFtZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVTZXJ2ZXJOYW1lSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyUG9ydDoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3NlcnZlclBvcnQnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkbWluaXN0cmF0aXZlTG9naW46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdhZG1pbmlzdHJhdGl2ZUxvZ2luJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlTG9naW5Jc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBhZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSGlkZGVuOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYWRtaW5pc3RyYXRpdmVQYXNzd29yZEhpZGRlbicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYmFzZUROOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYmFzZUROJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUJhc2VETklzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHVzZXJJZEF0dHJpYnV0ZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3VzZXJJZEF0dHJpYnV0ZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuaW5pdGlhbGl6ZUZvcm0oKTtcblxuICAgICAgICAvLyBIYW5kbGUgZ2V0IHVzZXJzIGxpc3QgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuYXBpQ2FsbEdldExkYXBVc2VycygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5hcGlDYWxsQ2hlY2tBdXRoKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEdlbmVyYWwgbGRhcCBzd2l0Y2hlclxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VMZGFwQ2hlY2tib3guY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVWlJbmRleExkYXAub25DaGFuZ2VMZGFwQ2hlY2tib3gsXG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLm9uQ2hhbmdlTGRhcENoZWNrYm94KCk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcFR5cGVEcm9wZG93bi5kcm9wZG93bih7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5vbkNoYW5nZUxkYXBUeXBlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hhbmdlIFRMUyBwcm90b2NvbCDigJQgdGhyZWUtd2F5IHNlbGVjdG9yIChub25lIC8gc3RhcnR0bHMgLyBsZGFwcykuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRUbHNNb2RlID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAndGxzTW9kZScpIHx8ICdub25lJztcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlVGxzRHJvcGRvd24uZHJvcGRvd24oe1xuICAgICAgICAgICAgdmFsdWVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbGRhcDovLycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkOiBjdXJyZW50VGxzTW9kZSA9PT0gJ25vbmUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsZGFwOi8vICsgU1RBUlRUTFMnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ3N0YXJ0dGxzJyxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGN1cnJlbnRUbHNNb2RlID09PSAnc3RhcnR0bHMnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsZGFwczovLycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbGRhcHMnLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogY3VycmVudFRsc01vZGUgPT09ICdsZGFwcydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgb25DaGFuZ2UodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsICd0bHNNb2RlJywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDZXJ0aWZpY2F0ZSB2YWxpZGF0aW9uIHRvZ2dsZSDigJQgcmVmcmVzaCBVWCBzdGF0ZSBvbiBmbGlwLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR2ZXJpZnlDZXJ0Q2hlY2tib3gub24oJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUeXBpbmcgaW50byB0aGUgQ0EgdGV4dGFyZWEgY2xlYXJzIHRoZSBcIm1pc3NpbmcgQ0FcIiB3YXJuaW5nLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYUNlcnRUZXh0YXJlYS5vbignaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcblxuICAgICAgICAvLyBIYW5kbGUgdGVzdC1iaW5kIGljb24gYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmFwaUNhbGxUZXN0QmluZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIEZvbWFudGljIHN1Yi10YWJzIChDb25uZWN0aW9uIC8gQ2VydGlmaWNhdGUpLiBTY29wZWQgdG9cbiAgICAgICAgLy8gdGhlIExEQVAgZm9ybSdzIG1lbnUgc28gaXQgZG9lc24ndCBjb2xsaWRlIHdpdGggdGhlIHBhZ2UtbGV2ZWwgdGFicy5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kc3ViVGFic01lbnUuZmluZCgnLml0ZW0nKS50YWIoe1xuICAgICAgICAgICAgY29udGV4dDogbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iaixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRmllbGQtbGV2ZWwgaW5mbyB0b29sdGlwcyAobWlycm9yIG9mIE1vZHVsZUxkYXBTeW5jIFVYKS5cbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5pbml0aWFsaXplVG9vbHRpcHMoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2lyZXMgdG9vbHRpcHMgZm9yIGV2ZXJ5IGFubm90YXRlZCBmaWVsZCBvbiB0aGUgZm9ybS4gVXNlcyB0aGUgc2hhcmVkXG4gICAgICogVG9vbHRpcEJ1aWxkZXIgaGVscGVyIGZyb20gdGhlIGFkbWluIGNhYmluZXQgc28gdGhlIHBvcHVwIHN0cnVjdHVyZVxuICAgICAqIG1hdGNoZXMgdGhlIHJlc3Qgb2YgTWlrb1BCWC4gU2tpcHMgc2lsZW50bHkgaWYgVG9vbHRpcEJ1aWxkZXIgaGFzbid0XG4gICAgICogYmVlbiBsb2FkZWQg4oCUIHRoZSBwYWdlIHN0aWxsIHdvcmtzLCBqdXN0IHdpdGhvdXQgdGhlIGhvdmVyIGhpbnRzLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVUb29sdGlwcygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBUb29sdGlwQnVpbGRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvb2x0aXBDb25maWdzID0ge1xuICAgICAgICAgICAgc2VydmVyTmFtZTogVG9vbHRpcEJ1aWxkZXIuYnVpbGRDb250ZW50KHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX2hlYWRlcixcbiAgICAgICAgICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICAgICAgICAgIHsgdGVybTogJ2xkYXA6Ly8nLCBkZWZpbml0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9wbGFpbiB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRlcm06ICdsZGFwOi8vICsgU1RBUlRUTFMnLCBkZWZpbml0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9zdGFydHRscyB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRlcm06ICdsZGFwczovLycsIGRlZmluaXRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX2xkYXBzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgYmFzZUROOiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2Jhc2VETl9oZWFkZXIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5fZGVzYyxcbiAgICAgICAgICAgICAgICBleGFtcGxlczogWydkYz1taWtvLGRjPXJ1JywgJ2RjPWNvcnAsZGM9ZXhhbXBsZSxkYz1jb20nXSxcbiAgICAgICAgICAgICAgICBleGFtcGxlc0hlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2Jhc2VETl9leGFtcGxlc0hlYWRlcixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgYWRtaW5pc3RyYXRpdmVMb2dpbjogVG9vbHRpcEJ1aWxkZXIuYnVpbGRDb250ZW50KHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX2hlYWRlcixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2FkbWluTG9naW5fZGVzYyxcbiAgICAgICAgICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICdtaWtvcGJ4JyxcbiAgICAgICAgICAgICAgICAgICAgJ21pa29wYnhAbWlrby5ydScsXG4gICAgICAgICAgICAgICAgICAgICdNSUtPXFxcXG1pa29wYngnLFxuICAgICAgICAgICAgICAgICAgICAnQ049bWlrb3BieCxDTj1Vc2VycyxEQz1taWtvLERDPXJ1JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIG5vdGU6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX25vdGUsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHZlcmlmeUNlcnQ6IFRvb2x0aXBCdWlsZGVyLmJ1aWxkQ29udGVudCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X2hlYWRlcixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3ZlcmlmeV9kZXNjLFxuICAgICAgICAgICAgICAgIHdhcm5pbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X3dhcm5pbmdfaGVhZGVyLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X3dhcm5pbmcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdXNlcklkQXR0cmlidXRlOiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJJZEF0dHJfaGVhZGVyLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdXNlcklkQXR0cl9kZXNjLFxuICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXJtOiAnQWN0aXZlIERpcmVjdG9yeScsIGRlZmluaXRpb246ICdzYW1hY2NvdW50bmFtZSAvIHVzZXJQcmluY2lwYWxOYW1lJyB9LFxuICAgICAgICAgICAgICAgICAgICB7IHRlcm06ICdPcGVuTERBUCAvIEZyZWVJUEEnLCBkZWZpbml0aW9uOiAndWlkJyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG9yZ2FuaXphdGlvbmFsVW5pdDogVG9vbHRpcEJ1aWxkZXIuYnVpbGRDb250ZW50KHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2hlYWRlcixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X29yZ1VuaXRfZGVzYyxcbiAgICAgICAgICAgICAgICBleGFtcGxlczogWydPVT1TYWxlcyxEQz1taWtvLERDPXJ1JywgJ291PXBlb3BsZSxkYz1leGFtcGxlLGRjPWNvbSddLFxuICAgICAgICAgICAgICAgIGV4YW1wbGVzSGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9leGFtcGxlc0hlYWRlcixcbiAgICAgICAgICAgICAgICBub3RlOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9ub3RlLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB1c2VyRmlsdGVyOiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfaGVhZGVyLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9kZXNjLFxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiBbXG4gICAgICAgICAgICAgICAgICAgICcoJihvYmplY3RDbGFzcz11c2VyKShvYmplY3RDYXRlZ29yeT1QRVJTT04pKScsXG4gICAgICAgICAgICAgICAgICAgICcoJihvYmplY3RDbGFzcz11c2VyKShtZW1iZXJPZj1DTj1QQlggVXNlcnMsT1U9R3JvdXBzLERDPW1pa28sREM9cnUpKScsXG4gICAgICAgICAgICAgICAgICAgICcob2JqZWN0Q2xhc3M9aW5ldE9yZ1BlcnNvbiknLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgZXhhbXBsZXNIZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF91c2VyRmlsdGVyX2V4YW1wbGVzSGVhZGVyLFxuICAgICAgICAgICAgICAgIG5vdGU6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF91c2VyRmlsdGVyX25vdGUsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfTtcblxuICAgICAgICAkKCcuZmllbGQtaW5mby1pY29uJykuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRpY29uID0gJChlbCk7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gdG9vbHRpcENvbmZpZ3NbJGljb24uZGF0YSgnZmllbGQnKV07XG4gICAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkaWNvbi5wb3B1cCh7XG4gICAgICAgICAgICAgICAgaHRtbDogY29udGVudCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3RvcCByaWdodCcsXG4gICAgICAgICAgICAgICAgaG92ZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRlbGF5OiB7IHNob3c6IDMwMCwgaGlkZTogMTAwIH0sXG4gICAgICAgICAgICAgICAgdmFyaWF0aW9uOiAnZmxvd2luZycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlY29tcHV0ZXMgdmlzaWJpbGl0eSBvZiBUTFMtcmVsYXRlZCBVSSBiYXNlZCBvbiB0bHNNb2RlIC8gdmVyaWZ5Q2VydCAvIGNhQ2VydGlmaWNhdGUuXG4gICAgICogIC0gVGhlIFRMUyBzZXR0aW5ncyBibG9jayAodmVyaWZ5LWNlcnQgdG9nZ2xlICsgaW5zZWN1cmUgYmFubmVyKSBsaXZlc1xuICAgICAqICAgIG9uIHRoZSBDb25uZWN0aW9uIHN1Yi10YWIgYW5kIHNob3dzIG9ubHkgZm9yIGVuY3J5cHRlZCBtb2Rlcy5cbiAgICAgKiAgLSBUaGUgQ2VydGlmaWNhdGUgc3ViLXRhYiBpdGVtIGlzIHZpc2libGUgb25seSB3aGVuIExEQVAgYXV0aG9yaXphdGlvblxuICAgICAqICAgIGlzIGVuYWJsZWQgQU5EIHRoZSB2ZXJpZnlDZXJ0IHRvZ2dsZSBpcyBvbi4gVGhpcyBpcyB0aGUgZ2F0ZSB0aGVcbiAgICAgKiAgICBvcGVyYXRvciBhc2tlZCBmb3I6IHRoZSB0YWIgYXBwZWFycyBwcmVjaXNlbHkgd2hlbiBhIENBIGFjdHVhbGx5XG4gICAgICogICAgbWF0dGVycy4gSWYgdGhlIHVzZXIgd2FzIG9uIHRoZSBDZXJ0aWZpY2F0ZSB0YWIgYW5kIHRvZ2dsZXMgZWl0aGVyXG4gICAgICogICAgb2ZmLCBzbmFwIGJhY2sgdG8gdGhlIENvbm5lY3Rpb24gdGFiIHNvIHRoZXkgYXJlbid0IHN0cmFuZGVkIG9uIGFcbiAgICAgKiAgICBoaWRkZW4gc2VnbWVudC5cbiAgICAgKiAgLSBXYXJuaW5nIHRyaWFuZ2xlIG9uIHRoZSBDZXJ0aWZpY2F0ZSB0YWIgaGVhZGVyIGxpZ2h0cyB1cCB3aGVuXG4gICAgICogICAgdmVyaWZpY2F0aW9uIGlzIG9uIGJ1dCB0aGUgQ0EgdGV4dGFyZWEgaXMgZW1wdHkuXG4gICAgICogIC0gSW5zZWN1cmUtVExTIGJhbm5lciBsaWdodHMgdXAgb25seSBmb3IgbGRhcHM6Ly8gd2l0aG91dCB2ZXJpZmljYXRpb246XG4gICAgICogICAgdHJhZmZpYyBpcyBlbmNyeXB0ZWQgYnV0IHNlcnZlciBpZGVudGl0eSBpcyB1bnZlcmlmaWVkLlxuICAgICAqL1xuICAgIHJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgY29uc3QgdGxzTW9kZSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywgJ3Rsc01vZGUnKSB8fCAnbm9uZSc7XG4gICAgICAgIGNvbnN0IHZlcmlmeSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHZlcmlmeUNlcnRDaGVja2JveC5pcygnOmNoZWNrZWQnKTtcbiAgICAgICAgY29uc3QgZW5jcnlwdGVkID0gdGxzTW9kZSA9PT0gJ3N0YXJ0dGxzJyB8fCB0bHNNb2RlID09PSAnbGRhcHMnO1xuICAgICAgICBjb25zdCBjYUVtcHR5ID0gKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNhQ2VydFRleHRhcmVhLnZhbCgpIHx8ICcnKS50cmltKCkgPT09ICcnO1xuICAgICAgICBjb25zdCBsZGFwRW5hYmxlZCA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpO1xuXG4gICAgICAgIGlmIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRsc1NldHRpbmdzQmxvY2suc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGxzU2V0dGluZ3NCbG9jay5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDZXJ0aWZpY2F0ZSBzdWItdGFiOiBnYXRlIHN0cmljdGx5IG9uIExEQVAtb24gKyB2ZXJpZnktb24sIHJlZ2FyZGxlc3NcbiAgICAgICAgLy8gb2YgdGxzTW9kZS4gSWYgdGhlIG9wZXJhdG9yIHR1cm5lZCB2YWxpZGF0aW9uIG9uIGJ1dCBzdGF5ZWQgb24gcGxhaW5cbiAgICAgICAgLy8gTERBUCwgd2Ugc3RpbGwgbGV0IHRoZW0gcGFzdGUgYSBDQSDigJQgc3dpdGNoaW5nIHRvIFNUQVJUVExTL0xEQVBTIGxhdGVyXG4gICAgICAgIC8vIHNob3VsZG4ndCBsb3NlIHRoZSB3b3JrLlxuICAgICAgICBjb25zdCBzaG93Q2VydFRhYiA9IGxkYXBFbmFibGVkICYmIHZlcmlmeTtcbiAgICAgICAgaWYgKHNob3dDZXJ0VGFiKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjZXJ0aWZpY2F0ZVRhYi5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjZXJ0aWZpY2F0ZVRhYi5oaWRlKCk7XG4gICAgICAgICAgICAvLyBTbmFwIGJhY2sgdG8gQ29ubmVjdGlvbiBpZiBDZXJ0aWZpY2F0ZSB3YXMgdGhlIGFjdGl2ZSB0YWIuXG4gICAgICAgICAgICBpZiAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2VydGlmaWNhdGVUYWIuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kc3ViVGFic01lbnVcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJy5pdGVtW2RhdGEtdGFiPVwibGRhcC1jb25uZWN0aW9uXCJdJylcbiAgICAgICAgICAgICAgICAgICAgLnRhYignY2hhbmdlIHRhYicsICdsZGFwLWNvbm5lY3Rpb24nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaG93Q2VydFRhYiAmJiBjYUVtcHR5KSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjYU1pc3NpbmdXYXJuaW5nLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNhTWlzc2luZ1dhcm5pbmcuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRsc01vZGUgPT09ICdsZGFwcycgJiYgIXZlcmlmeSkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kaW5zZWN1cmVUbHNXYXJuaW5nLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGluc2VjdXJlVGxzV2FybmluZy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgYSBsaWdodHdlaWdodCBiaW5kIGNoZWNrIGFnYWluc3QgdGhlIGN1cnJlbnQgZm9ybSB2YWx1ZXMuXG4gICAgICogU2hvd3MgYSBncmVlbiBzdWNjZXNzIG1lc3NhZ2Ugb3IgYSByZWQgZXJyb3IgbWVzc2FnZSBpbmxpbmUgdW5kZXJcbiAgICAgKiB0aGUgYWRtaW4tY3JlZGVudGlhbHMgcm93LlxuICAgICAqL1xuICAgIGFwaUNhbGxUZXN0QmluZCgpIHtcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvbGRhcC1jb25maWcvdGVzdC1iaW5kYCxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYmVmb3JlU2VuZChzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kQnV0dG9uLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRSZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdwb3NpdGl2ZSBuZWdhdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5oaWRlKCk7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5zdWNjZXNzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRTdWNjZXNzO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IEFycmF5LmlzQXJyYXkocmVzcG9uc2UubWVzc2FnZSkgPyByZXNwb25zZS5tZXNzYWdlLmpvaW4oJyAnKSA6IHJlc3BvbnNlLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBkZXRhaWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRSZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCduZWdhdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygncG9zaXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAudGV4dCh0ZXh0KVxuICAgICAgICAgICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRmFpbHVyZShyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRGYWlsdXJlO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IEFycmF5LmlzQXJyYXkocmVzcG9uc2UubWVzc2FnZSkgPyByZXNwb25zZS5tZXNzYWdlLmpvaW4oJyAnKSA6IHJlc3BvbnNlLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSBgJHt0ZXh0fTogJHtkZXRhaWx9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZFJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bvc2l0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCduZWdhdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KHRleHQpXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgY2hhbmdlIExEQVAgZHJvcGRvd24uXG4gICAgICovXG4gICAgb25DaGFuZ2VMZGFwVHlwZSh2YWx1ZSl7XG4gICAgICAgIGlmKHZhbHVlPT09J09wZW5MREFQJyl7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJJZEF0dHJpYnV0ZScsJ3VpZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdhZG1pbmlzdHJhdGl2ZUxvZ2luJywnY249YWRtaW4sZGM9ZXhhbXBsZSxkYz1jb20nKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywndXNlckZpbHRlcicsJyhvYmplY3RDbGFzcz1pbmV0T3JnUGVyc29uKScpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdiYXNlRE4nLCdkYz1leGFtcGxlLGRjPWNvbScpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdvcmdhbml6YXRpb25hbFVuaXQnLCdvdT11c2VycywgZGM9ZG9tYWluLCBkYz1jb20nKTtcbiAgICAgICAgfSBlbHNlIGlmKHZhbHVlPT09J0FjdGl2ZURpcmVjdG9yeScpe1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdhZG1pbmlzdHJhdGl2ZUxvZ2luJywnYWRtaW4nKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywndXNlcklkQXR0cmlidXRlJywnc2FtYWNjb3VudG5hbWUnKVxuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCd1c2VyRmlsdGVyJywnKCYob2JqZWN0Q2xhc3M9dXNlcikob2JqZWN0Q2F0ZWdvcnk9UEVSU09OKSknKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnYmFzZUROJywnZGM9ZXhhbXBsZSxkYz1jb20nKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywnb3JnYW5pemF0aW9uYWxVbml0Jywnb3U9dXNlcnMsIGRjPWRvbWFpbiwgZGM9Y29tJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZ2V0IExEQVAgdXNlcnMgbGlzdCBidXR0b24gY2xpY2suXG4gICAgICovXG4gICAgYXBpQ2FsbEdldExkYXBVc2Vycygpe1xuICAgICAgICAkLmFwaSh7XG4gICAgICAgICAgICB1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9nZXQtYXZhaWxhYmxlLWxkYXAtdXNlcnNgLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBiZWZvcmVTZW5kKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tHZXRVc2Vyc0J1dHRvbi5hZGRDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VjY2Vzc1Rlc3QocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5zdWNjZXNzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlcyB0aGUgc3VjY2Vzc2Z1bCByZXNwb25zZSBvZiB0aGUgJ2dldC1hdmFpbGFibGUtbGRhcC11c2VycycgQVBJIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvblN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbGV0IGh0bWwgPSAnPHVsIGNsYXNzPVwidWkgbGlzdFwiPic7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gYDxsaSBjbGFzcz1cIml0ZW1cIj4ke2dsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9FbXB0eVNlcnZlclJlc3BvbnNlfTwvbGk+YDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZGF0YSwgKGluZGV4LCB1c2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sICs9IGA8bGkgY2xhc3M9XCJpdGVtXCI+JHt1c2VyLm5hbWV9ICgke3VzZXIubG9naW59KTwvbGk+YDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzwvdWw+JztcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBwb3NpdGl2ZVwiPiR7aHRtbH08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIGZhaWx1cmUgcmVzcG9uc2Ugb2YgdGhlICdnZXQtYXZhaWxhYmxlLWxkYXAtdXNlcnMnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25GYWlsdXJlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrR2V0VXNlcnNCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggbmVnYXRpdmVcIj48aSBjbGFzcz1cImljb24gZXhjbGFtYXRpb24gY2lyY2xlXCI+PC9pPiR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgY2hlY2sgTERBUCBhdXRoZW50aWNhdGlvbiBidXR0b24gY2xpY2suXG4gICAgICovXG4gICAgYXBpQ2FsbENoZWNrQXV0aCgpe1xuICAgICAgICAkLmFwaSh7XG4gICAgICAgICAgICB1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9jaGVjay1hdXRoYCxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYmVmb3JlU2VuZChzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5hZGRDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VjY2Vzc1Rlc3QocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5zdWNjZXNzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlcyB0aGUgc3VjY2Vzc2Z1bCByZXNwb25zZSBvZiB0aGUgJ2NoZWNrLWxkYXAtYXV0aCcgQVBJIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvblN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tBdXRoQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBwb3NpdGl2ZVwiPjxpIGNsYXNzPVwiaWNvbiBjaGVja1wiPjwvaT4gJHtyZXNwb25zZS5tZXNzYWdlfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlcyB0aGUgZmFpbHVyZSByZXNwb25zZSBvZiB0aGUgJ2NoZWNrLWxkYXAtYXV0aCcgQVBJIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbkZhaWx1cmU6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tBdXRoQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBuZWdhdGl2ZVwiPjxpIGNsYXNzPVwiaWNvbiBleGNsYW1hdGlvbiBjaXJjbGVcIj48L2k+JHtyZXNwb25zZS5tZXNzYWdlfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyB0aGUgY2hhbmdlIG9mIHRoZSBMREFQIGNoZWNrYm94LlxuICAgICAqL1xuICAgIG9uQ2hhbmdlTGRhcENoZWNrYm94KCl7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VMZGFwQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncy5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1FbGVtZW50c0F2YWlsYWJsZUlmTGRhcElzT24uc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncy5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1FbGVtZW50c0F2YWlsYWJsZUlmTGRhcElzT24uaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBDZXJ0aWZpY2F0ZSBzdWItdGFiIGlzIGdhdGVkIG9uIExEQVAtb24gKyB2ZXJpZnlDZXJ0OyByZWNvbXB1dGVcbiAgICAgICAgLy8gdmlzaWJpbGl0eSBldmVyeSB0aW1lIHRoZSBtYXN0ZXIgdG9nZ2xlIGZsaXBzIHNvIGl0IGRpc2FwcGVhcnMgd2hlblxuICAgICAgICAvLyBMREFQIGlzIHR1cm5lZCBvZmYgYW5kIHJlYXBwZWFycyAod2l0aCBwcmlvciB2ZXJpZnkgc3RhdGUpIHdoZW4gb24uXG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIC0gVGhlIHNldHRpbmdzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSAtIFRoZSBtb2RpZmllZCBzZXR0aW5ncyBvYmplY3QuXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgcmVzdWx0LmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKXtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLnVzZUxkYXBBdXRoTWV0aG9kID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEudXNlTGRhcEF1dGhNZXRob2QgPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcbiAgICAgICAgLy8gQ2FsbGJhY2sgaW1wbGVtZW50YXRpb25cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmNiQmVmb3JlU2VuZEZvcm07XG4gICAgICAgIEZvcm0uY2JBZnRlclNlbmRGb3JtID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==