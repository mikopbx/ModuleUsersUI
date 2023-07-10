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
  $disabilityFields: $('#module-users-ui-form .disability'),

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtdXNlcnMtdWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlVXNlcnNVSUluZGV4IiwiJHN0YXR1c1RvZ2dsZSIsIiQiLCIkZGlzYWJpbGl0eUZpZWxkcyIsIiRib2R5IiwiaW5pdGlhbGl6ZSIsInRhYiIsImNoZWNrU3RhdHVzVG9nZ2xlIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNoZWNrYm94IiwicmVtb3ZlQ2xhc3MiLCJhZGRDbGFzcyIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQU1BLGtCQUFrQixHQUFHO0FBQzFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NDLEVBQUFBLGFBQWEsRUFBRUMsQ0FBQyxDQUFDLHVCQUFELENBTFU7O0FBTzFCO0FBQ0Q7QUFDQTtBQUNBO0FBQ0NDLEVBQUFBLGlCQUFpQixFQUFFRCxDQUFDLENBQUMsbUNBQUQsQ0FYTTs7QUFhMUI7QUFDRDtBQUNBO0FBQ0E7QUFDQ0UsRUFBQUEsS0FBSyxFQUFFRixDQUFDLENBQUMsTUFBRCxDQWpCa0I7O0FBbUIxQjtBQUNEO0FBQ0E7QUFDQ0csRUFBQUEsVUF0QjBCLHdCQXNCYjtBQUNaSCxJQUFBQSxDQUFDLENBQUMsK0JBQUQsQ0FBRCxDQUFtQ0ksR0FBbkM7QUFDQU4sSUFBQUEsa0JBQWtCLENBQUNPLGlCQUFuQjtBQUNBQyxJQUFBQSxNQUFNLENBQUNDLGdCQUFQLENBQXdCLHFCQUF4QixFQUErQ1Qsa0JBQWtCLENBQUNPLGlCQUFsRTtBQUNBLEdBMUJ5Qjs7QUE0QjFCO0FBQ0Q7QUFDQTtBQUNDQSxFQUFBQSxpQkEvQjBCLCtCQStCTjtBQUNuQixRQUFJUCxrQkFBa0IsQ0FBQ0MsYUFBbkIsQ0FBaUNTLFFBQWpDLENBQTBDLFlBQTFDLENBQUosRUFBNkQ7QUFDNURWLE1BQUFBLGtCQUFrQixDQUFDRyxpQkFBbkIsQ0FBcUNRLFdBQXJDLENBQWlELFVBQWpEO0FBQ0EsS0FGRCxNQUVPO0FBQ05YLE1BQUFBLGtCQUFrQixDQUFDRyxpQkFBbkIsQ0FBcUNTLFFBQXJDLENBQThDLFVBQTlDO0FBQ0E7QUFDRDtBQXJDeUIsQ0FBM0I7QUF3Q0FWLENBQUMsQ0FBQ1csUUFBRCxDQUFELENBQVlDLEtBQVosQ0FBa0IsWUFBTTtBQUN2QmQsRUFBQUEsa0JBQWtCLENBQUNLLFVBQW5CO0FBQ0EsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDIzIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmNvbnN0IE1vZHVsZVVzZXJzVUlJbmRleCA9IHtcblx0LyoqXG5cdCAqIFN0YXR1cyB0b2dnbGUgY2hlY2tib3guXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkc3RhdHVzVG9nZ2xlOiAkKCcjbW9kdWxlLXN0YXR1cy10b2dnbGUnKSxcblxuXHQvKipcblx0ICogRGlzYWJpbGl0eSBmaWVsZHMuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkZGlzYWJpbGl0eUZpZWxkczogJCgnI21vZHVsZS11c2Vycy11aS1mb3JtIC5kaXNhYmlsaXR5JyksXG5cblx0LyoqXG5cdCAqIEJvZHkuXG5cdCAqIEB0eXBlIHtqUXVlcnl9XG5cdCAqL1xuXHQkYm9keTogJCgnYm9keScpLFxuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplcyB0aGUgTW9kdWxlVXNlcnNVSUluZGV4IG1vZHVsZS5cblx0ICovXG5cdGluaXRpYWxpemUoKSB7XG5cdFx0JCgnI21haW4tdXNlcnMtdWktdGFiLW1lbnUgLml0ZW0nKS50YWIoKTtcblx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguY2hlY2tTdGF0dXNUb2dnbGUoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignTW9kdWxlU3RhdHVzQ2hhbmdlZCcsIE1vZHVsZVVzZXJzVUlJbmRleC5jaGVja1N0YXR1c1RvZ2dsZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENoZWNrcyB0aGUgc3RhdHVzIHRvZ2dsZSBhbmQgdXBkYXRlcyB0aGUgZGlzYWJpbGl0eSBmaWVsZHMuXG5cdCAqL1xuXHRjaGVja1N0YXR1c1RvZ2dsZSgpIHtcblx0XHRpZiAoTW9kdWxlVXNlcnNVSUluZGV4LiRzdGF0dXNUb2dnbGUuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuXHRcdFx0TW9kdWxlVXNlcnNVSUluZGV4LiRkaXNhYmlsaXR5RmllbGRzLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRNb2R1bGVVc2Vyc1VJSW5kZXguJGRpc2FiaWxpdHlGaWVsZHMuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdFx0fVxuXHR9LFxufTtcblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRNb2R1bGVVc2Vyc1VJSW5kZXguaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==