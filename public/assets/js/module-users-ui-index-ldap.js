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
        $.each(response.data, function (index, user) {
          html += "<li class=\"item\">".concat(user.name, " (").concat(user.login, ")</li>");
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXgtbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwIiwiJHVzZUxkYXBDaGVja2JveCIsIiQiLCIkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5ncyIsIiRmb3JtRWxlbWVudHNBdmFpbGFibGVJZkxkYXBJc09uIiwiJGxkYXBDaGVja1NlZ21lbnQiLCIkZm9ybU9iaiIsIiRjaGVja0F1dGhCdXR0b24iLCIkY2hlY2tHZXRVc2Vyc0J1dHRvbiIsIiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQiLCJ2YWxpZGF0ZVJ1bGVzIiwic2VydmVyTmFtZSIsImlkZW50aWZpZXIiLCJydWxlcyIsInR5cGUiLCJwcm9tcHQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5Iiwic2VydmVyUG9ydCIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyUG9ydElzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZUxvZ2luIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSIsImFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4iLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5IiwiYmFzZUROIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5IiwidXNlcklkQXR0cmlidXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVVc2VySWRBdHRyaWJ1dGVJc0VtcHR5IiwiaW5pdGlhbGl6ZSIsImluaXRpYWxpemVGb3JtIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJhcGlDYWxsR2V0TGRhcFVzZXJzIiwiYXBpQ2FsbENoZWNrQXV0aCIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImFwaSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJtZXRob2QiLCJiZWZvcmVTZW5kIiwic2V0dGluZ3MiLCJhZGRDbGFzcyIsImRhdGEiLCJmb3JtIiwic3VjY2Vzc1Rlc3QiLCJyZXNwb25zZSIsInN1Y2Nlc3MiLCJvblN1Y2Nlc3MiLCJyZW1vdmVDbGFzcyIsInJlbW92ZSIsImh0bWwiLCJlYWNoIiwiaW5kZXgiLCJ1c2VyIiwibmFtZSIsImxvZ2luIiwiYWZ0ZXIiLCJvbkZhaWx1cmUiLCJtZXNzYWdlIiwic2hvdyIsImhpZGUiLCJjYkJlZm9yZVNlbmRGb3JtIiwicmVzdWx0IiwidXNlTGRhcEF1dGhNZXRob2QiLCJjYkFmdGVyU2VuZEZvcm0iLCJGb3JtIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBR0EsSUFBTUEsc0JBQXNCLEdBQUc7QUFFM0I7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxnQkFBZ0IsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBUFE7O0FBUzNCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsMEJBQTBCLEVBQUVELENBQUMsQ0FBQyxxQkFBRCxDQWRGOztBQWdCM0I7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJRSxFQUFBQSxnQ0FBZ0MsRUFBRUYsQ0FBQyxDQUFDLDRCQUFELENBckJSOztBQXVCM0I7QUFDSjtBQUNBO0FBQ0E7QUFDSUcsRUFBQUEsaUJBQWlCLEVBQUVILENBQUMsQ0FBQyxrQkFBRCxDQTNCTzs7QUE2QjNCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lJLEVBQUFBLFFBQVEsRUFBRUosQ0FBQyxDQUFDLDRCQUFELENBakNnQjs7QUFtQzNCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lLLEVBQUFBLGdCQUFnQixFQUFFTCxDQUFDLENBQUMsZ0NBQUQsQ0F2Q1E7O0FBMEMzQjtBQUNKO0FBQ0E7QUFDQTtB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TUFBTSxDQUFDcEIsSUFBUCxDQUFZcUIsaUJBQVosR0FBZ0MsR0FBaEM7QUFDSCxLQUZELE1BRU87QUFDSEQsTUFBQUEsTUFBTSxDQUFDcEIsSUFBUCxDQUFZcUIsaUJBQVosR0FBZ0MsR0FBaEM7QUFDSDs7QUFFRCxXQUFPRCxNQUFQO0FBQ0gsR0F2UDBCOztBQXlQM0I7QUFDSjtBQUNBO0FBQ0lFLEVBQUFBLGVBNVAyQiw2QkE0UFQsQ0FDZDtBQUNILEdBOVAwQjs7QUFnUTNCO0FBQ0o7QUFDQTtBQUNJdEMsRUFBQUEsY0FuUTJCLDRCQW1RVjtBQUNidUMsSUFBQUEsSUFBSSxDQUFDOUQsUUFBTCxHQUFnQk4sc0JBQXNCLENBQUNNLFFBQXZDO0FBQ0E4RCxJQUFBQSxJQUFJLENBQUM3QixHQUFMLGFBQWNDLGFBQWQ7QUFDQTRCLElBQUFBLElBQUksQ0FBQzFELGFBQUwsR0FBcUJWLHNCQUFzQixDQUFDVSxhQUE1QztBQUNBMEQsSUFBQUEsSUFBSSxDQUFDSixnQkFBTCxHQUF3QmhFLHNCQUFzQixDQUFDZ0UsZ0JBQS9DO0FBQ0FJLElBQUFBLElBQUksQ0FBQ0QsZUFBTCxHQUF1Qm5FLHNCQUFzQixDQUFDbUUsZUFBOUM7QUFDQUMsSUFBQUEsSUFBSSxDQUFDeEMsVUFBTDtBQUNIO0FBMVEwQixDQUEvQjtBQTZRQTFCLENBQUMsQ0FBQ21FLFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDcEJ0RSxFQUFBQSxzQkFBc0IsQ0FBQzRCLFVBQXZCO0FBQ0gsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIFBieEFwaSovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVaUluZGV4TGRhcCA9IHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGZvciBMREFQIGF1dGhlbnRpY2F0aW9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkdXNlTGRhcENoZWNrYm94OiAkKCcjdXNlLWxkYXAtYXV0aC1tZXRob2QnKSxcblxuICAgIC8qKlxuICAgICAqIFNldCBvZiBmb3JtIGZpZWxkcyB0byB1c2UgZm9yIExEQVAgYXV0aGVudGljYXRpb24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzOiAkKCcuZGlzYWJsZS1pZi1uby1sZGFwJyksXG5cbiAgICAvKipcbiAgICAgKiBTZXQgb2YgZWxlbWVudHMgb2YgdGhlIGZvcm0gYWRoZXJlZCB0byBsZGFwIGF1dGggbWV0aG9kLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbjogJCgnLnNob3ctb25seS1pZi1sZGFwLWVuYWJsZWQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrU2VnbWVudDogJCgnI2xkYXAtY2hlY2stYXV0aCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1sZGFwLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBjaGVjayBjcmVkZW50aWFscyBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tBdXRoQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1jcmVkZW50aWFscy5idXR0b24nKSxcblxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdldHRpbmcgTERBUCB1c2VycyBsaXN0IGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0dldFVzZXJzQnV0dG9uOiAkKCcuY2hlY2stbGRhcC1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBsZGFwIGNoZWNrIHNlZ21lbnQuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbGRhcENoZWNrR2V0VXNlcnNTZWdtZW50OiAkKCcjbGRhcC1jaGVjay1nZXQtdXNlcnMnKSxcblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRpb24gcnVsZXMgZm9yIHRoZSBmb3JtIGZpZWxkcy5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhbGlkYXRlUnVsZXM6IHtcbiAgICAgICAgc2VydmVyTmFtZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ3NlcnZlck5hbWUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlU2VydmVyTmFtZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlclBvcnQ6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdzZXJ2ZXJQb3J0JyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlclBvcnRJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBhZG1pbmlzdHJhdGl2ZUxvZ2luOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnYWRtaW5pc3RyYXRpdmVMb2dpbicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZUxvZ2luSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRtaW5pc3RyYXRpdmVQYXNzd29yZEhpZGRlbjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2FkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQWRtaW5pc3RyYXRpdmVQYXNzd29yZElzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGJhc2VETjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2Jhc2VETicsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVCYXNlRE5Jc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB1c2VySWRBdHRyaWJ1dGU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICd1c2VySWRBdHRyaWJ1dGUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlVXNlcklkQXR0cmlidXRlSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZHVsZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmluaXRpYWxpemVGb3JtKCk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGdldCB1c2VycyBsaXN0IGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuYXBpQ2FsbEdldExkYXBVc2VycygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGNoZWNrQXV0aEJ1dHRvbi5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmFwaUNhbGxDaGVja0F1dGgoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR2VuZXJhbCBsZGFwIHN3aXRjaGVyXG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5vbkNoYW5nZUxkYXBDaGVja2JveCxcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAub25DaGFuZ2VMZGFwQ2hlY2tib3goKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBnZXQgTERBUCB1c2VycyBsaXN0IGJ1dHRvbiBjbGljay5cbiAgICAgKi9cbiAgICBhcGlDYWxsR2V0TGRhcFVzZXJzKCl7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL2dldC1hdmFpbGFibGUtbGRhcC11c2Vyc2AsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBzdWNjZXNzZnVsIHJlc3BvbnNlIG9mIHRoZSAnZ2V0LWF2YWlsYWJsZS1sZGFwLXVzZXJzJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0dldFVzZXJzQnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGxldCBodG1sID0gJzx1bCBjbGFzcz1cInVpIGxpc3RcIj4nO1xuICAgICAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5kYXRhLCAoaW5kZXgsIHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBgPGxpIGNsYXNzPVwiaXRlbVwiPiR7dXNlci5uYW1lfSAoJHt1c2VyLmxvZ2lufSk8L2xpPmA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC91bD4nO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGxkYXBDaGVja0dldFVzZXJzU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IHBvc2l0aXZlXCI+JHtodG1sfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlcyB0aGUgZmFpbHVyZSByZXNwb25zZSBvZiB0aGUgJ2dldC1hdmFpbGFibGUtbGRhcC11c2VycycgQVBJIHJlcXVlc3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbkZhaWx1cmU6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tHZXRVc2Vyc0J1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICQoJy51aS5tZXNzYWdlLmFqYXgnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRsZGFwQ2hlY2tHZXRVc2Vyc1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBuZWdhdGl2ZVwiPjxpIGNsYXNzPVwiaWNvbiBleGNsYW1hdGlvbiBjaXJjbGVcIj48L2k+JHtyZXNwb25zZS5tZXNzYWdlfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBjaGVjayBMREFQIGF1dGhlbnRpY2F0aW9uIGJ1dHRvbiBjbGljay5cbiAgICAgKi9cbiAgICBhcGlDYWxsQ2hlY2tBdXRoKCl7XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2xkYXAtY29uZmlnL2NoZWNrLWF1dGhgLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBiZWZvcmVTZW5kKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kY2hlY2tBdXRoQnV0dG9uLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZGF0YSA9IG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBzdWNjZXNzZnVsIHJlc3BvbnNlIG9mIHRoZSAnY2hlY2stbGRhcC1hdXRoJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IHBvc2l0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGNoZWNrXCI+PC9pPiAke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBmYWlsdXJlIHJlc3BvbnNlIG9mIHRoZSAnY2hlY2stbGRhcC1hdXRoJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uRmFpbHVyZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRjaGVja0F1dGhCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kbGRhcENoZWNrU2VnbWVudC5hZnRlcihgPGRpdiBjbGFzcz1cInVpIGljb24gbWVzc2FnZSBhamF4IG5lZ2F0aXZlXCI+PGkgY2xhc3M9XCJpY29uIGV4Y2xhbWF0aW9uIGNpcmNsZVwiPjwvaT4ke3Jlc3BvbnNlLm1lc3NhZ2V9PC9kaXY+YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIHRoZSBjaGFuZ2Ugb2YgdGhlIExEQVAgY2hlY2tib3guXG4gICAgICovXG4gICAgb25DaGFuZ2VMZGFwQ2hlY2tib3goKXtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbi5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC4kZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIC0gVGhlIHNldHRpbmdzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSAtIFRoZSBtb2RpZmllZCBzZXR0aW5ncyBvYmplY3QuXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgcmVzdWx0LmRhdGEgPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVWlJbmRleExkYXAuJHVzZUxkYXBDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKXtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLnVzZUxkYXBBdXRoTWV0aG9kID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEudXNlTGRhcEF1dGhNZXRob2QgPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcbiAgICAgICAgLy8gQ2FsbGJhY2sgaW1wbGVtZW50YXRpb25cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLmNiQmVmb3JlU2VuZEZvcm07XG4gICAgICAgIEZvcm0uY2JBZnRlclNlbmRGb3JtID0gbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgbW9kdWxlVXNlcnNVaUluZGV4TGRhcC5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==