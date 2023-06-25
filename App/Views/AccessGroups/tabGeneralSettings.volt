{{ form.render('id') }}
<div class="field">
    <label for="name">{{ t._('module_usersui_GroupName') }}</label>
    {{ form.render('name') }}
</div>
<div class="field">
    <label for="home-page">{{ t._('module_usersui_HomePage') }}</label>
    {{ form.render('home-page') }}
</div>
<div class="field">
    <label for="description">{{ t._('module_usersui_ColumnGroupDescription') }}</label>
    {{ form.render('description') }}
</div>