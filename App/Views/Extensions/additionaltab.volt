<div class="ui bottom attached tab segment" data-tab="usersUI">

    <div class="wide field">
        <label for="module_users_ui_login">{{ t._('module_usersui_Login') }}</label>
        <div class="ten wide field">
            {{ form.render('module_users_ui_login') }}
        </div>
    </div>

    <div class="wide field">
        <label for="module_users_ui_password">{{ t._('module_usersui_Password') }}</label>
        {{ form.render('module_users_ui_password') }}
    </div>

    <div class="wide field">
        <label for="module_users_ui_access_group">{{ t._('module_usersui_AccessGroup') }}</label>
        {{ form.render('module_users_ui_access_group') }}
    </div>

</div>