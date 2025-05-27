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
    var extCdrIndexCheckboxId = $("input[data-module='ModuleExtendedCDRs'][data-action='index']").attr('id');
    var accessToCdr = moduleUsersUIModifyAG.$formObj.form('get value', 'MikoPBX\\AdminCabinet\\Controllers\\CallDetailRecordsController_main');
    var accessToCdrExt = moduleUsersUIModifyAG.$formObj.form('get value', extCdrIndexCheckboxId);

    if (accessToCdr === 'on' || accessToCdrExt === 'on') {
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktbW9kaWZ5LWFnLmpzIl0sIm5hbWVzIjpbIm1vZHVsZVVzZXJzVUlNb2RpZnlBRyIsIiRmb3JtT2JqIiwiJCIsIiRmdWxsQWNjZXNzQ2hlY2tib3giLCIkc2VsZWN0VXNlcnNEcm9wRG93biIsIiRzdGF0dXNUb2dnbGUiLCIkaG9tZVBhZ2VEcm9wZG93biIsIiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUiLCIkbWFpblRhYk1lbnUiLCIkY2RyRmlsdGVyVGFiIiwiJGdyb3VwUmlnaHRzVGFiIiwiJGNkckZpbHRlclVzZXJzVGFibGUiLCJjZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSIsIiRjZHJGaWx0ZXJUb2dnbGVzIiwiJGNkckZpbHRlck1vZGUiLCIkZ3JvdXBSaWdodE1vZHVsZXNUYWJzIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiR1bkNoZWNrQnV0dG9uIiwiJGNoZWNrQnV0dG9uIiwidmFsaWRhdGVSdWxlcyIsIm5hbWUiLCJpZGVudGlmaWVyIiwicnVsZXMiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwibW9kdWxlX3VzZXJzdWlfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImluaXRpYWxpemUiLCJjaGVja1N0YXR1c1RvZ2dsZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJlYWNoIiwiYXR0ciIsImdsb2JhbFJvb3RVcmwiLCJ0YWIiLCJpbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duIiwiaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMiLCJjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSIsImNoZWNrYm94Iiwib25DaGFuZ2UiLCJjYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZGVsZXRlTWVtYmVyRnJvbVRhYmxlIiwidGFyZ2V0IiwicGFyZW50IiwiZmluZCIsImluaXRpYWxpemVDRFJGaWx0ZXJUYWJsZSIsImluaXRpYWxpemVGb3JtIiwiaGlkZSIsInNob3ciLCJkcm9wZG93biIsImdldEhvbWVQYWdlc0ZvclNlbGVjdCIsImNkckZpbHRlck1vZGUiLCJmb3JtIiwibmV3UGFnZUxlbmd0aCIsImNhbGN1bGF0ZVBhZ2VMZW5ndGgiLCJwYWdlIiwibGVuIiwiZHJhdyIsImRyb3Bkb3duUGFyYW1zIiwiRXh0ZW5zaW9ucyIsImdldERyb3Bkb3duU2V0dGluZ3NPbmx5SW50ZXJuYWxXaXRob3V0RW1wdHkiLCJhY3Rpb24iLCJjYkFmdGVyVXNlcnNTZWxlY3QiLCJ0ZW1wbGF0ZXMiLCJtZW51IiwiY3VzdG9tTWVtYmVyc0Ryb3Bkb3duTWVudSIsInJlc3BvbnNlIiwiZmllbGRzIiwidmFsdWVzIiwiaHRtbCIsIm9sZFR5cGUiLCJpbmRleCIsIm9wdGlvbiIsInR5cGVMb2NhbGl6ZWQiLCJtYXliZVRleHQiLCJ0ZXh0IiwibWF5YmVEaXNhYmxlZCIsInZhbHVlIiwiaGFzQ2xhc3MiLCIkZWxlbWVudCIsImNsb3Nlc3QiLCJhZGRDbGFzcyIsIkZvcm0iLCJkYXRhQ2hhbmdlZCIsImlkIiwicmVtb3ZlQ2xhc3MiLCJvbkNoZWNrZWQiLCIkY2hpbGRDaGVja2JveCIsInNpYmxpbmdzIiwib25VbmNoZWNrZWQiLCJmaXJlT25Jbml0IiwiJGxpc3RHcm91cCIsIiRwYXJlbnRDaGVja2JveCIsImNoaWxkcmVuIiwiJGNoZWNrYm94IiwiYWxsQ2hlY2tlZCIsImFsbFVuY2hlY2tlZCIsImNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0IiwiZXh0Q2RySW5kZXhDaGVja2JveElkIiwiYWNjZXNzVG9DZHIiLCJhY2Nlc3NUb0NkckV4dCIsIm9iaiIsIm1vZHVsZVRhYiIsImxlbmd0aCIsInZhbHVlU2VsZWN0ZWQiLCJjdXJyZW50SG9tZVBhZ2UiLCJzZWxlY3RlZFJpZ2h0cyIsIm1vZHVsZSIsImNvbnRyb2xsZXJOYW1lIiwiaW5kZXhPZiIsInVybCIsImNvbnZlcnRDYW1lbFRvRGFzaCIsIm5hbWVUZW1wbGF0ZXMiLCJzb21lIiwibmFtZVRlbXBsYXRlIiwidW5kZWZpbmVkIiwicHVzaCIsInNlbGVjdGVkIiwiZmFpbEJhY2tIb21lUGFnZSIsInN0ciIsInJlcGxhY2UiLCJtYXRjaCIsInNwbGl0Iiwiam9pbiIsInRvTG93ZXJDYXNlIiwiY2JCZWZvcmVTZW5kRm9ybSIsInNldHRpbmdzIiwicmVzdWx0IiwiZm9ybVZhbHVlcyIsImRhdGEiLCJkZXNjcmlwdGlvbiIsImFyck1lbWJlcnMiLCJtZW1iZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsImFyckdyb3VwUmlnaHRzIiwiY29udHJvbGxlciIsIm1vZHVsZUluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsImNvbnRyb2xsZXJzIiwibW9kdWxlQ29udHJvbGxlcnMiLCJjb250cm9sbGVySW5kZXgiLCJhY3Rpb25zIiwiYWNjZXNzX2dyb3VwX3JpZ2h0cyIsImFyckNEUkZpbHRlciIsImNkckZpbHRlciIsImZ1bGxBY2Nlc3MiLCJzZWxlY3RlZEhvbWVQYWdlIiwiaG9tZVBhZ2UiLCJyZWNvcmQiLCJvblZpc2libGUiLCJEYXRhVGFibGUiLCJsZW5ndGhDaGFuZ2UiLCJwYWdpbmciLCJwYWdlTGVuZ3RoIiwic2Nyb2xsQ29sbGFwc2UiLCJjb2x1bW5zIiwib3JkZXJhYmxlIiwic2VhcmNoYWJsZSIsIm9yZGVyRGF0YVR5cGUiLCJvcmRlciIsImxhbmd1YWdlIiwiU2VtYW50aWNMb2NhbGl6YXRpb24iLCJkYXRhVGFibGVMb2NhbGlzYXRpb24iLCJyb3dIZWlnaHQiLCJmaXJzdCIsIm91dGVySGVpZ2h0Iiwid2luZG93SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWFkZXJGb290ZXJIZWlnaHQiLCJNYXRoIiwibWF4IiwiZmxvb3IiLCJjYkFmdGVyU2VuZEZvcm0iLCJkb2N1bWVudCIsInJlYWR5IiwiZm4iLCJkYXRhVGFibGUiLCJleHQiLCJjb2wiLCJhcGkiLCJjb2x1bW4iLCJub2RlcyIsIm1hcCIsInRkIiwiaSIsInByb3AiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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RUFDM0M7QUFDSSxXQUFPLEtBQUtDLEdBQUwsR0FBV0MsTUFBWCxDQUFtQkYsR0FBbkIsRUFBd0I7QUFBQ25CLE1BQUFBLEtBQUssRUFBQztBQUFQLEtBQXhCLEVBQTBDc0IsS0FBMUMsR0FBa0RDLEdBQWxELENBQXVELFVBQVdDLEVBQVgsRUFBZUMsQ0FBZixFQUFtQjtBQUM3RSxhQUFPM0wsQ0FBQyxDQUFDLE9BQUQsRUFBVTBMLEVBQVYsQ0FBRCxDQUFlRSxJQUFmLENBQW9CLFNBQXBCLElBQWlDLEdBQWpDLEdBQXVDLEdBQTlDO0FBQ0gsS0FGTSxDQUFQO0FBR0gsR0FMRDs7QUFPQTlMLEVBQUFBLHFCQUFxQixDQUFDMkIsVUFBdEI7QUFDSCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwsIGdsb2JhbFRyYW5zbGF0ZSwgRm9ybSwgRXh0ZW5zaW9ucywgRGF0YXRhYmxlICovXG5cblxuY29uc3QgbW9kdWxlVXNlcnNVSU1vZGlmeUFHID0ge1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGZvcm0uXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZm9ybU9iajogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtJyksXG5cbiAgICAvKipcbiAgICAgKiBDaGVja2JveCBhbGxvd3MgZnVsbCBhY2Nlc3MgdG8gdGhlIHN5c3RlbS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgJGZ1bGxBY2Nlc3NDaGVja2JveDogJCgnI2Z1bGwtYWNjZXNzLWdyb3VwJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgc2VsZWN0IHVzZXJzIGRyb3Bkb3duLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHNlbGVjdFVzZXJzRHJvcERvd246ICQoJ1tkYXRhLXRhYj1cInVzZXJzXCJdIC5zZWxlY3QtZXh0ZW5zaW9uLWZpZWxkJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbW9kdWxlIHN0YXR1cyB0b2dnbGUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBob21lIHBhZ2UgZHJvcGRvd24gc2VsZWN0LlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGhvbWVQYWdlRHJvcGRvd246ICQoJyNob21lLXBhZ2UtZHJvcGRvd24nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBhY2Nlc3Mgc2V0dGluZ3MgdGFiIG1lbnUuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkYWNjZXNzU2V0dGluZ3NUYWJNZW51OiAkKCcjYWNjZXNzLXNldHRpbmdzLXRhYi1tZW51IC5pdGVtJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgbWFpbiB0YWIgbWVudS5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRtYWluVGFiTWVudTogJCgnI21vZHVsZS1hY2Nlc3MtZ3JvdXAtbW9kaWZ5LW1lbnUgLml0ZW0nKSxcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBDRFIgZmlsdGVyIHRhYi5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiY2RyLWZpbHRlclwiXScpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIGdyb3VwIHJpZ2h0cyB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZ3JvdXBSaWdodHNUYWI6ICQoJyNtb2R1bGUtYWNjZXNzLWdyb3VwLW1vZGlmeS1tZW51IC5pdGVtW2RhdGEtdGFiPVwiZ3JvdXAtcmlnaHRzXCJdJyksXG5cbiAgICAvKipcbiAgICAgKiBVc2VycyB0YWJsZSBmb3IgQ0RSIGZpbHRlci5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJVc2Vyc1RhYmxlOiAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZScpLFxuXG4gICAgLyoqXG4gICAgICogVXNlcnMgZGF0YSB0YWJsZSBmb3IgQ0RSIGZpbHRlci5cbiAgICAgKiBAdHlwZSB7RGF0YXRhYmxlfVxuICAgICAqL1xuICAgIGNkckZpbHRlclVzZXJzRGF0YVRhYmxlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIENEUiBmaWx0ZXIgdG9nZ2xlcy5cbiAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAqL1xuICAgICRjZHJGaWx0ZXJUb2dnbGVzOiAkKCdkaXYuY2RyLWZpbHRlci10b2dnbGVzJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IGZvciB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNkckZpbHRlck1vZGU6ICQoJ2Rpdi5jZHItZmlsdGVyLXJhZGlvJyksXG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgb2JqZWN0IHdpdGggYWxsIHRhYnMgaW4gYWNjZXNzLWdyb3VwLXJpZ2h0cyB0YWIuXG4gICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgKi9cbiAgICAkZ3JvdXBSaWdodE1vZHVsZXNUYWJzOiAkKCcjYWNjZXNzLWdyb3VwLXJpZ2h0cyAudWkudGFiJyksXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGV4dGVuc2lvbi5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJHVuQ2hlY2tCdXR0b246ICQoJy51bmNoZWNrLmJ1dHRvbicpLFxuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IG9iamVjdCBmb3IgdGhlIHVuY2hlY2sgYnV0dG9uLlxuICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICovXG4gICAgJGNoZWNrQnV0dG9uOiAkKCcuY2hlY2suYnV0dG9uJyksXG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0aW9uIHJ1bGVzIGZvciB0aGUgZm9ybSBmaWVsZHMuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVJ1bGVzOiB7XG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICduYW1lJyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZW1wdHknLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfdXNlcnN1aV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbW9kdWxlLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cbiAgICAgICAgJCgnLmF2YXRhcicpLmVhY2goKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuYXR0cignc3JjJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCBgJHtnbG9iYWxSb290VXJsfWFzc2V0cy9pbWcvdW5rbm93blBlcnNvbi5qcGdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRtYWluVGFiTWVudS50YWIoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRhY2Nlc3NTZXR0aW5nc1RhYk1lbnUudGFiKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplTWVtYmVyc0Ryb3BEb3duKCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplUmlnaHRzQ2hlY2tib3hlcygpO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZ1bGxBY2Nlc3NDaGVja2JveC5jaGVja2JveCh7XG4gICAgICAgICAgICBvbkNoYW5nZTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNiQWZ0ZXJDaGFuZ2VGdWxsQWNjZXNzVG9nZ2xlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVG9nZ2xlcy5jaGVja2JveCgpO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGUoKTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJNb2RlLmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlckNoYW5nZUNEUkZpbHRlck1vZGVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnYm9keScpLm9uKCdjbGljaycsICdkaXYuZGVsZXRlLXVzZXItcm93JywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5kZWxldGVNZW1iZXJGcm9tVGFibGUoZS50YXJnZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hlY2sgYnV0dG9uIGNsaWNrXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2hlY2tCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoZS50YXJnZXQpLnBhcmVudCgnLnVpLnRhYicpLmZpbmQoJy51aS5jaGVja2JveCcpLmNoZWNrYm94KCdjaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGUgdW5jaGVjayBidXR0b24gY2xpY2tcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiR1bkNoZWNrQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkKGUudGFyZ2V0KS5wYXJlbnQoJy51aS50YWInKS5maW5kKCcudWkuY2hlY2tib3gnKS5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIENEUiBmaWx0ZXIgZGF0YXRhYmxlXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplQ0RSRmlsdGVyVGFibGUoKTtcblxuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuaW5pdGlhbGl6ZUZvcm0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgY2hhbmdpbmcgdGhlIGZ1bGwgYWNjZXNzIHRvZ2dsZS5cbiAgICAgKi9cbiAgICBjYkFmdGVyQ2hhbmdlRnVsbEFjY2Vzc1RvZ2dsZSgpe1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIGNoZWNrYm94ZXNcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKCdjaGFuZ2UgdGFiJywnZ2VuZXJhbCcpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0c1RhYi5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGdyb3VwUmlnaHRzVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bihtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgQ0RSIGZpbHRlciBtb2RlLlxuICAgICAqL1xuICAgIGNiQWZ0ZXJDaGFuZ2VDRFJGaWx0ZXJNb2RlKCl7XG4gICAgICAgIGNvbnN0IGNkckZpbHRlck1vZGUgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnY2RyRmlsdGVyTW9kZScpO1xuICAgICAgICBpZiAoY2RyRmlsdGVyTW9kZT09PSdhbGwnKSB7XG4gICAgICAgICAgICAkKCcjY2RyLWZpbHRlci11c2Vycy10YWJsZV93cmFwcGVyJykuaGlkZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2Nkci1maWx0ZXItdXNlcnMtdGFibGVfd3JhcHBlcicpLnNob3coKTtcbiAgICAgICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2RyRmlsdGVyVXNlcnNEYXRhVGFibGUpe1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BhZ2VMZW5ndGggPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2FsY3VsYXRlUGFnZUxlbmd0aCgpO1xuICAgICAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZS5wYWdlLmxlbihuZXdQYWdlTGVuZ3RoKS5kcmF3KGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBmb3IgYXNzaWduaW5nIGN1cnJlbnQgYWNjZXNzIGdyb3VwLlxuICAgICAqL1xuICAgIGluaXRpYWxpemVNZW1iZXJzRHJvcERvd24oKSB7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duUGFyYW1zID0gRXh0ZW5zaW9ucy5nZXREcm9wZG93blNldHRpbmdzT25seUludGVybmFsV2l0aG91dEVtcHR5KCk7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLmFjdGlvbiA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyVXNlcnNTZWxlY3Q7XG4gICAgICAgIGRyb3Bkb3duUGFyYW1zLnRlbXBsYXRlcyA9IHsgbWVudTogbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUgfTtcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRzZWxlY3RVc2Vyc0Ryb3BEb3duLmRyb3Bkb3duKGRyb3Bkb3duUGFyYW1zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9taXplcyB0aGUgbWVtYmVycyBkcm9wZG93biBtZW51IHZpc3VhbGl6YXRpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gVGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZmllbGRzIC0gVGhlIGZpZWxkcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgSFRNTCBzdHJpbmcgZm9yIHRoZSBkcm9wZG93biBtZW51LlxuICAgICAqL1xuICAgIGN1c3RvbU1lbWJlcnNEcm9wZG93bk1lbnUocmVzcG9uc2UsIGZpZWxkcykge1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSByZXNwb25zZVtmaWVsZHMudmFsdWVzXSB8fCB7fTtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgbGV0IG9sZFR5cGUgPSAnJztcbiAgICAgICAgJC5lYWNoKHZhbHVlcywgKGluZGV4LCBvcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb24udHlwZSAhPT0gb2xkVHlwZSkge1xuICAgICAgICAgICAgICAgIG9sZFR5cGUgPSBvcHRpb24udHlwZTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiZGl2aWRlclwiPjwvZGl2Pic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnXHQ8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+JztcbiAgICAgICAgICAgICAgICBodG1sICs9ICdcdDxpIGNsYXNzPVwidGFncyBpY29uXCI+PC9pPic7XG4gICAgICAgICAgICAgICAgaHRtbCArPSBvcHRpb24udHlwZUxvY2FsaXplZDtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWF5YmVUZXh0ID0gKG9wdGlvbltmaWVsZHMudGV4dF0pID8gYGRhdGEtdGV4dD1cIiR7b3B0aW9uW2ZpZWxkcy50ZXh0XX1cImAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IG1heWJlRGlzYWJsZWQgPSAoJChgI2V4dC0ke29wdGlvbltmaWVsZHMudmFsdWVdfWApLmhhc0NsYXNzKCdzZWxlY3RlZC1tZW1iZXInKSkgPyAnZGlzYWJsZWQgJyA6ICcnO1xuICAgICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz1cIiR7bWF5YmVEaXNhYmxlZH1pdGVtXCIgZGF0YS12YWx1ZT1cIiR7b3B0aW9uW2ZpZWxkcy52YWx1ZV19XCIke21heWJlVGV4dH0+YDtcbiAgICAgICAgICAgIGh0bWwgKz0gb3B0aW9uW2ZpZWxkcy5uYW1lXTtcbiAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VsZWN0aW5nIGEgdXNlciBmb3IgdGhlIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVGhlIHNlbGVjdGVkIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIFRoZSBqUXVlcnkgZWxlbWVudC5cbiAgICAgKi9cbiAgICBjYkFmdGVyVXNlcnNTZWxlY3QodGV4dCwgdmFsdWUsICRlbGVtZW50KSB7XG4gICAgICAgICQoYCNleHQtJHt2YWx1ZX1gKVxuICAgICAgICAgICAgLmNsb3Nlc3QoJ3RyJylcbiAgICAgICAgICAgIC5hZGRDbGFzcygnc2VsZWN0ZWQtbWVtYmVyJylcbiAgICAgICAgICAgIC5zaG93KCk7XG4gICAgICAgICQoJGVsZW1lbnQpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICBGb3JtLmRhdGFDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSBncm91cCBtZW1iZXIgZnJvbSB0aGUgdGFibGUuXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gVGhlIHRhcmdldCBlbGVtZW50LlxuICAgICAqL1xuICAgIGRlbGV0ZU1lbWJlckZyb21UYWJsZSh0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgaWQgPSAkKHRhcmdldCkuY2xvc2VzdCgnZGl2JykuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAkKGAjJHtpZH1gKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdzZWxlY3RlZC1tZW1iZXInKVxuICAgICAgICAgICAgLmhpZGUoKTtcbiAgICAgICAgRm9ybS5kYXRhQ2hhbmdlZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgcmlnaHRzIGNoZWNrYm94ZXMuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZVJpZ2h0c0NoZWNrYm94ZXMoKSB7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5tYXN0ZXIuY2hlY2tib3gnKVxuICAgICAgICAgICAgLmNoZWNrYm94KHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBhbGwgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBvbkNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgnY2hlY2snKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIHVuY2hlY2sgYWxsIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgb25VbmNoZWNrZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICRjaGlsZENoZWNrYm94ICA9ICQodGhpcykuY2xvc2VzdCgnLmNoZWNrYm94Jykuc2libGluZ3MoJy5saXN0JykuZmluZCgnLmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDaGVja2JveC5jaGVja2JveCgndW5jaGVjaycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGhvbWVQYWdlRHJvcGRvd24uZHJvcGRvd24obW9kdWxlVXNlcnNVSU1vZGlmeUFHLmdldEhvbWVQYWdlc0ZvclNlbGVjdCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgICQoJyNhY2Nlc3MtZ3JvdXAtcmlnaHRzIC5saXN0IC5jaGlsZC5jaGVja2JveCcpXG4gICAgICAgICAgICAuY2hlY2tib3goe1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgb24gbG9hZCB0byBzZXQgcGFyZW50IHZhbHVlXG4gICAgICAgICAgICAgICAgZmlyZU9uSW5pdCA6IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHBhcmVudCBzdGF0ZSBvbiBlYWNoIGNoaWxkIGNoZWNrYm94IGNoYW5nZVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlICAgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0XG4gICAgICAgICAgICAgICAgICAgICAgICAkbGlzdEdyb3VwICAgICAgPSAkKHRoaXMpLmNsb3Nlc3QoJy5saXN0JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3ggPSAkbGlzdEdyb3VwLmNsb3Nlc3QoJy5pdGVtJykuY2hpbGRyZW4oJy5jaGVja2JveCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94ICAgICAgID0gJGxpc3RHcm91cC5maW5kKCcuY2hlY2tib3gnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoZWNrZWQgICAgICA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxVbmNoZWNrZWQgICAgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGFsbCBvdGhlciBzaWJsaW5ncyBhcmUgY2hlY2tlZCBvciB1bmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgJGNoZWNrYm94LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHBhcmVudCBjaGVja2JveCBzdGF0ZSwgYnV0IGRvbid0IHRyaWdnZXIgaXRzIG9uQ2hhbmdlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIGlmKGFsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYXJlbnRDaGVja2JveC5jaGVja2JveCgnc2V0IGNoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKGFsbFVuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhcmVudENoZWNrYm94LmNoZWNrYm94KCdzZXQgdW5jaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFyZW50Q2hlY2tib3guY2hlY2tib3goJ3NldCBpbmRldGVybWluYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkQWZ0ZXJDaGFuZ2VHcm91cFJpZ2h0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBhZnRlciBjaGFuZ2luZyB0aGUgZ3JvdXAgcmlnaHQuXG4gICAgICovXG4gICAgY2RBZnRlckNoYW5nZUdyb3VwUmlnaHQoKXtcbiAgICAgICAgY29uc3QgZXh0Q2RySW5kZXhDaGVja2JveElkID0gJChcImlucHV0W2RhdGEtbW9kdWxlPSdNb2R1bGVFeHRlbmRlZENEUnMnXVtkYXRhLWFjdGlvbj0naW5kZXgnXVwiKS5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBhY2Nlc3NUb0NkciA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnTWlrb1BCWFxcXFxBZG1pbkNhYmluZXRcXFxcQ29udHJvbGxlcnNcXFxcQ2FsbERldGFpbFJlY29yZHNDb250cm9sbGVyX21haW4nKTtcbiAgICAgICAgY29uc3QgYWNjZXNzVG9DZHJFeHQgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywgZXh0Q2RySW5kZXhDaGVja2JveElkKTtcblxuICAgICAgICBpZiAoYWNjZXNzVG9DZHIgPT09ICdvbicgfHwgYWNjZXNzVG9DZHJFeHQgPT09ICdvbicpIHtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kY2RyRmlsdGVyVGFiLnNob3coKTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYkFmdGVyQ2hhbmdlQ0RSRmlsdGVyTW9kZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJUYWIuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyBoaWRlIGNoZWNrIGljb24gY2xvc2UgdG8gbW9kdWxlIG5hbWVcbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRncm91cFJpZ2h0TW9kdWxlc1RhYnMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlVGFiID0gJChvYmopLmF0dHIoJ2RhdGEtdGFiJyk7XG4gICAgICAgICAgICBpZiAoJChgZGl2W2RhdGEtdGFiPVwiJHttb2R1bGVUYWJ9XCJdICAuYWNjZXNzLWdyb3VwLWNoZWNrYm94YCkucGFyZW50KCcuY2hlY2tlZCcpLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAkKGBhW2RhdGEtdGFiPScke21vZHVsZVRhYn0nXSBpLmljb25gKS5hZGRDbGFzcygnYW5nbGUgcmlnaHQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJChgYVtkYXRhLXRhYj0nJHttb2R1bGVUYWJ9J10gaS5pY29uYCkucmVtb3ZlQ2xhc3MoJ2FuZ2xlIHJpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBzdGF0dXMgb2YgYnV0dG9ucyB3aGVuIHRoZSBtb2R1bGUgc3RhdHVzIGNoYW5nZXMuXG4gICAgICovXG4gICAgY2hlY2tTdGF0dXNUb2dnbGUoKSB7XG4gICAgICAgIGlmIChtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJHN0YXR1c1RvZ2dsZS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImdlbmVyYWxcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwidXNlcnNcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ3JvdXAtcmlnaHRzXCJdIC5kaXNhYmlsaXR5JykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAkKCdbZGF0YS10YWIgPSBcImNkci1maWx0ZXJcIl0gLmRpc2FiaWxpdHknKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiZ2VuZXJhbFwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJ1c2Vyc1wiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgJCgnW2RhdGEtdGFiID0gXCJncm91cC1yaWdodHNcIl0gLmRpc2FiaWxpdHknKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICQoJ1tkYXRhLXRhYiA9IFwiY2RyLWZpbHRlclwiXSAuZGlzYWJpbGl0eScpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXBhcmVzIGxpc3Qgb2YgcG9zc2libGUgaG9tZSBwYWdlcyB0byBzZWxlY3QgZnJvbVxuICAgICAqL1xuICAgIGdldEhvbWVQYWdlc0ZvclNlbGVjdCgpe1xuICAgICAgICBsZXQgdmFsdWVTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBjdXJyZW50SG9tZVBhZ2UgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlJywnaG9tZVBhZ2UnKTtcbiAgICAgICAgbGV0IHNlbGVjdGVkUmlnaHRzID0gJCgnLmNoZWNrZWQgLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgIHNlbGVjdGVkUmlnaHRzID0gJCgnLmFjY2Vzcy1ncm91cC1jaGVja2JveCcpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgICBzZWxlY3RlZFJpZ2h0cy5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXJOYW1lID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlci1uYW1lJyk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkKG9iaikuYXR0cignZGF0YS1hY3Rpb24nKTtcbiAgICAgICAgICAgIGlmIChjb250cm9sbGVyTmFtZS5pbmRleE9mKCdwYnhjb3JlJykgPT09IC0xICYmIGFjdGlvbi5pbmRleE9mKCdpbmRleCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXJsID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNvbnZlcnRDYW1lbFRvRGFzaChgLyR7bW9kdWxlfS8ke2NvbnRyb2xsZXJOYW1lfS8ke2FjdGlvbn1gKTtcblxuICAgICAgICAgICAgICAgIGxldCBuYW1lVGVtcGxhdGVzID0gW1xuICAgICAgICAgICAgICAgICAgICBgbW9fJHttb2R1bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgYG1tXyR7Y29udHJvbGxlck5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgYEJyZWFkY3J1bWIke21vZHVsZX1gLFxuICAgICAgICAgICAgICAgICAgICBgbW9kdWxlX3VzZXJzdWlfJHttb2R1bGV9XyR7Y29udHJvbGxlck5hbWV9XyR7YWN0aW9ufWBcbiAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICBuYW1lVGVtcGxhdGVzLnNvbWUoKG5hbWVUZW1wbGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyDQn9C+0L/Ri9GC0LrQsCDQvdCw0LnRgtC4INC/0LXRgNC10LLQvtC0XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBnbG9iYWxUcmFuc2xhdGVbbmFtZVRlbXBsYXRlXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDQldGB0LvQuCDQv9C10YDQtdCy0L7QtCDQvdCw0LnQtNC10L0gKNC+0L0g0L3QtSB1bmRlZmluZWQpLCDQv9GA0LXQutGA0LDRidCw0LXQvCDQv9C10YDQtdCx0L7RgFxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSAhPT0gdW5kZWZpbmVkICYmIG5hbWUgIT09IG5hbWVUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyDQntGB0YLQsNC90LDQstC70LjQstCw0LXQvCDQv9C10YDQtdCx0L7RgFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g0JXRgdC70Lgg0L/QtdGA0LXQstC+0LQg0L3QtSDQvdCw0LnQtNC10L0sINC/0YDQvtC00L7Qu9C20LDQtdC8INC/0L7QuNGB0LpcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5hbWVUZW1wbGF0ZTsgIC8vINCY0YHQv9C+0LvRjNC30YPQtdC8INGI0LDQsdC70L7QvSDQutCw0Log0LfQvdCw0YfQtdC90LjQtSDQv9C+INGD0LzQvtC70YfQsNC90LjRjlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRIb21lUGFnZSA9PT0gdXJsKXtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goIHsgbmFtZTogbmFtZSwgdmFsdWU6IHVybCwgc2VsZWN0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKCB7IG5hbWU6IG5hbWUsIHZhbHVlOiB1cmwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgIGNvbnN0IGZhaWxCYWNrSG9tZVBhZ2UgPSAgYCR7Z2xvYmFsUm9vdFVybH1zZXNzaW9uL2VuZGA7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCggeyBuYW1lOiBmYWlsQmFja0hvbWVQYWdlLCB2YWx1ZTogZmFpbEJhY2tIb21lUGFnZSwgc2VsZWN0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICB2YWx1ZVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZhbHVlU2VsZWN0ZWQpe1xuICAgICAgICAgICAgdmFsdWVzWzBdLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWVzOnZhbHVlcyxcbiAgICAgICAgICAgIG9uQ2hhbmdlOiBGb3JtLmRhdGFDaGFuZ2VkXG4gICAgICAgIH07XG5cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGEgc3RyaW5nIGZyb20gY2FtZWwgY2FzZSB0byBkYXNoIGNhc2UuXG4gICAgICogQHBhcmFtIHN0clxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGNvbnZlcnRDYW1lbFRvRGFzaChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgICAgLy8gSW5zZXJ0IGEgaHlwaGVuIGJldHdlZW4gYSBsb3dlcmNhc2UgbGV0dGVyIGFuZCBhbiB1cHBlcmNhc2UgbGV0dGVyXG4gICAgICAgICAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJylcbiAgICAgICAgICAgIC8vIEluc2VydCBhIGh5cGhlbiBiZXR3ZWVuIGEgZGlnaXQgYW5kIGFuIHVwcGVyY2FzZSBsZXR0ZXJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oXFxkKShbQS1aXSkvZywgJyQxLSQyJylcbiAgICAgICAgICAgIC8vIEluc2VydCBhIGh5cGhlbiBiZXR3ZWVuIGFuIHVwcGVyY2FzZSBsZXR0ZXIgb3Igc2VxdWVuY2UgYW5kIGFuIHVwcGVyY2FzZSBsZXR0ZXIgZm9sbG93ZWQgYnkgYSBsb3dlcmNhc2UgbGV0dGVyXG4gICAgICAgICAgICAucmVwbGFjZSgvKFtBLVpdKykoW0EtWl1bYS16XSkvZywgJyQxLSQyJylcbiAgICAgICAgICAgIC8vIFNwbGl0IHNlcXVlbmNlcyBvZiB0d28gb3IgbW9yZSB1cHBlcmNhc2UgbGV0dGVycyB3aXRoIGh5cGhlbnNcbiAgICAgICAgICAgIC5yZXBsYWNlKC8oW0EtWl17Mix9KS9nLCAobWF0Y2gpID0+IG1hdGNoLnNwbGl0KCcnKS5qb2luKCctJykpXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBlbnRpcmUgc3RyaW5nIHRvIGxvd2VyY2FzZVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc2V0dGluZ3MgLSBUaGUgZm9ybSBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSBtb2RpZmllZCBmb3JtIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gc2V0dGluZ3M7XG4gICAgICAgIGNvbnN0IGZvcm1WYWx1ZXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuICAgICAgICByZXN1bHQuZGF0YSA9IHtcbiAgICAgICAgICAgIGlkOiBmb3JtVmFsdWVzLmlkLFxuICAgICAgICAgICAgbmFtZTogZm9ybVZhbHVlcy5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGZvcm1WYWx1ZXMuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBjZHJGaWx0ZXJNb2RlOiAgZm9ybVZhbHVlcy5jZHJGaWx0ZXJNb2RlLFxuICAgICAgICB9O1xuICAgICAgICAvLyBHcm91cCBtZW1iZXJzXG4gICAgICAgIGNvbnN0IGFyck1lbWJlcnMgPSBbXTtcbiAgICAgICAgJCgndHIuc2VsZWN0ZWQtbWVtYmVyJykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5hdHRyKCdkYXRhLXZhbHVlJykpIHtcbiAgICAgICAgICAgICAgICBhcnJNZW1iZXJzLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5kYXRhLm1lbWJlcnMgPSBKU09OLnN0cmluZ2lmeShhcnJNZW1iZXJzKTtcblxuICAgICAgICAvLyBHcm91cCBSaWdodHNcbiAgICAgICAgY29uc3QgYXJyR3JvdXBSaWdodHMgPSBbXTtcbiAgICAgICAgJCgnaW5wdXQuYWNjZXNzLWdyb3VwLWNoZWNrYm94JykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5wYXJlbnQoJy5jaGVja2JveCcpLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2R1bGUgPSAkKG9iaikuYXR0cignZGF0YS1tb2R1bGUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gJChvYmopLmF0dHIoJ2RhdGEtY29udHJvbGxlcicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9ICQob2JqKS5hdHRyKCdkYXRhLWFjdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgbW9kdWxlIGluIGFyckdyb3VwUmlnaHRzIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGxldCBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0ubW9kdWxlID09PSBtb2R1bGUpO1xuICAgICAgICAgICAgICAgIGlmIChtb2R1bGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyR3JvdXBSaWdodHMucHVzaCh7IG1vZHVsZSwgY29udHJvbGxlcnM6IFtdIH0pO1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGVJbmRleCA9IGFyckdyb3VwUmlnaHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgY29udHJvbGxlciBpbiB0aGUgbW9kdWxlIG9yIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZHVsZUNvbnRyb2xsZXJzID0gYXJyR3JvdXBSaWdodHNbbW9kdWxlSW5kZXhdLmNvbnRyb2xsZXJzO1xuICAgICAgICAgICAgICAgIGxldCBjb250cm9sbGVySW5kZXggPSBtb2R1bGVDb250cm9sbGVycy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUNvbnRyb2xsZXJzLnB1c2goeyBjb250cm9sbGVyLCBhY3Rpb25zOiBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckluZGV4ID0gbW9kdWxlQ29udHJvbGxlcnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQdXNoIHRoZSBhY3Rpb24gaW50byB0aGUgY29udHJvbGxlcidzIGFjdGlvbnMgYXJyYXlcbiAgICAgICAgICAgICAgICBtb2R1bGVDb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdLmFjdGlvbnMucHVzaChhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQuZGF0YS5hY2Nlc3NfZ3JvdXBfcmlnaHRzID0gSlNPTi5zdHJpbmdpZnkoYXJyR3JvdXBSaWdodHMpOyBcblxuICAgICAgICAvLyBDRFIgRmlsdGVyXG4gICAgICAgIGNvbnN0IGFyckNEUkZpbHRlciA9IFtdO1xuICAgICAgICBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclRvZ2dsZXMuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuICAgICAgICAgICAgaWYgKCQob2JqKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgYXJyQ0RSRmlsdGVyLnB1c2goJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuZGF0YS5jZHJGaWx0ZXIgPSBKU09OLnN0cmluZ2lmeShhcnJDRFJGaWx0ZXIpO1xuXG4gICAgICAgIC8vIEZ1bGwgYWNjZXNzIGdyb3VwIHRvZ2dsZVxuICAgICAgICBpZiAobW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRmdWxsQWNjZXNzQ2hlY2tib3guY2hlY2tib3goJ2lzIGNoZWNrZWQnKSl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5mdWxsQWNjZXNzID0gJzEnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuZnVsbEFjY2VzcyA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhvbWUgUGFnZSB2YWx1ZVxuICAgICAgICBjb25zdCBzZWxlY3RlZEhvbWVQYWdlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRob21lUGFnZURyb3Bkb3duLmRyb3Bkb3duKCdnZXQgdmFsdWUnKTtcbiAgICAgICAgY29uc3QgZHJvcGRvd25QYXJhbXMgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuZ2V0SG9tZVBhZ2VzRm9yU2VsZWN0KCk7XG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0dXAgbWVudScsIGRyb3Bkb3duUGFyYW1zKTtcbiAgICAgICAgbGV0IGhvbWVQYWdlID0gJyc7XG4gICAgICAgICQuZWFjaChkcm9wZG93blBhcmFtcy52YWx1ZXMsIGZ1bmN0aW9uKGluZGV4LCByZWNvcmQpIHtcbiAgICAgICAgICAgIGlmIChyZWNvcmQudmFsdWUgPT09IHNlbGVjdGVkSG9tZVBhZ2UpIHtcbiAgICAgICAgICAgICAgICBob21lUGFnZSA9IHNlbGVjdGVkSG9tZVBhZ2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaG9tZVBhZ2U9PT0nJyl7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS5ob21lUGFnZSA9IGRyb3Bkb3duUGFyYW1zLnZhbHVlc1swXS52YWx1ZTtcbiAgICAgICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kaG9tZVBhZ2VEcm9wZG93bi5kcm9wZG93bignc2V0IHNlbGVjdGVkJywgcmVzdWx0LmRhdGEuaG9tZVBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEuaG9tZVBhZ2UgPSBzZWxlY3RlZEhvbWVQYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSB1c2VycyB0YWJsZSBEYXRhVGFibGUuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUNEUkZpbHRlclRhYmxlKCkge1xuXG4gICAgICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy4kbWFpblRhYk1lbnUudGFiKHtcbiAgICAgICAgICAgIG9uVmlzaWJsZSgpe1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ3RhYicpPT09J2Nkci1maWx0ZXInICYmIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jZHJGaWx0ZXJVc2Vyc0RhdGFUYWJsZSE9PW51bGwpe1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdQYWdlTGVuZ3RoID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNhbGN1bGF0ZVBhZ2VMZW5ndGgoKTtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlLnBhZ2UubGVuKG5ld1BhZ2VMZW5ndGgpLmRyYXcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kdWxlVXNlcnNVSU1vZGlmeUFHLmNkckZpbHRlclVzZXJzRGF0YVRhYmxlID0gbW9kdWxlVXNlcnNVSU1vZGlmeUFHLiRjZHJGaWx0ZXJVc2Vyc1RhYmxlLkRhdGFUYWJsZSh7XG4gICAgICAgICAgICAvLyBkZXN0cm95OiB0cnVlLFxuICAgICAgICAgICAgbGVuZ3RoQ2hhbmdlOiBmYWxzZSxcbiAgICAgICAgICAgIHBhZ2luZzogdHJ1ZSxcbiAgICAgICAgICAgIHBhZ2VMZW5ndGg6IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5jYWxjdWxhdGVQYWdlTGVuZ3RoKCksXG4gICAgICAgICAgICBzY3JvbGxDb2xsYXBzZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICAgICAgICAvLyBDaGVja0JveFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBmYWxzZSwgIC8vIFRoaXMgY29sdW1uIGlzIG5vdCBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyRGF0YVR5cGU6ICdkb20tY2hlY2tib3gnICAvLyBVc2UgdGhlIGN1c3RvbSBzb3J0aW5nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBVc2VybmFtZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIEV4dGVuc2lvblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgb3JkZXJhYmxlXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaGFibGU6IHRydWUgIC8vIFRoaXMgY29sdW1uIGlzIHNlYXJjaGFibGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIE1vYmlsZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkZXJhYmxlOiB0cnVlLCAgLy8gVGhpcyBjb2x1bW4gaXMgbm90IG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBub3Qgc2VhcmNoYWJsZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gRW1haWxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG9yZGVyYWJsZTogdHJ1ZSwgIC8vIFRoaXMgY29sdW1uIGlzIG9yZGVyYWJsZVxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiB0cnVlICAvLyBUaGlzIGNvbHVtbiBpcyBzZWFyY2hhYmxlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcmRlcjogWzAsICdkZXNjJ10sXG4gICAgICAgICAgICBsYW5ndWFnZTogU2VtYW50aWNMb2NhbGl6YXRpb24uZGF0YVRhYmxlTG9jYWxpc2F0aW9uLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNhbGN1bGF0ZVBhZ2VMZW5ndGgoKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSByb3cgaGVpZ2h0XG4gICAgICAgIGxldCByb3dIZWlnaHQgPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGNkckZpbHRlclVzZXJzVGFibGUuZmluZCgndHInKS5maXJzdCgpLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB3aW5kb3cgaGVpZ2h0IGFuZCBhdmFpbGFibGUgc3BhY2UgZm9yIHRhYmxlXG4gICAgICAgIGNvbnN0IHdpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgY29uc3QgaGVhZGVyRm9vdGVySGVpZ2h0ID0gNTgwOyAvLyBFc3RpbWF0ZSBoZWlnaHQgZm9yIGhlYWRlciwgZm9vdGVyLCBhbmQgb3RoZXIgZWxlbWVudHNcblxuICAgICAgICAvLyBDYWxjdWxhdGUgbmV3IHBhZ2UgbGVuZ3RoXG4gICAgICAgIHJldHVybiBNYXRoLm1heChNYXRoLmZsb29yKCh3aW5kb3dIZWlnaHQgLSBoZWFkZXJGb290ZXJIZWlnaHQpIC8gcm93SGVpZ2h0KSwgMTApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZnVuY3Rpb24gYWZ0ZXIgc2VuZGluZyB0aGUgZm9ybS5cbiAgICAgKi9cbiAgICBjYkFmdGVyU2VuZEZvcm0oKSB7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGZvcm0uXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUZvcm0oKSB7XG4gICAgICAgIEZvcm0uJGZvcm1PYmogPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuJGZvcm1PYmo7XG4gICAgICAgIEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2FjY2Vzcy1ncm91cHMvc2F2ZWA7XG4gICAgICAgIEZvcm0udmFsaWRhdGVSdWxlcyA9IG1vZHVsZVVzZXJzVUlNb2RpZnlBRy52YWxpZGF0ZVJ1bGVzO1xuICAgICAgICBGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JCZWZvcmVTZW5kRm9ybTtcbiAgICAgICAgRm9ybS5jYkFmdGVyU2VuZEZvcm0gPSBtb2R1bGVVc2Vyc1VJTW9kaWZ5QUcuY2JBZnRlclNlbmRGb3JtO1xuICAgICAgICBGb3JtLmluaXRpYWxpemUoKTtcbiAgICB9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIC8vIEN1c3RvbSBzb3J0aW5nIGZvciBjaGVja2JveCBzdGF0ZXNcbiAgICAkLmZuLmRhdGFUYWJsZS5leHQub3JkZXJbJ2RvbS1jaGVja2JveCddID0gZnVuY3Rpb24gICggc2V0dGluZ3MsIGNvbCApXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkoKS5jb2x1bW4oIGNvbCwge29yZGVyOidpbmRleCd9ICkubm9kZXMoKS5tYXAoIGZ1bmN0aW9uICggdGQsIGkgKSB7XG4gICAgICAgICAgICByZXR1cm4gJCgnaW5wdXQnLCB0ZCkucHJvcCgnY2hlY2tlZCcpID8gJzEnIDogJzAnO1xuICAgICAgICB9ICk7XG4gICAgfTtcblxuICAgIG1vZHVsZVVzZXJzVUlNb2RpZnlBRy5pbml0aWFsaXplKCk7XG59KTtcbiJdfQ==