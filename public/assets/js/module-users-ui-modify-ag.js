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
    moduleUsersUIModifyAG.initializeForm();
    $('.avatar').each(function () {
      if ($(_this).attr('src') === '') {
        $(_this).attr('src', "".concat(globalRootUrl, "assets/img/unknownPerson.jpg"));
      }
    });
    moduleUsersUIModifyAG.$mainTabMenu.tab();
    moduleUsersUIModifyAG.$accessSettingsTabMenu.tab();
    moduleUsersUIModifyAG.initializeMembersDropDown();
    moduleUsersUIModifyAG.initializeRightsCheckboxes();
    moduleUsersUIModifyAG.$homePageDropdown.dropdown();
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
  },

  /**
   * Callback function after changing the full access toggle.
   */
  cbAfterChangeFullAccessToggle: function cbAfterChangeFullAccessToggle() {
    if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
      moduleUsersUIModifyAG.$cdrFilterTab.hide();
      moduleUsersUIModifyAG.$groupRightsTab.hide();
      moduleUsersUIModifyAG.$mainTabMenu.tab('change tab', 'general');
    } else {
      moduleUsersUIModifyAG.$groupRightsTab.show();
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
        }); // set parent checkbox state, but dont trigger its onChange callback

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
    var accessToCdr = moduleUsersUIModifyAG.$formObj.form('get value', 'CallDetailRecordsController_main');

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
    result.data.cdrFilter = JSON.stringify(arrCDRFilter);

    if (moduleUsersUiIndexLdap.$fullAccessCheckbox.checkbox('is checked')) {
      result.data.fullAccess = '1';
    } else {
      result.data.fullAccess = '0';
    }

    return result;
  },

  /**
   * Callback function after sending the form.
   */
  cbAfterSendForm: function cbAfterSendForm() {// Add implementation
  },

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclRvZ2dsZXMiLCIkY2RyRmlsdGVyTW9kZSIsImRlZmF1bHRFeHRlbnNpb24iLCIkdW5DaGVja0J1dHRvbiIsIiRjaGVja0J1dHRvbiIsInZhbGlkYXRlUnVsZXMiLCJuYW1lIiwiaWRlbnRpZmllciIsInJ1bGVzIiwidHlwZSIsInByb21wdCIsImdsb2JhbFRyYW5zbGF0ZSIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlTmFtZUlzRW1wdHkiLCJpbml0aWFsaXplIiwiY2hlY2tTdGF0dXNUb2dnbGUiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiaW5pdGlhbGl6ZUZvcm0iLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJkcm9wZG93biIsImNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlIiwiY2hlY2tib3giLCJvbkNoYW5nZSIsImNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJkZWxldGVNZW1iZXJGcm9tVGFibGUiLCJ0YXJnZXQiLCJwYXJlbnQiLCJmaW5kIiwiaGlkZSIsInNob3ciLCJjZHJGaWx0ZXJNb2RlIiwiZm9ybSIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJkYXRhIiwiYXJyTWVtYmVycyIsIm9iaiIsInB1c2giLCJtZW1iZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsImFyckdyb3VwUmlnaHRzIiwibW9kdWxlIiwiY29udHJvbGxlciIsIm1vZHVsZUluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImNvbnRyb2xsZXJzIiwibGVuZ3RoIiwibW9kdWxlQ29udHJvbGxlcnMiLCJjb250cm9sbGVySW5kZXgiLCJhY3Rpb25zIiwiYWNjZXNzX2dyb3VwX3JpZ2h0cyIsImFyckNEUkZpbHRlciIsImNkckZpbHRlciIsIm1vZHVsZVVzZXJzVWlJbmRleExkYXAiLCJmdWxsQWNjZXNzIiwiY2JBZnRlclNlbmRGb3JtIiwidXJsIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtB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aG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIEV4dGVuc2lvbnMgKi9cblxuXG5jb25zdCBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcgPSB7XG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZm9ybS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRmb3JtT2JqOiAkKCcjbW9kdWxlLXVzZXJzLXVpLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGFsbG93cyBmdWxsIGFjY2VzcyB0byB0aGUgc3lzdGVtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZnVsbEFjY2Vzc0NoZWNrYm94OiAkKCcjZnVsbC1hY2Nlc3MtZ3JvdXAnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBzZWxlY3QgdXNlcnMgZHJvcGRvd24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc2VsZWN0VXNlcnNEcm9wRG93bjogJCgnW2RhdGEtdGFiPVwidXNlcnNcIl0gLnNlbGVjdC1leHRlbnNpb24tZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtb2R1bGUgc3RhdHVzIHRvZ2dsZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGhvbWUgcGFnZSBkcm9wZG93biBzZWxlY3QuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkaG9tZVBhZ2VEcm9wZG93bjogJCgnLmhvbWUtcGFnZS1kcm9wZG93bicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGFjY2VzcyBzZXR0aW5ncyB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRhY2Nlc3NTZXR0aW5nc1RhYk1lbnU6ICQoJyNhY2Nlc3Mtc2V0dGluZ3MtdGFiLW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtYWluIHRhYiBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJG1haW5UYWJNZW51OiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclRhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJjZHItZmlsdGVyXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZ3JvdXAgcmlnaHRzIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRncm91cFJpZ2h0c1RhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJncm91cC1yaWdodHNcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRvZ2dsZXMuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyVG9nZ2xlczogJCgnZGl2LmNkci1maWx0ZXItdG9nZ2xlcycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgbW9kZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJNb2RlOiAkKCdkaXYuY2RyLWZpbHRlci1yYWRpbycpLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCBleHRlbnNpb24uXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBkZWZhdWx0RXh0ZW5zaW9uOiAnJyxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB1bmNoZWNrIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR1bkNoZWNrQnV0dG9uOiAkKCcudW5jaGVjay5idXR0b24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB1bmNoZWNrIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0J1dHRvbjogJCgnLmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGlvbiBydWxlcyBmb3IgdGhlIGZvcm0gZmllbGRzLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFsaWRhdGVSdWxlczoge1xuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnbmFtZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZHVsZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2hlY2tTdGF0dXNUb2dnbGUoKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ01vZHVsZVN0YXR1c0NoYW5nZWQnLCBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2hlY2tTdGF0dXNUb2dnbGUpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZUZvcm0oKTtcblxuICAgICAgICAkKCcuYXZhdGFyJykuZWFjaCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdzcmMnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsIGAke2dsb2JhbFJvb3RVcmx9YXNzZXRzL2ltZy91bmtub3duUGVyc29uLmpwZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJG1haW5UYWJNZW51LnRhYigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGFjY2Vzc1NldHRpbmdzVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bigpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUb2dnbGVzLmNoZWNrYm94KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlck1vZGUuY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCdib2R5Jykub24oJ2NsaWNrJywgJ2Rpdi5kZWxldGUtdXNlci1yb3cnLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmRlbGV0ZU1lbWJlckZyb21UYWJsZShlLnRhcmdldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBjaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjaGVja0J1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJChlLnRhcmdldCkucGFyZW50KCcudWkudGFiJykuZmluZCgnLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSB1bmNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHVuQ2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBmdWxsIGFjY2VzcyB0b2dnbGUuXG4gICAgICovXG4gICAgY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUoKXtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLmhpZGUoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuaGlkZSgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoJ2NoYW5nZSB0YWInLCdnZW5lcmFsJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuc2hvdygpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIENEUiBmaWx0ZXIgbW9kZS5cbiAgICAgKi9cbiAgICBjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpe1xuICAgICAgICBjb25zdCBjZHJGaWx0ZXJNb2RlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsJ2NkckZpbHRlck1vZGUnKTtcbiAgICAgICAgaWYgKGNkckZpbHRlck1vZGU9PT0nYWxsJykge1xuICAgICAgICAgICAgJCgnI2Nkci1leHRlbnNpb25zLXRhYmxlJykuaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2Nkci1leHRlbnNpb25zLXRhYmxlJykuc2hvdygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIGZvciBhc3NpZ25pbmcgY3VycmVudCBhY2Nlc3MgZ3JvdXAuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93bigpIHtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBFeHRlbnNpb25zLmdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkoKTtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMuYWN0aW9uID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJVc2Vyc1NlbGVjdDtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMudGVtcGxhdGVzID0geyBtZW51OiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSB9O1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHNlbGVjdFVzZXJzRHJvcERvd24uZHJvcGRvd24oZHJvcGRvd25QYXJhbXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b21pemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIG1lbnUgdmlzdWFsaXphdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZHMgLSBUaGUgZmllbGRzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSBIVE1MIHN0cmluZyBmb3IgdGhlIGRyb3Bkb3duIG1lbnUuXG4gICAgICovXG4gICAgY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudShyZXNwb25zZSwgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHJlc3BvbnNlW2ZpZWxkcy52YWx1ZXNdIHx8IHt9O1xuICAgICAgICBsZXQgaHRtbCA9ICcnO1xuICAgICAgICBsZXQgb2xkVHlwZSA9ICcnO1xuICAgICAgICAkLmVhY2godmFsdWVzLCAoaW5kZXgsIG9wdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKG9wdGlvbi50eXBlICE9PSBvbGRUeXBlKSB7XG4gICAgICAgICAgICAgICAgb2xkVHlwZSA9IG9wdGlvbi50eXBlO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJkaXZpZGVyXCI+PC9kaXY+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxkaXYgY2xhc3M9XCJoZWFkZXJcIj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGkgY2xhc3M9XCJ0YWdzIGljb25cIj48L2k+JztcbiAgICAgICAgICAgICAgICBodG1sICs9IG9wdGlvbi50eXBlTG9jYWxpemVkO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtYXliZVRleHQgPSAob3B0aW9uW2ZpZWxkcy50ZXh0XSkgPyBgZGF0YS10ZXh0PVwiJHtvcHRpb25bZmllbGRzLnRleHRdfVwiYCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbWF5YmVEaXNhYmxlZCA9ICgkKGAjZXh0LSR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19YCkuaGFzQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpKSA/ICdkaXNhYmxlZCAnIDogJyc7XG4gICAgICAgICAgICBodG1sICs9IGA8ZGl2IGNsYXNzPVwiJHttYXliZURpc2FibGVkfWl0ZW1cIiBkYXRhLXZhbHVlPVwiJHtvcHRpb25bZmllbGRzLnZhbHVlXX1cIiR7bWF5YmVUZXh0fT5gO1xuICAgICAgICAgICAgaHRtbCArPSBvcHRpb25bZmllbGRzLm5hbWVdO1xuICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZWxlY3RpbmcgYSB1c2VyIGZvciB0aGUgZ3JvdXAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBUaGUgc2VsZWN0ZWQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0gVGhlIGpRdWVyeSBlbGVtZW50LlxuICAgICAqL1xuICAgIGNiQWZ0ZXJVc2Vyc1NlbGVjdCh0ZXh0LCB2YWx1ZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgJChgI2V4dC0ke3ZhbHVlfWApXG4gICAgICAgICAgICAuY2xvc2VzdCgndHInKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgJCgkZWxlbWVudCkuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIGdyb3VwIG1lbWJlciBmcm9tIHRoZSB0YWJsZS5cbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICovXG4gICAgZGVsZXRlTWVtYmVyRnJvbVRhYmxlKHRhcmdldCkge1xuICAgICAgICBjb25zdCBpZCA9ICQodGFyZ2V0KS5jbG9zZXN0KCdkaXYnKS5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICQoYCMke2lkfWApXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuaGlkZSgpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSByaWdodHMgY2hlY2tib3hlcy5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpIHtcbiAgICAgICAgJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLmxpc3QgLm1hc3Rlci5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uQ2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gdW5jaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvblVuY2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgICAgICAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAubGlzdCAuY2hpbGQuY2hlY2tib3gnKVxuICAgICAgICAgICAgLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlIG9uIGxvYWQgdG8gc2V0IHBhcmVudCB2YWx1ZVxuICAgICAgICAgICAgICAgIGZpcmVPbkluaXQgOiB0cnVlLFxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBwYXJlbnQgc3RhdGUgb24gZWFjaCBjaGlsZCBjaGVja2JveCBjaGFuZ2VcbiAgICAgICAgICAgICAgICBvbkNoYW5nZSAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGxpc3RHcm91cCAgICAgID0gJCh0aGlzKS5jbG9zZXN0KCcubGlzdCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94ID0gJGxpc3RHcm91cC5jbG9zZXN0KCcuaXRlbScpLmNoaWxkcmVuKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGVja2JveCAgICAgICA9ICRsaXN0R3JvdXAuZmluZCgnLmNoZWNrYm94JyksXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxDaGVja2VkICAgICAgPSB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsVW5jaGVja2VkICAgID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBhbGwgb3RoZXIgc2libGluZ3MgYXJlIGNoZWNrZWQgb3IgdW5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICRjaGVja2JveC5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICQodGhpcykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNldCBwYXJlbnQgY2hlY2tib3ggc3RhdGUsIGJ1dCBkb250IHRyaWdnZXIgaXRzIG9uQ2hhbmdlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmKGFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGFsbFVuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgdW5jaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBpbmRldGVybWluYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZ3JvdXAgcmlnaHQuXG4gICAgICovXG4gICAgY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKXtcbiAgICAgICAgY29uc3QgYWNjZXNzVG9DZHIgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnQ2FsbERldGFpbFJlY29yZHNDb250cm9sbGVyX21haW4nKTtcbiAgICAgICAgaWYgKGFjY2Vzc1RvQ2RyPT09J29uJykge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHN0YXR1cyBvZiBidXR0b25zIHdoZW4gdGhlIG1vZHVsZSBzdGF0dXMgY2hhbmdlcy5cbiAgICAgKi9cbiAgICBjaGVja1N0YXR1c1RvZ2dsZSgpIHtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIC0gVGhlIGZvcm0gc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgbW9kaWZpZWQgZm9ybSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICByZXN1bHQuZGF0YSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG5cbiAgICAgICAgLy8gR3JvdXAgbWVtYmVyc1xuICAgICAgICBjb25zdCBhcnJNZW1iZXJzID0gW107XG4gICAgICAgICQoJ3RyLnNlbGVjdGVkLW1lbWJlcicpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSB7XG4gICAgICAgICAgICAgICAgYXJyTWVtYmVycy5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5tZW1iZXJzID0gSlNPTi5zdHJpbmdpZnkoYXJyTWVtYmVycyk7XG5cbiAgICAgICAgLy8gR3JvdXAgUmlnaHRzXG4gICAgICAgIGNvbnN0IGFyckdyb3VwUmlnaHRzID0gW107XG4gICAgICAgICQoJ2lucHV0LmFjY2Vzcy1ncm91cC1jaGVja2JveCcpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXInKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIG1vZHVsZSBpbiBhcnJHcm91cFJpZ2h0cyBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBsZXQgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLm1vZHVsZSA9PT0gbW9kdWxlKTtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyckdyb3VwUmlnaHRzLnB1c2goeyBtb2R1bGUsIGNvbnRyb2xsZXJzOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvbnRyb2xsZXIgaW4gdGhlIG1vZHVsZSBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGVDb250cm9sbGVycyA9IGFyckdyb3VwUmlnaHRzW21vZHVsZUluZGV4XS5jb250cm9sbGVycztcbiAgICAgICAgICAgICAgICBsZXQgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb250cm9sbGVyID09PSBjb250cm9sbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbGxlckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVycy5wdXNoKHsgY29udHJvbGxlciwgYWN0aW9uczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHVzaCB0aGUgYWN0aW9uIGludG8gdGhlIGNvbnRyb2xsZXIncyBhY3Rpb25zIGFycmF5XG4gICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEuYWNjZXNzX2dyb3VwX3JpZ2h0cyA9IEpTT04uc3RyaW5naWZ5KGFyckdyb3VwUmlnaHRzKTtcblxuICAgICAgICAvLyBDRFIgRmlsdGVyXG4gICAgICAgIGNvbnN0IGFyckNEUkZpbHRlciA9IFtdO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyQ0RSRmlsdGVyLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuZGF0YS5jZHJGaWx0ZXIgPSBKU09OLnN0cmluZ2lmeShhcnJDRFJGaWx0ZXIpO1xuXG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VpSW5kZXhMZGFwLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcbiAgICAgICAgLy8gQWRkIGltcGxlbWVudGF0aW9uXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVGb3JtKCkge1xuICAgICAgICBGb3JtLiRmb3JtT2JqID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9hY2Nlc3MtZ3JvdXBzL3NhdmVgO1xuICAgICAgICBGb3JtLnZhbGlkYXRlUnVsZXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcudmFsaWRhdGVSdWxlcztcbiAgICAgICAgRm9ybS5jYkJlZm9yZVNlbmRGb3JtID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQmVmb3JlU2VuZEZvcm07XG4gICAgICAgIEZvcm0uY2JBZnRlclNlbmRGb3JtID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5pbml0aWFsaXplKCk7XG4gICAgfSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=