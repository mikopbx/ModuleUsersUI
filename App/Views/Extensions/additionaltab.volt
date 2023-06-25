<div class="ui bottom attached tab segment" data-tab="usersUI">

    <div class="two fields">
        <div class="field max-width-300">
            <label for="module_users_ui_login">{{ t._('module_usersui_Login') }}</label>
            {{ form.render('module_users_ui_login') }}
        </div>

        <div class="field max-width-400">
            <label for="module_users_ui_password">{{ t._('module_usersui_Password') }}</label>
            {{ form.render('module_users_ui_password') }}
        </div>
    </div>
    <div class="field">
        <label for="module_users_ui_access_group">{{ t._('module_usersui_AccessGroup') }}</label>
        <div class="field max-width-500">
            {{ form.render('module_users_ui_access_group') }}
        </div>
    </div>

</div>