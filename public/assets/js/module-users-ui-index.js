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
  $statusToggle: $('#module-status-toggle'),
  $usersTable: $('#users-table'),
  $disabilityFields: $('#module-users-ui-form .disability'),
  $selectGroup: $('.select-group'),
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
  },
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
   * Изменение статуса кнопок при изменении статуса модуля
   */
  checkStatusToggle: function checkStatusToggle() {
    if (ModuleUsersUIIndex.$statusToggle.checkbox('is checked')) {
      ModuleUsersUIIndex.$disabilityFields.removeClass('disabled');
    } else {
      ModuleUsersUIIndex.$disabilityFields.addClass('disabled');
    }
  },

  /**
   * Подготавливает список выбора пользователей
   * @param selected
   * @returns {[]}
   */
  makeDropdownList: function makeDropdownList(selected) {
    var values = [];
    $('#users-groups-list option').each(function (index, obj) {
      if (selected === obj.text) {
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
   * Обработка изменения группы в списке
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
  }
};
$(document).ready(function () {
  ModuleUsersUIIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkdXNlcnNUYWJsZSIsIiRkaXNhYmlsaXR5RmllbGRzIiwiJHNlbGVjdEdyb3VwIiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImluaXRpYWxpemVEYXRhVGFibGUiLCJlYWNoIiwiaW5kZXgiLCJvYmoiLCJkcm9wZG93biIsInZhbHVlcyIsIm1ha2VEcm9wZG93bkxpc3QiLCJhdHRyIiwib25DaGFuZ2UiLCJjaGFuZ2VHcm91cEluTGlzdCIsIkRhdGFUYWJsZSIsImxlbmd0aENoYW5nZSIsInBhZ2luZyIsImNvbHVtbnMiLCJvcmRlciIsImxhbmd1YWdlIiwiU2VtYW50aWNMb2NhbGl6YXRpb24iLCJkYXRhVGFibGVMb2NhbGlzYXRpb24iLCJjaGVja2JveCIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzZWxlY3RlZCIsInRleHQiLCJwdXNoIiwibmFtZSIsInZhbHVlIiwiJGNob2ljZSIsImFwaSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJvbiIsIm1ldGhvZCIsImRhdGEiLCJ1c2VyX2lkIiwiY2xvc2VzdCIsImdyb3VwX2lkIiwib25TdWNjZXNzIiwib25FcnJvciIsInJlc3BvbnNlIiwiY29uc29sZSIsImxvZyIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUVBLElBQU1BLGtCQUFrQixHQUFHO0FBQzFCQyxFQUFBQSxhQUFhLEVBQUVDLENBQUMsQ0FBQyx1QkFBRCxDQURVO0FBRTFCQyxFQUFBQSxXQUFXLEVBQUVELENBQUMsQ0FBQyxjQUFE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TUFBUDtBQUNBLEdBbkV5Qjs7QUFvRTFCO0FBQ0Q7QUFDQTtBQUNDSSxFQUFBQSxpQkF2RTBCLDZCQXVFUmdCLEtBdkVRLEVBdUVESCxJQXZFQyxFQXVFS0ksT0F2RUwsRUF1RWM7QUFDdkNuQyxJQUFBQSxDQUFDLENBQUNvQyxHQUFGLENBQU07QUFDTEMsTUFBQUEsR0FBRyxZQUFLQyxhQUFMLHlEQURFO0FBRUxDLE1BQUFBLEVBQUUsRUFBRSxLQUZDO0FBR0xDLE1BQUFBLE1BQU0sRUFBRSxNQUhIO0FBSUxDLE1BQUFBLElBQUksRUFBRTtBQUNMQyxRQUFBQSxPQUFPLEVBQUUxQyxDQUFDLENBQUNtQyxPQUFELENBQUQsQ0FBV1EsT0FBWCxDQUFtQixJQUFuQixFQUF5QjNCLElBQXpCLENBQThCLElBQTlCLENBREo7QUFFTDRCLFFBQUFBLFFBQVEsRUFBRVY7QUFGTCxPQUpEO0FBUUxXLE1BQUFBLFNBUkssdUJBUU8sQ0FDWDtBQUNBO0FBQ0EsT0FYSTtBQVlMQyxNQUFBQSxPQVpLLG1CQVlHQyxRQVpILEVBWWE7QUFDakJDLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixRQUFaO0FBQ0E7QUFkSSxLQUFOO0FBZ0JBO0FBeEZ5QixDQUEzQjtBQTJGQS9DLENBQUMsQ0FBQ2tELFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDdkJyRCxFQUFBQSxrQkFBa0IsQ0FBQ00sVUFBbkI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIFNlbWFudGljTG9jYWxpemF0aW9uLCBnbG9iYWxSb290VXJsICovXG5cbmNvbnN0IE1vZHVsZVVzZXJzVUlJbmRleCA9IHtcblx0JHN0YXR1c1RvZ2dsZTogJCgnI21vZHVsZS1zdGF0dXMtdG9nZ2xlJyksXG5cdCR1c2Vyc1RhYmxlOiAkKCcjdXNlcnMtdGFibGUnKSxcblx0JGRpc2FiaWxpdHlGaWVsZHM6ICQoJyNtb2R1bGUtdXNlcnMtdWktZm9ybSAuZGlzYWJpbGl0eScpLFxuXHQkc2VsZWN0R3JvdXA6ICQoJy5zZWxlY3QtZ3JvdXAnKSxcblx0aW5pdGlhbGl6ZSgpIHtcblx0XHQkKCcjbWFpbi11c2Vycy11aS10YWItbWVudSAuaXRlbScpLnRhYigpO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC5jaGVja1N0YXR1c1RvZ2dsZSgpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdNb2R1bGVTdGF0dXNDaGFuZ2VkJywgTW9kdWxlVXNlcnNVSUluZGV4LmNoZWNrU3RhdHVzVG9nZ2xlKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZURhdGFUYWJsZSgpO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kc2VsZWN0R3JvdXAuZWFjaCgoaW5kZXgsIG9iaikgPT4ge1xuXHRcdFx0JChvYmopLmRyb3Bkb3duKHtcblx0XHRcdFx0dmFsdWVzOiBNb2R1bGVVc2Vyc1VJSW5kZXgubWFrZURyb3Bkb3duTGlzdCgkKG9iaikuYXR0cignZGF0YS12YWx1ZScpKSxcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kc2VsZWN0R3JvdXAuZHJvcGRvd24oe1xuXHRcdFx0b25DaGFuZ2U6IE1vZHVsZVVzZXJzVUlJbmRleC5jaGFuZ2VHcm91cEluTGlzdCxcblx0XHR9KTtcblx0fSxcblx0aW5pdGlhbGl6ZURhdGFUYWJsZSgpIHtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHVzZXJzVGFibGUuRGF0YVRhYmxlKHtcblx0XHRcdC8vIGRlc3Ryb3k6IHRydWUsXG5cdFx0XHRsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuXHRcdFx0cGFnaW5nOiBmYWxzZSxcblx0XHRcdGNvbHVtbnM6IFtcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0bnVsbCxcblx0XHRcdF0sXG5cdFx0XHRvcmRlcjogWzEsICdhc2MnXSxcblx0XHRcdGxhbmd1YWdlOiBTZW1hbnRpY0xvY2FsaXphdGlvbi5kYXRhVGFibGVMb2NhbGlzYXRpb24sXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiDQmNC30LzQtdC90LXQvdC40LUg0YHRgtCw0YLRg9GB0LAg0LrQvdC+0L/QvtC6INC/0YDQuCDQuNC30LzQtdC90LXQvdC40Lgg0YHRgtCw0YLRg9GB0LAg0LzQvtC00YPQu9GPXG5cdCAqL1xuXHRjaGVja1N0YXR1c1RvZ2dsZSgpIHtcblx0XHRpZiAoTW9kdWxlVXNlcnNVSUluZGV4LiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJGRpc2FiaWxpdHlGaWVsZHMuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICog0J/QvtC00LPQvtGC0LDQstC70LjQstCw0LXRgiDRgdC/0LjRgdC+0Log0LLRi9Cx0L7RgNCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5XG5cdCAqIEBwYXJhbSBzZWxlY3RlZFxuXHQgKiBAcmV0dXJucyB7W119XG5cdCAqL1xuXHRtYWtlRHJvcGRvd25MaXN0KHNlbGVjdGVkKSB7XG5cdFx0Y29uc3QgdmFsdWVzID0gW107XG5cdFx0JCgnI3VzZXJzLWdyb3Vwcy1saXN0IG9wdGlvbicpLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdGlmIChzZWxlY3RlZCA9PT0gb2JqLnRleHQpIHtcblx0XHRcdFx0dmFsdWVzLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG9iai50ZXh0LFxuXHRcdFx0XHRcdHZhbHVlOiBvYmoudmFsdWUsXG5cdFx0XHRcdFx0c2VsZWN0ZWQ6IHRydWUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFsdWVzLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG9iai50ZXh0LFxuXHRcdFx0XHRcdHZhbHVlOiBvYmoudmFsdWUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiB2YWx1ZXM7XG5cdH0sXG5cdC8qKlxuXHQgKiDQntCx0YDQsNCx0L7RgtC60LAg0LjQt9C80LXQvdC10L3QuNGPINCz0YDRg9C/0L/RiyDQsiDRgdC/0LjRgdC60LVcblx0ICovXG5cdGNoYW5nZUdyb3VwSW5MaXN0KHZhbHVlLCB0ZXh0LCAkY2hvaWNlKSB7XG5cdFx0JC5hcGkoe1xuXHRcdFx0dXJsOiBgJHtnbG9iYWxSb290VXJsfW1vZHVsZS11c2Vycy11LWkvdXNlcnMtY3JlZGVudGlhbHMvY2hhbmdlLXVzZXItZ3JvdXBgLFxuXHRcdFx0b246ICdub3cnLFxuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHVzZXJfaWQ6ICQoJGNob2ljZSkuY2xvc2VzdCgndHInKS5hdHRyKCdpZCcpLFxuXHRcdFx0XHRncm91cF9pZDogdmFsdWUsXG5cdFx0XHR9LFxuXHRcdFx0b25TdWNjZXNzKCkge1xuXHRcdFx0XHQvL1x0TW9kdWxlVXNlcnNVSUluZGV4LmluaXRpYWxpemVEYXRhVGFibGUoKTtcblx0XHRcdFx0Ly9cdGNvbnNvbGUubG9nKCd1cGRhdGVkJyk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcihyZXNwb25zZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==