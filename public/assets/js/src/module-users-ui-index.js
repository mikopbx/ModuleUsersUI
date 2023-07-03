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
	$statusToggle: $('#module-status-toggle'),
	$usersTable: $('#users-table'),
	$disabilityFields: $('#module-users-ui-form .disability'),
	$selectGroup: $('.select-group'),
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
	},
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
	 * Изменение статуса кнопок при изменении статуса модуля
	 */
	checkStatusToggle() {
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
	makeDropdownList(selected) {
		const values = [];
		$('#users-groups-list option').each((index, obj) => {
			if (selected === obj.text) {
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
	 * Обработка изменения группы в списке
	 */
	changeGroupInList(value, text, $choice) {
		$.api({
			url: `${globalRootUrl}module-users-u-i/change-user-group/`,
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
};

$(document).ready(() => {
	ModuleUsersUIIndex.initialize();
});

