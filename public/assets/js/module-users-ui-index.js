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
var ModuleUsersUIIndex = {
  /**
   * Status toggle checkbox.
   * @type {jQuery}
   */
  $statusToggle: $('#module-status-toggle'),

  /**
   * Disability fields.
   * @type {jQuery}
   */
  $disabilityFields: $('.disability'),

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
  }
};
$(document).ready(function () {
  ModuleUsersUIIndex.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkZGlzYWJpbGl0eUZpZWxkcyIsIiRib2R5IiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNoZWNrYm94IiwicmVtb3ZlQ2xhc3MiLCJhZGRDbGFzcyIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQU1BLGtCQUFrQixHQUFHO0FBQzFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NDLEVBQUFBLGFBQWEsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBTFU7O0FBTzFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NDLEVBQUFBLGlCQUFpQixFQUFFRCxDQUFDLENBQUMsYUFBRCxDQVhNOztBQWExQjtBQUNEO0FBQ0E7QUFDQTtBQUNDRSxFQUFBQSxLQUFLLEVBQUVGLENBQUMsQ0FBQyxNQUFELENBakJrQjs7QUFtQjFCO0FBQ0Q7QUFDQTtBQUNDRyxFQUFBQSxVQXRCMEIsd0JBc0JiO0FBQ1pILElBQUFBLENBQUMsQ0FBQywrQkFBRCxDQUFELENBQW1DSSxHQUFuQztBQUNBTixJQUFBQSxrQkFBa0IsQ0FBQ08saUJBQW5CO0FBQ0FDLElBQUFBLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IscUJBQXhCLEVBQStDVCxrQkFBa0IsQ0FBQ08saUJBQWxFO0FBQ0EsR0ExQnlCOztBQTRCMUI7QUFDRDtBQUNBO0FBQ0NBLEVBQUFBLGlCQS9CMEIsK0JBK0JOO0FBQ25CLFFBQUlQLGtCQUFrQixDQUFDQyxhQUFuQixDQUFpQ1MsUUFBakMsQ0FBMEMsWUFBMUMsQ0FBSixFQUE2RDtBQUM1RFYsTUFBQUEsa0JBQWtCLENBQUNHLGlCQUFuQixDQUFxQ1EsV0FBckMsQ0FBaUQsVUFBakQ7QUFDQSxLQUZELE1BRU87QUFDTlgsTUFBQUEsa0JBQWtCLENBQUNHLGlCQUFuQixDQUFxQ1MsUUFBckMsQ0FBOEMsVUFBOUM7QUFDQTtBQUNEO0FBckN5QixDQUEzQjtBQXdDQVYsQ0FBQyxDQUFDVyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCZCxFQUFBQSxrQkFBa0IsQ0FBQ0ssVUFBbkI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjMgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuY29uc3QgTW9kdWxlVXNlcnNVSUluZGV4ID0ge1xuXHQvKipcblx0ICogU3RhdHVzIHRvZ2dsZSBjaGVja2JveC5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXG5cdC8qKlxuXHQgKiBEaXNhYmlsaXR5IGZpZWxkcy5cblx0ICogQHR5cGUge2pRdWVyeX1cblx0ICovXG5cdCRkaXNhYmlsaXR5RmllbGRzOiAkKCcuZGlzYWJpbGl0eScpLFxuXG5cdC8qKlxuXHQgKiBCb2R5LlxuXHQgKiBAdHlwZSB7alF1ZXJ5fVxuXHQgKi9cblx0JGJvZHk6ICQoJ2JvZHknKSxcblxuXHQvKipcblx0ICogSW5pdGlhbGl6ZXMgdGhlIE1vZHVsZVVzZXJzVUlJbmRleCBtb2R1bGUuXG5cdCAqL1xuXHRpbml0aWFsaXplKCkge1xuXHRcdCQoJyNtYWluLXVzZXJzLXVpLXRhYi1tZW51IC5pdGVtJykudGFiKCk7XG5cdFx0TW9kdWxlVXNlcnNVSUluZGV4LmNoZWNrU3RhdHVzVG9nZ2xlKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ01vZHVsZVN0YXR1c0NoYW5nZWQnLCBNb2R1bGVVc2Vyc1VJSW5kZXguY2hlY2tTdGF0dXNUb2dnbGUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDaGVja3MgdGhlIHN0YXR1cyB0b2dnbGUgYW5kIHVwZGF0ZXMgdGhlIGRpc2FiaWxpdHkgZmllbGRzLlxuXHQgKi9cblx0Y2hlY2tTdGF0dXNUb2dnbGUoKSB7XG5cdFx0aWYgKE1vZHVsZVVzZXJzVUlJbmRleC4kc3RhdHVzVG9nZ2xlLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcblx0XHRcdE1vZHVsZVVzZXJzVUlJbmRleC4kZGlzYWJpbGl0eUZpZWxkcy5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH1cblx0fSxcbn07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcblx0TW9kdWxlVXNlcnNVSUluZGV4LmluaXRpYWxpemUoKTtcbn0pO1xuXG4iXX0=