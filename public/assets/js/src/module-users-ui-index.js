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

const ModuleUsersUIIndex = {
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
	initialize() {
		$('#main-users-ui-tab-menu .item').tab();
		ModuleUsersUIIndex.checkStatusToggle();
		window.addEventListener('ModuleStatusChanged', ModuleUsersUIIndex.checkStatusToggle);
		ModuleUsersUIIndex.initializeDataTable();
		ModuleUsersUIIndex.$selectGroup.each((index, obj) => {
			$(obj).dropdown({
				values: ModuleUsersUIIndex.makeDropdownList($(obj).attr('data-value')),
			});
		});
		ModuleUsersUIIndex.$selectGroup.dropdown({
			onChange: ModuleUsersUIIndex.changeGroupInList,
		});

		ModuleUsersUIIndex.$userUseLdapTableCheckbox.checkbox({
			onChange: ModuleUsersUIIndex.changeLdapInList,
		});

		// Double click on password or login input field in the table
		ModuleUsersUIIndex.$body.on('focusin', '.user-login-input, .user-password-input', (e) => {
			const currentRowId = $(e.target).closest('tr').attr('id');
			$(e.target).transition('glow');

			$(e.target).closest('div')
				.removeClass('transparent')
				.addClass('changed-field');
			$(e.target).attr('readonly', false);
		});

		// Submit form on Enter or Tab
		$(document).on('keydown', (e) => {
			const keyCode = e.keyCode || e.which;
			if (keyCode === 13
				|| (keyCode === 9 && !$(':focus').hasClass('.number-input'))
			) {
				const $el = $('.changed-field').closest('tr');
				$el.each((index, obj) => {
					const currentRowId = $(obj).attr('id');
					if (currentRowId !== undefined) {
						ModuleUsersUIIndex.changeLoginPasswordInList(currentRowId);
					}
				});
			}
		});

		// Submit form on focus out from password or login input field
		ModuleUsersUIIndex.$body.on('focusout', '.user-login-input, .user-password-input', () => {
			const $el = $('.changed-field').closest('tr');
			$el.each((index, obj) => {
				const currentRowId = $(obj).attr('id');
				if (currentRowId !== undefined) {
					ModuleUsersUIIndex.changeLoginPasswordInList(currentRowId);
				}
			});
		});

	},

	/**
	 * Initializes the users table DataTable.
	 */
	initializeDataTable() {
		ModuleUsersUIIndex.$usersTable.DataTable({
			// destroy: true,
			lengthChange: false,
			paging: false,
			columns: [
				null,
				null,
				null,
				null,
				null,
			],
			order: [1, 'asc'],
			language: SemanticLocalization.dataTableLocalisation,
		});
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

	/**
	 * Creates a dropdown list for users.
	 * @param {string} selected - The selected value.
	 * @returns {Array} - The dropdown list.
	 */
	makeDropdownList(selected) {
		const values = [];
		$('#users-groups-list option').each((index, obj) => {
			if (selected === obj.text || selected === obj.value) {
				values.push({
					name: obj.text,
					value: obj.value,
					selected: true,
				});
			} else {
				values.push({
					name: obj.text,
					value: obj.value,
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
	changeGroupInList(value, text, $choice) {
		$.api({
			url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-group`,
			on: 'now',
			method: 'POST',
			data: {
				user_id: $($choice).closest('tr').attr('id'),
				group_id: value,
			},
			onSuccess() {
				//	ModuleUsersUIIndex.initializeDataTable();
				//	console.log('updated');
			},
			onError(response) {
				console.log(response);
			},
		});
	},

	/**
	 * Handles the change of LDAP checkbox in the list.
	 */
	changeLdapInList() {
		$.api({
			url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-use-ldap`,
			on: 'now',
			method: 'POST',
			data: {
				user_id: $(this).closest('tr').attr('id'),
				useLdap: $(this).parent('.checkbox').checkbox('is checked'),
			},
			onSuccess() {
				//	ModuleUsersUIIndex.initializeDataTable();
				//	console.log('updated');
			},
			onError(response) {
				console.log(response);
			},
		});
	},

	/**
	 * Changes the login and password in the list.
	 * @param {string} rowId - The ID of the row.
	 */
	changeLoginPasswordInList(rowId) {
		const login = $(`#{rowId} input.user-login-input`).val();
		const password = $(`#{rowId} input.user-password-input`).val();

		$.api({
			url: `${globalRootUrl}module-users-u-i/users-credentials/change-user-credentials`,
			on: 'now',
			method: 'POST',
			data: {
				user_id: rowId,
				login: login,
				password: password,
			},
			onSuccess() {
				//	ModuleUsersUIIndex.initializeDataTable();
				//	console.log('updated');
			},
			onError(response) {
				console.log(response);
			},
		});
	},
};

$(document).ready(() => {
	ModuleUsersUIIndex.initialize();
});

