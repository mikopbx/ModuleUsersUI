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
        var nameTemplates = ["mo_".concat(module), "mm_".concat(controllerName), "Breadcrumb".concat(module), "module_usersui_".concat(module, "_").concat(controllerName, "_").concat(action)];
        var name = '';
        nameTemplates.some(function (nameTemplate) {
          // Попытка найти перевод
          name = globalTranslate[nameTemplate]; // Если перевод найден (он не undefined), прекращаем перебор

          if (name !== undefined && name !== nameTemplate) {
            return true; // Останавливаем перебор
          } // Если перевод не найден, продолжаем поиск


          name = nameTemplate; // Используем шаблон как значение по умолчанию

          return false;
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
    return str.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCJjZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSIsIiRjZHJGaWx0ZXJUb2dnbGVzIiwiJGNkckZpbHRlck1vZGUiLCIkZ3JvdXBSaWdodE1vZHVsZXNUYWJzIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJkcm9wZG93biIsImdldEhvbWVQYWdlc0ZvclNlbGVjdCIsImNkckZpbHRlck1vZGUiLCJmb3JtIiwibmV3UGFnZUxlbmd0aCIsImNhbGN1bGF0ZVBhZ2VMZW5ndGgiLCJwYWdlIiwibGVuIiwiZHJhdyIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiYWNjZXNzVG9DZHIiLCJvYmoiLCJtb2R1bGVUYWIiLCJsZW5ndGgiLCJ2YWx1ZVNlbGVjdGVkIiwiY3VycmVudEhvbWVQYWdlIiwic2VsZWN0ZWRSaWdodHMiLCJtb2R1bGUiLCJjb250cm9sbGVyTmFtZSIsImluZGV4T2YiLCJ1cmwiLCJjb252ZXJ0Q2FtZWxUb0Rhc2giLCJuYW1lVGVtcGxhdGVzIiwic29tZSIsIm5hbWVUZW1wbGF0ZSIsInVuZGVmaW5lZCIsInB1c2giLCJzZWxlY3RlZCIsImZhaWxCYWNrSG9tZVBhZ2UiLCJzdHIiLCJyZXBsYWNlIiwidG9Mb3dlckNhc2UiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJmb3JtVmFsdWVzIiwiZGF0YSIsImRlc2NyaXB0aW9uIiwiYXJyTWVtYmVycyIsIm1lbWJlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiYXJyR3JvdXBSaWdodHMiLCJjb250cm9sbGVyIiwibW9kdWxlSW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwiY29udHJvbGxlcnMiLCJtb2R1bGVDb250cm9sbGVycyIsImNvbnRyb2xsZXJJbmRleCIsImFjdGlvbnMiLCJhY2Nlc3NfZ3JvdXBfcmlnaHRzIiwiYXJyQ0RSRmlsdGVyIiwiY2RyRmlsdGVyIiwiZnVsbEFjY2VzcyIsInNlbGVjdGVkSG9tZVBhZ2UiLCJob21lUGFnZSIsInJlY29yZCIsIm9uVmlzaWJsZSIsIkRhdGFUYWJsZSIsImxlbmd0aENoYW5nZSIsInBhZ2luZyIsInBhZ2VMZW5ndGgiLCJzY3JvbGxDb2xsYXBzZSIsImNvbHVtbnMiLCJvcmRlcmFibGUiLCJzZWFyY2hhYmxlIiwib3JkZXJEYXRhVHlwZSIsIm9yZGVyIiwibGFuZ3VhZ2UiLCJTZW1hbnRpY0xvY2FsaXphdGlvbiIsImRhdGFUYWJsZUxvY2FsaXNhdGlvbiIsInJvd0hlaWdodCIsImZpcnN0Iiwib3V0ZXJIZWlnaHQiLCJ3aW5kb3dIZWlnaHQiLCJpbm5lckhlaWdodCIsImhlYWRlckZvb3RlckhlaWdodCIsIk1hdGgiLCJtYXgiLCJmbG9vciIsImNiQWZ0ZXJTZW5kRm9ybSIsImRvY3VtZW50IiwicmVhZHkiLCJmbiIsImRhdGFUYWJsZSIsImV4dCIsImNvbCIsImFwaSIsImNvbHVtbiIsIm5vZGVzIiwibWFwIiwidGQiLCJpIiwicHJvcCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBR0EsSUFBTUEs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QixHQUFMLGFBQWM5RSxhQUFkO0FBQ0FvRCxJQUFBQSxJQUFJLENBQUNsRSxhQUFMLEdBQXFCbkIscUJBQXFCLENBQUNtQixhQUEzQztBQUNBa0UsSUFBQUEsSUFBSSxDQUFDc0MsZ0JBQUwsR0FBd0IzSCxxQkFBcUIsQ0FBQzJILGdCQUE5QztBQUNBdEMsSUFBQUEsSUFBSSxDQUFDdUYsZUFBTCxHQUF1QjVLLHFCQUFxQixDQUFDNEssZUFBN0M7QUFDQXZGLElBQUFBLElBQUksQ0FBQzFELFVBQUw7QUFDSDtBQW5tQnlCLENBQTlCO0FBc21CQXpCLENBQUMsQ0FBQzJLLFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDcEI7QUFDQTVLLEVBQUFBLENBQUMsQ0FBQzZLLEVBQUYsQ0FBS0MsU0FBTCxDQUFlQyxHQUFmLENBQW1CbEIsS0FBbkIsQ0FBeUIsY0FBekIsSUFBMkMsVUFBWW5DLFFBQVosRUFBc0JzRCxHQUF0QixFQUMzQztBQUNJLFdBQU8sS0FBS0MsR0FBTCxHQUFXQyxNQUFYLENBQW1CRixHQUFuQixFQUF3QjtBQUFDbkIsTUFBQUEsS0FBSyxFQUFDO0FBQVAsS0FBeEIsRUFBMENzQixLQUExQyxHQUFrREMsR0FBbEQsQ0FBdUQsVUFBV0MsRUFBWCxFQUFlQyxDQUFmLEVBQW1CO0FBQzdFLGFBQU90TCxDQUFDLENBQUMsT0FBRCxFQUFVcUwsRUFBVixDQUFELENBQWVFLElBQWYsQ0FBb0IsU0FBcEIsSUFBaUMsR0FBakMsR0FBdUMsR0FBOUM7QUFDSCxLQUZNLENBQVA7QUFHSCxHQUxEOztBQU9BekwsRUFBQUEscUJBQXFCLENBQUMyQixVQUF0QjtBQUNILENBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgZ2xvYmFsVHJhbnNsYXRlLCBGb3JtLCBFeHRlbnNpb25zLCBEYXRhdGFibGUgKi9cblxuXG5jb25zdCBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcgPSB7XG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZm9ybS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRmb3JtT2JqOiAkKCcjbW9kdWxlLXVzZXJzLXVpLWZvcm0nKSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrYm94IGFsbG93cyBmdWxsIGFjY2VzcyB0byB0aGUgc3lzdGVtLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAkZnVsbEFjY2Vzc0NoZWNrYm94OiAkKCcjZnVsbC1hY2Nlc3MtZ3JvdXAnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBzZWxlY3QgdXNlcnMgZHJvcGRvd24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc2VsZWN0VXNlcnNEcm9wRG93bjogJCgnW2RhdGEtdGFiPVwidXNlcnNcIl0gLnNlbGVjdC1leHRlbnNpb24tZmllbGQnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtb2R1bGUgc3RhdHVzIHRvZ2dsZS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGhvbWUgcGFnZSBkcm9wZG93biBzZWxlY3QuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkaG9tZVBhZ2VEcm9wZG93bjogJCgnI2hvbWUtcGFnZS1kcm9wZG93bicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGFjY2VzcyBzZXR0aW5ncyB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRhY2Nlc3NTZXR0aW5nc1RhYk1lbnU6ICQoJyNhY2Nlc3Mtc2V0dGluZ3MtdGFiLW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBtYWluIHRhYiBtZW51LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJG1haW5UYWJNZW51OiAkKCcjbW9kdWxlLWFjY2Vzcy1ncm91cC1tb2RpZnktbWVudSAuaXRlbScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdGFiLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclRhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJjZHItZmlsdGVyXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZ3JvdXAgcmlnaHRzIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRncm91cFJpZ2h0c1RhYjogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW1bZGF0YS10YWI9XCJncm91cC1yaWdodHNcIl0nKSxcblxuICAgIC8qKlxuICAgICAqIFVzZXJzIHRhYmxlIGZvciBDRFIgZmlsdGVyLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclVzZXJzVGFibGU6ICQoJyNjZHItZmlsdGVyLXVzZXJzLXRhYmxlJyksXG5cbiAgICAvKipcbiAgICAgKiBVc2VycyBkYXRhIHRhYmxlIGZvciBDRFIgZmlsdGVyLlxuICAgICAqIEB0eXBlIHtEYXRhdGFibGV9XG4gICAgICovXG4gICAgY2RyRmlsdGVyVXNlcnNEYXRhVGFibGU6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciB0b2dnbGVzLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlclRvZ2dsZXM6ICQoJ2Rpdi5jZHItZmlsdGVyLXRvZ2dsZXMnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIG1vZGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2RyRmlsdGVyTW9kZTogJCgnZGl2LmNkci1maWx0ZXItcmFkaW8nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3Qgd2l0aCBhbGwgdGFicyBpbiBhY2Nlc3MtZ3JvdXAtcmlnaHRzIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRncm91cFJpZ2h0TW9kdWxlc1RhYnM6ICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC51aS50YWInKSxcblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgZXh0ZW5zaW9uLlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZGVmYXVsdEV4dGVuc2lvbjogJycsXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgdW5jaGVjayBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkdW5DaGVja0J1dHRvbjogJCgnLnVuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgdW5jaGVjayBidXR0b24uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkY2hlY2tCdXR0b246ICQoJy5jaGVjay5idXR0b24nKSxcblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRpb24gcnVsZXMgZm9yIHRoZSBmb3JtIGZpZWxkcy5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhbGlkYXRlUnVsZXM6IHtcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgaWRlbnRpZmllcjogJ25hbWUnLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlbXB0eScsXG4gICAgICAgICAgICAgICAgICAgIHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV91c2Vyc3VpX1ZhbGlkYXRlTmFtZUlzRW1wdHksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtb2R1bGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNoZWNrU3RhdHVzVG9nZ2xlKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdNb2R1bGVTdGF0dXNDaGFuZ2VkJywgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNoZWNrU3RhdHVzVG9nZ2xlKTtcblxuICAgICAgICAkKCcuYXZhdGFyJykuZWFjaCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdzcmMnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsIGAke2dsb2JhbFJvb3RVcmx9YXNzZXRzL2ltZy91bmtub3duUGVyc29uLmpwZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJG1haW5UYWJNZW51LnRhYigpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGFjY2Vzc1NldHRpbmdzVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVSaWdodHNDaGVja2JveGVzKCk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUZ1bGxBY2Nlc3NUb2dnbGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUb2dnbGVzLmNoZWNrYm94KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlck1vZGUuY2hlY2tib3goe1xuICAgICAgICAgICAgb25DaGFuZ2U6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCdib2R5Jykub24oJ2NsaWNrJywgJ2Rpdi5kZWxldGUtdXNlci1yb3cnLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmRlbGV0ZU1lbWJlckZyb21UYWJsZShlLnRhcmdldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSBjaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjaGVja0J1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJChlLnRhcmdldCkucGFyZW50KCcudWkudGFiJykuZmluZCgnLnVpLmNoZWNrYm94JykuY2hlY2tib3goJ2NoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSB1bmNoZWNrIGJ1dHRvbiBjbGlja1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHVuQ2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgQ0RSIGZpbHRlciBkYXRhdGFibGVcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSgpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplRm9ybSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZnVsbCBhY2Nlc3MgdG9nZ2xlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlKCl7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoJ2NoYW5nZSB0YWInLCdnZW5lcmFsJyk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5oaWRlKCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodHNUYWIuc2hvdygpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5nZXRIb21lUGFnZXNGb3JTZWxlY3QoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBDRFIgZmlsdGVyIG1vZGUuXG4gICAgICovXG4gICAgY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKXtcbiAgICAgICAgY29uc3QgY2RyRmlsdGVyTW9kZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdjZHJGaWx0ZXJNb2RlJyk7XG4gICAgICAgIGlmIChjZHJGaWx0ZXJNb2RlPT09J2FsbCcpIHtcbiAgICAgICAgICAgICQoJyNjZHItZmlsdGVyLXVzZXJzLXRhYmxlX3dyYXBwZXInKS5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZV93cmFwcGVyJykuc2hvdygpO1xuICAgICAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSl7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UGFnZUxlbmd0aCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYWxjdWxhdGVQYWdlTGVuZ3RoKCk7XG4gICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlLnBhZ2UubGVuKG5ld1BhZ2VMZW5ndGgpLmRyYXcoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIGZvciBhc3NpZ25pbmcgY3VycmVudCBhY2Nlc3MgZ3JvdXAuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZU1lbWJlcnNEcm9wRG93bigpIHtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBFeHRlbnNpb25zLmdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkoKTtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMuYWN0aW9uID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJVc2Vyc1NlbGVjdDtcbiAgICAgICAgZHJvcGRvd25QYXJhbXMudGVtcGxhdGVzID0geyBtZW51OiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSB9O1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHNlbGVjdFVzZXJzRHJvcERvd24uZHJvcGRvd24oZHJvcGRvd25QYXJhbXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDdXN0b21pemVzIHRoZSBtZW1iZXJzIGRyb3Bkb3duIG1lbnUgdmlzdWFsaXphdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgLSBUaGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZHMgLSBUaGUgZmllbGRzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSBIVE1MIHN0cmluZyBmb3IgdGhlIGRyb3Bkb3duIG1lbnUuXG4gICAgICovXG4gICAgY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudShyZXNwb25zZSwgZmllbGRzKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHJlc3BvbnNlW2ZpZWxkcy52YWx1ZXNdIHx8IHt9O1xuICAgICAgICBsZXQgaHRtbCA9ICcnO1xuICAgICAgICBsZXQgb2xkVHlwZSA9ICcnO1xuICAgICAgICAkLmVhY2godmFsdWVzLCAoaW5kZXgsIG9wdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKG9wdGlvbi50eXBlICE9PSBvbGRUeXBlKSB7XG4gICAgICAgICAgICAgICAgb2xkVHlwZSA9IG9wdGlvbi50eXBlO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJkaXZpZGVyXCI+PC9kaXY+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxkaXYgY2xhc3M9XCJoZWFkZXJcIj4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJ1x0PGkgY2xhc3M9XCJ0YWdzIGljb25cIj48L2k+JztcbiAgICAgICAgICAgICAgICBodG1sICs9IG9wdGlvbi50eXBlTG9jYWxpemVkO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBtYXliZVRleHQgPSAob3B0aW9uW2ZpZWxkcy50ZXh0XSkgPyBgZGF0YS10ZXh0PVwiJHtvcHRpb25bZmllbGRzLnRleHRdfVwiYCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbWF5YmVEaXNhYmxlZCA9ICgkKGAjZXh0LSR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19YCkuaGFzQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpKSA/ICdkaXNhYmxlZCAnIDogJyc7XG4gICAgICAgICAgICBodG1sICs9IGA8ZGl2IGNsYXNzPVwiJHttYXliZURpc2FibGVkfWl0ZW1cIiBkYXRhLXZhbHVlPVwiJHtvcHRpb25bZmllbGRzLnZhbHVlXX1cIiR7bWF5YmVUZXh0fT5gO1xuICAgICAgICAgICAgaHRtbCArPSBvcHRpb25bZmllbGRzLm5hbWVdO1xuICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZWxlY3RpbmcgYSB1c2VyIGZvciB0aGUgZ3JvdXAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBUaGUgc2VsZWN0ZWQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0gVGhlIGpRdWVyeSBlbGVtZW50LlxuICAgICAqL1xuICAgIGNiQWZ0ZXJVc2Vyc1NlbGVjdCh0ZXh0LCB2YWx1ZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgJChgI2V4dC0ke3ZhbHVlfWApXG4gICAgICAgICAgICAuY2xvc2VzdCgndHInKVxuICAgICAgICAgICAgLmFkZENsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLnNob3coKTtcbiAgICAgICAgJCgkZWxlbWVudCkuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIGdyb3VwIG1lbWJlciBmcm9tIHRoZSB0YWJsZS5cbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICovXG4gICAgZGVsZXRlTWVtYmVyRnJvbVRhYmxlKHRhcmdldCkge1xuICAgICAgICBjb25zdCBpZCA9ICQodGFyZ2V0KS5jbG9zZXN0KCdkaXYnKS5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICQoYCMke2lkfWApXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkLW1lbWJlcicpXG4gICAgICAgICAgICAuaGlkZSgpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSByaWdodHMgY2hlY2tib3hlcy5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpIHtcbiAgICAgICAgJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLmxpc3QgLm1hc3Rlci5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFsbCBjaGlsZHJlblxuICAgICAgICAgICAgICAgIG9uQ2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gdW5jaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvblVuY2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoaWxkQ2hlY2tib3ggID0gJCh0aGlzKS5jbG9zZXN0KCcuY2hlY2tib3gnKS5zaWJsaW5ncygnLmxpc3QnKS5maW5kKCcuY2hlY2tib3gnKVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94LmNoZWNrYm94KCd1bmNoZWNrJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bihtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIDtcbiAgICAgICAgJCgnI2FjY2Vzcy1ncm91cC1yaWdodHMgLmxpc3QgLmNoaWxkLmNoZWNrYm94JylcbiAgICAgICAgICAgIC5jaGVja2JveCh7XG4gICAgICAgICAgICAgICAgLy8gRmlyZSBvbiBsb2FkIHRvIHNldCBwYXJlbnQgdmFsdWVcbiAgICAgICAgICAgICAgICBmaXJlT25Jbml0IDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgcGFyZW50IHN0YXRlIG9uIGVhY2ggY2hpbGQgY2hlY2tib3ggY2hhbmdlXG4gICAgICAgICAgICAgICAgb25DaGFuZ2UgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRsaXN0R3JvdXAgICAgICA9ICQodGhpcykuY2xvc2VzdCgnLmxpc3QnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveCA9ICRsaXN0R3JvdXAuY2xvc2VzdCgnLml0ZW0nKS5jaGlsZHJlbignLmNoZWNrYm94JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkY2hlY2tib3ggICAgICAgPSAkbGlzdEdyb3VwLmZpbmQoJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCAgICAgID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCAgICA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgYWxsIG90aGVyIHNpYmxpbmdzIGFyZSBjaGVja2VkIG9yIHVuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAkY2hlY2tib3guZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLmNoZWNrYm94KCdpcyBjaGVja2VkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsVW5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxDaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgcGFyZW50IGNoZWNrYm94IHN0YXRlLCBidXQgZG9uJ3QgdHJpZ2dlciBpdHMgb25DaGFuZ2UgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgaWYoYWxsQ2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgY2hlY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoYWxsVW5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCB1bmNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGluZGV0ZXJtaW5hdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIGNoYW5naW5nIHRoZSBncm91cCByaWdodC5cbiAgICAgKi9cbiAgICBjZEFmdGVyQ2hhbmdlR3JvdXBSaWdodCgpe1xuICAgICAgICBjb25zdCBhY2Nlc3NUb0NkciA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdNaWtvUEJYXFxcXEFkbWluQ2FiaW5ldFxcXFxDb250cm9sbGVyc1xcXFxDYWxsRGV0YWlsUmVjb3Jkc0NvbnRyb2xsZXJfbWFpbicpO1xuICAgICAgICBpZiAoYWNjZXNzVG9DZHI9PT0nb24nKSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRhYi5zaG93KCk7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3cgaGlkZSBjaGVjayBpY29uIGNsb3NlIHRvIG1vZHVsZSBuYW1lXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZ3JvdXBSaWdodE1vZHVsZXNUYWJzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZVRhYiA9ICQob2JqKS5hdHRyKCdkYXRhLXRhYicpO1xuICAgICAgICAgICAgaWYgKCQoYGRpdltkYXRhLXRhYj1cIiR7bW9kdWxlVGFifVwiXSAgLmFjY2Vzcy1ncm91cC1jaGVja2JveGApLnBhcmVudCgnLmNoZWNrZWQnKS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgJChgYVtkYXRhLXRhYj0nJHttb2R1bGVUYWJ9J10gaS5pY29uYCkuYWRkQ2xhc3MoJ2FuZ2xlIHJpZ2h0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoYGFbZGF0YS10YWI9JyR7bW9kdWxlVGFifSddIGkuaWNvbmApLnJlbW92ZUNsYXNzKCdhbmdsZSByaWdodCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgc3RhdHVzIG9mIGJ1dHRvbnMgd2hlbiB0aGUgbW9kdWxlIHN0YXR1cyBjaGFuZ2VzLlxuICAgICAqL1xuICAgIGNoZWNrU3RhdHVzVG9nZ2xlKCkge1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJnZW5lcmFsXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcInVzZXJzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdyb3VwLXJpZ2h0c1wiXSAuZGlzYWJpbGl0eScpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJjZHItZmlsdGVyXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwYXJlcyBsaXN0IG9mIHBvc3NpYmxlIGhvbWUgcGFnZXMgdG8gc2VsZWN0IGZyb21cbiAgICAgKi9cbiAgICBnZXRIb21lUGFnZXNGb3JTZWxlY3QoKXtcbiAgICAgICAgbGV0IHZhbHVlU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY3VycmVudEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsJ2hvbWVQYWdlJyk7XG4gICAgICAgIGxldCBzZWxlY3RlZFJpZ2h0cyA9ICQoJy5jaGVja2VkIC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKTtcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICBzZWxlY3RlZFJpZ2h0cyA9ICQoJy5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgc2VsZWN0ZWRSaWdodHMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sbGVyTmFtZSA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXItbmFtZScpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gJChvYmopLmF0dHIoJ2RhdGEtYWN0aW9uJyk7XG4gICAgICAgICAgICBpZiAoY29udHJvbGxlck5hbWUuaW5kZXhPZigncGJ4Y29yZScpID09PSAtMSAmJiBhY3Rpb24uaW5kZXhPZignaW5kZXgnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jb252ZXJ0Q2FtZWxUb0Rhc2goYC8ke21vZHVsZX0vJHtjb250cm9sbGVyTmFtZX0vJHthY3Rpb259YCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbmFtZVRlbXBsYXRlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgYG1vXyR7bW9kdWxlfWAsXG4gICAgICAgICAgICAgICAgICAgIGBtbV8ke2NvbnRyb2xsZXJOYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIGBCcmVhZGNydW1iJHttb2R1bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgYG1vZHVsZV91c2Vyc3VpXyR7bW9kdWxlfV8ke2NvbnRyb2xsZXJOYW1lfV8ke2FjdGlvbn1gXG4gICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgbmFtZVRlbXBsYXRlcy5zb21lKChuYW1lVGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g0J/QvtC/0YvRgtC60LAg0L3QsNC50YLQuCDQv9C10YDQtdCy0L7QtFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gZ2xvYmFsVHJhbnNsYXRlW25hbWVUZW1wbGF0ZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g0JXRgdC70Lgg0L/QtdGA0LXQstC+0LQg0L3QsNC50LTQtdC9ICjQvtC9INC90LUgdW5kZWZpbmVkKSwg0L/RgNC10LrRgNCw0YnQsNC10Lwg0L/QtdGA0LXQsdC+0YBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgIT09IHVuZGVmaW5lZCAmJiBuYW1lICE9PSBuYW1lVGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8g0J7RgdGC0LDQvdCw0LLQu9C40LLQsNC10Lwg0L/QtdGA0LXQsdC+0YBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vINCV0YHQu9C4INC/0LXRgNC10LLQvtC0INC90LUg0L3QsNC50LTQtdC9LCDQv9GA0L7QtNC+0LvQttCw0LXQvCDQv9C+0LjRgdC6XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lVGVtcGxhdGU7ICAvLyDQmNGB0L/QvtC70YzQt9GD0LXQvCDRiNCw0LHQu9C+0L0g0LrQsNC6INC30L3QsNGH0LXQvdC40LUg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SG9tZVBhZ2UgPT09IHVybCl7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IG5hbWUsIHZhbHVlOiB1cmwsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBuYW1lLCB2YWx1ZTogdXJsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICBjb25zdCBmYWlsQmFja0hvbWVQYWdlID0gIGAke2dsb2JhbFJvb3RVcmx9c2Vzc2lvbi9lbmRgO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogZmFpbEJhY2tIb21lUGFnZSwgdmFsdWU6IGZhaWxCYWNrSG9tZVBhZ2UsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgdmFsdWVTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWx1ZVNlbGVjdGVkKXtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlczp2YWx1ZXMsXG4gICAgICAgICAgICBvbkNoYW5nZTogRm9ybS5kYXRhQ2hhbmdlZFxuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhIHN0cmluZyBmcm9tIGNhbWVsIGNhc2UgdG8gZGFzaCBjYXNlLlxuICAgICAqIEBwYXJhbSBzdHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBjb252ZXJ0Q2FtZWxUb0Rhc2goc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGJlZm9yZSBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzZXR0aW5ncyAtIFRoZSBmb3JtIHNldHRpbmdzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IC0gVGhlIG1vZGlmaWVkIGZvcm0gc2V0dGluZ3MuXG4gICAgICovXG4gICAgY2JCZWZvcmVTZW5kRm9ybShzZXR0aW5ncykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBzZXR0aW5ncztcbiAgICAgICAgY29uc3QgZm9ybVZhbHVlcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG4gICAgICAgIHJlc3VsdC5kYXRhID0ge1xuICAgICAgICAgICAgaWQ6IGZvcm1WYWx1ZXMuaWQsXG4gICAgICAgICAgICBuYW1lOiBmb3JtVmFsdWVzLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZm9ybVZhbHVlcy5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIGNkckZpbHRlck1vZGU6ICBmb3JtVmFsdWVzLmNkckZpbHRlck1vZGUsXG4gICAgICAgIH07XG4gICAgICAgIC8vIEdyb3VwIG1lbWJlcnNcbiAgICAgICAgY29uc3QgYXJyTWVtYmVycyA9IFtdO1xuICAgICAgICAkKCd0ci5zZWxlY3RlZC1tZW1iZXInKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSkge1xuICAgICAgICAgICAgICAgIGFyck1lbWJlcnMucHVzaCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEubWVtYmVycyA9IEpTT04uc3RyaW5naWZ5KGFyck1lbWJlcnMpO1xuXG4gICAgICAgIC8vIEdyb3VwIFJpZ2h0c1xuICAgICAgICBjb25zdCBhcnJHcm91cFJpZ2h0cyA9IFtdO1xuICAgICAgICAkKCdpbnB1dC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3gnKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLnBhcmVudCgnLmNoZWNrYm94JykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9ICQob2JqKS5hdHRyKCdkYXRhLW1vZHVsZScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSAkKG9iaikuYXR0cignZGF0YS1jb250cm9sbGVyJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gJChvYmopLmF0dHIoJ2RhdGEtYWN0aW9uJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBtb2R1bGUgaW4gYXJyR3JvdXBSaWdodHMgb3IgY3JlYXRlIGEgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgbGV0IG1vZHVsZUluZGV4ID0gYXJyR3JvdXBSaWdodHMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5tb2R1bGUgPT09IG1vZHVsZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZUluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhcnJHcm91cFJpZ2h0cy5wdXNoKHsgbW9kdWxlLCBjb250cm9sbGVyczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUluZGV4ID0gYXJyR3JvdXBSaWdodHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBjb250cm9sbGVyIGluIHRoZSBtb2R1bGUgb3IgY3JlYXRlIGEgbmV3IGVudHJ5XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlQ29udHJvbGxlcnMgPSBhcnJHcm91cFJpZ2h0c1ttb2R1bGVJbmRleF0uY29udHJvbGxlcnM7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uY29udHJvbGxlciA9PT0gY29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXJJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnMucHVzaCh7IGNvbnRyb2xsZXIsIGFjdGlvbnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVySW5kZXggPSBtb2R1bGVDb250cm9sbGVycy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFB1c2ggdGhlIGFjdGlvbiBpbnRvIHRoZSBjb250cm9sbGVyJ3MgYWN0aW9ucyBhcnJheVxuICAgICAgICAgICAgICAgIG1vZHVsZUNvbnRyb2xsZXJzW2NvbnRyb2xsZXJJbmRleF0uYWN0aW9ucy5wdXNoKGFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5kYXRhLmFjY2Vzc19ncm91cF9yaWdodHMgPSBKU09OLnN0cmluZ2lmeShhcnJHcm91cFJpZ2h0cyk7IFxuXG4gICAgICAgIC8vIENEUiBGaWx0ZXJcbiAgICAgICAgY29uc3QgYXJyQ0RSRmlsdGVyID0gW107XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBpZiAoJChvYmopLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBhcnJDRFJGaWx0ZXIucHVzaCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdC5kYXRhLmNkckZpbHRlciA9IEpTT04uc3RyaW5naWZ5KGFyckNEUkZpbHRlcik7XG5cbiAgICAgICAgLy8gRnVsbCBhY2Nlc3MgZ3JvdXAgdG9nZ2xlXG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCgnaXMgY2hlY2tlZCcpKXtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmZ1bGxBY2Nlc3MgPSAnMSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSG9tZSBQYWdlIHZhbHVlXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkSG9tZVBhZ2UgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ2dldCB2YWx1ZScpO1xuICAgICAgICBjb25zdCBkcm9wZG93blBhcmFtcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5nZXRIb21lUGFnZXNGb3JTZWxlY3QoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdzZXR1cCBtZW51JywgZHJvcGRvd25QYXJhbXMpO1xuICAgICAgICBsZXQgaG9tZVBhZ2UgPSAnJztcbiAgICAgICAgJC5lYWNoKGRyb3Bkb3duUGFyYW1zLnZhbHVlcywgZnVuY3Rpb24oaW5kZXgsIHJlY29yZCkge1xuICAgICAgICAgICAgaWYgKHJlY29yZC52YWx1ZSA9PT0gc2VsZWN0ZWRIb21lUGFnZSkge1xuICAgICAgICAgICAgICAgIGhvbWVQYWdlID0gc2VsZWN0ZWRIb21lUGFnZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChob21lUGFnZT09PScnKXtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmhvbWVQYWdlID0gZHJvcGRvd25QYXJhbXMudmFsdWVzWzBdLnZhbHVlO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdzZXQgc2VsZWN0ZWQnLCByZXN1bHQuZGF0YS5ob21lUGFnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5ob21lUGFnZSA9IHNlbGVjdGVkSG9tZVBhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHVzZXJzIHRhYmxlIERhdGFUYWJsZS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplQ0RSRmlsdGVyVGFibGUoKSB7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoe1xuICAgICAgICAgICAgb25WaXNpYmxlKCl7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykuZGF0YSgndGFiJyk9PT0nY2RyLWZpbHRlcicgJiYgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlIT09bnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BhZ2VMZW5ndGggPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2FsY3VsYXRlUGFnZUxlbmd0aCgpO1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUucGFnZS5sZW4obmV3UGFnZUxlbmd0aCkuZHJhdyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclVzZXJzVGFibGUuRGF0YVRhYmxlKHtcbiAgICAgICAgICAgIC8vIGRlc3Ryb3k6IHRydWUsXG4gICAgICAgICAgICBsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgcGFnaW5nOiB0cnVlLFxuICAgICAgICAgICAgcGFnZUxlbmd0aDogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNhbGN1bGF0ZVBhZ2VMZW5ndGgoKSxcbiAgICAgICAgICAgIHNjcm9sbENvbGxhcHNlOiB0cnVlLFxuICAgICAgICAgICAgY29sdW1uczogW1xuICAgICAgICAgICAgICAgIC8vIENoZWNrQm94XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IGZhbHNlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJEYXRhVHlwZTogJ2RvbS1jaGVja2JveCcgIC8vIFVzZSB0aGUgY3VzdG9tIHNvcnRpbmdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIFVzZXJuYW1lXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogdHJ1ZSAgLy8gVGhpcyBjb2x1bW4gaXMgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gRXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogdHJ1ZSAgLy8gVGhpcyBjb2x1bW4gaXMgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gTW9iaWxlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBFbWFpbFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yZGVyOiBbMCwgJ2Rlc2MnXSxcbiAgICAgICAgICAgIGxhbmd1YWdlOiBTZW1hbnRpY0xvY2FsaXphdGlvbi5kYXRhVGFibGVMb2NhbGlzYXRpb24sXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY2FsY3VsYXRlUGFnZUxlbmd0aCgpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHJvdyBoZWlnaHRcbiAgICAgICAgbGV0IHJvd0hlaWdodCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVXNlcnNUYWJsZS5maW5kKCd0cicpLmZpcnN0KCkub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHdpbmRvdyBoZWlnaHQgYW5kIGF2YWlsYWJsZSBzcGFjZSBmb3IgdGFibGVcbiAgICAgICAgY29uc3Qgd2luZG93SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICBjb25zdCBoZWFkZXJGb290ZXJIZWlnaHQgPSA1ODA7IC8vIEVzdGltYXRlIGhlaWdodCBmb3IgaGVhZGVyLCBmb290ZXIsIGFuZCBvdGhlciBlbGVtZW50c1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBuZXcgcGFnZSBsZW5ndGhcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KE1hdGguZmxvb3IoKHdpbmRvd0hlaWdodCAtIGhlYWRlckZvb3RlckhlaWdodCkgLyByb3dIZWlnaHQpLCAxMCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBzZW5kaW5nIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplRm9ybSgpIHtcbiAgICAgICAgRm9ybS4kZm9ybU9iaiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iajtcbiAgICAgICAgRm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvYWNjZXNzLWdyb3Vwcy9zYXZlYDtcbiAgICAgICAgRm9ybS52YWxpZGF0ZVJ1bGVzID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLnZhbGlkYXRlUnVsZXM7XG4gICAgICAgIEZvcm0uY2JCZWZvcmVTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkJlZm9yZVNlbmRGb3JtO1xuICAgICAgICBGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyU2VuZEZvcm07XG4gICAgICAgIEZvcm0uaW5pdGlhbGl6ZSgpO1xuICAgIH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgLy8gQ3VzdG9tIHNvcnRpbmcgZm9yIGNoZWNrYm94IHN0YXRlc1xuICAgICQuZm4uZGF0YVRhYmxlLmV4dC5vcmRlclsnZG9tLWNoZWNrYm94J10gPSBmdW5jdGlvbiAgKCBzZXR0aW5ncywgY29sIClcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaSgpLmNvbHVtbiggY29sLCB7b3JkZXI6J2luZGV4J30gKS5ub2RlcygpLm1hcCggZnVuY3Rpb24gKCB0ZCwgaSApIHtcbiAgICAgICAgICAgIHJldHVybiAkKCdpbnB1dCcsIHRkKS5wcm9wKCdjaGVja2VkJykgPyAnMScgOiAnMCc7XG4gICAgICAgIH0gKTtcbiAgICB9O1xuXG4gICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmluaXRpYWxpemUoKTtcbn0pO1xuIl19