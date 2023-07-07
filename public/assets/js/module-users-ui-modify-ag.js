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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRzZWxlY3RVc2Vyc0Ryb3BEb3duIiwiJHN0YXR1c1RvZ2dsZSIsIiRob21lUGFnZURyb3Bkb3duIiwiJGFjY2Vzc1NldHRpbmdzVGFiTWVudSIsIiRtYWluVGFiTWVudSIsIiRjZHJGaWx0ZXJUYWIiLCIkY2RyRmlsdGVyVG9nZ2xlcyIsIiRjZHJGaWx0ZXJNb2RlIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJpbml0aWFsaXplRm9ybSIsImVhY2giLCJhdHRyIiwiZ2xvYmFsUm9vdFVybCIsInRhYiIsImluaXRpYWxpemVNZW1iZXJzRHJvcERvd24iLCJpbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcyIsImRyb3Bkb3duIiwiY2hlY2tib3giLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uQ2hhbmdlIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJkZWxldGVNZW1iZXJGcm9tVGFibGUiLCJ0YXJnZXQiLCJwYXJlbnQiLCJmaW5kIiwiY2RyRmlsdGVyTW9kZSIsImZvcm0iLCJoaWRlIiwic2hvdyIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJkYXRhIiwiYXJyTWVtYmVycyIsIm9iaiIsInB1c2giLCJtZW1iZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsImFyckdyb3VwUmlnaHRzIiwibW9kdWxlIiwiY29udHJvbGxlciIsIm1vZHVsZUluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImNvbnRyb2xsZXJzIiwibGVuZ3RoIiwibW9kdWxlQ29udHJvbGxlcnMiLCJjb250cm9sbGVySW5kZXgiLCJhY3Rpb25zIiwiYWNjZXNzX2dyb3VwX3JpZ2h0cyIsImFyckNEUkZpbHRlciIsImNkckZpbHRlciIsImNiQWZ0ZXJTZW5kRm9ybSIsInVybCIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUdBLElBQU1BLHFCQUFxQixHQUFHO0FBRTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFFBQVEsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBTmU7O0FBUTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLG9CQUFvQixFQUFFRCxDQUFDLENBQUMsNENBQUQsQ0FaRzs7QUFjMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUUsRUFBQUEsYUFBYSxFQUFFRixDQUFDLENBQUMsdUJBQUQsQ0FsQlU7O0FBb0IxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRyxFQUFBQSxpQkFBaUIsRUFBRUgsQ0FBQyxDQUFDLHFCQUFELENBeEJNOztBQTBCMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUksRUFBQUEsc0JBQXNCLEVBQUVKLENBQUMsQ0FBQyxpQ0FBRCxDQTlCQzs7QUFnQzFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lLLEVBQUFBLFlBQVksRUFBRUwsQ0FBQyxDQUFDLHdDQUFELENBcENXOztBQXNDMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSU0sRUFBQUEsYUFBYSxFQUFFTixDQUFDLENBQUMsK0RBQUQsQ0ExQ1U7O0FBNEMxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJTyxFQUFBQSxpQkFBaUIsRUFBRVAsQ0FBQyxDQUFDLHdCQUFELENBaERNOztBQWtEMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSVEsRUFBQUEsY0FBYyxFQUFFUixDQUFDLENBQUMsc0JBQUQsQ0F0RFM7O0FBd0QxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJUyxFQUFBQSxnQkFBZ0IsRUFBRSxFQTVEUTs7QUE4RDFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGNBQWMsRUFBRVYsQ0FBQyxDQUFDLGlCQUFELENBbEVTOztBQW9FMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSVcsRUFBQUEsWUFBWSxFQUFFWCxDQUFDLENBQUMsZUFBRCxDQXhFVzs7QUEwRTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lZLEVBQUFBLGFBQWEsRUFBRTtBQUNYQyxJQUFBQSxJQUFJLEVBQUU7QUFDRkMsTUFBQUEsVUFBVSxFQUFFLE1BRFY7QUFFRkMsTUFBQUEsS0FBSyxFQUFFLENBQ0g7QUFDSUMsUUFBQUEsSUFBSSxFQUFFLE9BRFY7QUFFSUMsUUFBQUEsTUFBTSxFQUFFQyxlQUFlLENBQUNDO0FBRjVCLE9BREc7QUFGTDtBQURLLEdBOUVXOztBQTBGMUI7QUFDSjtBQUNBO0FBQ0lDLEVBQUFBLFVBN0YwQix3QkE2RmI7QUFBQTs7QUFDVHRCLElBQUFBLHFCQUFxQixDQUFDdUIsaUJBQXRCO0FBQ0FDLElBQUFBLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IscUJBQXhCLEVBQStDekIscUJBQXFCLENBQUN1QixpQkFBckU7QUFDQXZCLElBQUFBLHFCQUFxQixDQUFDMEIsY0FBdEI7QUFFQXhCLElBQUFBLENBQUMsQ0FBQyxTQUFELENBQUQsQ0FBYXlCLElBQWIsQ0FBa0IsWUFBTTtBQUNwQixVQUFJekIsQ0FBQyxDQUFDLEtBQUQsQ0FBRCxDQUFRMEIsSUFBUixDQUFhLEtBQWIsTUFBd0IsRUFBNUIsRUFBZ0M7QUFDNUIxQixRQUFBQSxDQUFDLENBQUMsS0FBRCxDQUFELENBQVEwQixJQUFSLENBQWEsS0FBYixZQUF1QkMsYUFBdkI7QUFDSDtBQUNKLEtBSkQ7QUFNQTdCLElBQUFBLHFCQUFxQixDQUFDTyxZQUF0QixDQUFtQ3VCLEdBQW5DO0FBQ0E5QixJQUFBQSxxQkFBcUIsQ0FBQ00sc0JBQXRCLENBQTZDd0IsR0FBN0M7QUFDQTlCLElBQUFBLHFCQUFxQixDQUFDK0IseUJBQXRCO0FBQ0EvQixJQUFBQSxxQkFBcUIsQ0FBQ2dDLDBCQUF0QjtBQUNBaEMsSUFBQUEscUJBQXFCLENBQUNLLGlCQUF0QixDQUF3QzRCLFFBQXhDO0FBQ0FqQyxJQUFBQSxxQkFBcUIsQ0FBQ1MsaUJBQXRCLENBQXdDeUIsUUFBeEM7QUFDQWxDLElBQUFBLHFCQUFxQixDQUFDbUMsMEJBQXRCO0FBQ0FuQyxJQUFBQSxxQkFBcUIsQ0FBQ1UsY0FBdEIsQ0FBcUN3QixRQUFyQyxDQUE4QztBQUMxQ0UsTUFBQUEsUUFBUSxFQUFFcEMscUJBQXFCLENBQUNtQztBQURVLEtBQTlDO0FBSUFqQyxJQUFBQSxDQUFDLENBQUMsTUFBRCxDQUFELENBQVVtQyxFQUFWLENBQWEsT0FBYixFQUFzQixxQkFBdEIsRUFBNkMsVUFBQ0MsQ0FBRCxFQUFPO0FBQ2hEQSxNQUFBQSxDQUFDLENBQUNDLGNBQUY7QUFDQXZDLE1BQUFBLHFCQUFxQixDQUFDd0MscUJBQXRCLENBQTRDRixDQUFDLENBQUNHLE1BQTlDO0FBQ0gsS0FIRCxFQXRCUyxDQTJCVDs7QUFDQXpDLElBQUFBLHFCQUFxQixDQUFDYSxZQUF0QixDQUFtQ3dCLEVBQW5DLENBQXNDLE9BQXRDLEVBQStDLFVBQUNDLENBQUQsRUFBTztBQUNsREEsTUFBQUEsQ0FBQyxDQUFDQyxjQUFGO0FBQ0FyQyxNQUFBQSxDQUFDLENBQUNvQyxDQUFDLENBQUNHLE1BQUgsQ0FBRCxDQUFZQyxNQUFaLENBQW1CLFNBQW5CLEVBQThCQyxJQUE5QixDQUFtQyxjQUFuQyxFQUFtRFQsUUFBbkQsQ0FBNEQsT0FBNUQ7QUFDSCxLQUhELEVBNUJTLENBaUNUOztBQUNBbEMsSUFBQUEscUJBQXFCLENBQUNZLGNBQXRCLENBQXFDeUIsRUFBckMsQ0FBd0MsT0FBeEMsRUFBaUQsVUFBQ0MsQ0FBRCxFQUFPO0FBQ3BEQSxNQUFBQSxDQUFDLENBQUNDLGNBQUY7QUFDQXJDLE1BQUFBLENBQUMsQ0FBQ29DLENBQUMsQ0FBQ0csTUFBSCxDQUFELENBQVlDLE1BQVosQ0FBbUIsU0FBbkIsRUFBOEJDLElBQTlCLENBQW1DLGNBQW5DLEVBQW1EVCxRQUFuRCxDQUE0RCxTQUE1RDtBQUNILEtBSEQ7QUFLSCxHQXBJeUI7O0FBc0kxQjtBQUNKO0FBQ0E7QUFDSUMsRUFBQUEsMEJBekkwQix3Q0F5SUU7QUFDeEIsUUFBTVMsYUFBYSxHQUFHNUMscUJBQXFCLENBQUNDLFFBQXRCLENBQStCNEMsSUFBL0IsQ0FBb0MsV0FBcEMsRUFBZ0QsZUFBaEQsQ0FBdEI7O0FBQ0EsUUFBSUQsYUFBYSxLQUFHLEtBQXBCLEVBQTJCO0FBQ3ZCMUMsTUFBQUEsQ0FBQyxDQUFDLHVCQUFELENBQUQsQ0FBMkI0QyxJQUEzQjtBQUNILEtBRkQsTUFFTztBQUNINUMsTUFBQUEsQ0FBQyxDQUFDLHVCQUFELENBQUQsQ0FBMkI2QyxJQUEzQjtBQUNIO0FBQ0osR0FoSnlCOztBQWtKMUI7QUFDSjtBQUNBO0FBQ0loQixFQUFBQSx5QkFySjBCLHVDQXFKRTtBQUN4QixRQUFNaUIsY0FBYyxHQUFHQyxVQUFVLENBQUNDLDJDQUFYLEVBQXZCO0FBQ0FGLElBQUFBLGNBQWMsQ0FBQ0csTUFBZixHQUF3Qm5ELHFCQUFxQixDQUFDb0Qsa0JBQTlDO0FBQ0FKLElBQUFBLGNBQWMsQ0FBQ0ssU0FBZixHQUEyQjtBQUFFQyxNQUFBQSxJQUFJLEVBQUV0RCxxQkFBcUIsQ0FBQ3VEO0FBQTlCLEtBQTNCO0FBQ0F2RCxJQUFBQSxxQkFBcUIsQ0FBQ0csb0JBQXRCLENBQTJDOEIsUUFBM0MsQ0FBb0RlLGNBQXBEO0FBQ0gsR0ExSnlCOztBQTRKMUI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0lPLEVBQUFBLHlCQWxLMEIscUNBa0tBQyxRQWxLQSxFQWtLVUMsTUFsS1YsRUFrS2tCO0FBQ3hDLFFBQU1DLE1BQU0sR0FBR0YsUUFBUSxDQUFDQyxNQUFNLENBQUNDLE1BQVIsQ0FBUixJQUEyQixFQUExQztBQUNBLFFBQUlDLElBQUksR0FBRyxFQUFYO0FBQ0EsUUFBSUMsT0FBTyxHQUFHLEVBQWQ7QUFDQTFELElBQUFBLENBQUMsQ0FBQ3lCLElBQUYsQ0FBTytCLE1BQVAsRUFBZSxVQUFDRyxLQUFELEVBQVFDLE1BQVIsRUFBbUI7QUFDOUIsVUFBSUEsTUFBTSxDQUFDNUMsSUFBUCxLQUFnQjBDLE9BQXBCLEVBQTZCO0FBQ3pCQSxRQUFBQSxPQUFPLEdBQUdFLE1BQU0sQ0FBQzVDLElBQWpCO0FBQ0F5QyxRQUFBQSxJQUFJLElBQUksNkJBQVI7QUFDQUEsUUFBQUEsSUFBSSxJQUFJLHVCQUFSO0FBQ0FBLFFBQUFBLElBQUksSUFBSSw0QkFBUjtBQUNBQSxRQUFBQSxJQUFJLElBQUlHLE1BQU0sQ0FBQ0MsYUFBZjtBQUNBSixRQUFBQSxJQUFJLElBQUksUUFBUjtBQUNIOztBQUNELFVBQU1LLFNBQVMsR0FBSUYsTUFBTSxDQUFDTCxNQUFNLENBQUNRLElBQVIsQ0FBUCx5QkFBc0NILE1BQU0sQ0FBQ0wsTUFBTSxDQUFDUSxJQUFSLENBQTVDLFVBQStELEVBQWpGO0FBQ0EsVUFBTUMsYUFBYSxHQUFJaEUsQ0FBQyxnQkFBUzRELE1BQU0sQ0FBQ0wsTUFBTSxDQUFDVSxLQUFSLENBQWYsRUFBRCxDQUFrQ0MsUUFBbEMsQ0FBMkMsaUJBQTNDLENBQUQsR0FBa0UsV0FBbEUsR0FBZ0YsRUFBdEc7QUFDQVQsTUFBQUEsSUFBSSwyQkFBbUJPLGFBQW5CLGlDQUFxREosTUFBTSxDQUFDTCxNQUFNLENBQUNVLEtBQVIsQ0FBM0QsZUFBNkVILFNBQTdFLE1BQUo7QUFDQUwsTUFBQUEsSUFBSSxJQUFJRyxNQUFNLENBQUNMLE1BQU0sQ0FBQzFDLElBQVIsQ0FBZDtBQUNBNEMsTUFBQUEsSUFBSSxJQUFJLFFBQVI7QUFDSCxLQWREO0FBZUEsV0FBT0EsSUFBUDtBQUNILEdBdEx5Qjs7QUF3TDFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJUCxFQUFBQSxrQkE5TDBCLDhCQThMUGEsSUE5TE8sRUE4TERFLEtBOUxDLEVBOExNRSxRQTlMTixFQThMZ0I7QUFDdENuRSxJQUFBQSxDQUFDLGdCQUFTaUUsS0FBVCxFQUFELENBQ0tHLE9BREwsQ0FDYSxJQURiLEVBRUtDLFFBRkwsQ0FFYyxpQkFGZCxFQUdLeEIsSUFITDtBQUlBN0MsSUFBQUEsQ0FBQyxDQUFDbUUsUUFBRCxDQUFELENBQVlFLFFBQVosQ0FBcUIsVUFBckI7QUFDQUMsSUFBQUEsSUFBSSxDQUFDQyxXQUFMO0FBQ0gsR0FyTXlCOztBQXVNMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSWpDLEVBQUFBLHFCQTNNMEIsaUNBMk1KQyxNQTNNSSxFQTJNSTtBQUMxQixRQUFNaUMsRUFBRSxHQUFHeEUsQ0FBQyxDQUFDdUMsTUFBRCxDQUFELENBQVU2QixPQUFWLENBQWtCLEtBQWxCLEVBQXlCMUMsSUFBekIsQ0FBOEIsWUFBOUIsQ0FBWDtBQUNBMUIsSUFBQUEsQ0FBQyxZQUFLd0UsRUFBTCxFQUFELENBQ0tDLFdBREwsQ0FDaUIsaUJBRGpCLEVBRUs3QixJQUZMO0FBR0EwQixJQUFBQSxJQUFJLENBQUNDLFdBQUw7QUFDSCxHQWpOeUI7O0FBbU4xQjtBQUNKO0FBQ0E7QUFDSXpDLEVBQUFBLDBCQXROMEIsd0NBc05HO0FBQ3pCOUIsSUFBQUEsQ0FBQyxDQUFDLDZDQUFELENBQUQsQ0FDS2dDLFFBREwsQ0FDYztBQUNOO0FBQ0EwQyxNQUFBQSxTQUFTLEVBQUUscUJBQVc7QUFDbEIsWUFDSUMsY0FBYyxHQUFJM0UsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRb0UsT0FBUixDQUFnQixXQUFoQixFQUE2QlEsUUFBN0IsQ0FBc0MsT0FBdEMsRUFBK0NuQyxJQUEvQyxDQUFvRCxXQUFwRCxDQUR0QjtBQUdBa0MsUUFBQUEsY0FBYyxDQUFDM0MsUUFBZixDQUF3QixPQUF4QjtBQUNILE9BUEs7QUFRTjtBQUNBNkMsTUFBQUEsV0FBVyxFQUFFLHVCQUFXO0FBQ3BCLFlBQ0lGLGNBQWMsR0FBSTNFLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUW9FLE9BQVIsQ0FBZ0IsV0FBaEIsRUFBNkJRLFFBQTdCLENBQXNDLE9BQXRDLEVBQStDbkMsSUFBL0MsQ0FBb0QsV0FBcEQsQ0FEdEI7QUFHQWtDLFFBQUFBLGNBQWMsQ0FBQzNDLFFBQWYsQ0FBd0IsU0FBeEI7QUFDSDtBQWRLLEtBRGQ7QUFrQkFoQyxJQUFBQSxDQUFDLENBQUMsNENBQUQsQ0FBRCxDQUNLZ0MsUUFETCxDQUNjO0FBQ047QUFDQThDLE1BQUFBLFVBQVUsRUFBRyxJQUZQO0FBR047QUFDQTVDLE1BQUFBLFFBQVEsRUFBSyxvQkFBVztBQUNwQixZQUNJNkMsVUFBVSxHQUFRL0UsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRb0UsT0FBUixDQUFnQixPQUFoQixDQUR0QjtBQUFBLFlBRUlZLGVBQWUsR0FBR0QsVUFBVSxDQUFDWCxPQUFYLENBQW1CLE9BQW5CLEVBQTRCYSxRQUE1QixDQUFxQyxXQUFyQyxDQUZ0QjtBQUFBLFlBR0lDLFNBQVMsR0FBU0gsVUFBVSxDQUFDdEMsSUFBWCxDQUFnQixXQUFoQixDQUh0QjtBQUFBLFlBSUkwQyxVQUFVLEdBQVEsSUFKdEI7QUFBQSxZQUtJQyxZQUFZLEdBQU0sSUFMdEIsQ0FEb0IsQ0FRcEI7O0FBQ0FGLFFBQUFBLFNBQVMsQ0FBQ3pELElBQVYsQ0FBZSxZQUFXO0FBQ3RCLGNBQUl6QixDQUFDLENBQUMsSUFBRCxDQUFELENBQVFnQyxRQUFSLENBQWlCLFlBQWpCLENBQUosRUFBcUM7QUFDakNvRCxZQUFBQSxZQUFZLEdBQUcsS0FBZjtBQUNILFdBRkQsTUFHSztBQUNERCxZQUFBQSxVQUFVLEdBQUcsS0FBYjtBQUNIO0FBQ0osU0FQRCxFQVRvQixDQWlCcEI7O0FBQ0EsWUFBR0EsVUFBSCxFQUFlO0FBQ1hILFVBQUFBLGVBQWUsQ0FBQ2hELFFBQWhCLENBQXlCLGFBQXpCO0FBQ0gsU0FGRCxNQUdLLElBQUdvRCxZQUFILEVBQWlCO0FBQ2xCSixVQUFBQSxlQUFlLENBQUNoRCxRQUFoQixDQUF5QixlQUF6QjtBQUNILFNBRkksTUFHQTtBQUNEZ0QsVUFBQUEsZUFBZSxDQUFDaEQsUUFBaEIsQ0FBeUIsbUJBQXpCO0FBQ0g7O0FBQ0RsQyxRQUFBQSxxQkFBcUIsQ0FBQ3VGLHVCQUF0QjtBQUNIO0FBaENLLEtBRGQ7QUFvQ0gsR0E3UXlCOztBQStRMUI7QUFDSjtBQUNBO0FBQ0lBLEVBQUFBLHVCQWxSMEIscUNBa1JEO0FBQ3JCLFFBQU1DLFdBQVcsR0FBR3hGLHFCQUFxQixDQUFDQyxRQUF0QixDQUErQjRDLElBQS9CLENBQW9DLFdBQXBDLEVBQWdELGtDQUFoRCxDQUFwQjs7QUFDQSxRQUFJMkMsV0FBVyxLQUFHLElBQWxCLEVBQXdCO0FBQ3BCeEYsTUFBQUEscUJBQXFCLENBQUNRLGFBQXRCLENBQW9DdUMsSUFBcEM7QUFDSCxLQUZELE1BRU87QUFDSC9DLE1BQUFBLHFCQUFxQixDQUFDUSxhQUF0QixDQUFvQ3NDLElBQXBDO0FBQ0g7QUFDSixHQXpSeUI7O0FBMlIxQjtBQUNKO0FBQ0E7QUFDSXZCLEVBQUFBLGlCQTlSMEIsK0JBOFJOO0FBQ2hCLFFBQUl2QixxQkFBcUIsQ0FBQ0ksYUFBdEIsQ0FBb0M4QixRQUFwQyxDQUE2QyxZQUE3QyxDQUFKLEVBQWdFO0FBQzVEaEMsTUFBQUEsQ0FBQyxDQUFDLG9DQUFELENBQUQsQ0FBd0N5RSxXQUF4QyxDQUFvRCxVQUFwRDtBQUNBekUsTUFBQUEsQ0FBQyxDQUFDLGtDQUFELENBQUQsQ0FBc0N5RSxXQUF0QyxDQUFrRCxVQUFsRDtBQUNBekUsTUFBQUEsQ0FBQyxDQUFDLHlDQUFELENBQUQsQ0FBNkN5RSxXQUE3QyxDQUF5RCxVQUF6RDtBQUNBekUsTUFBQUEsQ0FBQyxDQUFDLHVDQUFELENBQUQsQ0FBMkN5RSxXQUEzQyxDQUF1RCxVQUF2RDtBQUNILEtBTEQsTUFLTztBQUNIekUsTUFBQUEsQ0FBQyxDQUFDLG9DQUFELENBQUQsQ0FBd0NxRSxRQUF4QyxDQUFpRCxVQUFqRDtBQUNBckUsTUFBQUEsQ0FBQyxDQUFDLGtDQUFELENBQUQsQ0FBc0NxRSxRQUF0QyxDQUErQyxVQUEvQztBQUNBckUsTUFBQUEsQ0FBQyxDQUFDLHlDQUFELENBQUQsQ0FBNkNxRSxRQUE3QyxDQUFzRCxVQUF0RDtBQUNBckUsTUFBQUEsQ0FBQyxDQUFDLHVDQUFELENBQUQsQ0FBMkNxRSxRQUEzQyxDQUFvRCxVQUFwRDtBQUNIO0FBQ0osR0ExU3lCOztBQTRTMUI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJa0IsRUFBQUEsZ0JBalQwQiw0QkFpVFRDLFFBalRTLEVBaVRDO0FBQ3ZCLFFBQU1DLE1BQU0sR0FBR0QsUUFBZjtBQUNBQyxJQUFBQSxNQUFNLENBQUNDLElBQVAsR0FBYzVGLHFCQUFxQixDQUFDQyxRQUF0QixDQUErQjRDLElBQS9CLENBQW9DLFlBQXBDLENBQWQsQ0FGdUIsQ0FJdkI7O0FBQ0EsUUFBTWdELFVBQVUsR0FBRyxFQUFuQjtBQUNBM0YsSUFBQUEsQ0FBQyxDQUFDLG9CQUFELENBQUQsQ0FBd0J5QixJQUF4QixDQUE2QixVQUFDa0MsS0FBRCxFQUFRaUMsR0FBUixFQUFnQjtBQUN6QyxVQUFJNUYsQ0FBQyxDQUFDNEYsR0FBRCxDQUFELENBQU9sRSxJQUFQLENBQVksWUFBWixDQUFKLEVBQStCO0FBQzNCaUUsUUFBQUEsVUFBVSxDQUFDRSxJQUFYLENBQWdCN0YsQ0FBQyxDQUFDNEYsR0FBRCxDQUFELENBQU9sRSxJQUFQLENBQVksWUFBWixDQUFoQjtBQUNIO0FBQ0osS0FKRDtBQU1BK0QsSUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlJLE9BQVosR0FBc0JDLElBQUksQ0FBQ0MsU0FBTCxDQUFlTCxVQUFmLENBQXRCLENBWnVCLENBY3ZCOztBQUNBLFFBQU1NLGNBQWMsR0FBRyxFQUF2QjtBQUNBakcsSUFBQUEsQ0FBQyxDQUFDLDZCQUFELENBQUQsQ0FBaUN5QixJQUFqQyxDQUFzQyxVQUFDa0MsS0FBRCxFQUFRaUMsR0FBUixFQUFnQjtBQUNsRCxVQUFJNUYsQ0FBQyxDQUFDNEYsR0FBRCxDQUFELENBQU9wRCxNQUFQLENBQWMsV0FBZCxFQUEyQlIsUUFBM0IsQ0FBb0MsWUFBcEMsQ0FBSixFQUF1RDtBQUNuRCxZQUFNa0UsTUFBTSxHQUFHbEcsQ0FBQyxDQUFDNEYsR0FBRCxDQUFELENBQU9sRSxJQUFQLENBQVksYUFBWixDQUFmO0FBQ0EsWUFBTXlFLFVBQVUsR0FBR25HLENBQUMsQ0FBQzRGLEdBQUQsQ0FBRCxDQUFPbEUsSUFBUCxDQUFZLGlCQUFaLENBQW5CO0FBQ0EsWUFBTXVCLE1BQU0sR0FBR2pELENBQUMsQ0FBQzRGLEdBQUQsQ0FBRCxDQUFPbEUsSUFBUCxDQUFZLGFBQVosQ0FBZixDQUhtRCxDQUtuRDs7QUFDQSxZQUFJMEUsV0FBVyxHQUFHSCxjQUFjLENBQUNJLFNBQWYsQ0FBeUIsVUFBQUMsSUFBSTtBQUFBLGlCQUFJQSxJQUFJLENBQUNKLE1BQUwsS0FBZ0JBLE1BQXBCO0FBQUEsU0FBN0IsQ0FBbEI7O0FBQ0EsWUFBSUUsV0FBVyxLQUFLLENBQUMsQ0FBckIsRUFBd0I7QUFDcEJILFVBQUFBLGNBQWMsQ0FBQ0osSUFBZixDQUFvQjtBQUFFSyxZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUssWUFBQUEsV0FBVyxFQUFFO0FBQXZCLFdBQXBCO0FBQ0FILFVBQUFBLFdBQVcsR0FBR0gsY0FBYyxDQUFDTyxNQUFmLEdBQXdCLENBQXRDO0FBQ0gsU0FWa0QsQ0FZbkQ7OztBQUNBLFlBQU1DLGlCQUFpQixHQUFHUixjQUFjLENBQUNHLFdBQUQsQ0FBZCxDQUE0QkcsV0FBdEQ7QUFDQSxZQUFJRyxlQUFlLEdBQUdELGlCQUFpQixDQUFDSixTQUFsQixDQUE0QixVQUFBQyxJQUFJO0FBQUEsaUJBQUlBLElBQUksQ0FBQ0gsVUFBTCxLQUFvQkEsVUFBeEI7QUFBQSxTQUFoQyxDQUF0Qjs7QUFDQSxZQUFJTyxlQUFlLEtBQUssQ0FBQyxDQUF6QixFQUE0QjtBQUN4QkQsVUFBQUEsaUJBQWlCLENBQUNaLElBQWxCLENBQXVCO0FBQUVNLFlBQUFBLFVBQVUsRUFBVkEsVUFBRjtBQUFjUSxZQUFBQSxPQUFPLEVBQUU7QUFBdkIsV0FBdkI7QUFDQUQsVUFBQUEsZUFBZSxHQUFHRCxpQkFBaUIsQ0FBQ0QsTUFBbEIsR0FBMkIsQ0FBN0M7QUFDSCxTQWxCa0QsQ0FvQm5EOzs7QUFDQUMsUUFBQUEsaUJBQWlCLENBQUNDLGVBQUQsQ0FBakIsQ0FBbUNDLE9BQW5DLENBQTJDZCxJQUEzQyxDQUFnRDVDLE1BQWhEO0FBQ0g7QUFDSixLQXhCRDtBQTBCQXdDLElBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZa0IsbUJBQVosR0FBa0NiLElBQUksQ0FBQ0MsU0FBTCxDQUFlQyxjQUFmLENBQWxDLENBMUN1QixDQTRDdkI7O0FBQ0EsUUFBTVksWUFBWSxHQUFHLEVBQXJCO0FBQ0EvRyxJQUFBQSxxQkFBcUIsQ0FBQ1MsaUJBQXRCLENBQXdDa0IsSUFBeEMsQ0FBNkMsVUFBQ2tDLEtBQUQsRUFBUWlDLEdBQVIsRUFBZ0I7QUFDekQsVUFBSTVGLENBQUMsQ0FBQzRGLEdBQUQsQ0FBRCxDQUFPNUQsUUFBUCxDQUFnQixZQUFoQixDQUFKLEVBQW1DO0FBQy9CNkUsUUFBQUEsWUFBWSxDQUFDaEIsSUFBYixDQUFrQjdGLENBQUMsQ0FBQzRGLEdBQUQsQ0FBRCxDQUFPbEUsSUFBUCxDQUFZLFlBQVosQ0FBbEI7QUFDSDtBQUNKLEtBSkQ7QUFLQStELElBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZb0IsU0FBWixHQUF3QmYsSUFBSSxDQUFDQyxTQUFMLENBQWVhLFlBQWYsQ0FBeEI7QUFFQSxXQUFPcEIsTUFBUDtBQUNILEdBdld5Qjs7QUF3VzFCO0FBQ0o7QUFDQTtBQUNJc0IsRUFBQUEsZUEzVzBCLDZCQTJXUixDQUNkO0FBQ0gsR0E3V3lCOztBQStXMUI7QUFDSjtBQUNBO0FBQ0l2RixFQUFBQSxjQWxYMEIsNEJBa1hUO0FBQ2I4QyxJQUFBQSxJQUFJLENBQUN2RSxRQUFMLEdBQWdCRCxxQkFBcUIsQ0FBQ0MsUUFBdEM7QUFDQXVFLElBQUFBLElBQUksQ0FBQzBDLEdBQUwsYUFBY3JGLGFBQWQ7QUFDQTJDLElBQUFBLElBQUksQ0FBQzFELGFBQUwsR0FBcUJkLHFCQUFxQixDQUFDYyxhQUEzQztBQUNBMEQsSUFBQUEsSUFBSSxDQUFDaUIsZ0JBQUwsR0FBd0J6RixxQkFBcUIsQ0FBQ3lGLGdCQUE5QztBQUNBakIsSUFBQUEsSUFBSSxDQUFDeUMsZUFBTCxHQUF1QmpILHFCQUFxQixDQUFDaUgsZUFBN0M7QUFDQXpDLElBQUFBLElBQUksQ0FBQ2xELFVBQUw7QUFDSDtBQXpYeUIsQ0FBOUI7QUE0WEFwQixDQUFDLENBQUNpSCxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3BCcEgsRUFBQUEscUJBQXFCLENBQUNzQixVQUF0QjtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsVHJhbnNsYXRlLCBGb3JtLCBFeHRlbnNpb25zICovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVSU1vZGlmeUFHID0ge1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgc2VsZWN0IHVzZXJzIGRyb3Bkb3duLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHNlbGVjdFVzZXJzRHJvcERvd246ICQoJ1tkYXRhLXRhYj1cInVzZXJzXCJdIC5zZWxlY3QtZXh0ZW5zaW9uLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbW9kdWxlIHN0YXR1cyB0b2dnbGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBob21lIHBhZ2UgZHJvcGRvd24gc2VsZWN0LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGhvbWVQYWdlRHJvcGRvd246ICQoJy5ob21lLXBhZ2UtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBhY2Nlc3Mgc2V0dGluZ3MgdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkYWNjZXNzU2V0dGluZ3NUYWJNZW51OiAkKCcjYWNjZXNzLXNldHRpbmdzLXRhYi1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbWFpbiB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRtYWluVGFiTWVudTogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiY2RyLWZpbHRlclwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdG9nZ2xlcy5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUb2dnbGVzOiAkKCdkaXYuY2RyLWZpbHRlci10b2dnbGVzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlck1vZGU6ICQoJ2Rpdi5jZHItZmlsdGVyLXJhZGlvJyksXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGV4dGVuc2lvbi5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuQ2hlY2tCdXR0b246ICQoJy51bmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQnV0dG9uOiAkKCcuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICduYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplRm9ybSgpO1xuXG4gICAgICAgICQoJy5hdmF0YXInKS5lYWNoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3NyYycpID09PSAnJykge1xuICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc3JjJywgYCR7Z2xvYmFsUm9vdFVybH1hc3NldHMvaW1nL3Vua25vd25QZXJzb24uanBnYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kYWNjZXNzU2V0dGluZ3NUYWJNZW51LnRhYigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93bigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5jaGVja2JveCgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJNb2RlLmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnYm9keScpLm9uKCdjbGljaycsICdkaXYuZGVsZXRlLXVzZXItcm93JywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5kZWxldGVNZW1iZXJGcm9tVGFibGUoZS50YXJnZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgdW5jaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiR1bkNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCl7XG4gICAgICAgIGNvbnN0IGNkckZpbHRlck1vZGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnY2RyRmlsdGVyTW9kZScpO1xuICAgICAgICBpZiAoY2RyRmlsdGVyTW9kZT09PSdhbGwnKSB7XG4gICAgICAgICAgICAkKCcjY2RyLWV4dGVuc2lvbnMtdGFibGUnKS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjY2RyLWV4dGVuc2lvbnMtdGFibGUnKS5zaG93KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gZm9yIGFzc2lnbmluZyBjdXJyZW50IGFjY2VzcyBncm91cC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCkge1xuICAgICAgICBjb25zdCBkcm9wZG93blBhcmFtcyA9IEV4dGVuc2lvbnMuZ2V0RHJvcGRvd25TZXR0aW5nc09ubHlJbnRlcm5hbFdpdGhvdXRFbXB0eSgpO1xuICAgICAgICBkcm9wZG93blBhcmFtcy5hY3Rpb24gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclVzZXJzU2VsZWN0O1xuICAgICAgICBkcm9wZG93blBhcmFtcy50ZW1wbGF0ZXMgPSB7IG1lbnU6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jdXN0b21NZW1iZXJzRHJvcGRvd25NZW51IH07XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc2VsZWN0VXNlcnNEcm9wRG93bi5kcm9wZG93bihkcm9wZG93blBhcmFtcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbWl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gbWVudSB2aXN1YWxpemF0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkcyAtIFRoZSBmaWVsZHMgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIEhUTUwgc3RyaW5nIGZvciB0aGUgZHJvcGRvd24gbWVudS5cbiAgICAgKi9cbiAgICBjdXN0b21NZW1iZXJzRHJvcGRvd25NZW51KHJlc3BvbnNlLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gcmVzcG9uc2VbZmllbGRzLnZhbHVlc10gfHwge307XG4gICAgICAgIGxldCBodG1sID0gJyc7XG4gICAgICAgIGxldCBvbGRUeXBlID0gJyc7XG4gICAgICAgICQuZWFjaCh2YWx1ZXMsIChpbmRleCwgb3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAob3B0aW9uLnR5cGUgIT09IG9sZFR5cGUpIHtcbiAgICAgICAgICAgICAgICBvbGRUeXBlID0gb3B0aW9uLnR5cGU7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImRpdmlkZXJcIj48L2Rpdj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGRpdiBjbGFzcz1cImhlYWRlclwiPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8aSBjbGFzcz1cInRhZ3MgaWNvblwiPjwvaT4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uLnR5cGVMb2NhbGl6ZWQ7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1heWJlVGV4dCA9IChvcHRpb25bZmllbGRzLnRleHRdKSA/IGBkYXRhLXRleHQ9XCIke29wdGlvbltmaWVsZHMudGV4dF19XCJgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBtYXliZURpc2FibGVkID0gKCQoYCNleHQtJHtvcHRpb25bZmllbGRzLnZhbHVlXX1gKS5oYXNDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJykpID8gJ2Rpc2FibGVkICcgOiAnJztcbiAgICAgICAgICAgIGh0bWwgKz0gYDxkaXYgY2xhc3M9XCIke21heWJlRGlzYWJsZWR9aXRlbVwiIGRhdGEtdmFsdWU9XCIke29wdGlvbltmaWVsZHMudmFsdWVdfVwiJHttYXliZVRleHR9PmA7XG4gICAgICAgICAgICBodG1sICs9IG9wdGlvbltmaWVsZHMubmFtZV07XG4gICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbGVjdGluZyBhIHVzZXIgZm9yIHRoZSBncm91cC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzZWxlY3RlZCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBUaGUgalF1ZXJ5IGVsZW1lbnQuXG4gICAgICovXG4gICAgY2JBZnRlclVzZXJzU2VsZWN0KHRleHQsIHZhbHVlLCAkZWxlbWVudCkge1xuICAgICAgICAkKGAjZXh0LSR7dmFsdWV9YClcbiAgICAgICAgICAgIC5jbG9zZXN0KCd0cicpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAkKCRlbGVtZW50KS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGEgZ3JvdXAgbWVtYmVyIGZyb20gdGhlIHRhYmxlLlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIFRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKi9cbiAgICBkZWxldGVNZW1iZXJGcm9tVGFibGUodGFyZ2V0KSB7XG4gICAgICAgIGNvbnN0IGlkID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ2RpdicpLmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgJChgIyR7aWR9YClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5oaWRlKCk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHJpZ2h0cyBjaGVja2JveGVzLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCkge1xuICAgICAgICAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAubGlzdCAubWFzdGVyLmNoZWNrYm94JylcbiAgICAgICAgICAgIC5jaGVja2JveCh7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25DaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyB1bmNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uVW5jaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ3VuY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5jaGlsZC5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgb24gbG9hZCB0byBzZXQgcGFyZW50IHZhbHVlXG4gICAgICAgICAgICAgICAgZmlyZU9uSW5pdCA6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHBhcmVudCBzdGF0ZSBvbiBlYWNoIGNoaWxkIGNoZWNrYm94IGNoYW5nZVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkbGlzdEdyb3VwICAgICAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5saXN0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3ggPSAkbGlzdEdyb3VwLmNsb3Nlc3QoJy5pdGVtJykuY2hpbGRyZW4oJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94ICAgICAgID0gJGxpc3RHcm91cC5maW5kKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgICAgICA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgICAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGFsbCBvdGhlciBzaWJsaW5ncyBhcmUgY2hlY2tlZCBvciB1bmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHBhcmVudCBjaGVja2JveCBzdGF0ZSwgYnV0IGRvbnQgdHJpZ2dlciBpdHMgb25DaGFuZ2UgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgaWYoYWxsQ2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgY2hlY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoYWxsVW5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCB1bmNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGluZGV0ZXJtaW5hdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBncm91cCByaWdodC5cbiAgICAgKi9cbiAgICBjZEFmdGVyQ2hhbmdlR3JvdXBSaWdodCgpe1xuICAgICAgICBjb25zdCBhY2Nlc3NUb0NkciA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdDYWxsRGV0YWlsUmVjb3Jkc0NvbnRyb2xsZXJfbWFpbicpO1xuICAgICAgICBpZiAoYWNjZXNzVG9DZHI9PT0nb24nKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgc3RhdHVzIG9mIGJ1dHRvbnMgd2hlbiB0aGUgbW9kdWxlIHN0YXR1cyBjaGFuZ2VzLlxuICAgICAqL1xuICAgIGNoZWNrU3RhdHVzVG9nZ2xlKCkge1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc2V0dGluZ3MgLSBUaGUgZm9ybSBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBtb2RpZmllZCBmb3JtIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gc2V0dGluZ3M7XG4gICAgICAgIHJlc3VsdC5kYXRhID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcblxuICAgICAgICAvLyBHcm91cCBtZW1iZXJzXG4gICAgICAgIGNvbnN0IGFyck1lbWJlcnMgPSBbXTtcbiAgICAgICAgJCgndHIuc2VsZWN0ZWQtbWVtYmVyJykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpIHtcbiAgICAgICAgICAgICAgICBhcnJNZW1iZXJzLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5kYXRhLm1lbWJlcnMgPSBKU09OLnN0cmluZ2lmeShhcnJNZW1iZXJzKTtcblxuICAgICAgICAvLyBHcm91cCBSaWdodHNcbiAgICAgICAgY29uc3QgYXJyR3JvdXBSaWdodHMgPSBbXTtcbiAgICAgICAgJCgnaW5wdXQuYWNjZXNzLWdyb3VwLWNoZWNrYm94JykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5wYXJlbnQoJy5jaGVja2JveCcpLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlcicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9ICQob2JqKS5hdHRyKCdkYXRhLWFjdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgbW9kdWxlIGluIGFyckdyb3VwUmlnaHRzIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGxldCBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0ubW9kdWxlID09PSBtb2R1bGUpO1xuICAgICAgICAgICAgICAgIGlmIChtb2R1bGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyR3JvdXBSaWdodHMucHVzaCh7IG1vZHVsZSwgY29udHJvbGxlcnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgY29udHJvbGxlciBpbiB0aGUgbW9kdWxlIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZUNvbnRyb2xsZXJzID0gYXJyR3JvdXBSaWdodHNbbW9kdWxlSW5kZXhdLmNvbnRyb2xsZXJzO1xuICAgICAgICAgICAgICAgIGxldCBjb250cm9sbGVySW5kZXggPSBtb2R1bGVDb250cm9sbGVycy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUNvbnRyb2xsZXJzLnB1c2goeyBjb250cm9sbGVyLCBhY3Rpb25zOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQdXNoIHRoZSBhY3Rpb24gaW50byB0aGUgY29udHJvbGxlcidzIGFjdGlvbnMgYXJyYXlcbiAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdLmFjdGlvbnMucHVzaChhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5hY2Nlc3NfZ3JvdXBfcmlnaHRzID0gSlNPTi5zdHJpbmdpZnkoYXJyR3JvdXBSaWdodHMpO1xuXG4gICAgICAgIC8vIENEUiBGaWx0ZXJcbiAgICAgICAgY29uc3QgYXJyQ0RSRmlsdGVyID0gW107XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBhcnJDRFJGaWx0ZXIucHVzaCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdC5kYXRhLmNkckZpbHRlciA9IEpTT04uc3RyaW5naWZ5KGFyckNEUkZpbHRlcik7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKCkge1xuICAgICAgICAvLyBBZGQgaW1wbGVtZW50YXRpb25cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2FjY2Vzcy1ncm91cHMvc2F2ZWA7XG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclNlbmRGb3JtO1xuICAgICAgICBGb3JtLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==