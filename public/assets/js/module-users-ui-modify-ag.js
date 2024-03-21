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

/* global globalRootUrl, globalTranslate, Form, Extensions, Datatable */
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
   * Users data table for CDR filter.
   * @type {Datatable}
   */
  cdrFilterUsersDataTable: null,

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

      if (moduleUsersUIModifyAG.cdrFilterUsersDataTable) {
        var newPageLength = moduleUsersUIModifyAG.calculatePageLength();
        moduleUsersUIModifyAG.cdrFilterUsersDataTable.page.len(newPageLength).draw(false);
      }
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
    var formValues = moduleUsersUIModifyAG.$formObj.form('get values');
    result.data = {
      id: formValues.id,
      name: formValues.name,
      description: formValues.description,
      cdrFilterMode: formValues.cdrFilterMode
    }; // Group members

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
    moduleUsersUIModifyAG.$mainTabMenu.tab({
      onVisible: function onVisible() {
        if ($(this).data('tab') === 'cdr-filter' && moduleUsersUIModifyAG.cdrFilterUsersDataTable !== null) {
          var newPageLength = moduleUsersUIModifyAG.calculatePageLength();
          moduleUsersUIModifyAG.cdrFilterUsersDataTable.page.len(newPageLength).draw(false);
        }
      }
    });
    moduleUsersUIModifyAG.cdrFilterUsersDataTable = moduleUsersUIModifyAG.$cdrFilterUsersTable.DataTable({
      // destroy: true,
      lengthChange: false,
      paging: true,
      pageLength: moduleUsersUIModifyAG.calculatePageLength(),
      scrollCollapse: true,
      columns: [// CheckBox
      {
        orderable: true,
        // This column is not orderable
        searchable: false,
        // This column is not searchable
        orderDataType: 'dom-checkbox' // Use the custom sorting

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
        orderable: true,
        // This column is not orderable
        searchable: true // This column is not searchable

      }, // Email
      {
        orderable: true,
        // This column is orderable
        searchable: true // This column is searchable

      }],
      order: [0, 'desc'],
      language: SemanticLocalization.dataTableLocalisation
    });
  },
  calculatePageLength: function calculatePageLength() {
    // Calculate row height
    var rowHeight = moduleUsersUIModifyAG.$cdrFilterUsersTable.find('tr').first().outerHeight(); // Calculate window height and available space for table

    var windowHeight = window.innerHeight;
    var headerFooterHeight = 580; // Estimate height for header, footer, and other elements
    // Calculate new page length

    return Math.max(Math.floor((windowHeight - headerFooterHeight) / rowHeight), 10);
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
  // Custom sorting for checkbox states
  $.fn.dataTable.ext.order['dom-checkbox'] = function (settings, col) {
    return this.api().column(col, {
      order: 'index'
    }).nodes().map(function (td, i) {
      return $('input', td).prop('checked') ? '1' : '0';
    });
  };

  moduleUsersUIModifyAG.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCJjZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSIsIiRjZHJGaWx0ZXJUb2dnbGVzIiwiJGNkckZpbHRlck1vZGUiLCIkZ3JvdXBSaWdodE1vZHVsZXNUYWJzIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJkcm9wZG93biIsImdldEhvbWVQYWdlc0ZvclNlbGVjdCIsImNkckZpbHRlck1vZGUiLCJmb3JtIiwibmV3UGFnZUxlbmd0aCIsImNhbGN1bGF0ZVBhZ2VMZW5ndGgiLCJwYWdlIiwibGVuIiwiZHJhdyIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJvYmoiLCJtb2R1bGVUYWIiLCJsZW5ndGgiLCJ2YWx1ZVNlbGVjdGVkIiwiY3VycmVudEhvbWVQYWdlIiwic2VsZWN0ZWRSaWdodHMiLCJtb2R1bGUiLCJjb250cm9sbGVyTmFtZSIsImluZGV4T2YiLCJ1cmwiLCJjb252ZXJ0Q2FtZWxUb0Rhc2giLCJuYW1lVGVtcGxhdGVzIiwiZXZlcnkiLCJuYW1lVGVtcGxhdGUiLCJ1bmRlZmluZWQiLCJwdXNoIiwic2VsZWN0ZWQiLCJmYWlsQmFja0hvbWVQYWdlIiwic3RyIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwiY2JCZWZvcmVTZW5kRm9ybSIsInNldHRpbmdzIiwicmVzdWx0IiwiZm9ybVZhbHVlcyIsImRhdGEiLCJkZXNjcmlwdGlvbiIsImFyck1lbWJlcnMiLCJtZW1iZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsImFyckdyb3VwUmlnaHRzIiwiY29udHJvbGxlciIsIm1vZHVsZUluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImNvbnRyb2xsZXJzIiwibW9kdWxlQ29udHJvbGxlcnMiLCJjb250cm9sbGVySW5kZXgiLCJhY3Rpb25zIiwiYWNjZXNzX2dyb3VwX3JpZ2h0cyIsImFyckNEUkZpbHRlciIsImNkckZpbHRlciIsImZ1bGxBY2Nlc3MiLCJzZWxlY3RlZEhvbWVQYWdlIiwiaG9tZVBhZ2UiLCJyZWNvcmQiLCJvblZpc2libGUiLCJEYXRhVGFibGUiLCJsZW5ndGhDaGFuZ2UiLCJwYWdpbmciLCJwYWdlTGVuZ3RoIiwic2Nyb2xsQ29sbGFwc2UiLCJjb2x1bW5zIiwib3JkZXJhYmxlIiwic2VhcmNoYWJsZSIsIm9yZGVyRGF0YVR5cGUiLCJvcmRlciIsImxhbmd1YWdlIiwiU2VtYW50aWNMb2NhbGl6YXRpb24iLCJkYXRhVGFibGVMb2NhbGlzYXRpb24iLCJyb3dIZWlnaHQiLCJmaXJzdCIsIm91dGVySGVpZ2h0Iiwid2luZG93SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWFkZXJGb290ZXJIZWlnaHQiLCJNYXRoIiwibWF4IiwiZmxvb3IiLCJjYkFmdGVyU2VuZEZvcm0iLCJkb2N1bWVudCIsInJlYWR5IiwiZm4iLCJkYXRhVGFibGUiLCJleHQiLCJjb2wiLCJhcGkiLCJjb2x1bW4iLCJub2RlcyIsIm1hcCIsInRkIiwiaSIsInByb3AiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUdBLElBQU1B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Q0FrRSxJQUFBQSxJQUFJLENBQUNzQyxnQkFBTCxHQUF3QjNILHFCQUFxQixDQUFDMkgsZ0JBQTlDO0FBQ0F0QyxJQUFBQSxJQUFJLENBQUN1RixlQUFMLEdBQXVCNUsscUJBQXFCLENBQUM0SyxlQUE3QztBQUNBdkYsSUFBQUEsSUFBSSxDQUFDMUQsVUFBTDtBQUNIO0FBOWxCeUIsQ0FBOUI7QUFpbUJBekIsQ0FBQyxDQUFDMkssUUFBRCxDQUFELENBQVlDLEtBQVosQ0FBa0IsWUFBTTtBQUNwQjtBQUNBNUssRUFBQUEsQ0FBQyxDQUFDNkssRUFBRixDQUFLQyxTQUFMLENBQWVDLEdBQWYsQ0FBbUJsQixLQUFuQixDQUF5QixjQUF6QixJQUEyQyxVQUFZbkMsUUFBWixFQUFzQnNELEdBQXRCLEVBQzNDO0FBQ0ksV0FBTyxLQUFLQyxHQUFMLEdBQVdDLE1BQVgsQ0FBbUJGLEdBQW5CLEVBQXdCO0FBQUNuQixNQUFBQSxLQUFLLEVBQUM7QUFBUCxLQUF4QixFQUEwQ3NCLEtBQTFDLEdBQWtEQyxHQUFsRCxDQUF1RCxVQUFXQyxFQUFYLEVBQWVDLENBQWYsRUFBbUI7QUFDN0UsYUFBT3RMLENBQUMsQ0FBQyxPQUFELEVBQVVxTCxFQUFWLENBQUQsQ0FBZUUsSUFBZixDQUFvQixTQUFwQixJQUFpQyxHQUFqQyxHQUF1QyxHQUE5QztBQUNILEtBRk0sQ0FBUDtBQUdILEdBTEQ7O0FBT0F6TCxFQUFBQSxxQkFBcUIsQ0FBQzJCLFVBQXRCO0FBQ0gsQ0FWRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCBnbG9iYWxUcmFuc2xhdGUsIEZvcm0sIEV4dGVuc2lvbnMsIERhdGF0YWJsZSAqL1xuXG5cbmNvbnN0IG1vZHVsZVVzZXJzVUlNb2RpZnlBRyA9IHtcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBmb3JtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGZvcm1PYmo6ICQoJyNtb2R1bGUtdXNlcnMtdWktZm9ybScpLFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tib3ggYWxsb3dzIGZ1bGwgYWNjZXNzIHRvIHRoZSBzeXN0ZW0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgICRmdWxsQWNjZXNzQ2hlY2tib3g6ICQoJyNmdWxsLWFjY2Vzcy1ncm91cCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHNlbGVjdCB1c2VycyBkcm9wZG93bi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzZWxlY3RVc2Vyc0Ryb3BEb3duOiAkKCdbZGF0YS10YWI9XCJ1c2Vyc1wiXSAuc2VsZWN0LWV4dGVuc2lvbi1maWVsZCcpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIG1vZHVsZSBzdGF0dXMgdG9nZ2xlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHN0YXR1c1RvZ2dsZTogJCgnI21vZHVsZS1zdGF0dXMtdG9nZ2xlJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgaG9tZSBwYWdlIGRyb3Bkb3duIHNlbGVjdC5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRob21lUGFnZURyb3Bkb3duOiAkKCcjaG9tZS1wYWdlLWRyb3Bkb3duJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgYWNjZXNzIHNldHRpbmdzIHRhYiBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGFjY2Vzc1NldHRpbmdzVGFiTWVudTogJCgnI2FjY2Vzcy1zZXR0aW5ncy10YWItbWVudSAuaXRlbScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIG1haW4gdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkbWFpblRhYk1lbnU6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyVGFiOiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbVtkYXRhLXRhYj1cImNkci1maWx0ZXJcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBncm91cCByaWdodHMgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGdyb3VwUmlnaHRzVGFiOiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbVtkYXRhLXRhYj1cImdyb3VwLXJpZ2h0c1wiXScpLFxuXG4gICAgLyoqXG4gICAgICogVXNlcnMgdGFibGUgZm9yIENEUiBmaWx0ZXIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyVXNlcnNUYWJsZTogJCgnI2Nkci1maWx0ZXItdXNlcnMtdGFibGUnKSxcblxuICAgIC8qKlxuICAgICAqIFVzZXJzIGRhdGEgdGFibGUgZm9yIENEUiBmaWx0ZXIuXG4gICAgICogQHR5cGUge0RhdGF0YWJsZX1cbiAgICAgKi9cbiAgICBjZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZTogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRvZ2dsZXMuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyVG9nZ2xlczogJCgnZGl2LmNkci1maWx0ZXItdG9nZ2xlcycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgbW9kZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJNb2RlOiAkKCdkaXYuY2RyLWZpbHRlci1yYWRpbycpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCB3aXRoIGFsbCB0YWJzIGluIGFjY2Vzcy1ncm91cC1yaWdodHMgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGdyb3VwUmlnaHRNb2R1bGVzVGFiczogJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLnVpLnRhYicpLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCBleHRlbnNpb24uXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBkZWZhdWx0RXh0ZW5zaW9uOiAnJyxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB1bmNoZWNrIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICR1bkNoZWNrQnV0dG9uOiAkKCcudW5jaGVjay5idXR0b24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSB1bmNoZWNrIGJ1dHRvbi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjaGVja0J1dHRvbjogJCgnLmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGlvbiBydWxlcyBmb3IgdGhlIGZvcm0gZmllbGRzLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFsaWRhdGVSdWxlczoge1xuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiAnbmFtZScsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2VtcHR5JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBnbG9iYWxUcmFuc2xhdGUubW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZHVsZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2hlY2tTdGF0dXNUb2dnbGUoKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ01vZHVsZVN0YXR1c0NoYW5nZWQnLCBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2hlY2tTdGF0dXNUb2dnbGUpO1xuXG4gICAgICAgICQoJy5hdmF0YXInKS5lYWNoKCgpID0+IHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3NyYycpID09PSAnJykge1xuICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc3JjJywgYCR7Z2xvYmFsUm9vdFVybH1hc3NldHMvaW1nL3Vua25vd25QZXJzb24uanBnYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kYWNjZXNzU2V0dGluZ3NUYWJNZW51LnRhYigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93bigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMoKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuY2hlY2tib3goKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyTW9kZS5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoJ2JvZHknKS5vbignY2xpY2snLCAnZGl2LmRlbGV0ZS11c2VyLXJvdycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZGVsZXRlTWVtYmVyRnJvbVRhYmxlKGUudGFyZ2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIGNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgnY2hlY2snKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIHVuY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kdW5DaGVja0J1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJChlLnRhcmdldCkucGFyZW50KCcudWkudGFiJykuZmluZCgnLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ3VuY2hlY2snKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBDRFIgZmlsdGVyIGRhdGF0YWJsZVxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZUNEUkZpbHRlclRhYmxlKCk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVGb3JtKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBmdWxsIGFjY2VzcyB0b2dnbGUuXG4gICAgICovXG4gICAgY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGUoKXtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGFsbCBjaGVja2JveGVzXG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJG1haW5UYWJNZW51LnRhYignY2hhbmdlIHRhYicsJ2dlbmVyYWwnKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLmhpZGUoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0c1RhYi5zaG93KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24obW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIENEUiBmaWx0ZXIgbW9kZS5cbiAgICAgKi9cbiAgICBjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpe1xuICAgICAgICBjb25zdCBjZHJGaWx0ZXJNb2RlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsJ2NkckZpbHRlck1vZGUnKTtcbiAgICAgICAgaWYgKGNkckZpbHRlck1vZGU9PT0nYWxsJykge1xuICAgICAgICAgICAgJCgnI2Nkci1maWx0ZXItdXNlcnMtdGFibGVfd3JhcHBlcicpLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNjZHItZmlsdGVyLXVzZXJzLXRhYmxlX3dyYXBwZXInKS5zaG93KCk7XG4gICAgICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlKXtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQYWdlTGVuZ3RoID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNhbGN1bGF0ZVBhZ2VMZW5ndGgoKTtcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUucGFnZS5sZW4obmV3UGFnZUxlbmd0aCkuZHJhdyhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gZm9yIGFzc2lnbmluZyBjdXJyZW50IGFjY2VzcyBncm91cC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCkge1xuICAgICAgICBjb25zdCBkcm9wZG93blBhcmFtcyA9IEV4dGVuc2lvbnMuZ2V0RHJvcGRvd25TZXR0aW5nc09ubHlJbnRlcm5hbFdpdGhvdXRFbXB0eSgpO1xuICAgICAgICBkcm9wZG93blBhcmFtcy5hY3Rpb24gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclVzZXJzU2VsZWN0O1xuICAgICAgICBkcm9wZG93blBhcmFtcy50ZW1wbGF0ZXMgPSB7IG1lbnU6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jdXN0b21NZW1iZXJzRHJvcGRvd25NZW51IH07XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kc2VsZWN0VXNlcnNEcm9wRG93bi5kcm9wZG93bihkcm9wZG93blBhcmFtcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbWl6ZXMgdGhlIG1lbWJlcnMgZHJvcGRvd24gbWVudSB2aXN1YWxpemF0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSAtIFRoZSByZXNwb25zZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkcyAtIFRoZSBmaWVsZHMgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIEhUTUwgc3RyaW5nIGZvciB0aGUgZHJvcGRvd24gbWVudS5cbiAgICAgKi9cbiAgICBjdXN0b21NZW1iZXJzRHJvcGRvd25NZW51KHJlc3BvbnNlLCBmaWVsZHMpIHtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gcmVzcG9uc2VbZmllbGRzLnZhbHVlc10gfHwge307XG4gICAgICAgIGxldCBodG1sID0gJyc7XG4gICAgICAgIGxldCBvbGRUeXBlID0gJyc7XG4gICAgICAgICQuZWFjaCh2YWx1ZXMsIChpbmRleCwgb3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAob3B0aW9uLnR5cGUgIT09IG9sZFR5cGUpIHtcbiAgICAgICAgICAgICAgICBvbGRUeXBlID0gb3B0aW9uLnR5cGU7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImRpdmlkZXJcIj48L2Rpdj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGRpdiBjbGFzcz1cImhlYWRlclwiPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8aSBjbGFzcz1cInRhZ3MgaWNvblwiPjwvaT4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uLnR5cGVMb2NhbGl6ZWQ7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1heWJlVGV4dCA9IChvcHRpb25bZmllbGRzLnRleHRdKSA/IGBkYXRhLXRleHQ9XCIke29wdGlvbltmaWVsZHMudGV4dF19XCJgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBtYXliZURpc2FibGVkID0gKCQoYCNleHQtJHtvcHRpb25bZmllbGRzLnZhbHVlXX1gKS5oYXNDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJykpID8gJ2Rpc2FibGVkICcgOiAnJztcbiAgICAgICAgICAgIGh0bWwgKz0gYDxkaXYgY2xhc3M9XCIke21heWJlRGlzYWJsZWR9aXRlbVwiIGRhdGEtdmFsdWU9XCIke29wdGlvbltmaWVsZHMudmFsdWVdfVwiJHttYXliZVRleHR9PmA7XG4gICAgICAgICAgICBodG1sICs9IG9wdGlvbltmaWVsZHMubmFtZV07XG4gICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbGVjdGluZyBhIHVzZXIgZm9yIHRoZSBncm91cC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzZWxlY3RlZCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBUaGUgalF1ZXJ5IGVsZW1lbnQuXG4gICAgICovXG4gICAgY2JBZnRlclVzZXJzU2VsZWN0KHRleHQsIHZhbHVlLCAkZWxlbWVudCkge1xuICAgICAgICAkKGAjZXh0LSR7dmFsdWV9YClcbiAgICAgICAgICAgIC5jbG9zZXN0KCd0cicpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuc2hvdygpO1xuICAgICAgICAkKCRlbGVtZW50KS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGEgZ3JvdXAgbWVtYmVyIGZyb20gdGhlIHRhYmxlLlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIFRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICAgKi9cbiAgICBkZWxldGVNZW1iZXJGcm9tVGFibGUodGFyZ2V0KSB7XG4gICAgICAgIGNvbnN0IGlkID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ2RpdicpLmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgJChgIyR7aWR9YClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5oaWRlKCk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHJpZ2h0cyBjaGVja2JveGVzLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCkge1xuICAgICAgICAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAubGlzdCAubWFzdGVyLmNoZWNrYm94JylcbiAgICAgICAgICAgIC5jaGVja2JveCh7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25DaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyB1bmNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uVW5jaGVja2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveCAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5jaGVja2JveCcpLnNpYmxpbmdzKCcubGlzdCcpLmZpbmQoJy5jaGVja2JveCcpXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3guY2hlY2tib3goJ3VuY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5nZXRIb21lUGFnZXNGb3JTZWxlY3QoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgICAgICAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAubGlzdCAuY2hpbGQuY2hlY2tib3gnKVxuICAgICAgICAgICAgLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlIG9uIGxvYWQgdG8gc2V0IHBhcmVudCB2YWx1ZVxuICAgICAgICAgICAgICAgIGZpcmVPbkluaXQgOiB0cnVlLFxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBwYXJlbnQgc3RhdGUgb24gZWFjaCBjaGlsZCBjaGVja2JveCBjaGFuZ2VcbiAgICAgICAgICAgICAgICBvbkNoYW5nZSAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGxpc3RHcm91cCAgICAgID0gJCh0aGlzKS5jbG9zZXN0KCcubGlzdCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94ID0gJGxpc3RHcm91cC5jbG9zZXN0KCcuaXRlbScpLmNoaWxkcmVuKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGVja2JveCAgICAgICA9ICRsaXN0R3JvdXAuZmluZCgnLmNoZWNrYm94JyksXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxDaGVja2VkICAgICAgPSB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsVW5jaGVja2VkICAgID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBhbGwgb3RoZXIgc2libGluZ3MgYXJlIGNoZWNrZWQgb3IgdW5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICRjaGVja2JveC5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoICQodGhpcykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNldCBwYXJlbnQgY2hlY2tib3ggc3RhdGUsIGJ1dCBkb24ndCB0cmlnZ2VyIGl0cyBvbkNoYW5nZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICBpZihhbGxDaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBjaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZihhbGxVbmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IHVuY2hlY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgaW5kZXRlcm1pbmF0ZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZEFmdGVyQ2hhbmdlR3JvdXBSaWdodCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIGdyb3VwIHJpZ2h0LlxuICAgICAqL1xuICAgIGNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCl7XG4gICAgICAgIGNvbnN0IGFjY2Vzc1RvQ2RyID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsJ01pa29QQlhcXFxcQWRtaW5DYWJpbmV0XFxcXENvbnRyb2xsZXJzXFxcXENhbGxEZXRhaWxSZWNvcmRzQ29udHJvbGxlcl9tYWluJyk7XG4gICAgICAgIGlmIChhY2Nlc3NUb0Nkcj09PSdvbicpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyBoaWRlIGNoZWNrIGljb24gY2xvc2UgdG8gbW9kdWxlIG5hbWVcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0TW9kdWxlc1RhYnMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlVGFiID0gJChvYmopLmF0dHIoJ2RhdGEtdGFiJyk7XG4gICAgICAgICAgICBpZiAoJChgZGl2W2RhdGEtdGFiPVwiJHttb2R1bGVUYWJ9XCJdICAuYWNjZXNzLWdyb3VwLWNoZWNrYm94YCkucGFyZW50KCcuY2hlY2tlZCcpLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAkKGBhW2RhdGEtdGFiPScke21vZHVsZVRhYn0nXSBpLmljb25gKS5hZGRDbGFzcygnYW5nbGUgcmlnaHQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJChgYVtkYXRhLXRhYj0nJHttb2R1bGVUYWJ9J10gaS5pY29uYCkucmVtb3ZlQ2xhc3MoJ2FuZ2xlIHJpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBzdGF0dXMgb2YgYnV0dG9ucyB3aGVuIHRoZSBtb2R1bGUgc3RhdHVzIGNoYW5nZXMuXG4gICAgICovXG4gICAgY2hlY2tTdGF0dXNUb2dnbGUoKSB7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHN0YXR1c1RvZ2dsZS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXBhcmVzIGxpc3Qgb2YgcG9zc2libGUgaG9tZSBwYWdlcyB0byBzZWxlY3QgZnJvbVxuICAgICAqL1xuICAgIGdldEhvbWVQYWdlc0ZvclNlbGVjdCgpe1xuICAgICAgICBsZXQgdmFsdWVTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBjdXJyZW50SG9tZVBhZ2UgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnaG9tZVBhZ2UnKTtcbiAgICAgICAgbGV0IHNlbGVjdGVkUmlnaHRzID0gJCgnLmNoZWNrZWQgLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgIHNlbGVjdGVkUmlnaHRzID0gJCgnLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgICBzZWxlY3RlZFJpZ2h0cy5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXJOYW1lID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlci1uYW1lJyk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sbGVyTmFtZS5pbmRleE9mKCdwYnhjb3JlJykgPT09IC0xICYmIGFjdGlvbi5pbmRleE9mKCdpbmRleCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXJsID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNvbnZlcnRDYW1lbFRvRGFzaChgLyR7bW9kdWxlfS8ke2NvbnRyb2xsZXJOYW1lfS8ke2FjdGlvbn1gKTtcblxuICAgICAgICAgICAgICAgIGxldCBuYW1lVGVtcGxhdGVzID0gW1xuICAgICAgICAgICAgICAgICAgICBgbW1fJHtjb250cm9sbGVyTmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICBgQnJlYWRjcnVtYiR7bW9kdWxlfWAsXG4gICAgICAgICAgICAgICAgICAgIGBtb2R1bGVfdXNlcnN1aV8ke21vZHVsZX1fJHtjb250cm9sbGVyTmFtZX1fJHthY3Rpb259YFxuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgIG5hbWVUZW1wbGF0ZXMuZXZlcnkoKG5hbWVUZW1wbGF0ZSk9PntcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGdsb2JhbFRyYW5zbGF0ZVtuYW1lVGVtcGxhdGVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZVRlbXBsYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEhvbWVQYWdlID09PSB1cmwpe1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBuYW1lLCB2YWx1ZTogdXJsLCBzZWxlY3RlZDogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogbmFtZSwgdmFsdWU6IHVybCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aD09PTApe1xuICAgICAgICAgICAgY29uc3QgZmFpbEJhY2tIb21lUGFnZSA9ICBgJHtnbG9iYWxSb290VXJsfXNlc3Npb24vZW5kYDtcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IGZhaWxCYWNrSG9tZVBhZ2UsIHZhbHVlOiBmYWlsQmFja0hvbWVQYWdlLCBzZWxlY3RlZDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHZhbHVlU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmFsdWVTZWxlY3RlZCl7XG4gICAgICAgICAgICB2YWx1ZXNbMF0uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZXM6dmFsdWVzLFxuICAgICAgICAgICAgb25DaGFuZ2U6IEZvcm0uZGF0YUNoYW5nZWRcbiAgICAgICAgfTtcblxuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYSBzdHJpbmcgZnJvbSBjYW1lbCBjYXNlIHRvIGRhc2ggY2FzZS5cbiAgICAgKiBAcGFyYW0gc3RyXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgY29udmVydENhbWVsVG9EYXNoKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc2V0dGluZ3MgLSBUaGUgZm9ybSBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBtb2RpZmllZCBmb3JtIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gc2V0dGluZ3M7XG4gICAgICAgIGNvbnN0IGZvcm1WYWx1ZXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICByZXN1bHQuZGF0YSA9IHtcbiAgICAgICAgICAgIGlkOiBmb3JtVmFsdWVzLmlkLFxuICAgICAgICAgICAgbmFtZTogZm9ybVZhbHVlcy5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGZvcm1WYWx1ZXMuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBjZHJGaWx0ZXJNb2RlOiAgZm9ybVZhbHVlcy5jZHJGaWx0ZXJNb2RlLFxuICAgICAgICB9O1xuICAgICAgICAvLyBHcm91cCBtZW1iZXJzXG4gICAgICAgIGNvbnN0IGFyck1lbWJlcnMgPSBbXTtcbiAgICAgICAgJCgndHIuc2VsZWN0ZWQtbWVtYmVyJykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpIHtcbiAgICAgICAgICAgICAgICBhcnJNZW1iZXJzLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5kYXRhLm1lbWJlcnMgPSBKU09OLnN0cmluZ2lmeShhcnJNZW1iZXJzKTtcblxuICAgICAgICAvLyBHcm91cCBSaWdodHNcbiAgICAgICAgY29uc3QgYXJyR3JvdXBSaWdodHMgPSBbXTtcbiAgICAgICAgJCgnaW5wdXQuYWNjZXNzLWdyb3VwLWNoZWNrYm94JykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5wYXJlbnQoJy5jaGVja2JveCcpLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlcicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9ICQob2JqKS5hdHRyKCdkYXRhLWFjdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgbW9kdWxlIGluIGFyckdyb3VwUmlnaHRzIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGxldCBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0ubW9kdWxlID09PSBtb2R1bGUpO1xuICAgICAgICAgICAgICAgIGlmIChtb2R1bGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyR3JvdXBSaWdodHMucHVzaCh7IG1vZHVsZSwgY29udHJvbGxlcnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgY29udHJvbGxlciBpbiB0aGUgbW9kdWxlIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZUNvbnRyb2xsZXJzID0gYXJyR3JvdXBSaWdodHNbbW9kdWxlSW5kZXhdLmNvbnRyb2xsZXJzO1xuICAgICAgICAgICAgICAgIGxldCBjb250cm9sbGVySW5kZXggPSBtb2R1bGVDb250cm9sbGVycy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUNvbnRyb2xsZXJzLnB1c2goeyBjb250cm9sbGVyLCBhY3Rpb25zOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQdXNoIHRoZSBhY3Rpb24gaW50byB0aGUgY29udHJvbGxlcidzIGFjdGlvbnMgYXJyYXlcbiAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdLmFjdGlvbnMucHVzaChhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5hY2Nlc3NfZ3JvdXBfcmlnaHRzID0gSlNPTi5zdHJpbmdpZnkoYXJyR3JvdXBSaWdodHMpOyBcblxuICAgICAgICAvLyBDRFIgRmlsdGVyXG4gICAgICAgIGNvbnN0IGFyckNEUkZpbHRlciA9IFtdO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyQ0RSRmlsdGVyLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuZGF0YS5jZHJGaWx0ZXIgPSBKU09OLnN0cmluZ2lmeShhcnJDRFJGaWx0ZXIpO1xuXG4gICAgICAgIC8vIEZ1bGwgYWNjZXNzIGdyb3VwIHRvZ2dsZVxuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhvbWUgUGFnZSB2YWx1ZVxuICAgICAgICBjb25zdCBzZWxlY3RlZEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdnZXQgdmFsdWUnKTtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0dXAgbWVudScsIGRyb3Bkb3duUGFyYW1zKTtcbiAgICAgICAgbGV0IGhvbWVQYWdlID0gJyc7XG4gICAgICAgICQuZWFjaChkcm9wZG93blBhcmFtcy52YWx1ZXMsIGZ1bmN0aW9uKGluZGV4LCByZWNvcmQpIHtcbiAgICAgICAgICAgIGlmIChyZWNvcmQudmFsdWUgPT09IHNlbGVjdGVkSG9tZVBhZ2UpIHtcbiAgICAgICAgICAgICAgICBob21lUGFnZSA9IHNlbGVjdGVkSG9tZVBhZ2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaG9tZVBhZ2U9PT0nJyl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5ob21lUGFnZSA9IGRyb3Bkb3duUGFyYW1zLnZhbHVlc1swXS52YWx1ZTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0IHNlbGVjdGVkJywgcmVzdWx0LmRhdGEuaG9tZVBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSB1c2VycyB0YWJsZSBEYXRhVGFibGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUNEUkZpbHRlclRhYmxlKCkge1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKHtcbiAgICAgICAgICAgIG9uVmlzaWJsZSgpe1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ3RhYicpPT09J2Nkci1maWx0ZXInICYmIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSE9PW51bGwpe1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdQYWdlTGVuZ3RoID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNhbGN1bGF0ZVBhZ2VMZW5ndGgoKTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlLnBhZ2UubGVuKG5ld1BhZ2VMZW5ndGgpLmRyYXcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJVc2Vyc1RhYmxlLkRhdGFUYWJsZSh7XG4gICAgICAgICAgICAvLyBkZXN0cm95OiB0cnVlLFxuICAgICAgICAgICAgbGVuZ3RoQ2hhbmdlOiBmYWxzZSxcbiAgICAgICAgICAgIHBhZ2luZzogdHJ1ZSxcbiAgICAgICAgICAgIHBhZ2VMZW5ndGg6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYWxjdWxhdGVQYWdlTGVuZ3RoKCksXG4gICAgICAgICAgICBzY3JvbGxDb2xsYXBzZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICAgICAgICAvLyBDaGVja0JveFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBmYWxzZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyRGF0YVR5cGU6ICdkb20tY2hlY2tib3gnICAvLyBVc2UgdGhlIGN1c3RvbSBzb3J0aW5nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBVc2VybmFtZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIEV4dGVuc2lvblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIE1vYmlsZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gRW1haWxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcmRlcjogWzAsICdkZXNjJ10sXG4gICAgICAgICAgICBsYW5ndWFnZTogU2VtYW50aWNMb2NhbGl6YXRpb24uZGF0YVRhYmxlTG9jYWxpc2F0aW9uLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVBhZ2VMZW5ndGgoKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSByb3cgaGVpZ2h0XG4gICAgICAgIGxldCByb3dIZWlnaHQgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclVzZXJzVGFibGUuZmluZCgndHInKS5maXJzdCgpLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB3aW5kb3cgaGVpZ2h0IGFuZCBhdmFpbGFibGUgc3BhY2UgZm9yIHRhYmxlXG4gICAgICAgIGNvbnN0IHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgY29uc3QgaGVhZGVyRm9vdGVySGVpZ2h0ID0gNTgwOyAvLyBFc3RpbWF0ZSBoZWlnaHQgZm9yIGhlYWRlciwgZm9vdGVyLCBhbmQgb3RoZXIgZWxlbWVudHNcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHBhZ2UgbGVuZ3RoXG4gICAgICAgIHJldHVybiBNYXRoLm1heChNYXRoLmZsb29yKCh3aW5kb3dIZWlnaHQgLSBoZWFkZXJGb290ZXJIZWlnaHQpIC8gcm93SGVpZ2h0KSwgMTApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBjYkFmdGVyU2VuZEZvcm0oKSB7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2FjY2Vzcy1ncm91cHMvc2F2ZWA7XG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclNlbmRGb3JtO1xuICAgICAgICBGb3JtLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIC8vIEN1c3RvbSBzb3J0aW5nIGZvciBjaGVja2JveCBzdGF0ZXNcbiAgICAkLmZuLmRhdGFUYWJsZS5leHQub3JkZXJbJ2RvbS1jaGVja2JveCddID0gZnVuY3Rpb24gICggc2V0dGluZ3MsIGNvbCApXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkoKS5jb2x1bW4oIGNvbCwge29yZGVyOidpbmRleCd9ICkubm9kZXMoKS5tYXAoIGZ1bmN0aW9uICggdGQsIGkgKSB7XG4gICAgICAgICAgICByZXR1cm4gJCgnaW5wdXQnLCB0ZCkucHJvcCgnY2hlY2tlZCcpID8gJzEnIDogJzAnO1xuICAgICAgICB9ICk7XG4gICAgfTtcblxuICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==