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
var moduleUsersUILdap = {
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
    moduleUsersUILdap.initializeForm();
    moduleUsersUILdap.$useLdapCheckbox.checkbox({
      onChange: moduleUsersUILdap.onChangeLdapCheckbox
    });
    moduleUsersUILdap.onChangeLdapCheckbox(); // Handle check button click

    moduleUsersUILdap.$checkAuthButton.api({
      url: "".concat(globalRootUrl, "module-users-u-i/ldap-config/check-auth"),
      method: 'POST',
      beforeSend: function beforeSend(settings) {
        $(this).addClass('loading disabled');
        settings.data = moduleUsersUILdap.$formObj.form('get values');
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
        $(this).removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        moduleUsersUILdap.$ldapCheckSegment.after("<div class=\"ui icon message ajax positive\"><i class=\"icon check\"></i> ".concat(response.message, "</div>"));
      },

      /**
       * Handles the failure response of the 'check-ldap-auth' API request.
       * @param {object} response - The response object.
       */
      onFailure: function onFailure(response) {
        $(this).removeClass('loading disabled');
        $('.ui.message.ajax').remove();
        moduleUsersUILdap.$ldapCheckSegment.after("<div class=\"ui icon message ajax negative\"><i class=\"icon exclamation circle\"></i>".concat(response.message, "</div>"));
      }
    });
  },

  /**
   * Handles the change of the LDAP checkbox.
   */
  onChangeLdapCheckbox: function onChangeLdapCheckbox() {
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
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = moduleUsersUILdap.$formObj.form('get values');
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
    Form.$formObj = moduleUsersUILdap.$formObj;
    Form.url = "".concat(globalRootUrl, "module-users-u-i/ldap-config/save");
    Form.validateRules = moduleUsersUILdap.validateRules;
    Form.cbBeforeSendForm = moduleUsersUILdap.cbBeforeSendForm;
    Form.cbAfterSendForm = moduleUsersUILdap.cbAfterSendForm;
    Form.initialize();
  }
};
$(document).ready(function () {
  moduleUsersUILdap.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbGRhcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGVVc2Vyc1VJTGRhcCIsIiR1c2VMZGFwQ2hlY2tib3giLCIkIiwiJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MiLCIkZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbiIsIiRsZGFwQ2hlY2tTZWdtZW50IiwiJGZvcm1PYmoiLCIkY2hlY2tBdXRoQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsInNlcnZlck5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVTZXJ2ZXJOYW1lSXNFbXB0eSIsInNlcnZlclBvcnQiLCJtb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlclBvcnRJc0VtcHR5IiwiYWRtaW5pc3RyYXRpdmVMb2dpbiIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQWRtaW5pc3RyYXRpdmVMb2dpbklzRW1wdHkiLCJhZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSGlkZGVuIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVBZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSXNFbXB0eSIsImJhc2VETiIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQmFzZUROSXNFbXB0eSIsInVzZXJJZEF0dHJpYnV0ZSIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlVXNlcklkQXR0cmlidXRlSXNFbXB0eSIsImluaXRpYWxpemUiLCJpbml0aWFsaXplRm9ybSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJvbkNoYW5nZUxkYXBDaGVja2JveCIsImFwaSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJtZXRob2QiLCJiZWZvcmVTZW5kIiwic2V0dGluZ3MiLCJhZGRDbGFzcyIsImRhdGEiLCJmb3JtIiwic3VjY2Vzc1Rlc3QiLCJyZXNwb25zZSIsInN1Y2Nlc3MiLCJvblN1Y2Nlc3MiLCJyZW1vdmVDbGFzcyIsInJlbW92ZSIsImFmdGVyIiwibWVzc2FnZSIsIm9uRmFpbHVyZSIsInNob3ciLCJoaWRlIiwiY2JCZWZvcmVTZW5kRm9ybSIsInJlc3VsdCIsImNiQWZ0ZXJTZW5kRm9ybSIsIkZvcm0iLCJkb2N1bWVudCIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFHQSxJQUFNQSxpQkFBaUIsR0FBRztBQUV0QjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGdCQUFnQixFQUFFQyxDQUFDLENBQUMsdUJBQUQsQ0FQRzs7QUFTdEI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSwwQkFBMEIsRUFBRUQsQ0FBQyxDQUFDLHFCQUFELENBZFA7O0FBZ0J0QjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lFLEVBQUFBLGdDQUFnQyxFQUFFRixDQUFDLENBQUMsNEJBQUQsQ0FyQmI7O0FBdUJ0QjtBQUNKO0FBQ0E7QUFDQTtBQUNJRyxFQUFBQSxpQkFBaUIsRUFBRUgsQ0FBQyxDQUFDLGtCQUFELENBM0JFOztBQTZCdEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUksRUFBQUEsUUFBUSxFQUFFSixDQUFDLENBQUMsNEJBQUQsQ0FqQ1c7O0FBbUN0QjtBQUNKO0FBQ0E7QUFDQTtBQUNJSyxFQUFBQSxnQkFBZ0IsRUFBRUwsQ0FBQyxDQUFDLGdDQUFELENBdkNHOztBQXlDdEI7QUFDSjtBQUNBO0FBQ0E7QUFDSU0sRUFBQUEsYUFBYSxFQUFFO0FBQ1hDLElBQUFBLFVBQVUsRUFBRTtBQUNSQyxNQUFBQSxVQUFVLEVBQUUsWUFESjtBQUVSQyxNQUFBQSxLQUFLLEVBQUUsQ0FDSDtBQUNJQyxRQUFBQSxJQUFJLEVBQUUsT0FEVjtBQUVJQyxRQUFBQSxNQUFNLEVBQUVDLGVBQWUsQ0FBQ0M7QUFGNUIsT0FERztBQUZDLEtBREQ7QUFVWEMsSUFBQUEsVUFB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RCxJQUFBQSxJQUFJLENBQUN0QixHQUFMLGFBQWNDLGFBQWQ7QUFDQXFCLElBQUFBLElBQUksQ0FBQzlDLGFBQUwsR0FBcUJSLGlCQUFpQixDQUFDUSxhQUF2QztBQUNBOEMsSUFBQUEsSUFBSSxDQUFDSCxnQkFBTCxHQUF3Qm5ELGlCQUFpQixDQUFDbUQsZ0JBQTFDO0FBQ0FHLElBQUFBLElBQUksQ0FBQ0QsZUFBTCxHQUF1QnJELGlCQUFpQixDQUFDcUQsZUFBekM7QUFDQUMsSUFBQUEsSUFBSSxDQUFDNUIsVUFBTDtBQUNIO0FBNUxxQixDQUExQjtBQStMQXhCLENBQUMsQ0FBQ3FELFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDcEJ4RCxFQUFBQSxpQkFBaUIsQ0FBQzBCLFVBQWxCO0FBQ0gsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIFBieEFwaSovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVSUxkYXAgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja2JveCBmb3IgTERBUCBhdXRoZW50aWNhdGlvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJHVzZUxkYXBDaGVja2JveDogJCgnI3VzZS1sZGFwLWF1dGgtbWV0aG9kJyksXG5cbiAgICAvKipcbiAgICAgKiBTZXQgb2YgZm9ybSBmaWVsZHMgdG8gdXNlIGZvciBMREFQIGF1dGhlbnRpY2F0aW9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZm9ybUZpZWxkc0ZvckxkYXBTZXR0aW5nczogJCgnLmRpc2FibGUtaWYtbm8tbGRhcCcpLFxuXG4gICAgLyoqXG4gICAgICogU2V0IG9mIGVsZW1lbnRzIG9mIHRoZSBmb3JtIGFkaGVyZWQgdG8gbGRhcCBhdXRoIG1ldGhvZC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZvcm1FbGVtZW50c0F2YWlsYWJsZUlmTGRhcElzT246ICQoJy5zaG93LW9ubHktaWYtbGRhcC1lbmFibGVkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbGRhcCBjaGVjayBzZWdtZW50LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGxkYXBDaGVja1NlZ21lbnQ6ICQoJyNsZGFwLWNoZWNrLWF1dGgnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBmb3JtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGZvcm1PYmo6ICQoJyNtb2R1bGUtdXNlcnMtdWktbGRhcC1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgY2hlY2sgY3JlZGVudGlhbHMgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQXV0aEJ1dHRvbjogJCgnLmNoZWNrLWxkYXAtY3JlZGVudGlhbHMuYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIHNlcnZlck5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdzZXJ2ZXJOYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVNlcnZlck5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBzZXJ2ZXJQb3J0OiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnc2VydmVyUG9ydCcsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVTZXJ2ZXJQb3J0SXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYWRtaW5pc3RyYXRpdmVMb2dpbjoge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ2FkbWluaXN0cmF0aXZlTG9naW4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQWRtaW5pc3RyYXRpdmVMb2dpbklzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkbWluaXN0cmF0aXZlUGFzc3dvcmRIaWRkZW46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdhZG1pbmlzdHJhdGl2ZVBhc3N3b3JkSGlkZGVuJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZUFkbWluaXN0cmF0aXZlUGFzc3dvcmRJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBiYXNlRE46IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICdiYXNlRE4nLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlQmFzZUROSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgdXNlcklkQXR0cmlidXRlOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAndXNlcklkQXR0cmlidXRlJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZVVzZXJJZEF0dHJpYnV0ZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtb2R1bGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgbW9kdWxlVXNlcnNVSUxkYXAuaW5pdGlhbGl6ZUZvcm0oKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTGRhcC5vbkNoYW5nZUxkYXBDaGVja2JveCxcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlMZGFwLm9uQ2hhbmdlTGRhcENoZWNrYm94KCk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTGRhcC4kY2hlY2tBdXRoQnV0dG9uLmFwaSh7XG4gICAgICAgICAgICB1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9jaGVjay1hdXRoYCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgYmVmb3JlU2VuZChzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5kYXRhID0gbW9kdWxlVXNlcnNVSUxkYXAuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzVGVzdChyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGVzIHRoZSBzdWNjZXNzZnVsIHJlc3BvbnNlIG9mIHRoZSAnY2hlY2stbGRhcC1hdXRoJyBBUEkgcmVxdWVzdC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgJCgnLnVpLm1lc3NhZ2UuYWpheCcpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlMZGFwLiRsZGFwQ2hlY2tTZWdtZW50LmFmdGVyKGA8ZGl2IGNsYXNzPVwidWkgaWNvbiBtZXNzYWdlIGFqYXggcG9zaXRpdmVcIj48aSBjbGFzcz1cImljb24gY2hlY2tcIj48L2k+ICR7cmVzcG9uc2UubWVzc2FnZX08L2Rpdj5gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEhhbmRsZXMgdGhlIGZhaWx1cmUgcmVzcG9uc2Ugb2YgdGhlICdjaGVjay1sZGFwLWF1dGgnIEFQSSByZXF1ZXN0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25GYWlsdXJlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAkKCcudWkubWVzc2FnZS5hamF4JykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSUxkYXAuJGxkYXBDaGVja1NlZ21lbnQuYWZ0ZXIoYDxkaXYgY2xhc3M9XCJ1aSBpY29uIG1lc3NhZ2UgYWpheCBuZWdhdGl2ZVwiPjxpIGNsYXNzPVwiaWNvbiBleGNsYW1hdGlvbiBjaXJjbGVcIj48L2k+JHtyZXNwb25zZS5tZXNzYWdlfTwvZGl2PmApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyB0aGUgY2hhbmdlIG9mIHRoZSBMREFQIGNoZWNrYm94LlxuICAgICAqL1xuICAgIG9uQ2hhbmdlTGRhcENoZWNrYm94KCl7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTGRhcC4kdXNlTGRhcENoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlMZGFwLiRmb3JtRmllbGRzRm9yTGRhcFNldHRpbmdzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSUxkYXAuJGZvcm1FbGVtZW50c0F2YWlsYWJsZUlmTGRhcElzT24uc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSUxkYXAuJGZvcm1GaWVsZHNGb3JMZGFwU2V0dGluZ3MuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTGRhcC4kZm9ybUVsZW1lbnRzQXZhaWxhYmxlSWZMZGFwSXNPbi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIC0gVGhlIHNldHRpbmdzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSAtIFRoZSBtb2RpZmllZCBzZXR0aW5ncyBvYmplY3QuXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgcmVzdWx0LmRhdGEgPSBtb2R1bGVVc2Vyc1VJTGRhcC4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKCkge1xuICAgICAgICAvLyBDYWxsYmFjayBpbXBsZW1lbnRhdGlvblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVUlMZGFwLiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9sZGFwLWNvbmZpZy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVSUxkYXAudmFsaWRhdGVSdWxlcztcbiAgICAgICAgRm9ybS5jYkJlZm9yZVNlbmRGb3JtID0gbW9kdWxlVXNlcnNVSUxkYXAuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTGRhcC5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgbW9kdWxlVXNlcnNVSUxkYXAuaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=