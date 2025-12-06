/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2024 Alexey Portnov and Nikolay Beketov
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

/* global globalRootUrl, globalTranslate, GeneralSettingsPasskeys, UserMessage, PasswordWidget */

/**
 * ModuleUsersUI User Profile page
 * Handles password change and passkeys management
 *
 * @module UserProfile
 */
const UserProfile = {
    /**
     * jQuery object for the form
     * @type {jQuery}
     */
    $formObj: $('#user-profile-form'),

    /**
     * jQuery object for password change button
     * @type {jQuery}
     */
    $changePasswordButton: $('#change-password-button'),

    /**
     * jQuery object for new password input
     * @type {jQuery}
     */
    $newPassword: $('#new_password'),

    /**
     * Initialize the module
     */
    initialize() {
        // Initialize password widget for new password field
        UserProfile.initializePasswordWidget();

        // Note: GeneralSettingsPasskeys initializes itself via $(document).ready()
        // No need to call it here - would cause double initialization

        // Password change handler
        UserProfile.$changePasswordButton.on('click', (e) => {
            e.preventDefault();
            UserProfile.changePassword();
        });
    },

    /**
     * Handle password change form submission
     */
    changePassword() {
        const currentPassword = $('#current_password').val();
        const newPassword = $('#new_password').val();
        const newPasswordRepeat = $('#new_password_repeat').val();

        // Validation
        if (!currentPassword || !newPassword || !newPasswordRepeat) {
            UserMessage.showError(globalTranslate.module_usersui_PasswordFieldsRequired);
            return;
        }

        if (newPassword !== newPasswordRepeat) {
            UserMessage.showError(globalTranslate.module_usersui_PasswordsDontMatch);
            return;
        }

        // Add loading state
        UserProfile.$changePasswordButton.addClass('loading');

        // Send to server
        $.api({
            url: `${globalRootUrl}module-users-u-i/user-profile/change-password`,
            method: 'POST',
            data: {
                current_password: currentPassword,
                new_password: newPassword,
            },
            on: 'now',
            successTest(response) {
                return response.success === true;
            },
            onSuccess(response) {
                UserMessage.showInformation(response.message);
                // Clear fields
                $('#current_password').val('');
                $('#new_password').val('');
                $('#new_password_repeat').val('');
            },
            onFailure(response) {
                if (response.message) {
                    UserMessage.showError(response.message);
                } else {
                    UserMessage.showMultiString(response.messages);
                }
            },
            onComplete() {
                UserProfile.$changePasswordButton.removeClass('loading');
            },
        });
    },

    /**
     * Initialize password widget with validation and strength indicator
     */
    initializePasswordWidget() {
        if (UserProfile.$newPassword.length > 0 && typeof PasswordWidget !== 'undefined') {
            PasswordWidget.init(UserProfile.$newPassword, {
                generateButton: true,
                showPasswordButton: true,
                clipboardButton: true,
                validateOnInput: true,
                showStrengthBar: true,
                showWarnings: true,
                validation: 'soft',
                minScore: 60,
            });
        }
    },
};

$(document).ready(() => {
    UserProfile.initialize();
});
