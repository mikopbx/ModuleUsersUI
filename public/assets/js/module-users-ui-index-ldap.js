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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXgtbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwIiwiJHVzZUxkYXBDaGVja2JveCIsIiQiLCIkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncyIsIiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uIiwiJGxkYXBDaGVja1NlZ21lbnQiLCIkZm9ybU9iaiIsIiRjaGVja0F1dGhCdXR0b24iLCIkY2hlY2tHZXRVc2Vyc0J1dHRvbiIsIiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQiLCIkdXNlVGxzRHJvcGRvd24iLCIkbGRhcFR5cGVEcm9wZG93biIsIiR2ZXJpZnlDZXJ0Q2hlY2tib3giLCIkY2FDZXJ0VGV4dGFyZWEiLCIkdGxzU2V0dGluZ3NCbG9jayIsIiRjYUNlcnRpZmljYXRlRmllbGQiLCIkaW5zZWN1cmVUbHNXYXJuaW5nIiwiJGNhTWlzc2luZ1dhcm5pbmciLCIkdGVzdEJpbmRCdXR0b24iLCIkdGVzdEJpbmRSZXN1bHQiLCIkc3ViVGFic01lbnUiLCIkY2VydGlmaWNhdGVUYWIiLCJ2YWxpZGF0ZVJ1bGVzIiwic2VydmVyTmFtZSIsImlkZW50aWZpZXIiLCJydWxlcyIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5Iiwic2VydmVyUG9ydCIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZUxvZ2luIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSIsImFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4iLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5IiwiYmFzZUROIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5IiwidXNlcklkQXR0cmlidXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5IiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVGb3JtIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJhcGlDYWxsR2V0TGRhcFVzZXJzIiwiYXBpQ2FsbENoZWNrQXV0aCIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImRyb3Bkb3duIiwib25DaGFuZ2VMZGFwVHlwZSIsImN1cnJlbnRUbHNNb2RlIiwiZm9ybSIsInZhbHVlcyIsIm5hbWUiLCJ2YWx1ZSIsInNlbGVjdGVkIiwicmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5IiwiYXBpQ2FsbFRlc3RCaW5kIiwiZmluZCIsInRhYiIsImNvbnRleHQiLCJpbml0aWFsaXplVG9vbHRpcHMiLCJUb29sdGlwQnVpbGRlciIsInRvb2x0aXBDb25maWdzIiwiYnVpbGRDb250ZW50IiwiaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9oZWFkZXIiLCJsaXN0IiwidGVybSIsImRlZmluaXRpb24iLCJtb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX3BsYWluIiwibW9kdWxlX3VzZXJzdWlfdHRfc2VydmVyTmFtZV9zdGFydHRscyIsIm1vZHVsZV91c2Vyc3VpX3R0X3NlcnZlck5hbWVfbGRhcHMiLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5faGVhZGVyIiwiZGVzY3JpcHRpb24iLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5fZGVzYyIsImV4YW1wbGVzIiwiZXhhbXBsZXNIZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9iYXNlRE5fZXhhbXBsZXNIZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX2hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X2FkbWluTG9naW5fZGVzYyIsIm5vdGUiLCJtb2R1bGVfdXNlcnN1aV90dF9hZG1pbkxvZ2luX25vdGUiLCJ2ZXJpZnlDZXJ0IiwibW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X2hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3ZlcmlmeV9kZXNjIiwid2FybmluZyIsIm1vZHVsZV91c2Vyc3VpX3R0X3ZlcmlmeV93YXJuaW5nX2hlYWRlciIsInRleHQiLCJtb2R1bGVfdXNlcnN1aV90dF92ZXJpZnlfd2FybmluZyIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJJZEF0dHJfaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlcklkQXR0cl9kZXNjIiwib3JnYW5pemF0aW9uYWxVbml0IiwibW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9oZWFkZXIiLCJtb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2Rlc2MiLCJtb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2V4YW1wbGVzSGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9ub3RlIiwidXNlckZpbHRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfaGVhZGVyIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9kZXNjIiwibW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9leGFtcGxlc0hlYWRlciIsIm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfbm90ZSIsImVhY2giLCJpIiwiZWwiLCIkaWNvbiIsImNvbnRlbnQiLCJkYXRhIiwicG9wdXAiLCJodG1sIiwicG9zaXRpb24iLCJob3ZlcmFibGUiLCJkZWxheSIsInNob3ciLCJoaWRlIiwidmFyaWF0aW9uIiwidGxzTW9kZSIsInZlcmlmeSIsImlzIiwiZW5jcnlwdGVkIiwiY2FFbXB0eSIsInZhbCIsInRyaW0iLCJsZGFwRW5hYmxlZCIsInNob3dDZXJ0VGFiIiwiaGFzQ2xhc3MiLCJhcGkiLCJ1cmwiLCJnbG9iYWxSb290VXJsIiwibWV0aG9kIiwiYmVmb3JlU2VuZCIsInNldHRpbmdzIiwiYWRkQ2xhc3MiLCJyZW1vdmVDbGFzcyIsInN1Y2Nlc3NUZXN0IiwicmVzcG9uc2UiLCJzdWNjZXNzIiwib25TdWNjZXNzIiwibW9kdWxlX3VzZXJzdWlfVGVzdEJpbmRTdWNjZXNzIiwibWVzc2FnZSIsImRldGFpbCIsIkFycmF5IiwiaXNBcnJheSIsImpvaW4iLCJvbkZhaWx1cmUiLCJtb2R1bGVfdXNlcnN1aV9UZXN0QmluZEZhaWx1cmUiLCJyZW1vdmUiLCJsZW5ndGgiLCJnbG9iYWx0cmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9FbXB0eVNlcnZlclJlc3BvbnNlIiwiaW5kZXgiLCJ1c2VyIiwibG9naW4iLCJhZnRlciIsImNiQmVmb3JlU2VuZEZvcm0iLCJyZXN1bHQiLCJ1c2VMZGFwQXV0aE1ldGhvZCIsImNiQWZ0ZXJTZW5kRm9ybSIsIkZvcm0iLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFHQSxJQUFNQSxzQkFBc0IsR0FBRztBQUUzQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGdCQUFnQixFQUFFQyxDQUFDLENBQUMsdUJBQUQsQ0FQUTs7QUFTM0I7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSwwQkFBMEIsRUFBRUQsQ0FBQyxDQUFDLHFCQUFELENBZEY7O0FBZ0IzQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lFLEVBQUFBLGdDQUFnQyxFQUFFRixDQUFDLENBQUMsNEJBQUQsQ0FyQlI7O0FBdUIzQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRyxFQUFBQSxpQkFBaUIsRUFBRUgsQ0FBQyxDQUFDLGtCQUFELENBM0JPOztBQTZCM0I7QUFDSjtBQUNBO0FBQ0E7QUFDSUksRUFBQUEsUUFBUSxFQUFFSixDQUFDLENBQUMsNEJBQUQsQ0FqQ2dCOztBQW1DM0I7QUFDSjtBQUNBO0FBQ0E7QUFDSUssRUFBQUEsZ0JBQWdCLEVBQUVMLENBQUMsQ0FBQyxnQ0FBRCxDQXZDUTs7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aG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIFBieEFwaSwgVG9vbHRpcEJ1aWxkZXIgKi9cblxuXG5jb25zdCBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwID0ge1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tib3ggZm9yIExEQVAgYXV0aGVudGljYXRpb24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICR1c2VMZGFwQ2hlY2tib3g6ICQoJyN1c2UtbGRhcC1hdXRoLW1ldGhvZCcpLFxuXG4gICAgLyoqXG4gICAgICogU2V0IG9mIGZvcm0gZmllbGRzIHRvIHVzZSBmb3IgTERBUCBhdXRoZW50aWNhdGlvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3M6ICQoJy5kaXNhYmxlLWlmLW5vLWxkYXAnKSxcblxuICAgIC8qKlxuICAgICAqIFNldCBvZiBlbGVtZW50cyBvZiB0aGUgZm9ybSBhZGhlcmVkIHRvIGxkYXAgYXV0aCBtZXRob2QuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uOiAkKCcuc2hvdy1vbmx5LWlmLWxkYXAtZW5hYmxlZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGxkYXAgY2hlY2sgc2VnbWVudC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRsZGFwQ2hlY2tTZWdtZW50OiAkKCcjbGRhcC1jaGVjay1hdXRoJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZm9ybS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRmb3JtT2JqOiAkKCcjbW9kdWxlLXVzZXJzLXVpLWxkYXAtZm9ybScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGNoZWNrIGNyZWRlbnRpYWxzIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0F1dGhCdXR0b246ICQoJy5jaGVjay1sZGFwLWNyZWRlbnRpYWxzLmJ1dHRvbicpLFxuXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZ2V0dGluZyBMREFQIHVzZXJzIGxpc3QgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrR2V0VXNlcnNCdXR0b246ICQoJy5jaGVjay1sZGFwLWdldC11c2VycycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGxkYXAgY2hlY2sgc2VnbWVudC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQ6ICQoJyNsZGFwLWNoZWNrLWdldC11c2VycycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIFRMUyB0cmFuc3BvcnQtbW9kZSBzZWxlY3RvciAobGRhcCAvIHN0YXJ0dGxzIC8gbGRhcHMpLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVzZVRsc0Ryb3Bkb3duOiAkKCcudXNlLXRscy1kcm9wZG93bicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHNlcnZlciB0eXBlIGRyb3Bkb3duLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGxkYXBUeXBlRHJvcGRvd246ICQoJy5zZWxlY3QtbGRhcC1maWVsZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGNlcnRpZmljYXRlLXZhbGlkYXRpb24gdG9nZ2xlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHZlcmlmeUNlcnRDaGVja2JveDogJCgnaW5wdXRbbmFtZT1cInZlcmlmeUNlcnRcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjdXN0b20gQ0EgUEVNIHRleHRhcmVhLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNhQ2VydFRleHRhcmVhOiAkKCd0ZXh0YXJlYVtuYW1lPVwiY2FDZXJ0aWZpY2F0ZVwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIFRMUy1zcGVjaWZpYyBibG9jayAodmVyaWZ5LWNlcnQgdG9nZ2xlICsgaW5zZWN1cmUgYmFubmVyKS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR0bHNTZXR0aW5nc0Jsb2NrOiAkKCcudGxzLXNldHRpbmdzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0EgY2VydGlmaWNhdGUgc2VnbWVudCBzaG93biB3aGVuIGVuY3J5cHRpb24gaXMgb24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2FDZXJ0aWZpY2F0ZUZpZWxkOiAkKCcuY2EtY2VydGlmaWNhdGUtZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBcImluc2VjdXJlIFRMU1wiIHdhcm5pbmcgKGxkYXBzIHdpdGhvdXQgdmVyaWZpY2F0aW9uKS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRpbnNlY3VyZVRsc1dhcm5pbmc6ICQoJy5pbnNlY3VyZS10bHMtd2FybmluZycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIFwiQ0Egbm90IHByb3ZpZGVkXCIgd2FybmluZyBpY29uIG5leHQgdG8gdGhlIENBIGhlYWRlci5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjYU1pc3NpbmdXYXJuaW5nOiAkKCcuY2EtbWlzc2luZy13YXJuaW5nJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgdGVzdC1iaW5kIGljb24gYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHRlc3RCaW5kQnV0dG9uOiAkKCcudGVzdC1sZGFwLWJpbmQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBpbmxpbmUgdGVzdC1iaW5kIHJlc3VsdCBiYW5uZXIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdGVzdEJpbmRSZXN1bHQ6ICQoJy50ZXN0LWJpbmQtcmVzdWx0JyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgTERBUCBzdWItdGFicyBtZW51IChDb25uZWN0aW9uIC8gQ2VydGlmaWNhdGUpLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHN1YlRhYnNNZW51OiAkKCcjbW9kdWxlLXVzZXJzLXVpLWxkYXAtc3ViLXRhYnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDZXJ0aWZpY2F0ZSBzdWItdGFiIGl0ZW0gaW4gdGhlIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2VydGlmaWNhdGVUYWI6ICQoJy5sZGFwLWNlcnQtdGFiJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIHNlcnZlck5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdzZXJ2ZXJOYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBzZXJ2ZXJQb3J0OiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnc2VydmVyUG9ydCcsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVTZXJ2ZXJQb3J0SXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRtaW5pc3RyYXRpdmVMb2dpbjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2FkbWluaXN0cmF0aXZlTG9naW4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQWRtaW5pc3RyYXRpdmVMb2dpbklzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdhZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSGlkZGVuJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBiYXNlRE46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdiYXNlRE4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQmFzZUROSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgdXNlcklkQXR0cmlidXRlOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAndXNlcklkQXR0cmlidXRlJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVVzZXJJZEF0dHJpYnV0ZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtb2R1bGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5pbml0aWFsaXplRm9ybSgpO1xuXG4gICAgICAgIC8vIEhhbmRsZSBnZXQgdXNlcnMgbGlzdCBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tHZXRVc2Vyc0J1dHRvbi5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5hcGlDYWxsR2V0TGRhcFVzZXJzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBjaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tBdXRoQnV0dG9uLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmFwaUNhbGxDaGVja0F1dGgoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR2VuZXJhbCBsZGFwIHN3aXRjaGVyXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5vbkNoYW5nZUxkYXBDaGVja2JveCxcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAub25DaGFuZ2VMZGFwQ2hlY2tib3goKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwVHlwZURyb3Bkb3duLmRyb3Bkb3duKHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLm9uQ2hhbmdlTGRhcFR5cGUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBjaGFuZ2UgVExTIHByb3RvY29sIOKAlCB0aHJlZS13YXkgc2VsZWN0b3IgKG5vbmUgLyBzdGFydHRscyAvIGxkYXBzKS5cbiAgICAgICAgY29uc3QgY3VycmVudFRsc01vZGUgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsICd0bHNNb2RlJykgfHwgJ25vbmUnO1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR1c2VUbHNEcm9wZG93bi5kcm9wZG93bih7XG4gICAgICAgICAgICB2YWx1ZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdsZGFwOi8vJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGN1cnJlbnRUbHNNb2RlID09PSAnbm9uZSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2xkYXA6Ly8gKyBTVEFSVFRMUycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnc3RhcnR0bHMnLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogY3VycmVudFRsc01vZGUgPT09ICdzdGFydHRscydcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2xkYXBzOi8vJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdsZGFwcycsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkOiBjdXJyZW50VGxzTW9kZSA9PT0gJ2xkYXBzJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvbkNoYW5nZSh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywgJ3Rsc01vZGUnLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENlcnRpZmljYXRlIHZhbGlkYXRpb24gdG9nZ2xlIOKAlCByZWZyZXNoIFVYIHN0YXRlIG9uIGZsaXAuXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHZlcmlmeUNlcnRDaGVja2JveC5vbignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFR5cGluZyBpbnRvIHRoZSBDQSB0ZXh0YXJlYSBjbGVhcnMgdGhlIFwibWlzc2luZyBDQVwiIHdhcm5pbmcuXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNhQ2VydFRleHRhcmVhLm9uKCdpbnB1dCcsICgpID0+IHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAucmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSgpO1xuXG4gICAgICAgIC8vIEhhbmRsZSB0ZXN0LWJpbmQgaWNvbiBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuYXBpQ2FsbFRlc3RCaW5kKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgRm9tYW50aWMgc3ViLXRhYnMgKENvbm5lY3Rpb24gLyBDZXJ0aWZpY2F0ZSkuIFNjb3BlZCB0b1xuICAgICAgICAvLyB0aGUgTERBUCBmb3JtJ3MgbWVudSBzbyBpdCBkb2Vzbid0IGNvbGxpZGUgd2l0aCB0aGUgcGFnZS1sZXZlbCB0YWJzLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRzdWJUYWJzTWVudS5maW5kKCcuaXRlbScpLnRhYih7XG4gICAgICAgICAgICBjb250ZXh0OiBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBGaWVsZC1sZXZlbCBpbmZvIHRvb2x0aXBzIChtaXJyb3Igb2YgTW9kdWxlTGRhcFN5bmMgVVgpLlxuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmluaXRpYWxpemVUb29sdGlwcygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaXJlcyB0b29sdGlwcyBmb3IgZXZlcnkgYW5ub3RhdGVkIGZpZWxkIG9uIHRoZSBmb3JtLiBVc2VzIHRoZSBzaGFyZWRcbiAgICAgKiBUb29sdGlwQnVpbGRlciBoZWxwZXIgZnJvbSB0aGUgYWRtaW4gY2FiaW5ldCBzbyB0aGUgcG9wdXAgc3RydWN0dXJlXG4gICAgICogbWF0Y2hlcyB0aGUgcmVzdCBvZiBNaWtvUEJYLiBTa2lwcyBzaWxlbnRseSBpZiBUb29sdGlwQnVpbGRlciBoYXNuJ3RcbiAgICAgKiBiZWVuIGxvYWRlZCDigJQgdGhlIHBhZ2Ugc3RpbGwgd29ya3MsIGp1c3Qgd2l0aG91dCB0aGUgaG92ZXIgaGludHMuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZVRvb2x0aXBzKCkge1xuICAgICAgICBpZiAodHlwZW9mIFRvb2x0aXBCdWlsZGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9vbHRpcENvbmZpZ3MgPSB7XG4gICAgICAgICAgICBzZXJ2ZXJOYW1lOiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3NlcnZlck5hbWVfaGVhZGVyLFxuICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXJtOiAnbGRhcDovLycsIGRlZmluaXRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX3BsYWluIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgdGVybTogJ2xkYXA6Ly8gKyBTVEFSVFRMUycsIGRlZmluaXRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9zZXJ2ZXJOYW1lX3N0YXJ0dGxzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgdGVybTogJ2xkYXBzOi8vJywgZGVmaW5pdGlvbjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3NlcnZlck5hbWVfbGRhcHMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBiYXNlRE46IFRvb2x0aXBCdWlsZGVyLmJ1aWxkQ29udGVudCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfYmFzZUROX2hlYWRlcixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2Jhc2VETl9kZXNjLFxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiBbJ2RjPW1pa28sZGM9cnUnLCAnZGM9Y29ycCxkYz1leGFtcGxlLGRjPWNvbSddLFxuICAgICAgICAgICAgICAgIGV4YW1wbGVzSGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfYmFzZUROX2V4YW1wbGVzSGVhZGVyLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBhZG1pbmlzdHJhdGl2ZUxvZ2luOiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2FkbWluTG9naW5faGVhZGVyLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfYWRtaW5Mb2dpbl9kZXNjLFxuICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgJ21pa29wYngnLFxuICAgICAgICAgICAgICAgICAgICAnbWlrb3BieEBtaWtvLnJ1JyxcbiAgICAgICAgICAgICAgICAgICAgJ01JS09cXFxcbWlrb3BieCcsXG4gICAgICAgICAgICAgICAgICAgICdDTj1taWtvcGJ4LENOPVVzZXJzLERDPW1pa28sREM9cnUnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgbm90ZTogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X2FkbWluTG9naW5fbm90ZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdmVyaWZ5Q2VydDogVG9vbHRpcEJ1aWxkZXIuYnVpbGRDb250ZW50KHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF92ZXJpZnlfaGVhZGVyLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdmVyaWZ5X2Rlc2MsXG4gICAgICAgICAgICAgICAgd2FybmluZzoge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF92ZXJpZnlfd2FybmluZ19oZWFkZXIsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF92ZXJpZnlfd2FybmluZyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB1c2VySWRBdHRyaWJ1dGU6IFRvb2x0aXBCdWlsZGVyLmJ1aWxkQ29udGVudCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdXNlcklkQXR0cl9oZWFkZXIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF91c2VySWRBdHRyX2Rlc2MsXG4gICAgICAgICAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAgICAgICAgICB7IHRlcm06ICdBY3RpdmUgRGlyZWN0b3J5JywgZGVmaW5pdGlvbjogJ3NhbWFjY291bnRuYW1lIC8gdXNlclByaW5jaXBhbE5hbWUnIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgdGVybTogJ09wZW5MREFQIC8gRnJlZUlQQScsIGRlZmluaXRpb246ICd1aWQnIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgb3JnYW5pemF0aW9uYWxVbml0OiBUb29sdGlwQnVpbGRlci5idWlsZENvbnRlbnQoe1xuICAgICAgICAgICAgICAgIGhlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X29yZ1VuaXRfaGVhZGVyLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfb3JnVW5pdF9kZXNjLFxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiBbJ09VPVNhbGVzLERDPW1pa28sREM9cnUnLCAnb3U9cGVvcGxlLGRjPWV4YW1wbGUsZGM9Y29tJ10sXG4gICAgICAgICAgICAgICAgZXhhbXBsZXNIZWFkZXI6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X2V4YW1wbGVzSGVhZGVyLFxuICAgICAgICAgICAgICAgIG5vdGU6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF9vcmdVbml0X25vdGUsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHVzZXJGaWx0ZXI6IFRvb2x0aXBCdWlsZGVyLmJ1aWxkQ29udGVudCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfdHRfdXNlckZpbHRlcl9oZWFkZXIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV90dF91c2VyRmlsdGVyX2Rlc2MsXG4gICAgICAgICAgICAgICAgZXhhbXBsZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgJygmKG9iamVjdENsYXNzPXVzZXIpKG9iamVjdENhdGVnb3J5PVBFUlNPTikpJyxcbiAgICAgICAgICAgICAgICAgICAgJygmKG9iamVjdENsYXNzPXVzZXIpKG1lbWJlck9mPUNOPVBCWCBVc2VycyxPVT1Hcm91cHMsREM9bWlrbyxEQz1ydSkpJyxcbiAgICAgICAgICAgICAgICAgICAgJyhvYmplY3RDbGFzcz1pbmV0T3JnUGVyc29uKScsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBleGFtcGxlc0hlYWRlcjogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfZXhhbXBsZXNIZWFkZXIsXG4gICAgICAgICAgICAgICAgbm90ZTogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX3R0X3VzZXJGaWx0ZXJfbm90ZSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9O1xuXG4gICAgICAgICQoJy5maWVsZC1pbmZvLWljb24nKS5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGljb24gPSAkKGVsKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0b29sdGlwQ29uZmlnc1skaWNvbi5kYXRhKCdmaWVsZCcpXTtcbiAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRpY29uLnBvcHVwKHtcbiAgICAgICAgICAgICAgICBodG1sOiBjb250ZW50LFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAndG9wIHJpZ2h0JyxcbiAgICAgICAgICAgICAgICBob3ZlcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZGVsYXk6IHsgc2hvdzogMzAwLCBoaWRlOiAxMDAgfSxcbiAgICAgICAgICAgICAgICB2YXJpYXRpb246ICdmbG93aW5nJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVjb21wdXRlcyB2aXNpYmlsaXR5IG9mIFRMUy1yZWxhdGVkIFVJIGJhc2VkIG9uIHRsc01vZGUgLyB2ZXJpZnlDZXJ0IC8gY2FDZXJ0aWZpY2F0ZS5cbiAgICAgKiAgLSBUaGUgVExTIHNldHRpbmdzIGJsb2NrICh2ZXJpZnktY2VydCB0b2dnbGUgKyBpbnNlY3VyZSBiYW5uZXIpIGxpdmVzXG4gICAgICogICAgb24gdGhlIENvbm5lY3Rpb24gc3ViLXRhYiBhbmQgc2hvd3Mgb25seSBmb3IgZW5jcnlwdGVkIG1vZGVzLlxuICAgICAqICAtIFRoZSBDZXJ0aWZpY2F0ZSBzdWItdGFiIGl0ZW0gaXMgdmlzaWJsZSBvbmx5IHdoZW4gTERBUCBhdXRob3JpemF0aW9uXG4gICAgICogICAgaXMgZW5hYmxlZCBBTkQgdGhlIHZlcmlmeUNlcnQgdG9nZ2xlIGlzIG9uLiBUaGlzIGlzIHRoZSBnYXRlIHRoZVxuICAgICAqICAgIG9wZXJhdG9yIGFza2VkIGZvcjogdGhlIHRhYiBhcHBlYXJzIHByZWNpc2VseSB3aGVuIGEgQ0EgYWN0dWFsbHlcbiAgICAgKiAgICBtYXR0ZXJzLiBJZiB0aGUgdXNlciB3YXMgb24gdGhlIENlcnRpZmljYXRlIHRhYiBhbmQgdG9nZ2xlcyBlaXRoZXJcbiAgICAgKiAgICBvZmYsIHNuYXAgYmFjayB0byB0aGUgQ29ubmVjdGlvbiB0YWIgc28gdGhleSBhcmVuJ3Qgc3RyYW5kZWQgb24gYVxuICAgICAqICAgIGhpZGRlbiBzZWdtZW50LlxuICAgICAqICAtIFdhcm5pbmcgdHJpYW5nbGUgb24gdGhlIENlcnRpZmljYXRlIHRhYiBoZWFkZXIgbGlnaHRzIHVwIHdoZW5cbiAgICAgKiAgICB2ZXJpZmljYXRpb24gaXMgb24gYnV0IHRoZSBDQSB0ZXh0YXJlYSBpcyBlbXB0eS5cbiAgICAgKiAgLSBJbnNlY3VyZS1UTFMgYmFubmVyIGxpZ2h0cyB1cCBvbmx5IGZvciBsZGFwczovLyB3aXRob3V0IHZlcmlmaWNhdGlvbjpcbiAgICAgKiAgICB0cmFmZmljIGlzIGVuY3J5cHRlZCBidXQgc2VydmVyIGlkZW50aXR5IGlzIHVudmVyaWZpZWQuXG4gICAgICovXG4gICAgcmVmcmVzaFRsc1NlY3Rpb25WaXNpYmlsaXR5KCkge1xuICAgICAgICBjb25zdCB0bHNNb2RlID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAndGxzTW9kZScpIHx8ICdub25lJztcbiAgICAgICAgY29uc3QgdmVyaWZ5ID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdmVyaWZ5Q2VydENoZWNrYm94LmlzKCc6Y2hlY2tlZCcpO1xuICAgICAgICBjb25zdCBlbmNyeXB0ZWQgPSB0bHNNb2RlID09PSAnc3RhcnR0bHMnIHx8IHRsc01vZGUgPT09ICdsZGFwcyc7XG4gICAgICAgIGNvbnN0IGNhRW1wdHkgPSAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FDZXJ0VGV4dGFyZWEudmFsKCkgfHwgJycpLnRyaW0oKSA9PT0gJyc7XG4gICAgICAgIGNvbnN0IGxkYXBFbmFibGVkID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJyk7XG5cbiAgICAgICAgaWYgKGVuY3J5cHRlZCkge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGxzU2V0dGluZ3NCbG9jay5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0bHNTZXR0aW5nc0Jsb2NrLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENlcnRpZmljYXRlIHN1Yi10YWI6IGdhdGUgc3RyaWN0bHkgb24gTERBUC1vbiArIHZlcmlmeS1vbiwgcmVnYXJkbGVzc1xuICAgICAgICAvLyBvZiB0bHNNb2RlLiBJZiB0aGUgb3BlcmF0b3IgdHVybmVkIHZhbGlkYXRpb24gb24gYnV0IHN0YXllZCBvbiBwbGFpblxuICAgICAgICAvLyBMREFQLCB3ZSBzdGlsbCBsZXQgdGhlbSBwYXN0ZSBhIENBIOKAlCBzd2l0Y2hpbmcgdG8gU1RBUlRUTFMvTERBUFMgbGF0ZXJcbiAgICAgICAgLy8gc2hvdWxkbid0IGxvc2UgdGhlIHdvcmsuXG4gICAgICAgIGNvbnN0IHNob3dDZXJ0VGFiID0gbGRhcEVuYWJsZWQgJiYgdmVyaWZ5O1xuICAgICAgICBpZiAoc2hvd0NlcnRUYWIpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNlcnRpZmljYXRlVGFiLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNlcnRpZmljYXRlVGFiLmhpZGUoKTtcbiAgICAgICAgICAgIC8vIFNuYXAgYmFjayB0byBDb25uZWN0aW9uIGlmIENlcnRpZmljYXRlIHdhcyB0aGUgYWN0aXZlIHRhYi5cbiAgICAgICAgICAgIGlmIChtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjZXJ0aWZpY2F0ZVRhYi5oYXNDbGFzcygnYWN0aXZlJykpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRzdWJUYWJzTWVudVxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnLml0ZW1bZGF0YS10YWI9XCJsZGFwLWNvbm5lY3Rpb25cIl0nKVxuICAgICAgICAgICAgICAgICAgICAudGFiKCdjaGFuZ2UgdGFiJywgJ2xkYXAtY29ubmVjdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3dDZXJ0VGFiICYmIGNhRW1wdHkpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNhTWlzc2luZ1dhcm5pbmcuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2FNaXNzaW5nV2FybmluZy5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGxzTW9kZSA9PT0gJ2xkYXBzJyAmJiAhdmVyaWZ5KSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRpbnNlY3VyZVRsc1dhcm5pbmcuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kaW5zZWN1cmVUbHNXYXJuaW5nLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyBhIGxpZ2h0d2VpZ2h0IGJpbmQgY2hlY2sgYWdhaW5zdCB0aGUgY3VycmVudCBmb3JtIHZhbHVlcy5cbiAgICAgKiBTaG93cyBhIGdyZWVuIHN1Y2Nlc3MgbWVzc2FnZSBvciBhIHJlZCBlcnJvciBtZXNzYWdlIGlubGluZSB1bmRlclxuICAgICAqIHRoZSBhZG1pbi1jcmVkZW50aWFscyByb3cuXG4gICAgICovXG4gICAgYXBpQ2FsbFRlc3RCaW5kKCkge1xuICAgICAgICAkLmFwaSh7XG4gICAgICAgICAgICB1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy90ZXN0LWJpbmRgLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBiZWZvcmVTZW5kKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZFJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3Bvc2l0aXZlIG5lZ2F0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLmhpZGUoKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9UZXN0QmluZFN1Y2Nlc3M7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5tZXNzYWdlKSA/IHJlc3BvbnNlLm1lc3NhZ2Uuam9pbignICcpIDogcmVzcG9uc2UubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRldGFpbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGRldGFpbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiR0ZXN0QmluZFJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ25lZ2F0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdwb3NpdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KHRleHQpXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25GYWlsdXJlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdGVzdEJpbmRCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9UZXN0QmluZEZhaWx1cmU7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5tZXNzYWdlKSA/IHJlc3BvbnNlLm1lc3NhZ2Uuam9pbignICcpIDogcmVzcG9uc2UubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRldGFpbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGAke3RleHR9OiAke2RldGFpbH1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHRlc3RCaW5kUmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncG9zaXRpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ25lZ2F0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQodGV4dClcbiAgICAgICAgICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBjaGFuZ2UgTERBUCBkcm9wZG93bi5cbiAgICAgKi9cbiAgICBvbkNoYW5nZUxkYXBUeXBlKHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWU9PT0nT3BlbkxEQVAnKXtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnc2V0IHZhbHVlJywndXNlcklkQXR0cmlidXRlJywndWlkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ2FkbWluaXN0cmF0aXZlTG9naW4nLCdjbj1hZG1pbixkYz1leGFtcGxlLGRjPWNvbScpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCd1c2VyRmlsdGVyJywnKG9iamVjdENsYXNzPWluZXRPcmdQZXJzb24pJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ2Jhc2VETicsJ2RjPWV4YW1wbGUsZGM9Y29tJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ29yZ2FuaXphdGlvbmFsVW5pdCcsJ291PXVzZXJzLCBkYz1kb21haW4sIGRjPWNvbScpO1xuICAgICAgICB9IGVsc2UgaWYodmFsdWU9PT0nQWN0aXZlRGlyZWN0b3J5Jyl7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ2FkbWluaXN0cmF0aXZlTG9naW4nLCdhZG1pbicpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCd1c2VySWRBdHRyaWJ1dGUnLCdzYW1hY2NvdW50bmFtZScpXG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ3NldCB2YWx1ZScsJ3VzZXJGaWx0ZXInLCcoJihvYmplY3RDbGFzcz11c2VyKShvYmplY3RDYXRlZ29yeT1QRVJTT04pKScpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdiYXNlRE4nLCdkYz1leGFtcGxlLGRjPWNvbScpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybU9iai5mb3JtKCdzZXQgdmFsdWUnLCdvcmdhbml6YXRpb25hbFVuaXQnLCdvdT11c2VycywgZGM9ZG9tYWluLCBkYz1jb20nKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBnZXQgTERBUCB1c2VycyBsaXN0IGJ1dHRvbiBjbGljay5cbiAgICAgKi9cbiAgICBhcGlDYWxsR2V0TGRhcFVzZXJzKCl7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL2dldC1hdmFpbGFibGUtbGRhcC11c2Vyc2AsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBzdWNjZXNzZnVsIHJlc3BvbnNlIG9mIHRoZSAnZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tHZXRVc2Vyc0J1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBsZXQgaHRtbCA9ICc8dWwgY2xhc3M9XCJ1aSBsaXN0XCI+JztcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBgPGxpIGNsYXNzPVwiaXRlbVwiPiR7Z2xvYmFsdHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX0VtcHR5U2VydmVyUmVzcG9uc2V9PC9saT5gO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5kYXRhLCAoaW5kZXgsIHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gYDxsaSBjbGFzcz1cIml0ZW1cIj4ke3VzZXIubmFtZX0gKCR7dXNlci5sb2dpbn0pPC9saT5gO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC91bD4nO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja0dldFVzZXJzU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IHBvc2l0aXZlXCI+JHtodG1sfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlcyB0aGUgZmFpbHVyZSByZXNwb25zZSBvZiB0aGUgJ2dldC1hdmFpbGFibGUtbGRhcC11c2VycycgQVBJIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbkZhaWx1cmU6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tHZXRVc2Vyc0J1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBuZWdhdGl2ZVwiPjxpIGNsYXNzPVwiaWNvbiBleGNsYW1hdGlvbiBjaXJjbGVcIj48L2k+JHtyZXNwb25zZS5tZXNzYWdlfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBjaGVjayBMREFQIGF1dGhlbnRpY2F0aW9uIGJ1dHRvbiBjbGljay5cbiAgICAgKi9cbiAgICBhcGlDYWxsQ2hlY2tBdXRoKCl7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL2NoZWNrLWF1dGhgLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBiZWZvcmVTZW5kKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tBdXRoQnV0dG9uLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBzdWNjZXNzZnVsIHJlc3BvbnNlIG9mIHRoZSAnY2hlY2stbGRhcC1hdXRoJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IHBvc2l0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGNoZWNrXCI+PC9pPiAke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBmYWlsdXJlIHJlc3BvbnNlIG9mIHRoZSAnY2hlY2stbGRhcC1hdXRoJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uRmFpbHVyZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IG5lZ2F0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGV4Y2xhbWF0aW9uIGNpcmNsZVwiPjwvaT4ke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIHRoZSBjaGFuZ2Ugb2YgdGhlIExEQVAgY2hlY2tib3guXG4gICAgICovXG4gICAgb25DaGFuZ2VMZGFwQ2hlY2tib3goKXtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbi5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIENlcnRpZmljYXRlIHN1Yi10YWIgaXMgZ2F0ZWQgb24gTERBUC1vbiArIHZlcmlmeUNlcnQ7IHJlY29tcHV0ZVxuICAgICAgICAvLyB2aXNpYmlsaXR5IGV2ZXJ5IHRpbWUgdGhlIG1hc3RlciB0b2dnbGUgZmxpcHMgc28gaXQgZGlzYXBwZWFycyB3aGVuXG4gICAgICAgIC8vIExEQVAgaXMgdHVybmVkIG9mZiBhbmQgcmVhcHBlYXJzICh3aXRoIHByaW9yIHZlcmlmeSBzdGF0ZSkgd2hlbiBvbi5cbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnJlZnJlc2hUbHNTZWN0aW9uVmlzaWJpbGl0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5yZWZyZXNoVGxzU2VjdGlvblZpc2liaWxpdHkoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgLSBUaGUgc2V0dGluZ3Mgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IC0gVGhlIG1vZGlmaWVkIHNldHRpbmdzIG9iamVjdC5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICByZXN1bHQuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEudXNlTGRhcEF1dGhNZXRob2QgPSAnMSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS51c2VMZGFwQXV0aE1ldGhvZCA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKCkge1xuICAgICAgICAvLyBDYWxsYmFjayBpbXBsZW1lbnRhdGlvblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL3NhdmVgO1xuICAgICAgICBGb3JtLnZhbGlkYXRlUnVsZXMgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLnZhbGlkYXRlUnVsZXM7XG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmNiQWZ0ZXJTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5pbml0aWFsaXplKCk7XG4gICAgfSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmluaXRpYWxpemUoKTtcbn0pO1xuIl19