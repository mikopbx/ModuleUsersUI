{{ form('module-users-u-i/access-groups/save', 'role': 'form', 'class': 'ui large form','id':'module-users-ui-form') }}
        <input type="hidden" name="dirrty" id="dirrty"/>
        {{ form.render('id') }}
        <div class="ten wide field">
            <label for="name">{{ t._('module_usersui_ColumnGroupName') }}</label>
            {{ form.render('name') }}
        </div>
        <div class="field">
            <label>{{ t._('module_usersui_HomePage') }}</label>
            {{ form.render('home_page') }}
        </div>
        <div class="field">
            <label for="description">{{ t._('module_usersui_ColumnGroupDescription') }}</label>
            {{ form.render('description') }}
        </div>

{{ partial("partials/submitbutton",['indexurl':'module-users-u-i/index']) }}
{{ endform()}}