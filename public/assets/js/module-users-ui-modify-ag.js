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
  $homePageDropdown: $('#home-page-dropdown'),

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
   * Users table for CDR filter.
   * @type {jQuery}
   */
  $cdrFilterUsersTable: $('#cdr-filter-users-table'),

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
    }); // Initialize CDR filter datatable

    moduleUsersUIModifyAG.initializeCDRFilterTable();
    moduleUsersUIModifyAG.initializeForm();
  },

  /**
   * Callback function after changing the full access toggle.
   */
  cbAfterChangeFullAccessToggle: function cbAfterChangeFullAccessToggle() {
    if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
      // Check all checkboxes
      moduleUsersUIModifyAG.$mainTabMenu.tab('change tab', 'general');
      moduleUsersUIModifyAG.$cdrFilterTab.hide();
      moduleUsersUIModifyAG.$groupRightsTab.hide();
    } else {
      moduleUsersUIModifyAG.$groupRightsTab.show();
      moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
    }

    moduleUsersUIModifyAG.$homePageDropdown.dropdown(moduleUsersUIModifyAG.getHomePagesForSelect());
  },

  /**
   * Callback function after changing the CDR filter mode.
   */
  cbAfterChangeCDRFilterMode: function cbAfterChangeCDRFilterMode() {
    var cdrFilterMode = moduleUsersUIModifyAG.$formObj.form('get value', 'cdrFilterMode');

    if (cdrFilterMode === 'all') {
      $('#cdr-filter-users-table_wrapper').hide();
    } else {
      $('#cdr-filter-users-table_wrapper').show();
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
      },
      onChange: function onChange() {
        moduleUsersUIModifyAG.$homePageDropdown.dropdown(moduleUsersUIModifyAG.getHomePagesForSelect());
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
    var valueSelected = false;
    var currentHomePage = moduleUsersUIModifyAG.$formObj.form('get value', 'homePage');
    var selectedRights = $('.checked .access-group-checkbox');

    if (moduleUsersUIModifyAG.$fullAccessCheckbox.checkbox('is checked')) {
      selectedRights = $('.access-group-checkbox');
    }

    var values = [];
    selectedRights.each(function (index, obj) {
      var module = $(obj).attr('data-module');
      var controllerName = $(obj).attr('data-controller-name');
      var action = $(obj).attr('data-action');

      if (controllerName.indexOf('pbxcore') === -1 && action.indexOf('index') > -1) {
        var url = moduleUsersUIModifyAG.convertCamelToDash("/".concat(module, "/").concat(controllerName, "/").concat(action));
        var nameTemplates = ["mm_".concat(controllerName), "Breadcrumb".concat(module), "module_usersui_".concat(module, "_").concat(controllerName, "_").concat(action)];
        var name = '';
        nameTemplates.every(function (nameTemplate) {
          name = globalTranslate[nameTemplate];

          if (name === undefined) {
            name = nameTemplate;
            return true;
          } else {
            return false;
          }
        });

        if (currentHomePage === url) {
          values.push({
            name: name,
            value: url,
            selected: true
          });
          valueSelected = true;
        } else {
          values.push({
            name: name,
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
      valueSelected = true;
    }

    if (!valueSelected) {
      values[0].selected = true;
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


    var selectedHomePage = moduleUsersUIModifyAG.$homePageDropdown.dropdown('get value');
    var dropdownParams = moduleUsersUIModifyAG.getHomePagesForSelect();
    moduleUsersUIModifyAG.$homePageDropdown.dropdown('setup menu', dropdownParams);
    var homePage = '';
    $.each(dropdownParams.values, function (index, record) {
      if (record.value === selectedHomePage) {
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
   * Initializes the users table DataTable.
   */
  initializeCDRFilterTable: function initializeCDRFilterTable() {
    moduleUsersUIModifyAG.$cdrFilterUsersTable.DataTable({
      // destroy: true,
      lengthChange: false,
      paging: false,
      columns: [// CheckBox
      {
        orderable: false,
        // This column is not orderable
        searchable: false // This column is not searchable

      }, // Username
      {
        orderable: true,
        // This column is orderable
        searchable: true // This column is searchable

      }, // Extension
      {
        orderable: true,
        // This column is orderable
        searchable: true // This column is searchable

      }, // Mobile
      {
        orderable: false,
        // This column is not orderable
        searchable: false // This column is not searchable

      }, // Email
      {
        orderable: true,
        // This column is orderable
        searchable: true // This column is searchable

      }],
      order: [0, 'asc'],
      language: SemanticLocalization.dataTableLocalisation
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCIkY2RyRmlsdGVyVG9nZ2xlcyIsIiRjZHJGaWx0ZXJNb2RlIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJkcm9wZG93biIsImdldEhvbWVQYWdlc0ZvclNlbGVjdCIsImNkckZpbHRlck1vZGUiLCJmb3JtIiwiZHJvcGRvd25QYXJhbXMiLCJFeHRlbnNpb25zIiwiZ2V0RHJvcGRvd25TZXR0aW5nc09ubHlJbnRlcm5hbFdpdGhvdXRFbXB0eSIsImFjdGlvbiIsImNiQWZ0ZXJVc2Vyc1NlbGVjdCIsInRlbXBsYXRlcyIsIm1lbnUiLCJjdXN0b21NZW1iZXJzRHJvcGRvd25NZW51IiwicmVzcG9uc2UiLCJmaWVsZHMiLCJ2YWx1ZXMiLCJodG1sIiwib2xkVHlwZSIsImluZGV4Iiwib3B0aW9uIiwidHlwZUxvY2FsaXplZCIsIm1heWJlVGV4dCIsInRleHQiLCJtYXliZURpc2FibGVkIiwidmFsdWUiLCJoYXNDbGFzcyIsIiRlbGVtZW50IiwiY2xvc2VzdCIsImFkZENsYXNzIiwiRm9ybSIsImRhdGFDaGFuZ2VkIiwiaWQiLCJyZW1vdmVDbGFzcyIsIm9uQ2hlY2tlZCIsIiRjaGlsZENoZWNrYm94Iiwic2libGluZ3MiLCJvblVuY2hlY2tlZCIsImZpcmVPbkluaXQiLCIkbGlzdEdyb3VwIiwiJHBhcmVudENoZWNrYm94IiwiY2hpbGRyZW4iLCIkY2hlY2tib3giLCJhbGxDaGVja2VkIiwiYWxsVW5jaGVja2VkIiwiY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQiLCJhY2Nlc3NUb0NkciIsInZhbHVlU2VsZWN0ZWQiLCJjdXJyZW50SG9tZVBhZ2UiLCJzZWxlY3RlZFJpZ2h0cyIsIm9iaiIsIm1vZHVsZSIsImNvbnRyb2xsZXJOYW1lIiwiaW5kZXhPZiIsInVybCIsImNvbnZlcnRDYW1lbFRvRGFzaCIsIm5hbWVUZW1wbGF0ZXMiLCJldmVyeSIsIm5hbWVUZW1wbGF0ZSIsInVuZGVmaW5lZCIsInB1c2giLCJzZWxlY3RlZCIsImxlbmd0aCIsImZhaWxCYWNrSG9tZVBhZ2UiLCJzdHIiLCJyZXBsYWNlIiwidG9Mb3dlckNhc2UiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJkYXRhIiwiYXJyTWVtYmVycyIsIm1lbWJlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiYXJyR3JvdXBSaWdodHMiLCJjb250cm9sbGVyIiwibW9kdWxlSW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwiY29udHJvbGxlcnMiLCJtb2R1bGVDb250cm9sbGVycyIsImNvbnRyb2xsZXJJbmRleCIsImFjdGlvbnMiLCJhY2Nlc3NfZ3JvdXBfcmlnaHRzIiwiYXJyQ0RSRmlsdGVyIiwiY2RyRmlsdGVyIiwiZnVsbEFjY2VzcyIsInNlbGVjdGVkSG9tZVBhZ2UiLCJob21lUGFnZSIsInJlY29yZCIsIkRhdGFUYWJsZSIsImxlbmd0aENoYW5nZSIsInBhZ2luZyIsImNvbHVtbnMiLCJvcmRlcmFibGUiLCJzZWFyY2hhYmxlIiwib3JkZXIiLCJsYW5ndWFnZSIsIlNlbWFudGljTG9jYWxpemF0aW9uIiwiZGF0YVRhYmxlTG9jYWxpc2F0aW9uIiwiY2JBZnRlclNlbmRGb3JtIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBR0EsSUFBTUEscUJBQXFCLEdBQUc7QUFFMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsUUFBUSxFQUFFQyxDQUFDLENBQUMsdUJBQUQsQ0FOZTs7QUFRMUI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxtQkFBbUIsRUFBRUQsQ0FBQyxDQUFDLG9CQUFELENBYkk7O0FBZTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lFLEVBQUFBLG9CQUFvQixFQUFFRixDQUFDLENBQUMsNENBQUQsQ0FuQkc7O0FBcUIxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRyxFQUFBQSxhQUFhLEVBQUVILENBQUMsQ0FBQyx1QkFBRCxDQXpCVTs7QUEyQjFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lJLEVBQUFBLGlCQUFpQixFQUFFSixDQUFDLENBQUMscUJBQUQsQ0EvQk07O0FBaUMxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJ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LElBRGY7QUFDc0I7QUFDbEJDLFFBQUFBLFVBQVUsRUFBRSxJQUZoQixDQUVzQjs7QUFGdEIsT0F0QkssQ0FKd0M7QUErQmpEQyxNQUFBQSxLQUFLLEVBQUUsQ0FBQyxDQUFELEVBQUksS0FBSixDQS9CMEM7QUFnQ2pEQyxNQUFBQSxRQUFRLEVBQUVDLG9CQUFvQixDQUFDQztBQWhDa0IsS0FBckQ7QUFrQ0gsR0FyaEJ5Qjs7QUFzaEIxQjtBQUNKO0FBQ0E7QUFDSUMsRUFBQUEsZUF6aEIwQiw2QkF5aEJSLENBRWpCLENBM2hCeUI7O0FBNmhCMUI7QUFDSjtBQUNBO0FBQ0l0RyxFQUFBQSxjQWhpQjBCLDRCQWdpQlQ7QUFDYitCLElBQUFBLElBQUksQ0FBQzdFLFFBQUwsR0FBZ0JELHFCQUFxQixDQUFDQyxRQUF0QztBQUNBNkUsSUFBQUEsSUFBSSxDQUFDd0IsR0FBTCxhQUFjdkUsYUFBZDtBQUNBK0MsSUFBQUEsSUFBSSxDQUFDN0QsYUFBTCxHQUFxQmpCLHFCQUFxQixDQUFDaUIsYUFBM0M7QUFDQTZELElBQUFBLElBQUksQ0FBQ3FDLGdCQUFMLEdBQXdCbkgscUJBQXFCLENBQUNtSCxnQkFBOUM7QUFDQXJDLElBQUFBLElBQUksQ0FBQ3VFLGVBQUwsR0FBdUJySixxQkFBcUIsQ0FBQ3FKLGVBQTdDO0FBQ0F2RSxJQUFBQSxJQUFJLENBQUNyRCxVQUFMO0FBQ0g7QUF2aUJ5QixDQUE5QjtBQTBpQkF2QixDQUFDLENBQUNvSixRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3BCdkosRUFBQUEscUJBQXFCLENBQUN5QixVQUF0QjtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsVHJhbnNsYXRlLCBGb3JtLCBFeHRlbnNpb25zICovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVSU1vZGlmeUFHID0ge1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBDaGVja2JveCBhbGxvd3MgZnVsbCBhY2Nlc3MgdG8gdGhlIHN5c3RlbS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZ1bGxBY2Nlc3NDaGVja2JveDogJCgnI2Z1bGwtYWNjZXNzLWdyb3VwJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgc2VsZWN0IHVzZXJzIGRyb3Bkb3duLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHNlbGVjdFVzZXJzRHJvcERvd246ICQoJ1tkYXRhLXRhYj1cInVzZXJzXCJdIC5zZWxlY3QtZXh0ZW5zaW9uLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbW9kdWxlIHN0YXR1cyB0b2dnbGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBob21lIHBhZ2UgZHJvcGRvd24gc2VsZWN0LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGhvbWVQYWdlRHJvcGRvd246ICQoJyNob21lLXBhZ2UtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBhY2Nlc3Mgc2V0dGluZ3MgdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkYWNjZXNzU2V0dGluZ3NUYWJNZW51OiAkKCcjYWNjZXNzLXNldHRpbmdzLXRhYi1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbWFpbiB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRtYWluVGFiTWVudTogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiY2RyLWZpbHRlclwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdyb3VwIHJpZ2h0cyB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZ3JvdXBSaWdodHNUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiZ3JvdXAtcmlnaHRzXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBVc2VycyB0YWJsZSBmb3IgQ0RSIGZpbHRlci5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJVc2Vyc1RhYmxlOiAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdG9nZ2xlcy5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUb2dnbGVzOiAkKCdkaXYuY2RyLWZpbHRlci10b2dnbGVzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlck1vZGU6ICQoJ2Rpdi5jZHItZmlsdGVyLXJhZGlvJyksXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGV4dGVuc2lvbi5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuQ2hlY2tCdXR0b246ICQoJy51bmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQnV0dG9uOiAkKCcuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICduYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cbiAgICAgICAgJCgnLmF2YXRhcicpLmVhY2goKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cignc3JjJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBgJHtnbG9iYWxSb290VXJsfWFzc2V0cy9pbWcvdW5rbm93blBlcnNvbi5qcGdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5jaGVja2JveCgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJNb2RlLmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnYm9keScpLm9uKCdjbGljaycsICdkaXYuZGVsZXRlLXVzZXItcm93JywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5kZWxldGVNZW1iZXJGcm9tVGFibGUoZS50YXJnZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgdW5jaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiR1bkNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIENEUiBmaWx0ZXIgZGF0YXRhYmxlXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplQ0RSRmlsdGVyVGFibGUoKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZUZvcm0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIGZ1bGwgYWNjZXNzIHRvZ2dsZS5cbiAgICAgKi9cbiAgICBjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpe1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIGNoZWNrYm94ZXNcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCdjaGFuZ2UgdGFiJywnZ2VuZXJhbCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0c1RhYi5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bihtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCl7XG4gICAgICAgIGNvbnN0IGNkckZpbHRlck1vZGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnY2RyRmlsdGVyTW9kZScpO1xuICAgICAgICBpZiAoY2RyRmlsdGVyTW9kZT09PSdhbGwnKSB7XG4gICAgICAgICAgICAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZV93cmFwcGVyJykuaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2Nkci1maWx0ZXItdXNlcnMtdGFibGVfd3JhcHBlcicpLnNob3coKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBmb3IgYXNzaWduaW5nIGN1cnJlbnQgYWNjZXNzIGdyb3VwLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKSB7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duUGFyYW1zID0gRXh0ZW5zaW9ucy5nZXREcm9wZG93blNldHRpbmdzT25seUludGVybmFsV2l0aG91dEVtcHR5KCk7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLmFjdGlvbiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyVXNlcnNTZWxlY3Q7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLnRlbXBsYXRlcyA9IHsgbWVudTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUgfTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzZWxlY3RVc2Vyc0Ryb3BEb3duLmRyb3Bkb3duKGRyb3Bkb3duUGFyYW1zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9taXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBtZW51IHZpc3VhbGl6YXRpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZmllbGRzIC0gVGhlIGZpZWxkcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgSFRNTCBzdHJpbmcgZm9yIHRoZSBkcm9wZG93biBtZW51LlxuICAgICAqL1xuICAgIGN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUocmVzcG9uc2UsIGZpZWxkcykge1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSByZXNwb25zZVtmaWVsZHMudmFsdWVzXSB8fCB7fTtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgbGV0IG9sZFR5cGUgPSAnJztcbiAgICAgICAgJC5lYWNoKHZhbHVlcywgKGluZGV4LCBvcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb24udHlwZSAhPT0gb2xkVHlwZSkge1xuICAgICAgICAgICAgICAgIG9sZFR5cGUgPSBvcHRpb24udHlwZTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiZGl2aWRlclwiPjwvZGl2Pic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxpIGNsYXNzPVwidGFncyBpY29uXCI+PC9pPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBvcHRpb24udHlwZUxvY2FsaXplZDtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWF5YmVUZXh0ID0gKG9wdGlvbltmaWVsZHMudGV4dF0pID8gYGRhdGEtdGV4dD1cIiR7b3B0aW9uW2ZpZWxkcy50ZXh0XX1cImAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IG1heWJlRGlzYWJsZWQgPSAoJChgI2V4dC0ke29wdGlvbltmaWVsZHMudmFsdWVdfWApLmhhc0NsYXNzKCdzZWxlY3RlZC1tZW1iZXInKSkgPyAnZGlzYWJsZWQgJyA6ICcnO1xuICAgICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz1cIiR7bWF5YmVEaXNhYmxlZH1pdGVtXCIgZGF0YS12YWx1ZT1cIiR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19XCIke21heWJlVGV4dH0+YDtcbiAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uW2ZpZWxkcy5uYW1lXTtcbiAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VsZWN0aW5nIGEgdXNlciBmb3IgdGhlIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVGhlIHNlbGVjdGVkIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIFRoZSBqUXVlcnkgZWxlbWVudC5cbiAgICAgKi9cbiAgICBjYkFmdGVyVXNlcnNTZWxlY3QodGV4dCwgdmFsdWUsICRlbGVtZW50KSB7XG4gICAgICAgICQoYCNleHQtJHt2YWx1ZX1gKVxuICAgICAgICAgICAgLmNsb3Nlc3QoJ3RyJylcbiAgICAgICAgICAgIC5hZGRDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5zaG93KCk7XG4gICAgICAgICQoJGVsZW1lbnQpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSBncm91cCBtZW1iZXIgZnJvbSB0aGUgdGFibGUuXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldCBlbGVtZW50LlxuICAgICAqL1xuICAgIGRlbGV0ZU1lbWJlckZyb21UYWJsZSh0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgaWQgPSAkKHRhcmdldCkuY2xvc2VzdCgnZGl2JykuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAkKGAjJHtpZH1gKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLmhpZGUoKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgcmlnaHRzIGNoZWNrYm94ZXMuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMoKSB7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5tYXN0ZXIuY2hlY2tib3gnKVxuICAgICAgICAgICAgLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvbkNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgnY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIHVuY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25VbmNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24obW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5jaGlsZC5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgb24gbG9hZCB0byBzZXQgcGFyZW50IHZhbHVlXG4gICAgICAgICAgICAgICAgZmlyZU9uSW5pdCA6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHBhcmVudCBzdGF0ZSBvbiBlYWNoIGNoaWxkIGNoZWNrYm94IGNoYW5nZVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkbGlzdEdyb3VwICAgICAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5saXN0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3ggPSAkbGlzdEdyb3VwLmNsb3Nlc3QoJy5pdGVtJykuY2hpbGRyZW4oJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94ICAgICAgID0gJGxpc3RHcm91cC5maW5kKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgICAgICA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgICAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGFsbCBvdGhlciBzaWJsaW5ncyBhcmUgY2hlY2tlZCBvciB1bmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHBhcmVudCBjaGVja2JveCBzdGF0ZSwgYnV0IGRvbid0IHRyaWdnZXIgaXRzIG9uQ2hhbmdlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmKGFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGFsbFVuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgdW5jaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBpbmRldGVybWluYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZ3JvdXAgcmlnaHQuXG4gICAgICovXG4gICAgY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKXtcbiAgICAgICAgY29uc3QgYWNjZXNzVG9DZHIgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnTWlrb1BCWFxcXFxBZG1pbkNhYmluZXRcXFxcQ29udHJvbGxlcnNcXFxcQ2FsbERldGFpbFJlY29yZHNDb250cm9sbGVyX21haW4nKTtcbiAgICAgICAgaWYgKGFjY2Vzc1RvQ2RyPT09J29uJykge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHN0YXR1cyBvZiBidXR0b25zIHdoZW4gdGhlIG1vZHVsZSBzdGF0dXMgY2hhbmdlcy5cbiAgICAgKi9cbiAgICBjaGVja1N0YXR1c1RvZ2dsZSgpIHtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcGFyZXMgbGlzdCBvZiBwb3NzaWJsZSBob21lIHBhZ2VzIHRvIHNlbGVjdCBmcm9tXG4gICAgICovXG4gICAgZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCl7XG4gICAgICAgIGxldCB2YWx1ZVNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRIb21lUGFnZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdob21lUGFnZScpO1xuICAgICAgICBsZXQgc2VsZWN0ZWRSaWdodHMgPSAkKCcuY2hlY2tlZCAuYWNjZXNzLWdyb3VwLWNoZWNrYm94Jyk7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKXtcbiAgICAgICAgICAgc2VsZWN0ZWRSaWdodHMgPSAkKCcuYWNjZXNzLWdyb3VwLWNoZWNrYm94Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICAgIHNlbGVjdGVkUmlnaHRzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9ICQob2JqKS5hdHRyKCdkYXRhLW1vZHVsZScpO1xuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlck5hbWUgPSAkKG9iaikuYXR0cignZGF0YS1jb250cm9sbGVyLW5hbWUnKTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9ICQob2JqKS5hdHRyKCdkYXRhLWFjdGlvbicpO1xuICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXJOYW1lLmluZGV4T2YoJ3BieGNvcmUnKSA9PT0gLTEgJiYgYWN0aW9uLmluZGV4T2YoJ2luZGV4JykgPiAtMSkge1xuICAgICAgICAgICAgICAgIGxldCB1cmwgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY29udmVydENhbWVsVG9EYXNoKGAvJHttb2R1bGV9LyR7Y29udHJvbGxlck5hbWV9LyR7YWN0aW9ufWApO1xuXG4gICAgICAgICAgICAgICAgbGV0IG5hbWVUZW1wbGF0ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIGBtbV8ke2NvbnRyb2xsZXJOYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIGBCcmVhZGNydW1iJHttb2R1bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgYG1vZHVsZV91c2Vyc3VpXyR7bW9kdWxlfV8ke2NvbnRyb2xsZXJOYW1lfV8ke2FjdGlvbn1gXG4gICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgbmFtZVRlbXBsYXRlcy5ldmVyeSgobmFtZVRlbXBsYXRlKT0+e1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gZ2xvYmFsVHJhbnNsYXRlW25hbWVUZW1wbGF0ZV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SG9tZVBhZ2UgPT09IHVybCl7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IG5hbWUsIHZhbHVlOiB1cmwsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBuYW1lLCB2YWx1ZTogdXJsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICBjb25zdCBmYWlsQmFja0hvbWVQYWdlID0gIGAke2dsb2JhbFJvb3RVcmx9c2Vzc2lvbi9lbmRgO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogZmFpbEJhY2tIb21lUGFnZSwgdmFsdWU6IGZhaWxCYWNrSG9tZVBhZ2UsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgdmFsdWVTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWx1ZVNlbGVjdGVkKXtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlczp2YWx1ZXMsXG4gICAgICAgICAgICBvbkNoYW5nZTogRm9ybS5kYXRhQ2hhbmdlZFxuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhIHN0cmluZyBmcm9tIGNhbWVsIGNhc2UgdG8gZGFzaCBjYXNlLlxuICAgICAqIEBwYXJhbSBzdHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBjb252ZXJ0Q2FtZWxUb0Rhc2goc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGJlZm9yZSBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzZXR0aW5ncyAtIFRoZSBmb3JtIHNldHRpbmdzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIG1vZGlmaWVkIGZvcm0gc2V0dGluZ3MuXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgcmVzdWx0LmRhdGEgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuXG4gICAgICAgIC8vIEdyb3VwIG1lbWJlcnNcbiAgICAgICAgY29uc3QgYXJyTWVtYmVycyA9IFtdO1xuICAgICAgICAkKCd0ci5zZWxlY3RlZC1tZW1iZXInKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSkge1xuICAgICAgICAgICAgICAgIGFyck1lbWJlcnMucHVzaCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEubWVtYmVycyA9IEpTT04uc3RyaW5naWZ5KGFyck1lbWJlcnMpO1xuXG4gICAgICAgIC8vIEdyb3VwIFJpZ2h0c1xuICAgICAgICBjb25zdCBhcnJHcm91cFJpZ2h0cyA9IFtdO1xuICAgICAgICAkKCdpbnB1dC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLnBhcmVudCgnLmNoZWNrYm94JykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9ICQob2JqKS5hdHRyKCdkYXRhLW1vZHVsZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSAkKG9iaikuYXR0cignZGF0YS1jb250cm9sbGVyJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gJChvYmopLmF0dHIoJ2RhdGEtYWN0aW9uJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBtb2R1bGUgaW4gYXJyR3JvdXBSaWdodHMgb3IgY3JlYXRlIGEgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgbGV0IG1vZHVsZUluZGV4ID0gYXJyR3JvdXBSaWdodHMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5tb2R1bGUgPT09IG1vZHVsZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZUluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhcnJHcm91cFJpZ2h0cy5wdXNoKHsgbW9kdWxlLCBjb250cm9sbGVyczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUluZGV4ID0gYXJyR3JvdXBSaWdodHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBjb250cm9sbGVyIGluIHRoZSBtb2R1bGUgb3IgY3JlYXRlIGEgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlQ29udHJvbGxlcnMgPSBhcnJHcm91cFJpZ2h0c1ttb2R1bGVJbmRleF0uY29udHJvbGxlcnM7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uY29udHJvbGxlciA9PT0gY29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXJJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnMucHVzaCh7IGNvbnRyb2xsZXIsIGFjdGlvbnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVySW5kZXggPSBtb2R1bGVDb250cm9sbGVycy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFB1c2ggdGhlIGFjdGlvbiBpbnRvIHRoZSBjb250cm9sbGVyJ3MgYWN0aW9ucyBhcnJheVxuICAgICAgICAgICAgICAgIG1vZHVsZUNvbnRyb2xsZXJzW2NvbnRyb2xsZXJJbmRleF0uYWN0aW9ucy5wdXNoKGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5kYXRhLmFjY2Vzc19ncm91cF9yaWdodHMgPSBKU09OLnN0cmluZ2lmeShhcnJHcm91cFJpZ2h0cyk7XG5cbiAgICAgICAgLy8gQ0RSIEZpbHRlclxuICAgICAgICBjb25zdCBhcnJDRFJGaWx0ZXIgPSBbXTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUb2dnbGVzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgIGFyckNEUkZpbHRlci5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0LmRhdGEuY2RyRmlsdGVyID0gSlNPTi5zdHJpbmdpZnkoYXJyQ0RSRmlsdGVyKTtcblxuICAgICAgICAvLyBGdWxsIGFjY2VzcyBncm91cCB0b2dnbGVcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcxJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmZ1bGxBY2Nlc3MgPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIb21lIFBhZ2UgdmFsdWVcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRIb21lUGFnZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignZ2V0IHZhbHVlJyk7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duUGFyYW1zID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ3NldHVwIG1lbnUnLCBkcm9wZG93blBhcmFtcyk7XG4gICAgICAgIGxldCBob21lUGFnZSA9ICcnO1xuICAgICAgICAkLmVhY2goZHJvcGRvd25QYXJhbXMudmFsdWVzLCBmdW5jdGlvbihpbmRleCwgcmVjb3JkKSB7XG4gICAgICAgICAgICBpZiAocmVjb3JkLnZhbHVlID09PSBzZWxlY3RlZEhvbWVQYWdlKSB7XG4gICAgICAgICAgICAgICAgaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGhvbWVQYWdlPT09Jycpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBkcm9wZG93blBhcmFtcy52YWx1ZXNbMF0udmFsdWU7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ3NldCBzZWxlY3RlZCcsIHJlc3VsdC5kYXRhLmhvbWVQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmhvbWVQYWdlID0gc2VsZWN0ZWRIb21lUGFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdXNlcnMgdGFibGUgRGF0YVRhYmxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSgpIHtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJVc2Vyc1RhYmxlLkRhdGFUYWJsZSh7XG4gICAgICAgICAgICAvLyBkZXN0cm95OiB0cnVlLFxuICAgICAgICAgICAgbGVuZ3RoQ2hhbmdlOiBmYWxzZSxcbiAgICAgICAgICAgIHBhZ2luZzogZmFsc2UsXG4gICAgICAgICAgICBjb2x1bW5zOiBbXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2tCb3hcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogZmFsc2UsICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IGZhbHNlICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gVXNlcm5hbWVcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBFeHRlbnNpb25cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBNb2JpbGVcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogZmFsc2UsICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IGZhbHNlICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gRW1haWxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcmRlcjogWzAsICdhc2MnXSxcbiAgICAgICAgICAgIGxhbmd1YWdlOiBTZW1hbnRpY0xvY2FsaXphdGlvbi5kYXRhVGFibGVMb2NhbGlzYXRpb24sXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBjYkFmdGVyU2VuZEZvcm0oKSB7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2FjY2Vzcy1ncm91cHMvc2F2ZWA7XG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclNlbmRGb3JtO1xuICAgICAgICBGb3JtLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==