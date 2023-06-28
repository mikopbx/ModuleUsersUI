{{ form('module-users-u-i/access-groups/save', 'role': 'form', 'class': 'ui large form','id':'module-users-ui-form') }}

<div class="ui top attached tabular menu" id="module-users-group-modify-menu">
    {% if id is null %}
        <a class="item active" data-tab="general">{{ t._('module_usersui_GeneralSettings') }}</a>
        <a class="item disabled" data-tab="users">{{ t._('module_usersui_UsersFilter') }}</a>
        <a class="item disabled" data-tab="group-rights">{{ t._('module_usersui_GroupRights') }}</a>
        <a class="item disabled" data-tab="cdr-filter">{{ t._('module_usersui_GroupCDRFilter') }}</a>
    {% else %}
        <a class="item" data-tab="general">{{ t._('module_usersui_GeneralSettings') }}</a>
        <a class="item" data-tab="users">{{ t._('module_usersui_UsersFilter') }}</a>
        <a class="item active" data-tab="group-rights">{{ t._('module_usersui_GroupRights') }}</a>
        <a class="item" data-tab="cdr-filter">{{ t._('module_usersui_GroupCDRFilter') }}</a>
    {% endif %}
</div>

<div class="ui bottom attached tab segment {% if id is null %}active{% endif %}" data-tab="general">
    {{ partial("Modules/ModuleUsersUI/AccessGroups/tabGeneralSettings") }}
</div>

<div class="ui bottom attached tab segment  {% if id is not null %}active{% endif %}" data-tab="group-rights">
    {{ partial("Modules/ModuleUsersUI/AccessGroups/tabGroupRights") }}
</div>

<div class="ui bottom attached tab segment" data-tab="users">
    {{ partial("Modules/ModuleUsersUI/AccessGroups/tabUsers") }}
</div>

<div class="ui bottom attached tab segment" data-tab="cdr-filter">
    {{ partial("Modules/ModuleUsersUI/AccessGroups/tabCDRFilter") }}
</div>

{{ partial("partials/submitbutton",['indexurl':'module-users-u-i/index']) }}

{{ endform() }}