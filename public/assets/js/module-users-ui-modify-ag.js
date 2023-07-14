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

/* global globalRootUrl, globalTranslate, Form, Extensions */
var moduleUsersUIModifyAG = {
  /**
   * jQuery object for the form.
   * @type {jQuery}
   */
  $formObj: $('#module-users-ui-form'),

  /**
   * Checkbox allows full access to the system.
   * @type {jQuery}
   * @private
   */
  $fullAccessCheckbox: $('#full-access-group'),

  /**
   * jQuery object for the select users dropdown.
   * @type {jQuery}
   */
  $selectUsersDropDown: $('[data-tab="users"] .select-extension-field'),

  /**
   * jQuery object for the module status toggle.
   * @type {jQuery}
   */
  $statusToggle: $('#module-status-toggle'),

  /**
   * jQuery object for the home page dropdown select.
   * @type {jQuery}
   */
  $homePageDropdown: $('.home-page-dropdown'),

  /**
   * jQuery object for the access settings tab menu.
   * @type {jQuery}
   */
  $accessSettingsTabMenu: $('#access-settings-tab-menu .item'),

  /**
   * jQuery object for the main tab menu.
   * @type {jQuery}
   */
  $mainTabMenu: $('#module-access-group-modify-menu .item'),

  /**
   * jQuery object for the CDR filter tab.
   * @type {jQuery}
   */
  $cdrFilterTab: $('#module-access-group-modify-menu .item[data-tab="cdr-filter"]'),

  /**
   * jQuery object for the group rights tab.
   * @type {jQuery}
   */
  $groupRightsTab: $('#module-access-group-modify-menu .item[data-tab="group-rights"]'),

  /**
   * jQuery object for the CDR filter toggles.
   * @type {jQuery}
   */
  $cdrFilterToggles: $('div.cdr-filter-toggles'),

  /**
   * jQuery object for the CDR filter mode.
   * @type {jQuery}
   */
  $cdrFilterMode: $('div.cdr-filter-radio'),

  /**
   * Default extension.
   * @type {string}
   */
  defaultExtension: '',

  /**
   * jQuery object for the uncheck button.
   * @type {jQuery}
   */
  $unCheckButton: $('.uncheck.button'),

  /**
   * jQuery object for the uncheck button.
   * @type {jQuery}
   */
  $checkButton: $('.check.button'),

  /**
   * Validation rules for the form fields.
   * @type {Object}
   */
  validateRules: {
    name: {
      identifier: 'name',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.module_usersui_ValidateNameIsEmpty
      }]
    }
  },

  /**
   * Initializes the module.
   */
  initialize: function initialize() {
    var _this = this;

    moduleUsersUIModifyAG.checkStatusToggle();
    window.addEventListener('ModuleStatusChanged', moduleUsersUIModifyAG.checkStatusToggle);
    $('.avatar').each(function () {
      if ($(_this).attr('src') === '') {
        $(_this).attr('src', "".concat(globalRootUrl, "assets/img/unknownPerson.jpg"));
      }
    });
    moduleUsersUIModifyAG.$mainTabMenu.tab();
    moduleUsersUIModifyAG.$accessSettingsTabMenu.tab();
    moduleUsersUIModifyAG.initializeMembersDropDown();
    moduleUsersUIModifyAG.initializeRightsCheckboxes();
    moduleUsersUIModifyAG.$homePageDropdown.dropdown(moduleUsersUIModifyAG.getHomePagesForSelect());
    moduleUsersUIModifyAG.cbAfterChangeFullAccessToggle();
    moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox({
      onChange: moduleUsersUIModifyAG.cbAfterChangeFullAccessToggle
    });
    moduleUsersUIModifyAG.$cdrFilterToggles.checkbox();
    moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
    moduleUsersUIModifyAG.$cdrFilterMode.checkbox({
      onChange: moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode
    });
    $('body').on('click', 'div.delete-user-row', function (e) {
      e.preventDefault();
      moduleUsersUIModifyAG.deleteMemberFromTable(e.target);
    }); // Handle check button click

    moduleUsersUIModifyAG.$checkButton.on('click', function (e) {
      e.preventDefault();
      $(e.target).parent('.ui.tab').find('.ui.checkbox').checkbox('check');
    }); // Handle uncheck button click

    moduleUsersUIModifyAG.$unCheckButton.on('click', function (e) {
      e.preventDefault();
      $(e.target).parent('.ui.tab').find('.ui.checkbox').checkbox('uncheck');
    });
    moduleUsersUIModifyAG.initializeForm();
  },

  /**
   * Callback function after changing the full access toggle.
   */
  cbAfterChangeFullAccessToggle: function cbAfterChangeFullAccessToggle() {
    if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
      moduleUsersUIModifyAG.$cdrFilterTab.hide();
      moduleUsersUIModifyAG.$groupRightsTab.hide();
      moduleUsersUIModifyAG.$homePageDropdown.hide();
      moduleUsersUIModifyAG.$mainTabMenu.tab('change tab', 'general'); // Check all checkboxes

      $('div.tab[data-tab="group-rights"] .ui.checkbox').checkbox('check');
    } else {
      moduleUsersUIModifyAG.$groupRightsTab.show();
      moduleUsersUIModifyAG.$homePageDropdown.show();
      moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
    }
  },

  /**
   * Callback function after changing the CDR filter mode.
   */
  cbAfterChangeCDRFilterMode: function cbAfterChangeCDRFilterMode() {
    var cdrFilterMode = moduleUsersUIModifyAG.$formObj.form('get value', 'cdrFilterMode');

    if (cdrFilterMode === 'all') {
      $('#cdr-extensions-table').hide();
    } else {
      $('#cdr-extensions-table').show();
    }
  },

  /**
   * Initializes the members dropdown for assigning current access group.
   */
  initializeMembersDropDown: function initializeMembersDropDown() {
    var dropdownParams = Extensions.getDropdownSettingsOnlyInternalWithoutEmpty();
    dropdownParams.action = moduleUsersUIModifyAG.cbAfterUsersSelect;
    dropdownParams.templates = {
      menu: moduleUsersUIModifyAG.customMembersDropdownMenu
    };
    moduleUsersUIModifyAG.$selectUsersDropDown.dropdown(dropdownParams);
  },

  /**
   * Customizes the members dropdown menu visualization.
   * @param {Object} response - The response object.
   * @param {Object} fields - The fields object.
   * @returns {string} - The HTML string for the dropdown menu.
   */
  customMembersDropdownMenu: function customMembersDropdownMenu(response, fields) {
    var values = response[fields.values] || {};
    var html = '';
    var oldType = '';
    $.each(values, function (index, option) {
      if (option.type !== oldType) {
        oldType = option.type;
        html += '<div class="divider"></div>';
        html += '	<div class="header">';
        html += '	<i class="tags icon"></i>';
        html += option.typeLocalized;
        html += '</div>';
      }

      var maybeText = option[fields.text] ? "data-text=\"".concat(option[fields.text], "\"") : '';
      var maybeDisabled = $("#ext-".concat(option[fields.value])).hasClass('selected-member') ? 'disabled ' : '';
      html += "<div class=\"".concat(maybeDisabled, "item\" data-value=\"").concat(option[fields.value], "\"").concat(maybeText, ">");
      html += option[fields.name];
      html += '</div>';
    });
    return html;
  },

  /**
   * Callback function after selecting a user for the group.
   * @param {string} text - The text value.
   * @param {string} value - The selected value.
   * @param {jQuery} $element - The jQuery element.
   */
  cbAfterUsersSelect: function cbAfterUsersSelect(text, value, $element) {
    $("#ext-".concat(value)).closest('tr').addClass('selected-member').show();
    $($element).addClass('disabled');
    Form.dataChanged();
  },

  /**
   * Deletes a group member from the table.
   * @param {HTMLElement} target - The target element.
   */
  deleteMemberFromTable: function deleteMemberFromTable(target) {
    var id = $(target).closest('div').attr('data-value');
    $("#".concat(id)).removeClass('selected-member').hide();
    Form.dataChanged();
  },

  /**
   * Initializes the rights checkboxes.
   */
  initializeRightsCheckboxes: function initializeRightsCheckboxes() {
    $('#access-group-rights .list .master.checkbox').checkbox({
      // check all children
      onChecked: function onChecked() {
        var $childCheckbox = $(this).closest('.checkbox').siblings('.list').find('.checkbox');
        $childCheckbox.checkbox('check');
      },
      // uncheck all children
      onUnchecked: function onUnchecked() {
        var $childCheckbox = $(this).closest('.checkbox').siblings('.list').find('.checkbox');
        $childCheckbox.checkbox('uncheck');
      }
    });
    $('#access-group-rights .list .child.checkbox').checkbox({
      // Fire on load to set parent value
      fireOnInit: true,
      // Change parent state on each child checkbox change
      onChange: function onChange() {
        var $listGroup = $(this).closest('.list'),
            $parentCheckbox = $listGroup.closest('.item').children('.checkbox'),
            $checkbox = $listGroup.find('.checkbox'),
            allChecked = true,
            allUnchecked = true; // check to see if all other siblings are checked or unchecked

        $checkbox.each(function () {
          if ($(this).checkbox('is checked')) {
            allUnchecked = false;
          } else {
            allChecked = false;
          }
        }); // set parent checkbox state, but don't trigger its onChange callback

        if (allChecked) {
          $parentCheckbox.checkbox('set checked');
        } else if (allUnchecked) {
          $parentCheckbox.checkbox('set unchecked');
        } else {
          $parentCheckbox.checkbox('set indeterminate');
        }

        moduleUsersUIModifyAG.cdAfterChangeGroupRight();
      }
    });
  },

  /**
   * Callback function after changing the group right.
   */
  cdAfterChangeGroupRight: function cdAfterChangeGroupRight() {
    var accessToCdr = moduleUsersUIModifyAG.$formObj.form('get value', 'MikoPBX\\AdminCabinet\\Controllers\\CallDetailRecordsController_main');

    if (accessToCdr === 'on') {
      moduleUsersUIModifyAG.$cdrFilterTab.show();
    } else {
      moduleUsersUIModifyAG.$cdrFilterTab.hide();
    }
  },

  /**
   * Changes the status of buttons when the module status changes.
   */
  checkStatusToggle: function checkStatusToggle() {
    if (moduleUsersUIModifyAG.$statusToggle.checkbox('is checked')) {
      $('[data-tab = "general"] .disability').removeClass('disabled');
      $('[data-tab = "users"] .disability').removeClass('disabled');
      $('[data-tab = "group-rights"] .disability').removeClass('disabled');
      $('[data-tab = "cdr-filter"] .disability').removeClass('disabled');
    } else {
      $('[data-tab = "general"] .disability').addClass('disabled');
      $('[data-tab = "users"] .disability').addClass('disabled');
      $('[data-tab = "group-rights"] .disability').addClass('disabled');
      $('[data-tab = "cdr-filter"] .disability').addClass('disabled');
    }
  },

  /**
   * Prepares list of possible home pages to select from
   */
  getHomePagesForSelect: function getHomePagesForSelect() {
    var currentHomePage = moduleUsersUIModifyAG.$formObj.form('get value', 'homePage');
    var selectedRights = $('.checked .access-group-checkbox');
    var values = [];
    selectedRights.each(function (index, obj) {
      var module = moduleUsersUIModifyAG.convertCamelToDash($(obj).attr('data-module'));
      var controllerName = moduleUsersUIModifyAG.convertCamelToDash($(obj).attr('data-controller-name'));
      var action = moduleUsersUIModifyAG.convertCamelToDash($(obj).attr('data-action'));

      if (controllerName.indexOf('pbxcore') === -1 && action.indexOf('index') > -1) {
        var url = "/".concat(module, "/").concat(controllerName, "/").concat(action);

        if (currentHomePage === url) {
          values.push({
            name: url,
            value: url,
            selected: true
          });
        } else {
          values.push({
            name: url,
            value: url
          });
        }
      }
    });

    if (values.length === 0) {
      var failBackHomePage = "".concat(globalRootUrl, "session/end");
      values.push({
        name: failBackHomePage,
        value: failBackHomePage,
        selected: true
      });
    }

    return {
      values: values,
      onChange: Form.dataChanged
    };
  },

  /**
   * Converts a string from camel case to dash case.
   * @param str
   * @returns {*}
   */
  convertCamelToDash: function convertCamelToDash(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  },

  /**
   * Callback function before sending the form.
   * @param {Object} settings - The form settings.
   * @returns {Object} - The modified form settings.
   */
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = moduleUsersUIModifyAG.$formObj.form('get values'); // Group members

    var arrMembers = [];
    $('tr.selected-member').each(function (index, obj) {
      if ($(obj).attr('data-value')) {
        arrMembers.push($(obj).attr('data-value'));
      }
    });
    result.data.members = JSON.stringify(arrMembers); // Group Rights

    var arrGroupRights = [];
    $('input.access-group-checkbox').each(function (index, obj) {
      if ($(obj).parent('.checkbox').checkbox('is checked')) {
        var module = $(obj).attr('data-module');
        var controller = $(obj).attr('data-controller');
        var action = $(obj).attr('data-action'); // Find the module in arrGroupRights or create a new entry

        var moduleIndex = arrGroupRights.findIndex(function (item) {
          return item.module === module;
        });

        if (moduleIndex === -1) {
          arrGroupRights.push({
            module: module,
            controllers: []
          });
          moduleIndex = arrGroupRights.length - 1;
        } // Find the controller in the module or create a new entry


        var moduleControllers = arrGroupRights[moduleIndex].controllers;
        var controllerIndex = moduleControllers.findIndex(function (item) {
          return item.controller === controller;
        });

        if (controllerIndex === -1) {
          moduleControllers.push({
            controller: controller,
            actions: []
          });
          controllerIndex = moduleControllers.length - 1;
        } // Push the action into the controller's actions array


        moduleControllers[controllerIndex].actions.push(action);
      }
    });
    result.data.access_group_rights = JSON.stringify(arrGroupRights); // CDR Filter

    var arrCDRFilter = [];
    moduleUsersUIModifyAG.$cdrFilterToggles.each(function (index, obj) {
      if ($(obj).checkbox('is checked')) {
        arrCDRFilter.push($(obj).attr('data-value'));
      }
    });
    result.data.cdrFilter = JSON.stringify(arrCDRFilter); // Full access group toggle

    if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
      result.data.fullAccess = '1';
    } else {
      result.data.fullAccess = '0';
    } // Home Page value


    var selectedHomePage = moduleUsersUIModifyAG.$homePageDropdown.dropdown('get text');
    var dropdownParams = moduleUsersUIModifyAG.getHomePagesForSelect();
    moduleUsersUIModifyAG.$homePageDropdown.dropdown('setup menu', dropdownParams);
    var homePage = '';
    $.each(dropdownParams.values, function (index, record) {
      if (record.name === selectedHomePage) {
        homePage = selectedHomePage;
        return true;
      }
    });

    if (homePage === '') {
      result.data.homePage = dropdownParams.values[0].value;
      moduleUsersUIModifyAG.$homePageDropdown.dropdown('set selected', result.data.homePage);
    } else {
      result.data.homePage = selectedHomePage;
    }

    return result;
  },

  /**
   * Callback function after sending the form.
   */
  cbAfterSendForm: function cbAfterSendForm() {},

  /**
   * Initializes the form.
   */
  initializeForm: function initializeForm() {
    Form.$formObj = moduleUsersUIModifyAG.$formObj;
    Form.url = "".concat(globalRootUrl, "module-users-u-i/access-groups/save");
    Form.validateRules = moduleUsersUIModifyAG.validateRules;
    Form.cbBeforeSendForm = moduleUsersUIModifyAG.cbBeforeSendForm;
    Form.cbAfterSendForm = moduleUsersUIModifyAG.cbAfterSendForm;
    Form.initialize();
  }
};
$(document).ready(function () {
  moduleUsersUIModifyAG.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclRvZ2dsZXMiLCIkY2RyRmlsdGVyTW9kZSIsImRlZmF1bHRFeHRlbnNpb24iLCIkdW5DaGVja0J1dHRvbiIsIiRjaGVja0J1dHRvbiIsInZhbGlkYXRlUnVsZXMiLCJuYW1lIiwiaWRlbnRpZmllciIsInJ1bGVzIiwidHlwZSIsInByb21wdCIsImdsb2JhbFRyYW5zbGF0ZSIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlTmFtZUlzRW1wdHkiLCJpbml0aWFsaXplIiwiY2hlY2tTdGF0dXNUb2dnbGUiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiZWFjaCIsImF0dHIiLCJnbG9iYWxSb290VXJsIiwidGFiIiwiaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93biIsImluaXRpYWxpemVSaWdodHNDaGVja2JveGVzIiwiZHJvcGRvd24iLCJnZXRIb21lUGFnZXNGb3JTZWxlY3QiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJjZHJGaWx0ZXJNb2RlIiwiZm9ybSIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJjdXJyZW50SG9tZVBhZ2UiLCJzZWxlY3RlZFJpZ2h0cyIsIm9iaiIsIm1vZHVsZSIsImNvbnZlcnRDYW1lbFRvRGFzaCIsImNvbnRyb2xsZXJOYW1lIiwiaW5kZXhPZiIsInVybCIsInB1c2giLCJzZWxlY3RlZCIsImxlbmd0aCIsImZhaWxCYWNrSG9tZVBhZ2UiLCJzdHIiLCJyZXBsYWNlIiwidG9Mb3dlckNhc2UiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJkYXRhIiwiYXJyTWVtYmVycyIsIm1lbWJlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiYXJyR3JvdXBSaWdodHMiLCJjb250cm9sbGVyIiwibW9kdWxlSW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwiY29udHJvbGxlcnMiLCJtb2R1bGVDb250cm9sbGVycyIsImNvbnRyb2xsZXJJbmRleCIsImFjdGlvbnMiLCJhY2Nlc3NfZ3JvdXBfcmlnaHRzIiwiYXJyQ0RSRmlsdGVyIiwiY2RyRmlsdGVyIiwiZnVsbEFjY2VzcyIsInNlbGVjdGVkSG9tZVBhZ2UiLCJob21lUGFnZSIsInJlY29yZCIsImNiQWZ0ZXJTZW5kRm9ybSIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUdBLElBQU1BLHFCQUFxQixHQUFHO0FBRTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFFBQVEsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBTmU7O0FBUTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsbUJBQW1CLEVBQUVELENBQUMsQ0FBQyxvQkFBRCxDQWJJOztBQWUxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRSxFQUFBQSxvQkFBb0IsRUFBRUYsQ0FBQyxDQUFDLDRDQUFELENBbkJHOztBQXFCMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUcsRUFBQUEsYUFBYSxFQUFFSCxDQUFDLENBQUMsdUJBQUQsQ0F6QlU7O0FBMkIxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJSSxFQUFBQSxpQkFBaUIsRUFBRUosQ0FBQyxDQUFDLHFCQUFELENBL0JNOztBQWlDMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUssRUFBQUEsc0JBQXNCLEVBQUVMLENBQUMsQ0FBQyxpQ0FBRCxDQXJDQzs7QUF1QzFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lNLEVBQUFBLFlBQVksRUFBRU4sQ0FBQyxDQUFDLHdDQUFELENBM0NXOztBQTZDMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSU8sRUFBQUEsYUFBYSxFQUFFUCxDQUFDLENBQUMsK0RBQUQsQ0FqRFU7O0FBbUQxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJUSxFQUFBQSxlQUFlLEVBQUVSLENBQUMsQ0FBQyxpRUFBRCxDQXZEUTs7QUF5RDFC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bSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwsIGdsb2JhbFRyYW5zbGF0ZSwgRm9ybSwgRXh0ZW5zaW9ucyAqL1xuXG5cbmNvbnN0IG1vZHVsZVVzZXJzVUlNb2RpZnlBRyA9IHtcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBmb3JtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGZvcm1PYmo6ICQoJyNtb2R1bGUtdXNlcnMtdWktZm9ybScpLFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tib3ggYWxsb3dzIGZ1bGwgYWNjZXNzIHRvIHRoZSBzeXN0ZW0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmdWxsQWNjZXNzQ2hlY2tib3g6ICQoJyNmdWxsLWFjY2Vzcy1ncm91cCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHNlbGVjdCB1c2VycyBkcm9wZG93bi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzZWxlY3RVc2Vyc0Ryb3BEb3duOiAkKCdbZGF0YS10YWI9XCJ1c2Vyc1wiXSAuc2VsZWN0LWV4dGVuc2lvbi1maWVsZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIG1vZHVsZSBzdGF0dXMgdG9nZ2xlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHN0YXR1c1RvZ2dsZTogJCgnI21vZHVsZS1zdGF0dXMtdG9nZ2xlJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgaG9tZSBwYWdlIGRyb3Bkb3duIHNlbGVjdC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRob21lUGFnZURyb3Bkb3duOiAkKCcuaG9tZS1wYWdlLWRyb3Bkb3duJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgYWNjZXNzIHNldHRpbmdzIHRhYiBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGFjY2Vzc1NldHRpbmdzVGFiTWVudTogJCgnI2FjY2Vzcy1zZXR0aW5ncy10YWItbWVudSAuaXRlbScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIG1haW4gdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbWFpblRhYk1lbnU6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyVGFiOiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbVtkYXRhLXRhYj1cImNkci1maWx0ZXJcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBncm91cCByaWdodHMgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGdyb3VwUmlnaHRzVGFiOiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbVtkYXRhLXRhYj1cImdyb3VwLXJpZ2h0c1wiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdG9nZ2xlcy5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUb2dnbGVzOiAkKCdkaXYuY2RyLWZpbHRlci10b2dnbGVzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlck1vZGU6ICQoJ2Rpdi5jZHItZmlsdGVyLXJhZGlvJyksXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGV4dGVuc2lvbi5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuQ2hlY2tCdXR0b246ICQoJy51bmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQnV0dG9uOiAkKCcuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICduYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cbiAgICAgICAgJCgnLmF2YXRhcicpLmVhY2goKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cignc3JjJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBgJHtnbG9iYWxSb290VXJsfWFzc2V0cy9pbWcvdW5rbm93blBlcnNvbi5qcGdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24obW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuY2hlY2tib3goKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyTW9kZS5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJ2JvZHknKS5vbignY2xpY2snLCAnZGl2LmRlbGV0ZS11c2VyLXJvdycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZGVsZXRlTWVtYmVyRnJvbVRhYmxlKGUudGFyZ2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgnY2hlY2snKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIHVuY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kdW5DaGVja0J1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJChlLnRhcmdldCkucGFyZW50KCcudWkudGFiJykuZmluZCgnLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ3VuY2hlY2snKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVGb3JtKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBmdWxsIGFjY2VzcyB0b2dnbGUuXG4gICAgICovXG4gICAgY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUoKXtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLmhpZGUoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuaGlkZSgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmhpZGUoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCdjaGFuZ2UgdGFiJywnZ2VuZXJhbCcpO1xuICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIGNoZWNrYm94ZXNcbiAgICAgICAgICAgICQoJ2Rpdi50YWJbZGF0YS10YWI9XCJncm91cC1yaWdodHNcIl0gLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5zaG93KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCl7XG4gICAgICAgIGNvbnN0IGNkckZpbHRlck1vZGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnY2RyRmlsdGVyTW9kZScpO1xuICAgICAgICBpZiAoY2RyRmlsdGVyTW9kZT09PSdhbGwnKSB7XG4gICAgICAgICAgICAkKCcjY2RyLWV4dGVuc2lvbnMtdGFibGUnKS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjY2RyLWV4dGVuc2lvbnMtdGFibGUnKS5zaG93KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gZm9yIGFzc2lnbmluZyBjdXJyZW50IGFjY2VzcyBncm91cC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCkge1xuICAgICAgICBjb25zdCBkcm9wZG93blBhcmFtcyA9IEV4dGVuc2lvbnMuZ2V0RHJvcGRvd25TZXR0aW5nc09ubHlJbnRlcm5hbFdpdGhvdXRFbXB0eSgpO1xuICAgICAgICBkcm9wZG93blBhcmFtcy5hY3Rpb24gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclVzZXJzU2VsZWN0O1xuICAgICAgICBkcm9wZG93blBhcmFtcy50ZW1wbGF0ZXMgPSB7IG1lbnU6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jdXN0b21NZW1iZXJzRHJvcGRvd25NZW51IH07XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc2VsZWN0VXNlcnNEcm9wRG93bi5kcm9wZG93bihkcm9wZG93blBhcmFtcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbWl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gbWVudSB2aXN1YWxpemF0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkcyAtIFRoZSBmaWVsZHMgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIEhUTUwgc3RyaW5nIGZvciB0aGUgZHJvcGRvd24gbWVudS5cbiAgICAgKi9cbiAgICBjdXN0b21NZW1iZXJzRHJvcGRvd25NZW51KHJlc3BvbnNlLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gcmVzcG9uc2VbZmllbGRzLnZhbHVlc10gfHwge307XG4gICAgICAgIGxldCBodG1sID0gJyc7XG4gICAgICAgIGxldCBvbGRUeXBlID0gJyc7XG4gICAgICAgICQuZWFjaCh2YWx1ZXMsIChpbmRleCwgb3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAob3B0aW9uLnR5cGUgIT09IG9sZFR5cGUpIHtcbiAgICAgICAgICAgICAgICBvbGRUeXBlID0gb3B0aW9uLnR5cGU7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImRpdmlkZXJcIj48L2Rpdj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGRpdiBjbGFzcz1cImhlYWRlclwiPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8aSBjbGFzcz1cInRhZ3MgaWNvblwiPjwvaT4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uLnR5cGVMb2NhbGl6ZWQ7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1heWJlVGV4dCA9IChvcHRpb25bZmllbGRzLnRleHRdKSA/IGBkYXRhLXRleHQ9XCIke29wdGlvbltmaWVsZHMudGV4dF19XCJgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBtYXliZURpc2FibGVkID0gKCQoYCNleHQtJHtvcHRpb25bZmllbGRzLnZhbHVlXX1gKS5oYXNDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJykpID8gJ2Rpc2FibGVkICcgOiAnJztcbiAgICAgICAgICAgIGh0bWwgKz0gYDxkaXYgY2xhc3M9XCIke21heWJlRGlzYWJsZWR9aXRlbVwiIGRhdGEtdmFsdWU9XCIke29wdGlvbltmaWVsZHMudmFsdWVdfVwiJHttYXliZVRleHR9PmA7XG4gICAgICAgICAgICBodG1sICs9IG9wdGlvbltmaWVsZHMubmFtZV07XG4gICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbGVjdGluZyBhIHVzZXIgZm9yIHRoZSBncm91cC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzZWxlY3RlZCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBUaGUgalF1ZXJ5IGVsZW1lbnQuXG4gICAgICovXG4gICAgY2JBZnRlclVzZXJzU2VsZWN0KHRleHQsIHZhbHVlLCAkZWxlbWVudCkge1xuICAgICAgICAkKGAjZXh0LSR7dmFsdWV9YClcbiAgICAgICAgICAgIC5jbG9zZXN0KCd0cicpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAkKCRlbGVtZW50KS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGEgZ3JvdXAgbWVtYmVyIGZyb20gdGhlIHRhYmxlLlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIFRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKi9cbiAgICBkZWxldGVNZW1iZXJGcm9tVGFibGUodGFyZ2V0KSB7XG4gICAgICAgIGNvbnN0IGlkID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ2RpdicpLmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgJChgIyR7aWR9YClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5oaWRlKCk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHJpZ2h0cyBjaGVja2JveGVzLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCkge1xuICAgICAgICAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAubGlzdCAubWFzdGVyLmNoZWNrYm94JylcbiAgICAgICAgICAgIC5jaGVja2JveCh7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25DaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyB1bmNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uVW5jaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ3VuY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5jaGlsZC5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgb24gbG9hZCB0byBzZXQgcGFyZW50IHZhbHVlXG4gICAgICAgICAgICAgICAgZmlyZU9uSW5pdCA6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHBhcmVudCBzdGF0ZSBvbiBlYWNoIGNoaWxkIGNoZWNrYm94IGNoYW5nZVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkbGlzdEdyb3VwICAgICAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5saXN0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3ggPSAkbGlzdEdyb3VwLmNsb3Nlc3QoJy5pdGVtJykuY2hpbGRyZW4oJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94ICAgICAgID0gJGxpc3RHcm91cC5maW5kKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgICAgICA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgICAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGFsbCBvdGhlciBzaWJsaW5ncyBhcmUgY2hlY2tlZCBvciB1bmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHBhcmVudCBjaGVja2JveCBzdGF0ZSwgYnV0IGRvbid0IHRyaWdnZXIgaXRzIG9uQ2hhbmdlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmKGFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGFsbFVuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgdW5jaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBpbmRldGVybWluYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZ3JvdXAgcmlnaHQuXG4gICAgICovXG4gICAgY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKXtcbiAgICAgICAgY29uc3QgYWNjZXNzVG9DZHIgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnTWlrb1BCWFxcXFxBZG1pbkNhYmluZXRcXFxcQ29udHJvbGxlcnNcXFxcQ2FsbERldGFpbFJlY29yZHNDb250cm9sbGVyX21haW4nKTtcbiAgICAgICAgaWYgKGFjY2Vzc1RvQ2RyPT09J29uJykge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHN0YXR1cyBvZiBidXR0b25zIHdoZW4gdGhlIG1vZHVsZSBzdGF0dXMgY2hhbmdlcy5cbiAgICAgKi9cbiAgICBjaGVja1N0YXR1c1RvZ2dsZSgpIHtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcGFyZXMgbGlzdCBvZiBwb3NzaWJsZSBob21lIHBhZ2VzIHRvIHNlbGVjdCBmcm9tXG4gICAgICovXG4gICAgZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCl7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRIb21lUGFnZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdob21lUGFnZScpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZFJpZ2h0cyA9ICQoJy5jaGVja2VkIC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKTtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICAgIHNlbGVjdGVkUmlnaHRzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jb252ZXJ0Q2FtZWxUb0Rhc2goJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJykpO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlck5hbWUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY29udmVydENhbWVsVG9EYXNoKCQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXItbmFtZScpKTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jb252ZXJ0Q2FtZWxUb0Rhc2goJChvYmopLmF0dHIoJ2RhdGEtYWN0aW9uJykpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXJOYW1lLmluZGV4T2YoJ3BieGNvcmUnKSA9PT0gLTEgJiYgYWN0aW9uLmluZGV4T2YoJ2luZGV4JykgPiAtMSkge1xuICAgICAgICAgICAgICAgIGxldCB1cmwgPSBgLyR7bW9kdWxlfS8ke2NvbnRyb2xsZXJOYW1lfS8ke2FjdGlvbn1gO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SG9tZVBhZ2UgPT09IHVybCl7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IHVybCwgdmFsdWU6IHVybCwgc2VsZWN0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogdXJsLCB2YWx1ZTogdXJsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICBjb25zdCBmYWlsQmFja0hvbWVQYWdlID0gIGAke2dsb2JhbFJvb3RVcmx9c2Vzc2lvbi9lbmRgO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogZmFpbEJhY2tIb21lUGFnZSwgdmFsdWU6IGZhaWxCYWNrSG9tZVBhZ2UsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZXM6dmFsdWVzLFxuICAgICAgICAgICAgb25DaGFuZ2U6IEZvcm0uZGF0YUNoYW5nZWRcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGEgc3RyaW5nIGZyb20gY2FtZWwgY2FzZSB0byBkYXNoIGNhc2UuXG4gICAgICogQHBhcmFtIHN0clxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGNvbnZlcnRDYW1lbFRvRGFzaChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIC0gVGhlIGZvcm0gc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgbW9kaWZpZWQgZm9ybSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICByZXN1bHQuZGF0YSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG5cbiAgICAgICAgLy8gR3JvdXAgbWVtYmVyc1xuICAgICAgICBjb25zdCBhcnJNZW1iZXJzID0gW107XG4gICAgICAgICQoJ3RyLnNlbGVjdGVkLW1lbWJlcicpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSB7XG4gICAgICAgICAgICAgICAgYXJyTWVtYmVycy5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5tZW1iZXJzID0gSlNPTi5zdHJpbmdpZnkoYXJyTWVtYmVycyk7XG5cbiAgICAgICAgLy8gR3JvdXAgUmlnaHRzXG4gICAgICAgIGNvbnN0IGFyckdyb3VwUmlnaHRzID0gW107XG4gICAgICAgICQoJ2lucHV0LmFjY2Vzcy1ncm91cC1jaGVja2JveCcpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXInKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIG1vZHVsZSBpbiBhcnJHcm91cFJpZ2h0cyBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBsZXQgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLm1vZHVsZSA9PT0gbW9kdWxlKTtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyckdyb3VwUmlnaHRzLnB1c2goeyBtb2R1bGUsIGNvbnRyb2xsZXJzOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvbnRyb2xsZXIgaW4gdGhlIG1vZHVsZSBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGVDb250cm9sbGVycyA9IGFyckdyb3VwUmlnaHRzW21vZHVsZUluZGV4XS5jb250cm9sbGVycztcbiAgICAgICAgICAgICAgICBsZXQgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb250cm9sbGVyID09PSBjb250cm9sbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbGxlckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVycy5wdXNoKHsgY29udHJvbGxlciwgYWN0aW9uczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHVzaCB0aGUgYWN0aW9uIGludG8gdGhlIGNvbnRyb2xsZXIncyBhY3Rpb25zIGFycmF5XG4gICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEuYWNjZXNzX2dyb3VwX3JpZ2h0cyA9IEpTT04uc3RyaW5naWZ5KGFyckdyb3VwUmlnaHRzKTtcblxuICAgICAgICAvLyBDRFIgRmlsdGVyXG4gICAgICAgIGNvbnN0IGFyckNEUkZpbHRlciA9IFtdO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyQ0RSRmlsdGVyLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuZGF0YS5jZHJGaWx0ZXIgPSBKU09OLnN0cmluZ2lmeShhcnJDRFJGaWx0ZXIpO1xuXG4gICAgICAgIC8vIEZ1bGwgYWNjZXNzIGdyb3VwIHRvZ2dsZVxuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhvbWUgUGFnZSB2YWx1ZVxuICAgICAgICBjb25zdCBzZWxlY3RlZEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdnZXQgdGV4dCcpO1xuICAgICAgICBjb25zdCBkcm9wZG93blBhcmFtcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5nZXRIb21lUGFnZXNGb3JTZWxlY3QoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdzZXR1cCBtZW51JywgZHJvcGRvd25QYXJhbXMpO1xuICAgICAgICBsZXQgaG9tZVBhZ2UgPSAnJztcbiAgICAgICAgJC5lYWNoKGRyb3Bkb3duUGFyYW1zLnZhbHVlcywgZnVuY3Rpb24oaW5kZXgsIHJlY29yZCkge1xuICAgICAgICAgICAgaWYgKHJlY29yZC5uYW1lID09PSBzZWxlY3RlZEhvbWVQYWdlKSB7XG4gICAgICAgICAgICAgICAgaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGhvbWVQYWdlPT09Jycpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBkcm9wZG93blBhcmFtcy52YWx1ZXNbMF0udmFsdWU7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ3NldCBzZWxlY3RlZCcsIHJlc3VsdC5kYXRhLmhvbWVQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmhvbWVQYWdlID0gc2VsZWN0ZWRIb21lUGFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iajtcbiAgICAgICAgRm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvYWNjZXNzLWdyb3Vwcy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLnZhbGlkYXRlUnVsZXM7XG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkJlZm9yZVNlbmRGb3JtO1xuICAgICAgICBGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemUoKTtcbn0pO1xuIl19