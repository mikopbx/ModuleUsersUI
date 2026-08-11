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
    moduleUsersUIModifyAG.$cdrFilterToggles.checkbox({
      onChange: Form.dataChanged
    });
    moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
    moduleUsersUIModifyAG.$cdrFilterMode.checkbox({
      onChange: function onChange() {
        moduleUsersUIModifyAG.cbAfterChangeCDRFilterMode();
        Form.dataChanged();
      }
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
    // Check if any CDR-related checkbox is checked (not just the master checkbox)
    // This handles partial permissions (e.g., only view without delete)
    var $cdrCheckboxes = $("input.access-group-checkbox[data-controller='MikoPBX\\\\AdminCabinet\\\\Controllers\\\\CallDetailRecordsController']");
    var $extCdrCheckboxes = $("input.access-group-checkbox[data-module='ModuleExtendedCDRs']");
    var accessToCdr = false;
    $cdrCheckboxes.each(function () {
      if ($(this).parent('.checkbox').checkbox('is checked')) {
        accessToCdr = true;
        return false; // break the loop
      }
    });
    var accessToCdrExt = false;
    $extCdrCheckboxes.each(function () {
      if ($(this).parent('.checkbox').checkbox('is checked')) {
        accessToCdrExt = true;
        return false; // break the loop
      }
    });

    if (accessToCdr || accessToCdrExt) {
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
        var modulePath = module === 'AdminCabinet' ? '' : "".concat(module, "/");
        var url = moduleUsersUIModifyAG.convertCamelToDash("".concat(globalRootUrl).concat(modulePath).concat(controllerName, "/").concat(action));
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
    return str // Insert a hyphen between a lowercase letter and an uppercase letter
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert a hyphen between a digit and an uppercase letter
    .replace(/(\d)([A-Z])/g, '$1-$2') // Insert a hyphen between an uppercase letter or sequence and an uppercase letter followed by a lowercase letter
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Split sequences of two or more uppercase letters with hyphens
    .replace(/([A-Z]{2,})/g, function (match) {
      return match.split('').join('-');
    }) // Convert the entire string to lowercase
    .toLowerCase();
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
      language: SemanticLocalization.dataTableLocalisation,
      drawCallback: function drawCallback() {
        // Reinitialize Semantic UI checkboxes after DataTable redraw
        moduleUsersUIModifyAG.$cdrFilterUsersTable.find('div.cdr-filter-toggles').checkbox({
          onChange: Form.dataChanged
        });
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCJjZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSIsIiRjZHJGaWx0ZXJUb2dnbGVzIiwiJGNkckZpbHRlck1vZGUiLCIkZ3JvdXBSaWdodE1vZHVsZXNUYWJzIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJGb3JtIiwiZGF0YUNoYW5nZWQiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJkcm9wZG93biIsImdldEhvbWVQYWdlc0ZvclNlbGVjdCIsImNkckZpbHRlck1vZGUiLCJmb3JtIiwibmV3UGFnZUxlbmd0aCIsImNhbGN1bGF0ZVBhZ2VMZW5ndGgiLCJwYWdlIiwibGVuIiwiZHJhdyIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiJGNkckNoZWNrYm94ZXMiLCIkZXh0Q2RyQ2hlY2tib3hlcyIsImFjY2Vzc1RvQ2RyIiwiYWNjZXNzVG9DZHJFeHQiLCJvYmoiLCJtb2R1bGVUYWIiLCJsZW5ndGgiLCJ2YWx1ZVNlbGVjdGVkIiwiY3VycmVudEhvbWVQYWdlIiwic2VsZWN0ZWRSaWdodHMiLCJtb2R1bGUiLCJjb250cm9sbGVyTmFtZSIsImluZGV4T2YiLCJtb2R1bGVQYXRoIiwidXJsIiwiY29udmVydENhbWVsVG9EYXNoIiwibmFtZVRlbXBsYXRlcyIsInNvbWUiLCJuYW1lVGVtcGxhdGUiLCJ1bmRlZmluZWQiLCJwdXNoIiwic2VsZWN0ZWQiLCJmYWlsQmFja0hvbWVQYWdlIiwic3RyIiwicmVwbGFjZSIsIm1hdGNoIiwic3BsaXQiLCJqb2luIiwidG9Mb3dlckNhc2UiLCJjYkJlZm9yZVNlbmRGb3JtIiwic2V0dGluZ3MiLCJyZXN1bHQiLCJmb3JtVmFsdWVzIiwiZGF0YSIsImRlc2NyaXB0aW9uIiwiYXJyTWVtYmVycyIsIm1lbWJlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiYXJyR3JvdXBSaWdodHMiLCJjb250cm9sbGVyIiwibW9kdWxlSW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwiY29udHJvbGxlcnMiLCJtb2R1bGVDb250cm9sbGVycyIsImNvbnRyb2xsZXJJbmRleCIsImFjdGlvbnMiLCJhY2Nlc3NfZ3JvdXBfcmlnaHRzIiwiYXJyQ0RSRmlsdGVyIiwiY2RyRmlsdGVyIiwiZnVsbEFjY2VzcyIsInNlbGVjdGVkSG9tZVBhZ2UiLCJob21lUGFnZSIsInJlY29yZCIsIm9uVmlzaWJsZSIsIkRhdGFUYWJsZSIsImxlbmd0aENoYW5nZSIsInBhZ2luZyIsInBhZ2VMZW5ndGgiLCJzY3JvbGxDb2xsYXBzZSIsImNvbHVtbnMiLCJvcmRlcmFibGUiLCJzZWFyY2hhYmxlIiwib3JkZXJEYXRhVHlwZSIsIm9yZGVyIiwibGFuZ3VhZ2UiLCJTZW1hbnRpY0xvY2FsaXphdGlvbiIsImRhdGFUYWJsZUxvY2FsaXNhdGlvbiIsImRyYXdDYWxsYmFjayIsInJvd0hlaWdodCIsImZpcnN0Iiwib3V0ZXJIZWlnaHQiLCJ3aW5kb3dIZWlnaHQiLCJpbm5lckhlaWdodCIsImhlYWRlckZvb3RlckhlaWdodCIsIk1hdGgiLCJtYXgiLCJmbG9vciIsImNiQWZ0ZXJTZW5kRm9ybSIsImRvY3VtZW50IiwicmVhZHkiLCJmbiIsImRhdGFUYWJsZSIsImV4dCIsImNvbCIsImFwaSIsImNvbHVtbiIsIm5vZGVzIiwibWFwIiwidGQiLCJpIiwicHJvcCJdLCJtYXBwaW5ncyI6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LENBQW9CLFNBQXBCLElBQWlDLEdBQWpDLEdBQXVDLEdBQTlDO0FBQ0gsS0FGTSxDQUFQO0FBR0gsR0FMRDs7QUFPQWpNLEVBQUFBLHFCQUFxQixDQUFDMkIsVUFBdEI7QUFDSCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwsIGdsb2JhbFRyYW5zbGF0ZSwgRm9ybSwgRXh0ZW5zaW9ucywgRGF0YXRhYmxlICovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVSU1vZGlmeUFHID0ge1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBDaGVja2JveCBhbGxvd3MgZnVsbCBhY2Nlc3MgdG8gdGhlIHN5c3RlbS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZ1bGxBY2Nlc3NDaGVja2JveDogJCgnI2Z1bGwtYWNjZXNzLWdyb3VwJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgc2VsZWN0IHVzZXJzIGRyb3Bkb3duLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHNlbGVjdFVzZXJzRHJvcERvd246ICQoJ1tkYXRhLXRhYj1cInVzZXJzXCJdIC5zZWxlY3QtZXh0ZW5zaW9uLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbW9kdWxlIHN0YXR1cyB0b2dnbGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBob21lIHBhZ2UgZHJvcGRvd24gc2VsZWN0LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGhvbWVQYWdlRHJvcGRvd246ICQoJyNob21lLXBhZ2UtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBhY2Nlc3Mgc2V0dGluZ3MgdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkYWNjZXNzU2V0dGluZ3NUYWJNZW51OiAkKCcjYWNjZXNzLXNldHRpbmdzLXRhYi1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbWFpbiB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRtYWluVGFiTWVudTogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiY2RyLWZpbHRlclwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdyb3VwIHJpZ2h0cyB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZ3JvdXBSaWdodHNUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiZ3JvdXAtcmlnaHRzXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBVc2VycyB0YWJsZSBmb3IgQ0RSIGZpbHRlci5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJVc2Vyc1RhYmxlOiAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZScpLFxuXG4gICAgLyoqXG4gICAgICogVXNlcnMgZGF0YSB0YWJsZSBmb3IgQ0RSIGZpbHRlci5cbiAgICAgKiBAdHlwZSB7RGF0YXRhYmxlfVxuICAgICAqL1xuICAgIGNkckZpbHRlclVzZXJzRGF0YVRhYmxlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdG9nZ2xlcy5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUb2dnbGVzOiAkKCdkaXYuY2RyLWZpbHRlci10b2dnbGVzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlck1vZGU6ICQoJ2Rpdi5jZHItZmlsdGVyLXJhZGlvJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IHdpdGggYWxsIHRhYnMgaW4gYWNjZXNzLWdyb3VwLXJpZ2h0cyB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZ3JvdXBSaWdodE1vZHVsZXNUYWJzOiAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAudWkudGFiJyksXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGV4dGVuc2lvbi5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuQ2hlY2tCdXR0b246ICQoJy51bmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQnV0dG9uOiAkKCcuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICduYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cbiAgICAgICAgJCgnLmF2YXRhcicpLmVhY2goKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cignc3JjJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBgJHtnbG9iYWxSb290VXJsfWFzc2V0cy9pbWcvdW5rbm93blBlcnNvbi5qcGdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogRm9ybS5kYXRhQ2hhbmdlZFxuICAgICAgICB9KTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyTW9kZS5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICAgICAgICAgIEZvcm0uZGF0YUNoYW5nZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnYm9keScpLm9uKCdjbGljaycsICdkaXYuZGVsZXRlLXVzZXItcm93JywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5kZWxldGVNZW1iZXJGcm9tVGFibGUoZS50YXJnZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgdW5jaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiR1bkNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIENEUiBmaWx0ZXIgZGF0YXRhYmxlXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplQ0RSRmlsdGVyVGFibGUoKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZUZvcm0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIGZ1bGwgYWNjZXNzIHRvZ2dsZS5cbiAgICAgKi9cbiAgICBjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpe1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIGNoZWNrYm94ZXNcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCdjaGFuZ2UgdGFiJywnZ2VuZXJhbCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0c1RhYi5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bihtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCl7XG4gICAgICAgIGNvbnN0IGNkckZpbHRlck1vZGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnY2RyRmlsdGVyTW9kZScpO1xuICAgICAgICBpZiAoY2RyRmlsdGVyTW9kZT09PSdhbGwnKSB7XG4gICAgICAgICAgICAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZV93cmFwcGVyJykuaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2Nkci1maWx0ZXItdXNlcnMtdGFibGVfd3JhcHBlcicpLnNob3coKTtcbiAgICAgICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUpe1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BhZ2VMZW5ndGggPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2FsY3VsYXRlUGFnZUxlbmd0aCgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZS5wYWdlLmxlbihuZXdQYWdlTGVuZ3RoKS5kcmF3KGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBmb3IgYXNzaWduaW5nIGN1cnJlbnQgYWNjZXNzIGdyb3VwLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKSB7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duUGFyYW1zID0gRXh0ZW5zaW9ucy5nZXREcm9wZG93blNldHRpbmdzT25seUludGVybmFsV2l0aG91dEVtcHR5KCk7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLmFjdGlvbiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyVXNlcnNTZWxlY3Q7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLnRlbXBsYXRlcyA9IHsgbWVudTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUgfTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzZWxlY3RVc2Vyc0Ryb3BEb3duLmRyb3Bkb3duKGRyb3Bkb3duUGFyYW1zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9taXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBtZW51IHZpc3VhbGl6YXRpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZmllbGRzIC0gVGhlIGZpZWxkcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgSFRNTCBzdHJpbmcgZm9yIHRoZSBkcm9wZG93biBtZW51LlxuICAgICAqL1xuICAgIGN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUocmVzcG9uc2UsIGZpZWxkcykge1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSByZXNwb25zZVtmaWVsZHMudmFsdWVzXSB8fCB7fTtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgbGV0IG9sZFR5cGUgPSAnJztcbiAgICAgICAgJC5lYWNoKHZhbHVlcywgKGluZGV4LCBvcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb24udHlwZSAhPT0gb2xkVHlwZSkge1xuICAgICAgICAgICAgICAgIG9sZFR5cGUgPSBvcHRpb24udHlwZTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiZGl2aWRlclwiPjwvZGl2Pic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxpIGNsYXNzPVwidGFncyBpY29uXCI+PC9pPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBvcHRpb24udHlwZUxvY2FsaXplZDtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWF5YmVUZXh0ID0gKG9wdGlvbltmaWVsZHMudGV4dF0pID8gYGRhdGEtdGV4dD1cIiR7b3B0aW9uW2ZpZWxkcy50ZXh0XX1cImAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IG1heWJlRGlzYWJsZWQgPSAoJChgI2V4dC0ke29wdGlvbltmaWVsZHMudmFsdWVdfWApLmhhc0NsYXNzKCdzZWxlY3RlZC1tZW1iZXInKSkgPyAnZGlzYWJsZWQgJyA6ICcnO1xuICAgICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz1cIiR7bWF5YmVEaXNhYmxlZH1pdGVtXCIgZGF0YS12YWx1ZT1cIiR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19XCIke21heWJlVGV4dH0+YDtcbiAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uW2ZpZWxkcy5uYW1lXTtcbiAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VsZWN0aW5nIGEgdXNlciBmb3IgdGhlIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVGhlIHNlbGVjdGVkIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIFRoZSBqUXVlcnkgZWxlbWVudC5cbiAgICAgKi9cbiAgICBjYkFmdGVyVXNlcnNTZWxlY3QodGV4dCwgdmFsdWUsICRlbGVtZW50KSB7XG4gICAgICAgICQoYCNleHQtJHt2YWx1ZX1gKVxuICAgICAgICAgICAgLmNsb3Nlc3QoJ3RyJylcbiAgICAgICAgICAgIC5hZGRDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5zaG93KCk7XG4gICAgICAgICQoJGVsZW1lbnQpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSBncm91cCBtZW1iZXIgZnJvbSB0aGUgdGFibGUuXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldCBlbGVtZW50LlxuICAgICAqL1xuICAgIGRlbGV0ZU1lbWJlckZyb21UYWJsZSh0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgaWQgPSAkKHRhcmdldCkuY2xvc2VzdCgnZGl2JykuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAkKGAjJHtpZH1gKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLmhpZGUoKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgcmlnaHRzIGNoZWNrYm94ZXMuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMoKSB7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5tYXN0ZXIuY2hlY2tib3gnKVxuICAgICAgICAgICAgLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvbkNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgnY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIHVuY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25VbmNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24obW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5jaGlsZC5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgb24gbG9hZCB0byBzZXQgcGFyZW50IHZhbHVlXG4gICAgICAgICAgICAgICAgZmlyZU9uSW5pdCA6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHBhcmVudCBzdGF0ZSBvbiBlYWNoIGNoaWxkIGNoZWNrYm94IGNoYW5nZVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkbGlzdEdyb3VwICAgICAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5saXN0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3ggPSAkbGlzdEdyb3VwLmNsb3Nlc3QoJy5pdGVtJykuY2hpbGRyZW4oJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94ICAgICAgID0gJGxpc3RHcm91cC5maW5kKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgICAgICA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgICAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGFsbCBvdGhlciBzaWJsaW5ncyBhcmUgY2hlY2tlZCBvciB1bmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHBhcmVudCBjaGVja2JveCBzdGF0ZSwgYnV0IGRvbid0IHRyaWdnZXIgaXRzIG9uQ2hhbmdlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmKGFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGFsbFVuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgdW5jaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBpbmRldGVybWluYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZ3JvdXAgcmlnaHQuXG4gICAgICovXG4gICAgY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKXtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IENEUi1yZWxhdGVkIGNoZWNrYm94IGlzIGNoZWNrZWQgKG5vdCBqdXN0IHRoZSBtYXN0ZXIgY2hlY2tib3gpXG4gICAgICAgIC8vIFRoaXMgaGFuZGxlcyBwYXJ0aWFsIHBlcm1pc3Npb25zIChlLmcuLCBvbmx5IHZpZXcgd2l0aG91dCBkZWxldGUpXG4gICAgICAgIGNvbnN0ICRjZHJDaGVja2JveGVzID0gJChcImlucHV0LmFjY2Vzcy1ncm91cC1jaGVja2JveFtkYXRhLWNvbnRyb2xsZXI9J01pa29QQlhcXFxcXFxcXEFkbWluQ2FiaW5ldFxcXFxcXFxcQ29udHJvbGxlcnNcXFxcXFxcXENhbGxEZXRhaWxSZWNvcmRzQ29udHJvbGxlciddXCIpO1xuICAgICAgICBjb25zdCAkZXh0Q2RyQ2hlY2tib3hlcyA9ICQoXCJpbnB1dC5hY2Nlc3MtZ3JvdXAtY2hlY2tib3hbZGF0YS1tb2R1bGU9J01vZHVsZUV4dGVuZGVkQ0RScyddXCIpO1xuXG4gICAgICAgIGxldCBhY2Nlc3NUb0NkciA9IGZhbHNlO1xuICAgICAgICAkY2RyQ2hlY2tib3hlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYWNjZXNzVG9DZHIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gYnJlYWsgdGhlIGxvb3BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGFjY2Vzc1RvQ2RyRXh0ID0gZmFsc2U7XG4gICAgICAgICRleHRDZHJDaGVja2JveGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5wYXJlbnQoJy5jaGVja2JveCcpLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBhY2Nlc3NUb0NkckV4dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBicmVhayB0aGUgbG9vcFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYWNjZXNzVG9DZHIgfHwgYWNjZXNzVG9DZHJFeHQpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyBoaWRlIGNoZWNrIGljb24gY2xvc2UgdG8gbW9kdWxlIG5hbWVcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0TW9kdWxlc1RhYnMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlVGFiID0gJChvYmopLmF0dHIoJ2RhdGEtdGFiJyk7XG4gICAgICAgICAgICBpZiAoJChgZGl2W2RhdGEtdGFiPVwiJHttb2R1bGVUYWJ9XCJdICAuYWNjZXNzLWdyb3VwLWNoZWNrYm94YCkucGFyZW50KCcuY2hlY2tlZCcpLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAkKGBhW2RhdGEtdGFiPScke21vZHVsZVRhYn0nXSBpLmljb25gKS5hZGRDbGFzcygnYW5nbGUgcmlnaHQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJChgYVtkYXRhLXRhYj0nJHttb2R1bGVUYWJ9J10gaS5pY29uYCkucmVtb3ZlQ2xhc3MoJ2FuZ2xlIHJpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBzdGF0dXMgb2YgYnV0dG9ucyB3aGVuIHRoZSBtb2R1bGUgc3RhdHVzIGNoYW5nZXMuXG4gICAgICovXG4gICAgY2hlY2tTdGF0dXNUb2dnbGUoKSB7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHN0YXR1c1RvZ2dsZS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXBhcmVzIGxpc3Qgb2YgcG9zc2libGUgaG9tZSBwYWdlcyB0byBzZWxlY3QgZnJvbVxuICAgICAqL1xuICAgIGdldEhvbWVQYWdlc0ZvclNlbGVjdCgpe1xuICAgICAgICBsZXQgdmFsdWVTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBjdXJyZW50SG9tZVBhZ2UgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnaG9tZVBhZ2UnKTtcbiAgICAgICAgbGV0IHNlbGVjdGVkUmlnaHRzID0gJCgnLmNoZWNrZWQgLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgIHNlbGVjdGVkUmlnaHRzID0gJCgnLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgICBzZWxlY3RlZFJpZ2h0cy5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXJOYW1lID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlci1uYW1lJyk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sbGVyTmFtZS5pbmRleE9mKCdwYnhjb3JlJykgPT09IC0xICYmIGFjdGlvbi5pbmRleE9mKCdpbmRleCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGVQYXRoID0gbW9kdWxlID09PSAnQWRtaW5DYWJpbmV0JyA/ICcnIDogYCR7bW9kdWxlfS9gO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jb252ZXJ0Q2FtZWxUb0Rhc2goXG4gICAgICAgICAgICAgICAgICAgIGAke2dsb2JhbFJvb3RVcmx9JHttb2R1bGVQYXRofSR7Y29udHJvbGxlck5hbWV9LyR7YWN0aW9ufWBcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZVRlbXBsYXRlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgYG1vXyR7bW9kdWxlfWAsXG4gICAgICAgICAgICAgICAgICAgIGBtbV8ke2NvbnRyb2xsZXJOYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIGBCcmVhZGNydW1iJHttb2R1bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgYG1vZHVsZV91c2Vyc3VpXyR7bW9kdWxlfV8ke2NvbnRyb2xsZXJOYW1lfV8ke2FjdGlvbn1gXG4gICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgbmFtZVRlbXBsYXRlcy5zb21lKChuYW1lVGVtcGxhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g0J/QvtC/0YvRgtC60LAg0L3QsNC50YLQuCDQv9C10YDQtdCy0L7QtFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gZ2xvYmFsVHJhbnNsYXRlW25hbWVUZW1wbGF0ZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g0JXRgdC70Lgg0L/QtdGA0LXQstC+0LQg0L3QsNC50LTQtdC9ICjQvtC9INC90LUgdW5kZWZpbmVkKSwg0L/RgNC10LrRgNCw0YnQsNC10Lwg0L/QtdGA0LXQsdC+0YBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgIT09IHVuZGVmaW5lZCAmJiBuYW1lICE9PSBuYW1lVGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8g0J7RgdGC0LDQvdCw0LLQu9C40LLQsNC10Lwg0L/QtdGA0LXQsdC+0YBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vINCV0YHQu9C4INC/0LXRgNC10LLQvtC0INC90LUg0L3QsNC50LTQtdC9LCDQv9GA0L7QtNC+0LvQttCw0LXQvCDQv9C+0LjRgdC6XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lVGVtcGxhdGU7ICAvLyDQmNGB0L/QvtC70YzQt9GD0LXQvCDRiNCw0LHQu9C+0L0g0LrQsNC6INC30L3QsNGH0LXQvdC40LUg0L/QviDRg9C80L7Qu9GH0LDQvdC40Y5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SG9tZVBhZ2UgPT09IHVybCl7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IG5hbWUsIHZhbHVlOiB1cmwsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBuYW1lLCB2YWx1ZTogdXJsIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICBjb25zdCBmYWlsQmFja0hvbWVQYWdlID0gIGAke2dsb2JhbFJvb3RVcmx9c2Vzc2lvbi9lbmRgO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogZmFpbEJhY2tIb21lUGFnZSwgdmFsdWU6IGZhaWxCYWNrSG9tZVBhZ2UsIHNlbGVjdGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgdmFsdWVTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWx1ZVNlbGVjdGVkKXtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlczp2YWx1ZXMsXG4gICAgICAgICAgICBvbkNoYW5nZTogRm9ybS5kYXRhQ2hhbmdlZFxuICAgICAgICB9O1xuXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhIHN0cmluZyBmcm9tIGNhbWVsIGNhc2UgdG8gZGFzaCBjYXNlLlxuICAgICAqIEBwYXJhbSBzdHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBjb252ZXJ0Q2FtZWxUb0Rhc2goc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHJcbiAgICAgICAgICAgIC8vIEluc2VydCBhIGh5cGhlbiBiZXR3ZWVuIGEgbG93ZXJjYXNlIGxldHRlciBhbmQgYW4gdXBwZXJjYXNlIGxldHRlclxuICAgICAgICAgICAgLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpXG4gICAgICAgICAgICAvLyBJbnNlcnQgYSBoeXBoZW4gYmV0d2VlbiBhIGRpZ2l0IGFuZCBhbiB1cHBlcmNhc2UgbGV0dGVyXG4gICAgICAgICAgICAucmVwbGFjZSgvKFxcZCkoW0EtWl0pL2csICckMS0kMicpXG4gICAgICAgICAgICAvLyBJbnNlcnQgYSBoeXBoZW4gYmV0d2VlbiBhbiB1cHBlcmNhc2UgbGV0dGVyIG9yIHNlcXVlbmNlIGFuZCBhbiB1cHBlcmNhc2UgbGV0dGVyIGZvbGxvd2VkIGJ5IGEgbG93ZXJjYXNlIGxldHRlclxuICAgICAgICAgICAgLnJlcGxhY2UoLyhbQS1aXSspKFtBLVpdW2Etel0pL2csICckMS0kMicpXG4gICAgICAgICAgICAvLyBTcGxpdCBzZXF1ZW5jZXMgb2YgdHdvIG9yIG1vcmUgdXBwZXJjYXNlIGxldHRlcnMgd2l0aCBoeXBoZW5zXG4gICAgICAgICAgICAucmVwbGFjZSgvKFtBLVpdezIsfSkvZywgKG1hdGNoKSA9PiBtYXRjaC5zcGxpdCgnJykuam9pbignLScpKVxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgZW50aXJlIHN0cmluZyB0byBsb3dlcmNhc2VcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYmVmb3JlIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIC0gVGhlIGZvcm0gc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSBUaGUgbW9kaWZpZWQgZm9ybSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHNldHRpbmdzO1xuICAgICAgICBjb25zdCBmb3JtVmFsdWVzID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcbiAgICAgICAgcmVzdWx0LmRhdGEgPSB7XG4gICAgICAgICAgICBpZDogZm9ybVZhbHVlcy5pZCxcbiAgICAgICAgICAgIG5hbWU6IGZvcm1WYWx1ZXMubmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBmb3JtVmFsdWVzLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgY2RyRmlsdGVyTW9kZTogIGZvcm1WYWx1ZXMuY2RyRmlsdGVyTW9kZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gR3JvdXAgbWVtYmVyc1xuICAgICAgICBjb25zdCBhcnJNZW1iZXJzID0gW107XG4gICAgICAgICQoJ3RyLnNlbGVjdGVkLW1lbWJlcicpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSB7XG4gICAgICAgICAgICAgICAgYXJyTWVtYmVycy5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5tZW1iZXJzID0gSlNPTi5zdHJpbmdpZnkoYXJyTWVtYmVycyk7XG5cbiAgICAgICAgLy8gR3JvdXAgUmlnaHRzXG4gICAgICAgIGNvbnN0IGFyckdyb3VwUmlnaHRzID0gW107XG4gICAgICAgICQoJ2lucHV0LmFjY2Vzcy1ncm91cC1jaGVja2JveCcpLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gJChvYmopLmF0dHIoJ2RhdGEtbW9kdWxlJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9ICQob2JqKS5hdHRyKCdkYXRhLWNvbnRyb2xsZXInKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIG1vZHVsZSBpbiBhcnJHcm91cFJpZ2h0cyBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBsZXQgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLm1vZHVsZSA9PT0gbW9kdWxlKTtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyckdyb3VwUmlnaHRzLnB1c2goeyBtb2R1bGUsIGNvbnRyb2xsZXJzOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlSW5kZXggPSBhcnJHcm91cFJpZ2h0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvbnRyb2xsZXIgaW4gdGhlIG1vZHVsZSBvciBjcmVhdGUgYSBuZXcgZW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGVDb250cm9sbGVycyA9IGFyckdyb3VwUmlnaHRzW21vZHVsZUluZGV4XS5jb250cm9sbGVycztcbiAgICAgICAgICAgICAgICBsZXQgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5jb250cm9sbGVyID09PSBjb250cm9sbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbGxlckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVycy5wdXNoKHsgY29udHJvbGxlciwgYWN0aW9uczogW10gfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJJbmRleCA9IG1vZHVsZUNvbnRyb2xsZXJzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHVzaCB0aGUgYWN0aW9uIGludG8gdGhlIGNvbnRyb2xsZXIncyBhY3Rpb25zIGFycmF5XG4gICAgICAgICAgICAgICAgbW9kdWxlQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XS5hY3Rpb25zLnB1c2goYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LmRhdGEuYWNjZXNzX2dyb3VwX3JpZ2h0cyA9IEpTT04uc3RyaW5naWZ5KGFyckdyb3VwUmlnaHRzKTsgXG5cbiAgICAgICAgLy8gQ0RSIEZpbHRlclxuICAgICAgICBjb25zdCBhcnJDRFJGaWx0ZXIgPSBbXTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUb2dnbGVzLmVhY2goKGluZGV4LCBvYmopID0+IHtcbiAgICAgICAgICAgIGlmICgkKG9iaikuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgIGFyckNEUkZpbHRlci5wdXNoKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0LmRhdGEuY2RyRmlsdGVyID0gSlNPTi5zdHJpbmdpZnkoYXJyQ0RSRmlsdGVyKTtcblxuICAgICAgICAvLyBGdWxsIGFjY2VzcyBncm91cCB0b2dnbGVcbiAgICAgICAgaWYgKG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZnVsbEFjY2Vzc0NoZWNrYm94LmNoZWNrYm94KCdpcyBjaGVja2VkJykpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcxJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmZ1bGxBY2Nlc3MgPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIb21lIFBhZ2UgdmFsdWVcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRIb21lUGFnZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignZ2V0IHZhbHVlJyk7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duUGFyYW1zID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ3NldHVwIG1lbnUnLCBkcm9wZG93blBhcmFtcyk7XG4gICAgICAgIGxldCBob21lUGFnZSA9ICcnO1xuICAgICAgICAkLmVhY2goZHJvcGRvd25QYXJhbXMudmFsdWVzLCBmdW5jdGlvbihpbmRleCwgcmVjb3JkKSB7XG4gICAgICAgICAgICBpZiAocmVjb3JkLnZhbHVlID09PSBzZWxlY3RlZEhvbWVQYWdlKSB7XG4gICAgICAgICAgICAgICAgaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGhvbWVQYWdlPT09Jycpe1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBkcm9wZG93blBhcmFtcy52YWx1ZXNbMF0udmFsdWU7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24oJ3NldCBzZWxlY3RlZCcsIHJlc3VsdC5kYXRhLmhvbWVQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLmhvbWVQYWdlID0gc2VsZWN0ZWRIb21lUGFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdXNlcnMgdGFibGUgRGF0YVRhYmxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSgpIHtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJG1haW5UYWJNZW51LnRhYih7XG4gICAgICAgICAgICBvblZpc2libGUoKXtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5kYXRhKCd0YWInKT09PSdjZHItZmlsdGVyJyAmJiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUhPT1udWxsKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3UGFnZUxlbmd0aCA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYWxjdWxhdGVQYWdlTGVuZ3RoKCk7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZS5wYWdlLmxlbihuZXdQYWdlTGVuZ3RoKS5kcmF3KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVXNlcnNUYWJsZS5EYXRhVGFibGUoe1xuICAgICAgICAgICAgLy8gZGVzdHJveTogdHJ1ZSxcbiAgICAgICAgICAgIGxlbmd0aENoYW5nZTogZmFsc2UsXG4gICAgICAgICAgICBwYWdpbmc6IHRydWUsXG4gICAgICAgICAgICBwYWdlTGVuZ3RoOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2FsY3VsYXRlUGFnZUxlbmd0aCgpLFxuICAgICAgICAgICAgc2Nyb2xsQ29sbGFwc2U6IHRydWUsXG4gICAgICAgICAgICBjb2x1bW5zOiBbXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2tCb3hcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogZmFsc2UsICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgICAgICBvcmRlckRhdGFUeXBlOiAnZG9tLWNoZWNrYm94JyAgLy8gVXNlIHRoZSBjdXN0b20gc29ydGluZ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gVXNlcm5hbWVcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBFeHRlbnNpb25cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBNb2JpbGVcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogdHJ1ZSAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIEVtYWlsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmRlcmFibGU6IHRydWUsICAvLyBUaGlzIGNvbHVtbiBpcyBvcmRlcmFibGVcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogdHJ1ZSAgLy8gVGhpcyBjb2x1bW4gaXMgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgb3JkZXI6IFswLCAnZGVzYyddLFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IFNlbWFudGljTG9jYWxpemF0aW9uLmRhdGFUYWJsZUxvY2FsaXNhdGlvbixcbiAgICAgICAgICAgIGRyYXdDYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFJlaW5pdGlhbGl6ZSBTZW1hbnRpYyBVSSBjaGVja2JveGVzIGFmdGVyIERhdGFUYWJsZSByZWRyYXdcbiAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclVzZXJzVGFibGUuZmluZCgnZGl2LmNkci1maWx0ZXItdG9nZ2xlcycpLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U6IEZvcm0uZGF0YUNoYW5nZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjYWxjdWxhdGVQYWdlTGVuZ3RoKCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgcm93IGhlaWdodFxuICAgICAgICBsZXQgcm93SGVpZ2h0ID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJVc2Vyc1RhYmxlLmZpbmQoJ3RyJykuZmlyc3QoKS5vdXRlckhlaWdodCgpO1xuICAgICAgICAvLyBDYWxjdWxhdGUgd2luZG93IGhlaWdodCBhbmQgYXZhaWxhYmxlIHNwYWNlIGZvciB0YWJsZVxuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGhlYWRlckZvb3RlckhlaWdodCA9IDU4MDsgLy8gRXN0aW1hdGUgaGVpZ2h0IGZvciBoZWFkZXIsIGZvb3RlciwgYW5kIG90aGVyIGVsZW1lbnRzXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIG5ldyBwYWdlIGxlbmd0aFxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoTWF0aC5mbG9vcigod2luZG93SGVpZ2h0IC0gaGVhZGVyRm9vdGVySGVpZ2h0KSAvIHJvd0hlaWdodCksIDEwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGFmdGVyIHNlbmRpbmcgdGhlIGZvcm0uXG4gICAgICovXG4gICAgY2JBZnRlclNlbmRGb3JtKCkge1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBmb3JtLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVGb3JtKCkge1xuICAgICAgICBGb3JtLiRmb3JtT2JqID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmb3JtT2JqO1xuICAgICAgICBGb3JtLnVybCA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS9hY2Nlc3MtZ3JvdXBzL3NhdmVgO1xuICAgICAgICBGb3JtLnZhbGlkYXRlUnVsZXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcudmFsaWRhdGVSdWxlcztcbiAgICAgICAgRm9ybS5jYkJlZm9yZVNlbmRGb3JtID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQmVmb3JlU2VuZEZvcm07XG4gICAgICAgIEZvcm0uY2JBZnRlclNlbmRGb3JtID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5pbml0aWFsaXplKCk7XG4gICAgfSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICAvLyBDdXN0b20gc29ydGluZyBmb3IgY2hlY2tib3ggc3RhdGVzXG4gICAgJC5mbi5kYXRhVGFibGUuZXh0Lm9yZGVyWydkb20tY2hlY2tib3gnXSA9IGZ1bmN0aW9uICAoIHNldHRpbmdzLCBjb2wgKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpKCkuY29sdW1uKCBjb2wsIHtvcmRlcjonaW5kZXgnfSApLm5vZGVzKCkubWFwKCBmdW5jdGlvbiAoIHRkLCBpICkge1xuICAgICAgICAgICAgcmV0dXJuICQoJ2lucHV0JywgdGQpLnByb3AoJ2NoZWNrZWQnKSA/ICcxJyA6ICcwJztcbiAgICAgICAgfSApO1xuICAgIH07XG5cbiAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZSgpO1xufSk7XG4iXX0=