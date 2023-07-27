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
   * jQuery object with all tabs in access-group-rights tab.
   * @type {jQuery}
   */
  $groupRightModulesTabs: $('#access-group-rights .ui.tab'),

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
      moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
    } else {
      moduleUsersUIModifyAG.$cdrFilterTab.hide();
    } // Show hide check icon close to module name


    moduleUsersUIModifyAG.$groupRightModulesTabs.each(function (index, obj) {
      var moduleTab = $(obj).attr('data-tab');

      if ($("div[data-tab=\"".concat(moduleTab, "\"]  .access-group-checkbox")).parent('.checked').length > 0) {
        $("a[data-tab='".concat(moduleTab, "'] i.icon")).addClass('angle right');
      } else {
        $("a[data-tab='".concat(moduleTab, "'] i.icon")).removeClass('angle right');
      }
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCIkY2RyRmlsdGVyVG9nZ2xlcyIsIiRjZHJGaWx0ZXJNb2RlIiwiJGdyb3VwUmlnaHRNb2R1bGVzVGFicyIsImRlZmF1bHRFeHRlbnNpb24iLCIkdW5DaGVja0J1dHRvbiIsIiRjaGVja0J1dHRvbiIsInZhbGlkYXRlUnVsZXMiLCJuYW1lIiwiaWRlbnRpZmllciIsInJ1bGVzIiwidHlwZSIsInByb21wdCIsImdsb2JhbFRyYW5zbGF0ZSIsIm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlTmFtZUlzRW1wdHkiLCJpbml0aWFsaXplIiwiY2hlY2tTdGF0dXNUb2dnbGUiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiZWFjaCIsImF0dHIiLCJnbG9iYWxSb290VXJsIiwidGFiIiwiaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93biIsImluaXRpYWxpemVSaWdodHNDaGVja2JveGVzIiwiY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUiLCJjaGVja2JveCIsIm9uQ2hhbmdlIiwiY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUiLCJvbiIsImUiLCJwcmV2ZW50RGVmYXVsdCIsImRlbGV0ZU1lbWJlckZyb21UYWJsZSIsInRhcmdldCIsInBhcmVudCIsImZpbmQiLCJpbml0aWFsaXplQ0RSRmlsdGVyVGFibGUiLCJpbml0aWFsaXplRm9ybSIsImhpZGUiLCJzaG93IiwiZHJvcGRvd24iLCJnZXRIb21lUGFnZXNGb3JTZWxlY3QiLCJjZHJGaWx0ZXJNb2RlIiwiZm9ybSIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJvYmoiLCJtb2R1bGVUYWIiLCJsZW5ndGgiLCJ2YWx1ZVNlbGVjdGVkIiwiY3VycmVudEhvbWVQYWdlIiwic2VsZWN0ZWRSaWdodHMiLCJtb2R1bGUiLCJjb250cm9sbGVyTmFtZSIsImluZGV4T2YiLCJ1cmwiLCJjb252ZXJ0Q2FtZWxUb0Rhc2giLCJuYW1lVGVtcGxhdGVzIiwiZXZlcnkiLCJuYW1lVGVtcGxhdGUiLCJ1bmRlZmluZWQiLCJwdXNoIiwic2VsZWN0ZWQiLCJmYWlsQmFja0hvbWVQYWdlIiwic3RyIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwiY2JCZWZvcmVTZW5kRm9ybSIsInNldHRpbmdzIiwicmVzdWx0IiwiZGF0YSIsImFyck1lbWJlcnMiLCJtZW1iZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsImFyckdyb3VwUmlnaHRzIiwiY29udHJvbGxlciIsIm1vZHVsZUluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImNvbnRyb2xsZXJzIiwibW9kdWxlQ29udHJvbGxlcnMiLCJjb250cm9sbGVySW5kZXgiLCJhY3Rpb25zIiwiYWNjZXNzX2dyb3VwX3JpZ2h0cyIsImFyckNEUkZpbHRlciIsImNkckZpbHRlciIsImZ1bGxBY2Nlc3MiLCJzZWxlY3RlZEhvbWVQYWdlIiwiaG9tZVBhZ2UiLCJyZWNvcmQiLCJEYXRhVGFibGUiLCJsZW5ndGhDaGFuZ2UiLCJwYWdpbmciLCJjb2x1bW5zIiwib3JkZXJhYmxlIiwic2VhcmNoYWJsZSIsIm9yZGVyIiwibGFuZ3VhZ2UiLCJTZW1hbnRpY0xvY2FsaXphdGlvbiIsImRhdGFUYWJsZUxvY2FsaXNhdGlvbiIsImNiQWZ0ZXJTZW5kRm9ybSIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUdBLElBQU1BLHFCQUFxQixHQUFHO0FBRTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFFBQVEsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBTmU7O0FBUTFCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsbUJBQW1CLEVBQUVELENBQUMsQ0FBQyxvQkFBRCxDQWJJOztBQWUxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJRSxFQUFBQSxvQkFBb0IsRUFBRUYsQ0FBQyxDQUFDLDRDQUFELENBbkJHOztBQXFCMUI7QUFDSjtBQUNBO0FBQ0E7QUFDSUcsRUFBQUEsYUFBYSxFQUFFSCxDQUFDLENBQUMsdUJBQUQsQ0F6QlU7O0FBMkIxQjtBQUNKO0FBQ0E7QUFDQTtBQUNJSSxFQUFBQSxpQkFBaUIsRUFBRUosQ0FBQyxDQUFDLHFC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cUJBQXFCLENBQUNDLFFBQXRDO0FBQ0E4RSxJQUFBQSxJQUFJLENBQUMwQixHQUFMLGFBQWN6RSxhQUFkO0FBQ0ErQyxJQUFBQSxJQUFJLENBQUM3RCxhQUFMLEdBQXFCbEIscUJBQXFCLENBQUNrQixhQUEzQztBQUNBNkQsSUFBQUEsSUFBSSxDQUFDc0MsZ0JBQUwsR0FBd0JySCxxQkFBcUIsQ0FBQ3FILGdCQUE5QztBQUNBdEMsSUFBQUEsSUFBSSxDQUFDd0UsZUFBTCxHQUF1QnZKLHFCQUFxQixDQUFDdUosZUFBN0M7QUFDQXhFLElBQUFBLElBQUksQ0FBQ3JELFVBQUw7QUFDSDtBQXhqQnlCLENBQTlCO0FBMmpCQXhCLENBQUMsQ0FBQ3NKLFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDcEJ6SixFQUFBQSxxQkFBcUIsQ0FBQzBCLFVBQXRCO0FBQ0gsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIEV4dGVuc2lvbnMgKi9cblxuXG5jb25zdCBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcgPSB7XG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZm9ybS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRmb3JtT2JqOiAkKCcjbW9kdWxlLXVzZXJzLXVpLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGFsbG93cyBmdWxsIGFjY2VzcyB0byB0aGUgc3lzdGVtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZnVsbEFjY2Vzc0NoZWNrYm94OiAkKCcjZnVsbC1hY2Nlc3MtZ3JvdXAnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBzZWxlY3QgdXNlcnMgZHJvcGRvd24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc2VsZWN0VXNlcnNEcm9wRG93bjogJCgnW2RhdGEtdGFiPVwidXNlcnNcIl0gLnNlbGVjdC1leHRlbnNpb24tZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtb2R1bGUgc3RhdHVzIHRvZ2dsZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGhvbWUgcGFnZSBkcm9wZG93biBzZWxlY3QuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkaG9tZVBhZ2VEcm9wZG93bjogJCgnI2hvbWUtcGFnZS1kcm9wZG93bicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGFjY2VzcyBzZXR0aW5ncyB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRhY2Nlc3NTZXR0aW5nc1RhYk1lbnU6ICQoJyNhY2Nlc3Mtc2V0dGluZ3MtdGFiLW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtYWluIHRhYiBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJG1haW5UYWJNZW51OiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclRhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJjZHItZmlsdGVyXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZ3JvdXAgcmlnaHRzIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRncm91cFJpZ2h0c1RhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJncm91cC1yaWdodHNcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIFVzZXJzIHRhYmxlIGZvciBDRFIgZmlsdGVyLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclVzZXJzVGFibGU6ICQoJyNjZHItZmlsdGVyLXVzZXJzLXRhYmxlJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciB0b2dnbGVzLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclRvZ2dsZXM6ICQoJ2Rpdi5jZHItZmlsdGVyLXRvZ2dsZXMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIG1vZGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyTW9kZTogJCgnZGl2LmNkci1maWx0ZXItcmFkaW8nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3Qgd2l0aCBhbGwgdGFicyBpbiBhY2Nlc3MtZ3JvdXAtcmlnaHRzIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRncm91cFJpZ2h0TW9kdWxlc1RhYnM6ICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC51aS50YWInKSxcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgZXh0ZW5zaW9uLlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZGVmYXVsdEV4dGVuc2lvbjogJycsXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgdW5jaGVjayBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdW5DaGVja0J1dHRvbjogJCgnLnVuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgdW5jaGVjayBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tCdXR0b246ICQoJy5jaGVjay5idXR0b24nKSxcblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRpb24gcnVsZXMgZm9yIHRoZSBmb3JtIGZpZWxkcy5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhbGlkYXRlUnVsZXM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ25hbWUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlTmFtZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtb2R1bGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNoZWNrU3RhdHVzVG9nZ2xlKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdNb2R1bGVTdGF0dXNDaGFuZ2VkJywgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNoZWNrU3RhdHVzVG9nZ2xlKTtcblxuICAgICAgICAkKCcuYXZhdGFyJykuZWFjaCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdzcmMnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsIGAke2dsb2JhbFJvb3RVcmx9YXNzZXRzL2ltZy91bmtub3duUGVyc29uLmpwZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJG1haW5UYWJNZW51LnRhYigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGFjY2Vzc1NldHRpbmdzVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUb2dnbGVzLmNoZWNrYm94KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlck1vZGUuY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCdib2R5Jykub24oJ2NsaWNrJywgJ2Rpdi5kZWxldGUtdXNlci1yb3cnLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmRlbGV0ZU1lbWJlckZyb21UYWJsZShlLnRhcmdldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBjaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjaGVja0J1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJChlLnRhcmdldCkucGFyZW50KCcudWkudGFiJykuZmluZCgnLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSB1bmNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHVuQ2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgQ0RSIGZpbHRlciBkYXRhdGFibGVcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSgpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplRm9ybSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZnVsbCBhY2Nlc3MgdG9nZ2xlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlKCl7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoJ2NoYW5nZSB0YWInLCdnZW5lcmFsJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5oaWRlKCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuc2hvdygpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5nZXRIb21lUGFnZXNGb3JTZWxlY3QoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBDRFIgZmlsdGVyIG1vZGUuXG4gICAgICovXG4gICAgY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKXtcbiAgICAgICAgY29uc3QgY2RyRmlsdGVyTW9kZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdjZHJGaWx0ZXJNb2RlJyk7XG4gICAgICAgIGlmIChjZHJGaWx0ZXJNb2RlPT09J2FsbCcpIHtcbiAgICAgICAgICAgICQoJyNjZHItZmlsdGVyLXVzZXJzLXRhYmxlX3dyYXBwZXInKS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZV93cmFwcGVyJykuc2hvdygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIGZvciBhc3NpZ25pbmcgY3VycmVudCBhY2Nlc3MgZ3JvdXAuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93bigpIHtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBFeHRlbnNpb25zLmdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkoKTtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMuYWN0aW9uID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJVc2Vyc1NlbGVjdDtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMudGVtcGxhdGVzID0geyBtZW51OiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSB9O1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHNlbGVjdFVzZXJzRHJvcERvd24uZHJvcGRvd24oZHJvcGRvd25QYXJhbXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b21pemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIG1lbnUgdmlzdWFsaXphdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZHMgLSBUaGUgZmllbGRzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSBIVE1MIHN0cmluZyBmb3IgdGhlIGRyb3Bkb3duIG1lbnUuXG4gICAgICovXG4gICAgY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudShyZXNwb25zZSwgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHJlc3BvbnNlW2ZpZWxkcy52YWx1ZXNdIHx8IHt9O1xuICAgICAgICBsZXQgaHRtbCA9ICcnO1xuICAgICAgICBsZXQgb2xkVHlwZSA9ICcnO1xuICAgICAgICAkLmVhY2godmFsdWVzLCAoaW5kZXgsIG9wdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKG9wdGlvbi50eXBlICE9PSBvbGRUeXBlKSB7XG4gICAgICAgICAgICAgICAgb2xkVHlwZSA9IG9wdGlvbi50eXBlO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJkaXZpZGVyXCI+PC9kaXY+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxkaXYgY2xhc3M9XCJoZWFkZXJcIj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGkgY2xhc3M9XCJ0YWdzIGljb25cIj48L2k+JztcbiAgICAgICAgICAgICAgICBodG1sICs9IG9wdGlvbi50eXBlTG9jYWxpemVkO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtYXliZVRleHQgPSAob3B0aW9uW2ZpZWxkcy50ZXh0XSkgPyBgZGF0YS10ZXh0PVwiJHtvcHRpb25bZmllbGRzLnRleHRdfVwiYCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbWF5YmVEaXNhYmxlZCA9ICgkKGAjZXh0LSR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19YCkuaGFzQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpKSA/ICdkaXNhYmxlZCAnIDogJyc7XG4gICAgICAgICAgICBodG1sICs9IGA8ZGl2IGNsYXNzPVwiJHttYXliZURpc2FibGVkfWl0ZW1cIiBkYXRhLXZhbHVlPVwiJHtvcHRpb25bZmllbGRzLnZhbHVlXX1cIiR7bWF5YmVUZXh0fT5gO1xuICAgICAgICAgICAgaHRtbCArPSBvcHRpb25bZmllbGRzLm5hbWVdO1xuICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZWxlY3RpbmcgYSB1c2VyIGZvciB0aGUgZ3JvdXAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBUaGUgc2VsZWN0ZWQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0gVGhlIGpRdWVyeSBlbGVtZW50LlxuICAgICAqL1xuICAgIGNiQWZ0ZXJVc2Vyc1NlbGVjdCh0ZXh0LCB2YWx1ZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgJChgI2V4dC0ke3ZhbHVlfWApXG4gICAgICAgICAgICAuY2xvc2VzdCgndHInKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgJCgkZWxlbWVudCkuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIGdyb3VwIG1lbWJlciBmcm9tIHRoZSB0YWJsZS5cbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICovXG4gICAgZGVsZXRlTWVtYmVyRnJvbVRhYmxlKHRhcmdldCkge1xuICAgICAgICBjb25zdCBpZCA9ICQodGFyZ2V0KS5jbG9zZXN0KCdkaXYnKS5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICQoYCMke2lkfWApXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuaGlkZSgpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSByaWdodHMgY2hlY2tib3hlcy5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpIHtcbiAgICAgICAgJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLmxpc3QgLm1hc3Rlci5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uQ2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gdW5jaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvblVuY2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bihtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIDtcbiAgICAgICAgJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLmxpc3QgLmNoaWxkLmNoZWNrYm94JylcbiAgICAgICAgICAgIC5jaGVja2JveCh7XG4gICAgICAgICAgICAgICAgLy8gRmlyZSBvbiBsb2FkIHRvIHNldCBwYXJlbnQgdmFsdWVcbiAgICAgICAgICAgICAgICBmaXJlT25Jbml0IDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgcGFyZW50IHN0YXRlIG9uIGVhY2ggY2hpbGQgY2hlY2tib3ggY2hhbmdlXG4gICAgICAgICAgICAgICAgb25DaGFuZ2UgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRsaXN0R3JvdXAgICAgICA9ICQodGhpcykuY2xvc2VzdCgnLmxpc3QnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveCA9ICRsaXN0R3JvdXAuY2xvc2VzdCgnLml0ZW0nKS5jaGlsZHJlbignLmNoZWNrYm94JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hlY2tib3ggICAgICAgPSAkbGlzdEdyb3VwLmZpbmQoJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCAgICAgID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCAgICA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgYWxsIG90aGVyIHNpYmxpbmdzIGFyZSBjaGVja2VkIG9yIHVuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAkY2hlY2tib3guZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLmNoZWNrYm94KCdpcyBjaGVja2VkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsVW5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxDaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgcGFyZW50IGNoZWNrYm94IHN0YXRlLCBidXQgZG9uJ3QgdHJpZ2dlciBpdHMgb25DaGFuZ2UgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgaWYoYWxsQ2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgY2hlY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoYWxsVW5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCB1bmNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGluZGV0ZXJtaW5hdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBncm91cCByaWdodC5cbiAgICAgKi9cbiAgICBjZEFmdGVyQ2hhbmdlR3JvdXBSaWdodCgpe1xuICAgICAgICBjb25zdCBhY2Nlc3NUb0NkciA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdNaWtvUEJYXFxcXEFkbWluQ2FiaW5ldFxcXFxDb250cm9sbGVyc1xcXFxDYWxsRGV0YWlsUmVjb3Jkc0NvbnRyb2xsZXJfbWFpbicpO1xuICAgICAgICBpZiAoYWNjZXNzVG9DZHI9PT0nb24nKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5zaG93KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3cgaGlkZSBjaGVjayBpY29uIGNsb3NlIHRvIG1vZHVsZSBuYW1lXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodE1vZHVsZXNUYWJzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZVRhYiA9ICQob2JqKS5hdHRyKCdkYXRhLXRhYicpO1xuICAgICAgICAgICAgaWYgKCQoYGRpdltkYXRhLXRhYj1cIiR7bW9kdWxlVGFifVwiXSAgLmFjY2Vzcy1ncm91cC1jaGVja2JveGApLnBhcmVudCgnLmNoZWNrZWQnKS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgJChgYVtkYXRhLXRhYj0nJHttb2R1bGVUYWJ9J10gaS5pY29uYCkuYWRkQ2xhc3MoJ2FuZ2xlIHJpZ2h0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoYGFbZGF0YS10YWI9JyR7bW9kdWxlVGFifSddIGkuaWNvbmApLnJlbW92ZUNsYXNzKCdhbmdsZSByaWdodCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgc3RhdHVzIG9mIGJ1dHRvbnMgd2hlbiB0aGUgbW9kdWxlIHN0YXR1cyBjaGFuZ2VzLlxuICAgICAqL1xuICAgIGNoZWNrU3RhdHVzVG9nZ2xlKCkge1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwYXJlcyBsaXN0IG9mIHBvc3NpYmxlIGhvbWUgcGFnZXMgdG8gc2VsZWN0IGZyb21cbiAgICAgKi9cbiAgICBnZXRIb21lUGFnZXNGb3JTZWxlY3QoKXtcbiAgICAgICAgbGV0IHZhbHVlU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY3VycmVudEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsJ2hvbWVQYWdlJyk7XG4gICAgICAgIGxldCBzZWxlY3RlZFJpZ2h0cyA9ICQoJy5jaGVja2VkIC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKTtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICBzZWxlY3RlZFJpZ2h0cyA9ICQoJy5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgc2VsZWN0ZWRSaWdodHMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sbGVyTmFtZSA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXItbmFtZScpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gJChvYmopLmF0dHIoJ2RhdGEtYWN0aW9uJyk7XG4gICAgICAgICAgICBpZiAoY29udHJvbGxlck5hbWUuaW5kZXhPZigncGJ4Y29yZScpID09PSAtMSAmJiBhY3Rpb24uaW5kZXhPZignaW5kZXgnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jb252ZXJ0Q2FtZWxUb0Rhc2goYC8ke21vZHVsZX0vJHtjb250cm9sbGVyTmFtZX0vJHthY3Rpb259YCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbmFtZVRlbXBsYXRlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgYG1tXyR7Y29udHJvbGxlck5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgYEJyZWFkY3J1bWIke21vZHVsZX1gLFxuICAgICAgICAgICAgICAgICAgICBgbW9kdWxlX3VzZXJzdWlfJHttb2R1bGV9XyR7Y29udHJvbGxlck5hbWV9XyR7YWN0aW9ufWBcbiAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICBuYW1lVGVtcGxhdGVzLmV2ZXJ5KChuYW1lVGVtcGxhdGUpPT57XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBnbG9iYWxUcmFuc2xhdGVbbmFtZVRlbXBsYXRlXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5hbWVUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRIb21lUGFnZSA9PT0gdXJsKXtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogbmFtZSwgdmFsdWU6IHVybCwgc2VsZWN0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IG5hbWUsIHZhbHVlOiB1cmwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgIGNvbnN0IGZhaWxCYWNrSG9tZVBhZ2UgPSAgYCR7Z2xvYmFsUm9vdFVybH1zZXNzaW9uL2VuZGA7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBmYWlsQmFja0hvbWVQYWdlLCB2YWx1ZTogZmFpbEJhY2tIb21lUGFnZSwgc2VsZWN0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICB2YWx1ZVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZhbHVlU2VsZWN0ZWQpe1xuICAgICAgICAgICAgdmFsdWVzWzBdLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWVzOnZhbHVlcyxcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBGb3JtLmRhdGFDaGFuZ2VkXG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGEgc3RyaW5nIGZyb20gY2FtZWwgY2FzZSB0byBkYXNoIGNhc2UuXG4gICAgICogQHBhcmFtIHN0clxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGNvbnZlcnRDYW1lbFRvRGFzaChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIC0gVGhlIGZvcm0gc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgbW9kaWZpZWQgZm9ybSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICByZXN1bHQuZGF0YSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG5cbiAgICAgICAgLy8gR3JvdXAgbWVtYmVyc1xuICAgICAgICBjb25zdCBhcnJNZW1iZXJzID0gW107XG4gICAgICAgICQoJ3RyLnNlbGVjdGVkLW1lbWJlcicpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSB7XG4gICAgICAgICAgICAgICAgYXJyTWVtYmVycy5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5tZW1iZXJzID0gSlNPTi5zdHJpbmdpZnkoYXJyTWVtYmVycyk7XG5cbiAgICAgICAgLy8gR3JvdXAgUmlnaHRzXG4gICAgICAgIGNvbnN0IGFyckdyb3VwUmlnaHRzID0gW107XG4gICAgICAgICQoJ2lucHV0LmFjY2Vzcy1ncm91cC1jaGVja2JveCcpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXInKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIG1vZHVsZSBpbiBhcnJHcm91cFJpZ2h0cyBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBsZXQgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLm1vZHVsZSA9PT0gbW9kdWxlKTtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyckdyb3VwUmlnaHRzLnB1c2goeyBtb2R1bGUsIGNvbnRyb2xsZXJzOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvbnRyb2xsZXIgaW4gdGhlIG1vZHVsZSBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGVDb250cm9sbGVycyA9IGFyckdyb3VwUmlnaHRzW21vZHVsZUluZGV4XS5jb250cm9sbGVycztcbiAgICAgICAgICAgICAgICBsZXQgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb250cm9sbGVyID09PSBjb250cm9sbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbGxlckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVycy5wdXNoKHsgY29udHJvbGxlciwgYWN0aW9uczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHVzaCB0aGUgYWN0aW9uIGludG8gdGhlIGNvbnRyb2xsZXIncyBhY3Rpb25zIGFycmF5XG4gICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEuYWNjZXNzX2dyb3VwX3JpZ2h0cyA9IEpTT04uc3RyaW5naWZ5KGFyckdyb3VwUmlnaHRzKTtcblxuICAgICAgICAvLyBDRFIgRmlsdGVyXG4gICAgICAgIGNvbnN0IGFyckNEUkZpbHRlciA9IFtdO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyQ0RSRmlsdGVyLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuZGF0YS5jZHJGaWx0ZXIgPSBKU09OLnN0cmluZ2lmeShhcnJDRFJGaWx0ZXIpO1xuXG4gICAgICAgIC8vIEZ1bGwgYWNjZXNzIGdyb3VwIHRvZ2dsZVxuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhvbWUgUGFnZSB2YWx1ZVxuICAgICAgICBjb25zdCBzZWxlY3RlZEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdnZXQgdmFsdWUnKTtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0dXAgbWVudScsIGRyb3Bkb3duUGFyYW1zKTtcbiAgICAgICAgbGV0IGhvbWVQYWdlID0gJyc7XG4gICAgICAgICQuZWFjaChkcm9wZG93blBhcmFtcy52YWx1ZXMsIGZ1bmN0aW9uKGluZGV4LCByZWNvcmQpIHtcbiAgICAgICAgICAgIGlmIChyZWNvcmQudmFsdWUgPT09IHNlbGVjdGVkSG9tZVBhZ2UpIHtcbiAgICAgICAgICAgICAgICBob21lUGFnZSA9IHNlbGVjdGVkSG9tZVBhZ2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaG9tZVBhZ2U9PT0nJyl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5ob21lUGFnZSA9IGRyb3Bkb3duUGFyYW1zLnZhbHVlc1swXS52YWx1ZTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0IHNlbGVjdGVkJywgcmVzdWx0LmRhdGEuaG9tZVBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSB1c2VycyB0YWJsZSBEYXRhVGFibGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUNEUkZpbHRlclRhYmxlKCkge1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclVzZXJzVGFibGUuRGF0YVRhYmxlKHtcbiAgICAgICAgICAgIC8vIGRlc3Ryb3k6IHRydWUsXG4gICAgICAgICAgICBsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgcGFnaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICAgICAgICAvLyBDaGVja0JveFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiBmYWxzZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogZmFsc2UgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBVc2VybmFtZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIEV4dGVuc2lvblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIE1vYmlsZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiBmYWxzZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogZmFsc2UgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBFbWFpbFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yZGVyOiBbMCwgJ2FzYyddLFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IFNlbWFudGljTG9jYWxpemF0aW9uLmRhdGFUYWJsZUxvY2FsaXNhdGlvbixcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iajtcbiAgICAgICAgRm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvYWNjZXNzLWdyb3Vwcy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLnZhbGlkYXRlUnVsZXM7XG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkJlZm9yZVNlbmRGb3JtO1xuICAgICAgICBGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemUoKTtcbn0pO1xuIl19