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

const ModuleUsersUIIndex = {
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
	initialize() {
		$('#main-users-ui-tab-menu .item').tab();
		ModuleUsersUIIndex.checkStatusToggle();
		window.addEventListener('ModuleStatusChanged', ModuleUsersUIIndex.checkStatusToggle);
	},

	/**
	 * Checks the status toggle and updates the disability fields.
	 */
	checkStatusToggle() {
		if (ModuleUsersUIIndex.$statusToggle.checkbox('is checked')) {
			ModuleUsersUIIndex.$disabilityFields.removeClass('disabled');
		} else {
			ModuleUsersUIIndex.$disabilityFields.addClass('disabled');
		}
	},
};

$(document).ready(() => {
	ModuleUsersUIIndex.initialize();
});

