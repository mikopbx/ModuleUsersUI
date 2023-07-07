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

/* global SemanticLocalization, globalRootUrl */
var ModuleUsersUIIndex = {
  /**
   * Status toggle checkbox.
   * @type {jQuery}
   */
  $statusToggle: $('#module-status-toggle'),

  /**
   * Users table.
   * @type {jQuery}
   */
  $usersTable: $('#users-table'),

  /**
   * Disability fields.
   * @type {jQuery}
   */
  $disabilityFields: $('#module-users-ui-form .disability'),

  /**
   * Select group dropdowns.
   * @type {jQuery}
   */
  $selectGroup: $('.select-group'),

  /**
   * User use LDAP table checkboxes.
   * @type {jQuery}
   */
  $userUseLdapTableCheckbox: $('.user-use-ldap-checkbox'),

  /**
   * Body.
   * @type {jQuery}
   */
  $body: $('body'),

  /**
   * Initializes the ModuleUsersUIIndex module.
   */
  initialize: function initialize() {
    $('#main-users-ui-tab-menu .item').tab();
    ModuleUsersUIIndex.checkStatusToggle();
    window.addEventListener('ModuleStatusChanged', ModuleUsersUIIndex.checkStatusToggle);
    ModuleUsersUIIndex.initializeDataTable();
    ModuleUsersUIIndex.$selectGroup.each(function (index, obj) {
      $(obj).dropdown({
        values: ModuleUsersUIIndex.makeDropdownList($(obj).attr('data-value'))
      });
    });
    ModuleUsersUIIndex.$selectGroup.dropdown({
      onChange: ModuleUsersUIIndex.changeGroupInList
    });
    ModuleUsersUIIndex.$userUseLdapTableCheckbox.checkbox({
      onChange: ModuleUsersUIIndex.changeLdapInList
    }); // Double click on password or login input field in the table

    ModuleUsersUIIndex.$body.on('focusin', '.user-login-input, .user-password-input', function (e) {
      var currentRowId = $(e.target).closest('tr').attr('id');
      $(e.target).transition('glow');
      $(e.target).closest('div').removeClass('transparent').addClass('changed-field');
      $(e.target).attr('readonly', false);
    }); // Submit form on Enter or Tab

    $(document).on('keydown', function (e) {
      var keyCode = e.keyCode || e.which;

      if (keyCode === 13 || keyCode === 9 && !$(':focus').hasClass('.user-login-input') || keyCode === 9 && !$(':focus').hasClass('.user-password-input')) {
        var $el = $('.changed-field').closest('tr');
        $el.each(function (index, obj) {
          var currentRowId = $(obj).attr('id');

          if (currentRowId !== undefined) {
            ModuleUsersUIIndex.changeLoginPasswordInList(currentRowId);
          }
        });
      }
    }); // Submit form on focus out from password or login input field

    ModuleUsersUIIndex.$body.on('focusout', '.user-login-input, .user-password-input', function () {
      var $el = $('.changed-field').closest('tr');
      $el.each(function (index, obj) {
        var currentRowId = $(obj).attr('id');

        if (currentRowId !== undefined) {
          ModuleUsersUIIndex.changeLoginPasswordInList(currentRowId);
        }
      });
    });
  },

  /**
   * Initializes the users table DataTable.
   */
  initializeDataTable: function initializeDataTable() {
    ModuleUsersUIIndex.$usersTable.DataTable({
      // destroy: true,
      lengthChange: false,
      paging: false,
      columns: [null, null, null, null, null, null],
      order: [1, 'asc'],
      language: SemanticLocalization.dataTableLocalisation
    });
  },

  /**
   * Checks the status toggle and updates the disability fields.
   */
  checkStatusToggle: function checkStatusToggle() {
    if (ModuleUsersUIIndex.$statusToggle.checkbox('is checked')) {
      ModuleUsersUIIndex.$disabilityFields.removeClass('disabled');
    } else {
      ModuleUsersUIIndex.$disabilityFields.addClass('disabled');
    }
  },

  /**
   * Creates a dropdown list for users.
   * @param {string} selected - The selected value.
   * @returns {Array} - The dropdown list.
   */
  makeDropdownList: function makeDropdownList(selected) {
    var values = [];
    $('#users-groups-list option').each(function (index, obj) {
      if (selected === obj.text || selected === obj.value) {
        values.push({
          name: obj.text,
          value: obj.value,
          selected: true
        });
      } else {
        values.push({
          name: obj.text,
          value: obj.value
        });
      }
    });
    return values;
  },

  /**
   * Handles the change of group in the list.
   * @param {string} value - The selected value.
   * @param {string} text - The selected text.
   * @param {jQuery} $choice - The dropdown element.
   */
  changeGroupInList: function changeGroupInList(value, text, $choice) {
    var rowId = $($choice).closest('tr').attr('id');
    ModuleUsersUIIndex.addProgressIcon(rowId);
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-group"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: rowId,
        group_id: value
      },
      successTest: function successTest(response) {
        // test whether a JSON response is valid
        return response !== undefined && Object.keys(response).length > 0 && response.success === true;
      },
      onSuccess: function onSuccess() {
        ModuleUsersUIIndex.removeProgressIcon(rowId);
      },
      onError: function onError(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      },
      onFailure: function onFailure(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      }
    });
  },

  /**
   * Handles the change of LDAP checkbox in the list.
   */
  changeLdapInList: function changeLdapInList() {
    var rowId = $(this).closest('tr').attr('id');
    ModuleUsersUIIndex.addProgressIcon(rowId);
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-use-ldap"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: rowId,
        useLdap: $(this).parent('.checkbox').checkbox('is checked')
      },
      successTest: function successTest(response) {
        // test whether a JSON response is valid
        return response !== undefined && Object.keys(response).length > 0 && response.success === true;
      },
      onSuccess: function onSuccess() {
        ModuleUsersUIIndex.removeProgressIcon(rowId);
      },
      onError: function onError(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      },
      onFailure: function onFailure(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      }
    });
  },

  /**
   * Changes the login and password in the list.
   * @param {string} rowId - The ID of the row.
   */
  changeLoginPasswordInList: function changeLoginPasswordInList(rowId) {
    var login = $("#".concat(rowId, " input.user-login-input")).val();
    var password = $("#".concat(rowId, " input.user-password-input")).val();
    ModuleUsersUIIndex.addProgressIcon(rowId);
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-credentials"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: rowId,
        login: login,
        password: password
      },
      successTest: function successTest(response) {
        // test whether a JSON response is valid
        return response !== undefined && Object.keys(response).length > 0 && response.success === true;
      },
      onSuccess: function onSuccess() {
        ModuleUsersUIIndex.removeProgressIcon(rowId);
        $("tr#".concat(rowId, " .changed-field input")).attr('readonly', true);
        $("tr#".concat(rowId, " div.changed-field")).removeClass('changed-field loading').addClass('transparent');
      },
      onError: function onError(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      },
      onFailure: function onFailure(response) {
        if (response.message !== undefined) {
          UserMessage.showMultiString(response.message);
        }

        ModuleUsersUIIndex.removeProgressIcon(rowId);
      }
    });
  },

  /**
   * Adds save icon from the row
   */
  addProgressIcon: function addProgressIcon(rowId) {
    $("tr#".concat(rowId, " .changed-field")).find('.ui.spinner.loading.icon').show();
  },

  /**
   * Removes save icon from the row
   */
  removeProgressIcon: function removeProgressIcon(rowId) {
    $("tr#".concat(rowId, " .changed-field")).find('.ui.spinner.loading.icon').hide();
  }
};
$(document).ready(function () {
  ModuleUsersUIIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkdXNlcnNUYWJsZSIsIiRkaXNhYmlsaXR5RmllbGRzIiwiJHNlbGVjdEdyb3VwIiwiJHVzZXJVc2VMZGFwVGFibGVDaGVja2JveCIsIiRib2R5IiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImluaXRpYWxpemVEYXRhVGFibGUiLCJlYWNoIiwiaW5kZXgiLCJvYmoiLCJkcm9wZG93biIsInZhbHVlcyIsIm1ha2VEcm9wZG93bkxpc3QiLCJhdHRyIiwib25DaGFuZ2UiLCJjaGFuZ2VHcm91cEluTGlzdCIsImNoZWNrYm94IiwiY2hhbmdlTGRhcEluTGlzdCIsIm9uIiwiZSIsImN1cnJlbnRSb3dJZCIsInRhcmdldCIsImNsb3Nlc3QiLCJ0cmFuc2l0aW9uIiwicmVtb3ZlQ2xhc3MiLCJhZGRDbGFzcyIsImRvY3VtZW50Iiwia2V5Q29kZSIsIndoaWNoIiwiaGFzQ2xhc3MiLCIkZWwiLCJ1bmRlZmluZWQiLCJjaGFuZ2VMb2dpblBhc3N3b3JkSW5MaXN0IiwiRGF0YVRhYmxlIiwibGVuZ3RoQ2hhbmdlIiwicGFnaW5nIiwiY29sdW1ucyIsIm9yZGVyIiwibGFuZ3VhZ2UiLCJTZW1hbnRpY0xvY2FsaXphdGlvbiIsImRhdGFUYWJsZUxvY2FsaXNhdGlvbiIsInNlbGVjdGVkIiwidGV4dCIsInZhbHVlIiwicHVzaCIsIm5hbWUiLCIkY2hvaWNlIiwicm93SWQiLCJhZGRQcm9ncmVzc0ljb24iLCJhcGkiLCJ1cmwiLCJnbG9iYWxSb290VXJsIiwibWV0aG9kIiwiZGF0YSIsInVzZXJfaWQiLCJncm91cF9pZCIsInN1Y2Nlc3NUZXN0IiwicmVzcG9uc2UiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwic3VjY2VzcyIsIm9uU3VjY2VzcyIsInJlbW92ZVByb2dyZXNzSWNvbiIsIm9uRXJyb3IiLCJtZXNzYWdlIiwiVXNlck1lc3NhZ2UiLCJzaG93TXVsdGlTdHJpbmciLCJvbkZhaWx1cmUiLCJ1c2VMZGFwIiwicGFyZW50IiwibG9naW4iLCJ2YWwiLCJwYXNzd29yZCIsImZpbmQiLCJzaG93IiwiaGlkZSIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFFQSxJQUFNQSxrQkFBa0IsR0FBRztBQUMxQjtBQUNEO0FBQ0E7QUFDQTtBQUNDQyxFQUFBQSxhQUFhLEVBQUVDLENBQUMsQ0FBQyx1QkFBRCxDQUxVOztBQU8xQjtBQUNEO0FBQ0E7QUFDQTtBQUNDQyxFQUFBQSxXQUFXLEVBQUVELENBQUMsQ0FBQyxjQUFELENBWFk7O0FBYTFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NFLEVBQUFBLGlCQUFpQixFQUFFRixDQUFDLENBQUMsbUNBQUQsQ0FqQk07O0FBbUIxQjtBQUNEO0FBQ0E7QUFDQTtBQUNDRyxFQUFBQSxZQUFZLEVBQUVILENBQUMsQ0FBQyxlQUFELENBdkJXOztBQXlCMUI7QUFDRDtBQUNBO0FBQ0E7QUFDQ0ksRUFBQUEseUJBQXlCLEVBQUVKLENBQUMsQ0FBQyx5QkFBRCxDQTdCRjs7QUErQjFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NLLEVBQUFBLEtBQUssRUFBRUwsQ0FBQyxDQUFDLE1BQUQsQ0FuQ2tCOztBQXFDMUI7QUFDRDtBQUNBO0FBQ0NNLEVBQUFBLFVBeEMwQix3QkF3Q2I7QUFDWk4sSUFBQUEsQ0FBQyxDQUFDLCtCQUFELENBQUQsQ0FBbUNPLEdBQW5DO0FBQ0FULElBQUFBLGtCQUFrQixDQUFDVSxpQkFBbkI7QUFDQUMsSUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixxQkFBeEIsRUFBK0NaLGtCQUFrQixDQUFDVSxpQkFBbEU7QUFDQVYsSUFBQUEsa0JBQWtC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O0FBb1NBakYsQ0FBQyxDQUFDK0IsUUFBRCxDQUFELENBQVltRCxLQUFaLENBQWtCLFlBQU07QUFDdkJwRixFQUFBQSxrQkFBa0IsQ0FBQ1EsVUFBbkI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIFNlbWFudGljTG9jYWxpemF0aW9uLCBnbG9iYWxSb290VXJsICovXG5cbmNvbnN0IE1vZHVsZVVzZXJzVUlJbmRleCA9IHtcblx0LyoqXG5cdCAqIFN0YXR1cyB0b2dnbGUgY2hlY2tib3guXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuXHQvKipcblx0ICogVXNlcnMgdGFibGUuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkdXNlcnNUYWJsZTogJCgnI3VzZXJzLXRhYmxlJyksXG5cblx0LyoqXG5cdCAqIERpc2FiaWxpdHkgZmllbGRzLlxuXHQgKiBAdHlwZSB7alF1ZXJ5fVxuXHQgKi9cblx0JGRpc2FiaWxpdHlGaWVsZHM6ICQoJyNtb2R1bGUtdXNlcnMtdWktZm9ybSAuZGlzYWJpbGl0eScpLFxuXG5cdC8qKlxuXHQgKiBTZWxlY3QgZ3JvdXAgZHJvcGRvd25zLlxuXHQgKiBAdHlwZSB7alF1ZXJ5fVxuXHQgKi9cblx0JHNlbGVjdEdyb3VwOiAkKCcuc2VsZWN0LWdyb3VwJyksXG5cblx0LyoqXG5cdCAqIFVzZXIgdXNlIExEQVAgdGFibGUgY2hlY2tib3hlcy5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCR1c2VyVXNlTGRhcFRhYmxlQ2hlY2tib3g6ICQoJy51c2VyLXVzZS1sZGFwLWNoZWNrYm94JyksXG5cblx0LyoqXG5cdCAqIEJvZHkuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkYm9keTogJCgnYm9keScpLFxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplcyB0aGUgTW9kdWxlVXNlcnNVSUluZGV4IG1vZHVsZS5cblx0ICovXG5cdGluaXRpYWxpemUoKSB7XG5cdFx0JCgnI21haW4tdXNlcnMtdWktdGFiLW1lbnUgLml0ZW0nKS50YWIoKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguY2hlY2tTdGF0dXNUb2dnbGUoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIE1vZHVsZVVzZXJzVUlJbmRleC5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LmluaXRpYWxpemVEYXRhVGFibGUoKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHNlbGVjdEdyb3VwLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdCQob2JqKS5kcm9wZG93bih7XG5cdFx0XHRcdHZhbHVlczogTW9kdWxlVXNlcnNVSUluZGV4Lm1ha2VEcm9wZG93bkxpc3QoJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSksXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHNlbGVjdEdyb3VwLmRyb3Bkb3duKHtcblx0XHRcdG9uQ2hhbmdlOiBNb2R1bGVVc2Vyc1VJSW5kZXguY2hhbmdlR3JvdXBJbkxpc3QsXG5cdFx0fSk7XG5cblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHVzZXJVc2VMZGFwVGFibGVDaGVja2JveC5jaGVja2JveCh7XG5cdFx0XHRvbkNoYW5nZTogTW9kdWxlVXNlcnNVSUluZGV4LmNoYW5nZUxkYXBJbkxpc3QsXG5cdFx0fSk7XG5cblx0XHQvLyBEb3VibGUgY2xpY2sgb24gcGFzc3dvcmQgb3IgbG9naW4gaW5wdXQgZmllbGQgaW4gdGhlIHRhYmxlXG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRib2R5Lm9uKCdmb2N1c2luJywgJy51c2VyLWxvZ2luLWlucHV0LCAudXNlci1wYXNzd29yZC1pbnB1dCcsIChlKSA9PiB7XG5cdFx0XHRjb25zdCBjdXJyZW50Um93SWQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyk7XG5cdFx0XHQkKGUudGFyZ2V0KS50cmFuc2l0aW9uKCdnbG93Jyk7XG5cblx0XHRcdCQoZS50YXJnZXQpLmNsb3Nlc3QoJ2RpdicpXG5cdFx0XHRcdC5yZW1vdmVDbGFzcygndHJhbnNwYXJlbnQnKVxuXHRcdFx0XHQuYWRkQ2xhc3MoJ2NoYW5nZWQtZmllbGQnKTtcblx0XHRcdCQoZS50YXJnZXQpLmF0dHIoJ3JlYWRvbmx5JywgZmFsc2UpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3VibWl0IGZvcm0gb24gRW50ZXIgb3IgVGFiXG5cdFx0JChkb2N1bWVudCkub24oJ2tleWRvd24nLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3Qga2V5Q29kZSA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuXHRcdFx0aWYgKGtleUNvZGUgPT09IDEzXG5cdFx0XHRcdHx8IChrZXlDb2RlID09PSA5ICYmICEkKCc6Zm9jdXMnKS5oYXNDbGFzcygnLnVzZXItbG9naW4taW5wdXQnKSlcblx0XHRcdFx0fHwgKGtleUNvZGUgPT09IDkgJiYgISQoJzpmb2N1cycpLmhhc0NsYXNzKCcudXNlci1wYXNzd29yZC1pbnB1dCcpKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGNvbnN0ICRlbCA9ICQoJy5jaGFuZ2VkLWZpZWxkJykuY2xvc2VzdCgndHInKTtcblx0XHRcdFx0JGVsLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdFx0XHRjb25zdCBjdXJyZW50Um93SWQgPSAkKG9iaikuYXR0cignaWQnKTtcblx0XHRcdFx0XHRpZiAoY3VycmVudFJvd0lkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC5jaGFuZ2VMb2dpblBhc3N3b3JkSW5MaXN0KGN1cnJlbnRSb3dJZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFN1Ym1pdCBmb3JtIG9uIGZvY3VzIG91dCBmcm9tIHBhc3N3b3JkIG9yIGxvZ2luIGlucHV0IGZpZWxkXG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRib2R5Lm9uKCdmb2N1c291dCcsICcudXNlci1sb2dpbi1pbnB1dCwgLnVzZXItcGFzc3dvcmQtaW5wdXQnLCAoKSA9PiB7XG5cdFx0XHRjb25zdCAkZWwgPSAkKCcuY2hhbmdlZC1maWVsZCcpLmNsb3Nlc3QoJ3RyJyk7XG5cdFx0XHQkZWwuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0XHRjb25zdCBjdXJyZW50Um93SWQgPSAkKG9iaikuYXR0cignaWQnKTtcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3dJZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LmNoYW5nZUxvZ2luUGFzc3dvcmRJbkxpc3QoY3VycmVudFJvd0lkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0fSxcblxuXHQvKipcblx0ICogSW5pdGlhbGl6ZXMgdGhlIHVzZXJzIHRhYmxlIERhdGFUYWJsZS5cblx0ICovXG5cdGluaXRpYWxpemVEYXRhVGFibGUoKSB7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LiR1c2Vyc1RhYmxlLkRhdGFUYWJsZSh7XG5cdFx0XHQvLyBkZXN0cm95OiB0cnVlLFxuXHRcdFx0bGVuZ3RoQ2hhbmdlOiBmYWxzZSxcblx0XHRcdHBhZ2luZzogZmFsc2UsXG5cdFx0XHRjb2x1bW5zOiBbXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRdLFxuXHRcdFx0b3JkZXI6IFsxLCAnYXNjJ10sXG5cdFx0XHRsYW5ndWFnZTogU2VtYW50aWNMb2NhbGl6YXRpb24uZGF0YVRhYmxlTG9jYWxpc2F0aW9uLFxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDaGVja3MgdGhlIHN0YXR1cyB0b2dnbGUgYW5kIHVwZGF0ZXMgdGhlIGRpc2FiaWxpdHkgZmllbGRzLlxuXHQgKi9cblx0Y2hlY2tTdGF0dXNUb2dnbGUoKSB7XG5cdFx0aWYgKE1vZHVsZVVzZXJzVUlJbmRleC4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcblx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kZGlzYWJpbGl0eUZpZWxkcy5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIGRyb3Bkb3duIGxpc3QgZm9yIHVzZXJzLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0ZWQgLSBUaGUgc2VsZWN0ZWQgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gLSBUaGUgZHJvcGRvd24gbGlzdC5cblx0ICovXG5cdG1ha2VEcm9wZG93bkxpc3Qoc2VsZWN0ZWQpIHtcblx0XHRjb25zdCB2YWx1ZXMgPSBbXTtcblx0XHQkKCcjdXNlcnMtZ3JvdXBzLWxpc3Qgb3B0aW9uJykuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0aWYgKHNlbGVjdGVkID09PSBvYmoudGV4dCB8fCBzZWxlY3RlZCA9PT0gb2JqLnZhbHVlKSB7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiBvYmoudGV4dCxcblx0XHRcdFx0XHR2YWx1ZTogb2JqLnZhbHVlLFxuXHRcdFx0XHRcdHNlbGVjdGVkOiB0cnVlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiBvYmoudGV4dCxcblx0XHRcdFx0XHR2YWx1ZTogb2JqLnZhbHVlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gdmFsdWVzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIHRoZSBjaGFuZ2Ugb2YgZ3JvdXAgaW4gdGhlIGxpc3QuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzZWxlY3RlZCB2YWx1ZS5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgc2VsZWN0ZWQgdGV4dC5cblx0ICogQHBhcmFtIHtqUXVlcnl9ICRjaG9pY2UgLSBUaGUgZHJvcGRvd24gZWxlbWVudC5cblx0ICovXG5cdGNoYW5nZUdyb3VwSW5MaXN0KHZhbHVlLCB0ZXh0LCAkY2hvaWNlKSB7XG5cdFx0Y29uc3Qgcm93SWQgPSAkKCRjaG9pY2UpLmNsb3Nlc3QoJ3RyJykuYXR0cignaWQnKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguYWRkUHJvZ3Jlc3NJY29uKHJvd0lkKTtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS91c2Vycy1jcmVkZW50aWFscy9jaGFuZ2UtdXNlci1ncm91cGAsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXNlcl9pZDogcm93SWQsXG5cdFx0XHRcdGdyb3VwX2lkOiB2YWx1ZSxcblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzVGVzdChyZXNwb25zZSkge1xuXHRcdFx0XHQvLyB0ZXN0IHdoZXRoZXIgYSBKU09OIHJlc3BvbnNlIGlzIHZhbGlkXG5cdFx0XHRcdHJldHVybiByZXNwb25zZSAhPT0gdW5kZWZpbmVkXG5cdFx0XHRcdFx0JiYgT2JqZWN0LmtleXMocmVzcG9uc2UpLmxlbmd0aCA+IDBcblx0XHRcdFx0XHQmJiByZXNwb25zZS5zdWNjZXNzID09PSB0cnVlO1xuXHRcdFx0fSxcblx0XHRcdG9uU3VjY2VzcygpIHtcblx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LnJlbW92ZVByb2dyZXNzSWNvbihyb3dJZCk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0VXNlck1lc3NhZ2Uuc2hvd011bHRpU3RyaW5nKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC5yZW1vdmVQcm9ncmVzc0ljb24ocm93SWQpO1xuXHRcdFx0fSxcblx0XHRcdG9uRmFpbHVyZShyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0VXNlck1lc3NhZ2Uuc2hvd011bHRpU3RyaW5nKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC5yZW1vdmVQcm9ncmVzc0ljb24ocm93SWQpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyB0aGUgY2hhbmdlIG9mIExEQVAgY2hlY2tib3ggaW4gdGhlIGxpc3QuXG5cdCAqL1xuXHRjaGFuZ2VMZGFwSW5MaXN0KCkge1xuXHRcdGNvbnN0IHJvd0lkID0gJCh0aGlzKS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyk7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LmFkZFByb2dyZXNzSWNvbihyb3dJZCk7XG5cdFx0JC5hcGkoe1xuXHRcdFx0dXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvdXNlcnMtY3JlZGVudGlhbHMvY2hhbmdlLXVzZXItdXNlLWxkYXBgLFxuXHRcdFx0b246ICdub3cnLFxuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHVzZXJfaWQ6IHJvd0lkLFxuXHRcdFx0XHR1c2VMZGFwOiAkKHRoaXMpLnBhcmVudCgnLmNoZWNrYm94JykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSxcblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzVGVzdChyZXNwb25zZSkge1xuXHRcdFx0XHQvLyB0ZXN0IHdoZXRoZXIgYSBKU09OIHJlc3BvbnNlIGlzIHZhbGlkXG5cdFx0XHRcdHJldHVybiByZXNwb25zZSAhPT0gdW5kZWZpbmVkXG5cdFx0XHRcdFx0JiYgT2JqZWN0LmtleXMocmVzcG9uc2UpLmxlbmd0aCA+IDBcblx0XHRcdFx0XHQmJiByZXNwb25zZS5zdWNjZXNzID09PSB0cnVlO1xuXHRcdFx0fSxcblx0XHRcdG9uU3VjY2VzcygpIHtcblx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LnJlbW92ZVByb2dyZXNzSWNvbihyb3dJZCk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0VXNlck1lc3NhZ2Uuc2hvd011bHRpU3RyaW5nKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC5yZW1vdmVQcm9ncmVzc0ljb24ocm93SWQpO1xuXHRcdFx0fSxcblx0XHRcdG9uRmFpbHVyZShyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UubWVzc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0VXNlck1lc3NhZ2Uuc2hvd011bHRpU3RyaW5nKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC5yZW1vdmVQcm9ncmVzc0ljb24ocm93SWQpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogQ2hhbmdlcyB0aGUgbG9naW4gYW5kIHBhc3N3b3JkIGluIHRoZSBsaXN0LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcm93SWQgLSBUaGUgSUQgb2YgdGhlIHJvdy5cblx0ICovXG5cdGNoYW5nZUxvZ2luUGFzc3dvcmRJbkxpc3Qocm93SWQpIHtcblx0XHRjb25zdCBsb2dpbiA9ICQoYCMke3Jvd0lkfSBpbnB1dC51c2VyLWxvZ2luLWlucHV0YCkudmFsKCk7XG5cdFx0Y29uc3QgcGFzc3dvcmQgPSAkKGAjJHtyb3dJZH0gaW5wdXQudXNlci1wYXNzd29yZC1pbnB1dGApLnZhbCgpO1xuXG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LmFkZFByb2dyZXNzSWNvbihyb3dJZCk7XG5cblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS91c2Vycy1jcmVkZW50aWFscy9jaGFuZ2UtdXNlci1jcmVkZW50aWFsc2AsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXNlcl9pZDogcm93SWQsXG5cdFx0XHRcdGxvZ2luOiBsb2dpbixcblx0XHRcdFx0cGFzc3dvcmQ6IHBhc3N3b3JkLFxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3NUZXN0KHJlc3BvbnNlKSB7XG5cdFx0XHRcdC8vIHRlc3Qgd2hldGhlciBhIEpTT04gcmVzcG9uc2UgaXMgdmFsaWRcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlICE9PSB1bmRlZmluZWRcblx0XHRcdFx0XHQmJiBPYmplY3Qua2V5cyhyZXNwb25zZSkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdCYmIHJlc3BvbnNlLnN1Y2Nlc3MgPT09IHRydWU7XG5cdFx0XHR9LFxuXHRcdFx0b25TdWNjZXNzKCkge1xuXHRcdFx0XHRNb2R1bGVVc2Vyc1VJSW5kZXgucmVtb3ZlUHJvZ3Jlc3NJY29uKHJvd0lkKTtcblx0XHRcdFx0JChgdHIjJHtyb3dJZH0gLmNoYW5nZWQtZmllbGQgaW5wdXRgKS5hdHRyKCdyZWFkb25seScsIHRydWUpO1xuXHRcdFx0XHQkKGB0ciMke3Jvd0lkfSBkaXYuY2hhbmdlZC1maWVsZGApLnJlbW92ZUNsYXNzKCdjaGFuZ2VkLWZpZWxkIGxvYWRpbmcnKS5hZGRDbGFzcygndHJhbnNwYXJlbnQnKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRVc2VyTWVzc2FnZS5zaG93TXVsdGlTdHJpbmcocmVzcG9uc2UubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LnJlbW92ZVByb2dyZXNzSWNvbihyb3dJZCk7XG5cdFx0XHR9LFxuXHRcdFx0b25GYWlsdXJlKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5tZXNzYWdlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRVc2VyTWVzc2FnZS5zaG93TXVsdGlTdHJpbmcocmVzcG9uc2UubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LnJlbW92ZVByb2dyZXNzSWNvbihyb3dJZCk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICogQWRkcyBzYXZlIGljb24gZnJvbSB0aGUgcm93XG5cdCAqL1xuXHRhZGRQcm9ncmVzc0ljb24ocm93SWQpe1xuXHRcdCQoYHRyIyR7cm93SWR9IC5jaGFuZ2VkLWZpZWxkYCkuZmluZCgnLnVpLnNwaW5uZXIubG9hZGluZy5pY29uJykuc2hvdygpO1xuXHR9LFxuXHQvKipcblx0ICogUmVtb3ZlcyBzYXZlIGljb24gZnJvbSB0aGUgcm93XG5cdCAqL1xuXHRyZW1vdmVQcm9ncmVzc0ljb24ocm93SWQpIHtcblx0XHQkKGB0ciMke3Jvd0lkfSAuY2hhbmdlZC1maWVsZGApLmZpbmQoJy51aS5zcGlubmVyLmxvYWRpbmcuaWNvbicpLmhpZGUoKTtcblx0fVxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==