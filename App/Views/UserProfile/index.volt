<form class="ui large form" id="user-profile-form">

    {# Password Section - Hidden if LDAP #}
    {% if useLdapAuth !== '1' %}
    <div class="ui segment">
        <h3 class="ui header">
            <i class="key icon"></i>
            {{ t._('module_usersui_ChangePassword') }}
        </h3>
        <div class="field">
            <label>{{ t._('module_usersui_CurrentPassword') }}</label>
            <input type="password" name="current_password" id="current_password" autocomplete="current-password">
        </div>
        <div class="two fields">
            <div class="field">
                <label>{{ t._('module_usersui_NewPassword') }}</label>
                <div class="ui action input">
                    <input type="password" name="new_password" id="new_password" autocomplete="new-password">
                </div>
            </div>
            <div class="field">
                <label>{{ t._('module_usersui_NewPasswordRepeat') }}</label>
                <input type="password" name="new_password_repeat" id="new_password_repeat" autocomplete="new-password">
            </div>
        </div>
        <button type="button" class="ui primary button" id="change-password-button">
            <i class="save icon"></i>
            {{ t._('module_usersui_ChangePassword') }}
        </button>
    </div>
    {% else %}
    <div class="ui info message">
        <i class="info circle icon"></i>
        {{ t._('module_usersui_PasswordManagedByLDAP') }}
    </div>
    {% endif %}

    {# Passkeys Section - Reuse Core HTML structure #}
    <div class="ui segment">
        <h3 class="ui header">
            <i class="fingerprint icon"></i>
            {{ t._('pk_PasskeysTitle') }}
        </h3>
        <div id="passkeys-container">
            <table class="ui very basic table" id="passkeys-table">
                <tbody>
                    <tr id="passkeys-empty-row" style="display: none;">
                        <td colspan="2">
                            <div class="ui placeholder segment">
                                <div class="ui icon header">
                                    <i class="key icon"></i>
                                    {{ t._('pk_NoPasskeys') }}
                                </div>
                                <div class="inline">
                                    <div class="ui text">
                                        {{ t._('pk_EmptyDescription') }}
                                    </div>
                                </div>
                                <div style="margin-top: 1em; text-align: center;">
                                    <button type="button" class="ui blue button prevent-word-wrap" id="add-passkey-button">
                                        <i class="add circle icon"></i>
                                        {{ t._('pk_AddPasskey') }}
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</form>
