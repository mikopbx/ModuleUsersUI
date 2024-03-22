{{ form('module-users-u-i/access-groups/save', 'role': 'form', 'class': 'ui large form','id':'module-users-ui-form') }}

<div class="ui top attached tabular menu" id="module-access-group-modify-menu">
    {% if id is null %}
        <a class="item active" data-tab="general">{{ t._('module_usersui_GeneralSettings') }}</a>
    {% else %}
        <a class="item" data-tab="general">{{ t._('module_usersui_GeneralSettings') }}</a>
        <a class="item" data-tab="users">{{ t._('module_usersui_UsersFilter') }}</a>
        <a class="item active" data-tab="group-rights">{{ t._('module_usersui_GroupRights') }}</a>
        <a class="item" data-tab="cdr-filter">{{ t._('module_usersui_GroupCDRFilter') }}</a>
    {% endif %}
</div>

{% if id is null %}
    <div class="ui bottom attached tab segment active" data-tab="general">
        {{ partial("Modules/ModuleUsersUI/AccessGroups/ModifyTabs/tabGeneralSettingsSimple") }}
    </div>
{% else %}
    <div class="ui bottom attached tab segment" data-tab="general">
        {{ partial("Modules/ModuleUsersUI/AccessGroups/ModifyTabs/tabGeneralSettingsFull") }}
    </div>
    <div class="ui bottom attached tab segment active" data-tab="group-rights">
        {{ partial("Modules/ModuleUsersUI/AccessGroups/ModifyTabs/tabGroupRights") }}
    </div>

    <div class="ui bottom attached tab segment" data-tab="users">
        {{ partial("Modules/ModuleUsersUI/AccessGroups/ModifyTabs/tabUsers") }}
    </div>

    <div class="ui bottom attached tab segment" data-tab="cdr-filter">
        {{ partial("Modules/ModuleUsersUI/AccessGroups/ModifyTabs/tabCDRFilter") }}
    </div>
{% endif %}


{{ partial("partials/submitbutton",['indexurl':'module-users-u-i/index']) }}

{{ endform() }}