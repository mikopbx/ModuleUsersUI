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
  $disabilityFields: $('#module-users-ui-form  .disability'),
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
      url: "".concat(globalRootUrl, "module-users-u-i/change-user-group/"),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkdXNlcnNUYWJsZSIsIiRkaXNhYmlsaXR5RmllbGRzIiwiJHNlbGVjdEdyb3VwIiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImluaXRpYWxpemVEYXRhVGFibGUiLCJlYWNoIiwiaW5kZXgiLCJvYmoiLCJkcm9wZG93biIsInZhbHVlcyIsIm1ha2VEcm9wZG93bkxpc3QiLCJhdHRyIiwib25DaGFuZ2UiLCJjaGFuZ2VHcm91cEluTGlzdCIsIkRhdGFUYWJsZSIsImxlbmd0aENoYW5nZSIsInBhZ2luZyIsImNvbHVtbnMiLCJvcmRlciIsImxhbmd1YWdlIiwiU2VtYW50aWNMb2NhbGl6YXRpb24iLCJkYXRhVGFibGVMb2NhbGlzYXRpb24iLCJjaGVja2JveCIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzZWxlY3RlZCIsInRleHQiLCJwdXNoIiwibmFtZSIsInZhbHVlIiwiJGNob2ljZSIsImFwaSIsInVybCIsImdsb2JhbFJvb3RVcmwiLCJvbiIsIm1ldGhvZCIsImRhdGEiLCJ1c2VyX2lkIiwiY2xvc2VzdCIsImdyb3VwX2lkIiwib25TdWNjZXNzIiwib25FcnJvciIsInJlc3BvbnNlIiwiY29uc29sZSIsImxvZyIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUVBLElBQU1BLGtCQUFrQixHQUFHO0FBQzFCQyxFQUFBQSxhQUFhLEVBQUVDLENBQUMsQ0FBQyx1QkFBRCxDQURVO0FBRTFCQyxFQUFBQSxXQUFXLEVBQUVELENBQUMsQ0FBQyxjQUFE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TUFBUDtBQUNBLEdBbkV5Qjs7QUFvRTFCO0FBQ0Q7QUFDQTtBQUNDSSxFQUFBQSxpQkF2RTBCLDZCQXVFUmdCLEtBdkVRLEVBdUVESCxJQXZFQyxFQXVFS0ksT0F2RUwsRUF1RWM7QUFDdkNuQyxJQUFBQSxDQUFDLENBQUNvQyxHQUFGLENBQU07QUFDTEMsTUFBQUEsR0FBRyxZQUFLQyxhQUFMLHdDQURFO0FBRUxDLE1BQUFBLEVBQUUsRUFBRSxLQUZDO0FBR0xDLE1BQUFBLE1BQU0sRUFBRSxNQUhIO0FBSUxDLE1BQUFBLElBQUksRUFBRTtBQUNMQyxRQUFBQSxPQUFPLEVBQUUxQyxDQUFDLENBQUNtQyxPQUFELENBQUQsQ0FBV1EsT0FBWCxDQUFtQixJQUFuQixFQUF5QjNCLElBQXpCLENBQThCLElBQTlCLENBREo7QUFFTDRCLFFBQUFBLFFBQVEsRUFBRVY7QUFGTCxPQUpEO0FBUUxXLE1BQUFBLFNBUkssdUJBUU8sQ0FDWDtBQUNBO0FBQ0EsT0FYSTtBQVlMQyxNQUFBQSxPQVpLLG1CQVlHQyxRQVpILEVBWWE7QUFDakJDLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixRQUFaO0FBQ0E7QUFkSSxLQUFOO0FBZ0JBO0FBeEZ5QixDQUEzQjtBQTJGQS9DLENBQUMsQ0FBQ2tELFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDdkJyRCxFQUFBQSxrQkFBa0IsQ0FBQ00sVUFBbkI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIFNlbWFudGljTG9jYWxpemF0aW9uLCBnbG9iYWxSb290VXJsICovXG5cbmNvbnN0IE1vZHVsZVVzZXJzVUlJbmRleCA9IHtcblx0JHN0YXR1c1RvZ2dsZTogJCgnI21vZHVsZS1zdGF0dXMtdG9nZ2xlJyksXG5cdCR1c2Vyc1RhYmxlOiAkKCcjdXNlcnMtdGFibGUnKSxcblx0JGRpc2FiaWxpdHlGaWVsZHM6ICQoJyNtb2R1bGUtdXNlcnMtdWktZm9ybSAgLmRpc2FiaWxpdHknKSxcblx0JHNlbGVjdEdyb3VwOiAkKCcuc2VsZWN0LWdyb3VwJyksXG5cdGluaXRpYWxpemUoKSB7XG5cdFx0JCgnI21haW4tdXNlcnMtdWktdGFiLW1lbnUgLml0ZW0nKS50YWIoKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguY2hlY2tTdGF0dXNUb2dnbGUoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIE1vZHVsZVVzZXJzVUlJbmRleC5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LmluaXRpYWxpemVEYXRhVGFibGUoKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHNlbGVjdEdyb3VwLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdCQob2JqKS5kcm9wZG93bih7XG5cdFx0XHRcdHZhbHVlczogTW9kdWxlVXNlcnNVSUluZGV4Lm1ha2VEcm9wZG93bkxpc3QoJChvYmopLmF0dHIoJ2RhdGEtdmFsdWUnKSksXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJHNlbGVjdEdyb3VwLmRyb3Bkb3duKHtcblx0XHRcdG9uQ2hhbmdlOiBNb2R1bGVVc2Vyc1VJSW5kZXguY2hhbmdlR3JvdXBJbkxpc3QsXG5cdFx0fSk7XG5cdH0sXG5cdGluaXRpYWxpemVEYXRhVGFibGUoKSB7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LiR1c2Vyc1RhYmxlLkRhdGFUYWJsZSh7XG5cdFx0XHQvLyBkZXN0cm95OiB0cnVlLFxuXHRcdFx0bGVuZ3RoQ2hhbmdlOiBmYWxzZSxcblx0XHRcdHBhZ2luZzogZmFsc2UsXG5cdFx0XHRjb2x1bW5zOiBbXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRdLFxuXHRcdFx0b3JkZXI6IFsxLCAnYXNjJ10sXG5cdFx0XHRsYW5ndWFnZTogU2VtYW50aWNMb2NhbGl6YXRpb24uZGF0YVRhYmxlTG9jYWxpc2F0aW9uLFxuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICog0JjQt9C80LXQvdC10L3QuNC1INGB0YLQsNGC0YPRgdCwINC60L3QvtC/0L7QuiDQv9GA0Lgg0LjQt9C80LXQvdC10L3QuNC4INGB0YLQsNGC0YPRgdCwINC80L7QtNGD0LvRj1xuXHQgKi9cblx0Y2hlY2tTdGF0dXNUb2dnbGUoKSB7XG5cdFx0aWYgKE1vZHVsZVVzZXJzVUlJbmRleC4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcblx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kZGlzYWJpbGl0eUZpZWxkcy5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqINCf0L7QtNCz0L7RgtCw0LLQu9C40LLQsNC10YIg0YHQv9C40YHQvtC6INCy0YvQsdC+0YDQsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuVxuXHQgKiBAcGFyYW0gc2VsZWN0ZWRcblx0ICogQHJldHVybnMge1tdfVxuXHQgKi9cblx0bWFrZURyb3Bkb3duTGlzdChzZWxlY3RlZCkge1xuXHRcdGNvbnN0IHZhbHVlcyA9IFtdO1xuXHRcdCQoJyN1c2Vycy1ncm91cHMtbGlzdCBvcHRpb24nKS5lYWNoKChpbmRleCwgb2JqKSA9PiB7XG5cdFx0XHRpZiAoc2VsZWN0ZWQgPT09IG9iai50ZXh0KSB7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiBvYmoudGV4dCxcblx0XHRcdFx0XHR2YWx1ZTogb2JqLnZhbHVlLFxuXHRcdFx0XHRcdHNlbGVjdGVkOiB0cnVlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiBvYmoudGV4dCxcblx0XHRcdFx0XHR2YWx1ZTogb2JqLnZhbHVlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gdmFsdWVzO1xuXHR9LFxuXHQvKipcblx0ICog0J7QsdGA0LDQsdC+0YLQutCwINC40LfQvNC10L3QtdC90LjRjyDQs9GA0YPQv9C/0Ysg0LIg0YHQv9C40YHQutC1XG5cdCAqL1xuXHRjaGFuZ2VHcm91cEluTGlzdCh2YWx1ZSwgdGV4dCwgJGNob2ljZSkge1xuXHRcdCQuYXBpKHtcblx0XHRcdHVybDogYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtdXNlcnMtdS1pL2NoYW5nZS11c2VyLWdyb3VwL2AsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXNlcl9pZDogJCgkY2hvaWNlKS5jbG9zZXN0KCd0cicpLmF0dHIoJ2lkJyksXG5cdFx0XHRcdGdyb3VwX2lkOiB2YWx1ZSxcblx0XHRcdH0sXG5cdFx0XHRvblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdC8vXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZURhdGFUYWJsZSgpO1xuXHRcdFx0XHQvL1x0Y29uc29sZS5sb2coJ3VwZGF0ZWQnKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdE1vZHVsZVVzZXJzVUlJbmRleC5pbml0aWFsaXplKCk7XG59KTtcblxuIl19