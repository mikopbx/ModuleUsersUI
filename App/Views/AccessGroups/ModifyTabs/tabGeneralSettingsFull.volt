{{ form.render('id') }}
<div class="field">
    <label for="name">{{ t._('module_usersui_GroupName') }}</label>
    {{ form.render('name') }}
</div>
<div class="field">
    <div class="ui toggle checkbox" id="full-access-group">
        {{ form.render('fullAccess') }}
        <label for="fullAccess">{{ t._('module_usersui_FullAccessCheckbox') }}</label>
    </div>
</div>
<div class="field">
    <label for="homePage">{{ t._('module_usersui_HomePage') }}</label>
    <div class="ui selection dropdown search item" id="home-page-dropdown">
        {{ form.render('homePage') }}
        <div class="text"></div>
        <i class="dropdown icon"></i>
    </div>
</div>
<div class="field">
    <label for="description">{{ t._('module_usersui_ColumnGroupDescription') }}</label>
    {{ form.render('description') }}
</div>