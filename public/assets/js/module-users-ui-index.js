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

      if (keyCode === 13 || keyCode === 9 && !$(':focus').hasClass('.number-input')) {
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
      columns: [null, null, null, null, null],
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
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-group"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: $($choice).closest('tr').attr('id'),
        group_id: value
      },
      onSuccess: function onSuccess() {//	ModuleUsersUIIndex.initializeDataTable();
        //	console.log('updated');
      },
      onError: function onError(response) {
        console.log(response);
      }
    });
  },

  /**
   * Handles the change of LDAP checkbox in the list.
   */
  changeLdapInList: function changeLdapInList() {
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-use-ldap"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: $(this).closest('tr').attr('id'),
        useLdap: $(this).parent('.checkbox').checkbox('is checked')
      },
      onSuccess: function onSuccess() {//	ModuleUsersUIIndex.initializeDataTable();
        //	console.log('updated');
      },
      onError: function onError(response) {
        console.log(response);
      }
    });
  },

  /**
   * Changes the login and password in the list.
   * @param {string} rowId - The ID of the row.
   */
  changeLoginPasswordInList: function changeLoginPasswordInList(rowId) {
    var login = $("#{rowId} input.user-login-input").val();
    var password = $("#{rowId} input.user-password-input").val();
    $.api({
      url: "".concat(globalRootUrl, "module-users-u-i/users-credentials/change-user-credentials"),
      on: 'now',
      method: 'POST',
      data: {
        user_id: rowId,
        login: login,
        password: password
      },
      onSuccess: function onSuccess() {//	ModuleUsersUIIndex.initializeDataTable();
        //	console.log('updated');
      },
      onError: function onError(response) {
        console.log(response);
      }
    });
  }
};
$(document).ready(function () {
  ModuleUsersUIIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkdXNlcnNUYWJsZSIsIiRkaXNhYmlsaXR5RmllbGRzIiwiJHNlbGVjdEdyb3VwIiwiJHVzZXJVc2VMZGFwVGFibGVDaGVja2JveCIsIiRib2R5IiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImluaXRpYWxpemVEYXRhVGFibGUiLCJlYWNoIiwiaW5kZXgiLCJvYmoiLCJkcm9wZG93biIsInZhbHVlcyIsIm1ha2VEcm9wZG93bkxpc3QiLCJhdHRyIiwib25DaGFuZ2UiLCJjaGFuZ2VHcm91cEluTGlzdCIsImNoZWNrYm94IiwiY2hhbmdlTGRhcEluTGlzdCIsIm9uIiwiZSIsImN1cnJlbnRSb3dJZCIsInRhcmdldCIsImNsb3Nlc3QiLCJ0cmFuc2l0aW9uIiwicmVtb3ZlQ2xhc3MiLCJhZGRDbGFzcyIsImRvY3VtZW50Iiwia2V5Q29kZSIsIndoaWNoIiwiaGFzQ2xhc3MiLCIkZWwiLCJ1bmRlZmluZWQiLCJjaGFuZ2VMb2dpblBhc3N3b3JkSW5MaXN0IiwiRGF0YVRhYmxlIiwibGVuZ3RoQ2hhbmdlIiwicGFnaW5nIiwiY29sdW1ucyIsIm9yZGVyIiwibGFuZ3VhZ2UiLCJTZW1hbnRpY0xvY2FsaXphdGlvbiIsImRhdGFUYWJsZUxvY2FsaXNhdGlvbiIsInNlbGVjdGVkIiwidGV4dCIsInZhbHVlIiwicHVzaCIsIm5hbWUiLCIkY2hvaWNlIiwiYXBpIiwidXJsIiwiZ2xvYmFsUm9vdFVybCIsIm1ldGhvZCIsImRhdGEiLCJ1c2VyX2lkIiwiZ3JvdXBfaWQiLCJvblN1Y2Nlc3MiLCJvbkVycm9yIiwicmVzcG9uc2UiLCJjb25zb2xlIiwibG9nIiwidXNlTGRhcCIsInBhcmVudCIsInJvd0lkIiwibG9naW4iLCJ2YWwiLCJwYXNzd29y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O0FBSEwsT0FKRDtBQVNMVixNQUFBQSxTQVRLLHVCQVNPLENBQ1g7QUFDQTtBQUNBLE9BWkk7QUFhTEMsTUFBQUEsT0FiSyxtQkFhR0MsUUFiSCxFQWFhO0FBQ2pCQyxRQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsUUFBWjtBQUNBO0FBZkksS0FBTjtBQWlCQTtBQWpPeUIsQ0FBM0I7QUFvT0E3RCxDQUFDLENBQUMrQixRQUFELENBQUQsQ0FBWXVDLEtBQVosQ0FBa0IsWUFBTTtBQUN2QnhFLEVBQUFBLGtCQUFrQixDQUFDUSxVQUFuQjtBQUNBLENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyMyBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgU2VtYW50aWNMb2NhbGl6YXRpb24sIGdsb2JhbFJvb3RVcmwgKi9cblxuY29uc3QgTW9kdWxlVXNlcnNVSUluZGV4ID0ge1xuXHQvKipcblx0ICogU3RhdHVzIHRvZ2dsZSBjaGVja2JveC5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXG5cdC8qKlxuXHQgKiBVc2VycyB0YWJsZS5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCR1c2Vyc1RhYmxlOiAkKCcjdXNlcnMtdGFibGUnKSxcblxuXHQvKipcblx0ICogRGlzYWJpbGl0eSBmaWVsZHMuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkZGlzYWJpbGl0eUZpZWxkczogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtIC5kaXNhYmlsaXR5JyksXG5cblx0LyoqXG5cdCAqIFNlbGVjdCBncm91cCBkcm9wZG93bnMuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkc2VsZWN0R3JvdXA6ICQoJy5zZWxlY3QtZ3JvdXAnKSxcblxuXHQvKipcblx0ICogVXNlciB1c2UgTERBUCB0YWJsZSBjaGVja2JveGVzLlxuXHQgKiBAdHlwZSB7alF1ZXJ5fVxuXHQgKi9cblx0JHVzZXJVc2VMZGFwVGFibGVDaGVja2JveDogJCgnLnVzZXItdXNlLWxkYXAtY2hlY2tib3gnKSxcblxuXHQvKipcblx0ICogQm9keS5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCRib2R5OiAkKCdib2R5JyksXG5cblx0LyoqXG5cdCAqIEluaXRpYWxpemVzIHRoZSBNb2R1bGVVc2Vyc1VJSW5kZXggbW9kdWxlLlxuXHQgKi9cblx0aW5pdGlhbGl6ZSgpIHtcblx0XHQkKCcjbWFpbi11c2Vycy11aS10YWItbWVudSAuaXRlbScpLnRhYigpO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdNb2R1bGVTdGF0dXNDaGFuZ2VkJywgTW9kdWxlVXNlcnNVSUluZGV4LmNoZWNrU3RhdHVzVG9nZ2xlKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZURhdGFUYWJsZSgpO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kc2VsZWN0R3JvdXAuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0JChvYmopLmRyb3Bkb3duKHtcblx0XHRcdFx0dmFsdWVzOiBNb2R1bGVVc2Vyc1VJSW5kZXgubWFrZURyb3Bkb3duTGlzdCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSxcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kc2VsZWN0R3JvdXAuZHJvcGRvd24oe1xuXHRcdFx0b25DaGFuZ2U6IE1vZHVsZVVzZXJzVUlJbmRleC5jaGFuZ2VHcm91cEluTGlzdCxcblx0XHR9KTtcblxuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kdXNlclVzZUxkYXBUYWJsZUNoZWNrYm94LmNoZWNrYm94KHtcblx0XHRcdG9uQ2hhbmdlOiBNb2R1bGVVc2Vyc1VJSW5kZXguY2hhbmdlTGRhcEluTGlzdCxcblx0XHR9KTtcblxuXHRcdC8vIERvdWJsZSBjbGljayBvbiBwYXNzd29yZCBvciBsb2dpbiBpbnB1dCBmaWVsZCBpbiB0aGUgdGFibGVcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJGJvZHkub24oJ2ZvY3VzaW4nLCAnLnVzZXItbG9naW4taW5wdXQsIC51c2VyLXBhc3N3b3JkLWlucHV0JywgKGUpID0+IHtcblx0XHRcdGNvbnN0IGN1cnJlbnRSb3dJZCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ3RyJykuYXR0cignaWQnKTtcblx0XHRcdCQoZS50YXJnZXQpLnRyYW5zaXRpb24oJ2dsb3cnKTtcblxuXHRcdFx0JChlLnRhcmdldCkuY2xvc2VzdCgnZGl2Jylcblx0XHRcdFx0LnJlbW92ZUNsYXNzKCd0cmFuc3BhcmVudCcpXG5cdFx0XHRcdC5hZGRDbGFzcygnY2hhbmdlZC1maWVsZCcpO1xuXHRcdFx0JChlLnRhcmdldCkuYXR0cigncmVhZG9ubHknLCBmYWxzZSk7XG5cdFx0fSk7XG5cblx0XHQvLyBTdWJtaXQgZm9ybSBvbiBFbnRlciBvciBUYWJcblx0XHQkKGRvY3VtZW50KS5vbigna2V5ZG93bicsIChlKSA9PiB7XG5cdFx0XHRjb25zdCBrZXlDb2RlID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG5cdFx0XHRpZiAoa2V5Q29kZSA9PT0gMTNcblx0XHRcdFx0fHwgKGtleUNvZGUgPT09IDkgJiYgISQoJzpmb2N1cycpLmhhc0NsYXNzKCcubnVtYmVyLWlucHV0JykpXG5cdFx0XHQpIHtcblx0XHRcdFx0Y29uc3QgJGVsID0gJCgnLmNoYW5nZWQtZmllbGQnKS5jbG9zZXN0KCd0cicpO1xuXHRcdFx0XHQkZWwuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGN1cnJlbnRSb3dJZCA9ICQob2JqKS5hdHRyKCdpZCcpO1xuXHRcdFx0XHRcdGlmIChjdXJyZW50Um93SWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LmNoYW5nZUxvZ2luUGFzc3dvcmRJbkxpc3QoY3VycmVudFJvd0lkKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gU3VibWl0IGZvcm0gb24gZm9jdXMgb3V0IGZyb20gcGFzc3dvcmQgb3IgbG9naW4gaW5wdXQgZmllbGRcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJGJvZHkub24oJ2ZvY3Vzb3V0JywgJy51c2VyLWxvZ2luLWlucHV0LCAudXNlci1wYXNzd29yZC1pbnB1dCcsICgpID0+IHtcblx0XHRcdGNvbnN0ICRlbCA9ICQoJy5jaGFuZ2VkLWZpZWxkJykuY2xvc2VzdCgndHInKTtcblx0XHRcdCRlbC5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRSb3dJZCA9ICQob2JqKS5hdHRyKCdpZCcpO1xuXHRcdFx0XHRpZiAoY3VycmVudFJvd0lkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguY2hhbmdlTG9naW5QYXNzd29yZEluTGlzdChjdXJyZW50Um93SWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplcyB0aGUgdXNlcnMgdGFibGUgRGF0YVRhYmxlLlxuXHQgKi9cblx0aW5pdGlhbGl6ZURhdGFUYWJsZSgpIHtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHVzZXJzVGFibGUuRGF0YVRhYmxlKHtcblx0XHRcdC8vIGRlc3Ryb3k6IHRydWUsXG5cdFx0XHRsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuXHRcdFx0cGFnaW5nOiBmYWxzZSxcblx0XHRcdGNvbHVtbnM6IFtcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdF0sXG5cdFx0XHRvcmRlcjogWzEsICdhc2MnXSxcblx0XHRcdGxhbmd1YWdlOiBTZW1hbnRpY0xvY2FsaXphdGlvbi5kYXRhVGFibGVMb2NhbGlzYXRpb24sXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENoZWNrcyB0aGUgc3RhdHVzIHRvZ2dsZSBhbmQgdXBkYXRlcyB0aGUgZGlzYWJpbGl0eSBmaWVsZHMuXG5cdCAqL1xuXHRjaGVja1N0YXR1c1RvZ2dsZSgpIHtcblx0XHRpZiAoTW9kdWxlVXNlcnNVSUluZGV4LiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJGRpc2FiaWxpdHlGaWVsZHMuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgZHJvcGRvd24gbGlzdCBmb3IgdXNlcnMuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RlZCAtIFRoZSBzZWxlY3RlZCB2YWx1ZS5cblx0ICogQHJldHVybnMge0FycmF5fSAtIFRoZSBkcm9wZG93biBsaXN0LlxuXHQgKi9cblx0bWFrZURyb3Bkb3duTGlzdChzZWxlY3RlZCkge1xuXHRcdGNvbnN0IHZhbHVlcyA9IFtdO1xuXHRcdCQoJyN1c2Vycy1ncm91cHMtbGlzdCBvcHRpb24nKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG5cdFx0XHRpZiAoc2VsZWN0ZWQgPT09IG9iai50ZXh0IHx8IHNlbGVjdGVkID09PSBvYmoudmFsdWUpIHtcblx0XHRcdFx0dmFsdWVzLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG9iai50ZXh0LFxuXHRcdFx0XHRcdHZhbHVlOiBvYmoudmFsdWUsXG5cdFx0XHRcdFx0c2VsZWN0ZWQ6IHRydWUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFsdWVzLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG9iai50ZXh0LFxuXHRcdFx0XHRcdHZhbHVlOiBvYmoudmFsdWUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiB2YWx1ZXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgdGhlIGNoYW5nZSBvZiBncm91cCBpbiB0aGUgbGlzdC5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVGhlIHNlbGVjdGVkIHZhbHVlLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSBzZWxlY3RlZCB0ZXh0LlxuXHQgKiBAcGFyYW0ge2pRdWVyeX0gJGNob2ljZSAtIFRoZSBkcm9wZG93biBlbGVtZW50LlxuXHQgKi9cblx0Y2hhbmdlR3JvdXBJbkxpc3QodmFsdWUsIHRleHQsICRjaG9pY2UpIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS91c2Vycy1jcmVkZW50aWFscy9jaGFuZ2UtdXNlci1ncm91cGAsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXNlcl9pZDogJCgkY2hvaWNlKS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyksXG5cdFx0XHRcdGdyb3VwX2lkOiB2YWx1ZSxcblx0XHRcdH0sXG5cdFx0XHRvblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdC8vXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZURhdGFUYWJsZSgpO1xuXHRcdFx0XHQvL1x0Y29uc29sZS5sb2coJ3VwZGF0ZWQnKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgdGhlIGNoYW5nZSBvZiBMREFQIGNoZWNrYm94IGluIHRoZSBsaXN0LlxuXHQgKi9cblx0Y2hhbmdlTGRhcEluTGlzdCgpIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLXVzZXJzLXUtaS91c2Vycy1jcmVkZW50aWFscy9jaGFuZ2UtdXNlci11c2UtbGRhcGAsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXNlcl9pZDogJCh0aGlzKS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyksXG5cdFx0XHRcdHVzZUxkYXA6ICQodGhpcykucGFyZW50KCcuY2hlY2tib3gnKS5jaGVja2JveCgnaXMgY2hlY2tlZCcpLFxuXHRcdFx0fSxcblx0XHRcdG9uU3VjY2VzcygpIHtcblx0XHRcdFx0Ly9cdE1vZHVsZVVzZXJzVUlJbmRleC5pbml0aWFsaXplRGF0YVRhYmxlKCk7XG5cdFx0XHRcdC8vXHRjb25zb2xlLmxvZygndXBkYXRlZCcpO1xuXHRcdFx0fSxcblx0XHRcdG9uRXJyb3IocmVzcG9uc2UpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogQ2hhbmdlcyB0aGUgbG9naW4gYW5kIHBhc3N3b3JkIGluIHRoZSBsaXN0LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcm93SWQgLSBUaGUgSUQgb2YgdGhlIHJvdy5cblx0ICovXG5cdGNoYW5nZUxvZ2luUGFzc3dvcmRJbkxpc3Qocm93SWQpIHtcblx0XHRjb25zdCBsb2dpbiA9ICQoYCN7cm93SWR9IGlucHV0LnVzZXItbG9naW4taW5wdXRgKS52YWwoKTtcblx0XHRjb25zdCBwYXNzd29yZCA9ICQoYCN7cm93SWR9IGlucHV0LnVzZXItcGFzc3dvcmQtaW5wdXRgKS52YWwoKTtcblxuXHRcdCQuYXBpKHtcblx0XHRcdHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL3VzZXJzLWNyZWRlbnRpYWxzL2NoYW5nZS11c2VyLWNyZWRlbnRpYWxzYCxcblx0XHRcdG9uOiAnbm93Jyxcblx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHR1c2VyX2lkOiByb3dJZCxcblx0XHRcdFx0bG9naW46IGxvZ2luLFxuXHRcdFx0XHRwYXNzd29yZDogcGFzc3dvcmQsXG5cdFx0XHR9LFxuXHRcdFx0b25TdWNjZXNzKCkge1xuXHRcdFx0XHQvL1x0TW9kdWxlVXNlcnNVSUluZGV4LmluaXRpYWxpemVEYXRhVGFibGUoKTtcblx0XHRcdFx0Ly9cdGNvbnNvbGUubG9nKCd1cGRhdGVkJyk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcihyZXNwb25zZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==