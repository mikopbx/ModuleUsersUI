{% if addCustomTabFromModuleUsersUI %}
<div class="ui bottom attached tab segment" data-tab="usersUI">
    {{ form.render('module_users_ui_ldap_enabled') }}

    <div class="field">
        <label for="module_users_ui_access_group">{{ t._('module_usersui_AccessGroup') }}</label>
        <div class="field max-width-500">
            {{ form.render('module_users_ui_access_group') }}
        </div>
    </div>

    <div class="field disable-if-no-access">
        <div class="ui toggle checkbox">
            {{ form.render('module_users_ui_use_ldap_auth') }}
            <label for="module_users_ui_use_ldap_auth">{{ t._('module_usersui_LdapCheckbox') }}</label>
        </div>
    </div>

    <div class="field disable-if-no-access">
        <label>{{ t._('module_usersui_UserLoginAndPasswordLabel') }}</label>
        <div class="equal width fields">
            <div class="ui input search field max-width-300">
                {{ form.render('module_users_ui_login') }}
                <div class="results"></div>
            </div>
            <div class="field max-width-400">
                {{ form.render('module_users_ui_password') }}
            </div>
        </div>
    </div>

</div>
{% endif %}