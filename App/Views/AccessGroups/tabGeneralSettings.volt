{{ form.render('id') }}
<div class="field">
    <label for="name">{{ t._('module_usersui_GroupName') }}</label>
    {{ form.render('name') }}
</div>
<div class="field">
    <label for="homePage">{{ t._('module_usersui_HomePage') }}</label>
    {{ form.render('homePage') }}
</div>
<div class="field">
    <label for="description">{{ t._('module_usersui_ColumnGroupDescription') }}</label>
    {{ form.render('description') }}
</div>