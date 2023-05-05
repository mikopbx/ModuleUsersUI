
<div class="ui grid">
    <div class="ui row">
        <div class="ui five wide column">
            {{ link_to("#", '<i class="add user icon"></i>  '~t._('module_template_AddNewRecord'), "class": "ui blue button", "id":"add-new-row", "id-table":"PhoneBook-table") }}
        </div>
    </div>
</div>
<br>
<table id="PhoneBook-table" class="ui small very compact single line table"></table>

<select id="queues-list" style="display: none;">
    {% for record in queues %}
        <option value="{{ record.id }}">{{ record.name }}</option>
    {% endfor %}
</select>

<select id="users-list" style="display: none;">
    {% for record in users %}
        <option value="{{ record.number }}">{{ record.callerid }}</option>
    {% endfor %}
</select>

<div id="template-select" style="display: none;">
    <div class="ui dropdown select-group" data-value="PARAM">
        <div class="text">PARAM</div>
        <i class="dropdown icon"></i>
    </div>
</div>

<form class="ui large grey segment form" id="module-usersui-form">
    <div class="ui ribbon label">
        <i class="phone icon"></i> 123456
    </div>
    <div class="ui grey top right attached label" id="status">{{ t._("module_usersuiDisconnected") }}</div>
    {{ form.render('id') }}

    <div class="ten wide field disability">
        <label >{{ t._('module_usersuiTextFieldLabel') }}</label>
        {{ form.render('text_field') }}
    </div>

    <div class="ten wide field disability">
        <label >{{ t._('module_usersuiTextAreaFieldLabel') }}</label>
        {{ form.render('text_area_field') }}
    </div>

    <div class="ten wide field disability">
        <label >{{ t._('module_usersuiPasswordFieldLabel') }}</label>
        {{ form.render('password_field') }}
    </div>

    <div class="four wide field disability">
        <label>{{ t._('module_usersuiIntegerFieldLabel') }}</label>
        {{ form.render('integer_field') }}
    </div>

    <div class="field disability">
        <div class="ui segment">
            <div class="ui checkbox">
                <label>{{ t._('module_usersuiCheckBoxFieldLabel') }}</label>
                {{ form.render('checkbox_field') }}
            </div>
        </div>
    </div>

    <div class="field disability">
        <div class="ui segment">
            <div class="ui toggle checkbox">
                <label>{{ t._('module_usersuiToggleFieldLabel') }}</label>
                {{ form.render('toggle_field') }}
            </div>
        </div>
    </div>

    <div class="ten wide field disability">
        <label >{{ t._('module_usersuiDropDownFieldLabel') }}</label>
        {{ form.render('dropdown_field') }}
    </div>

    {{ partial("partials/submitbutton",['indexurl':'pbx-extension-modules/index/']) }}
</form>