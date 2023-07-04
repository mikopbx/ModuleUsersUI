{{ link_to("module-users-u-i/access-groups/modify", '<i class="add circle icon"></i> '~t._('module_usersui_AddNewAccessGroup'), "class": "ui blue button", "id":"add-new-button") }}
<div class="ui top attached tabular menu" id="main-users-ui-tab-menu">
    <a class="item active disability" data-tab="groups">{{ t._('module_usersui_Groups') }}</a>
    <a class="item disability" data-tab="users">{{ t._('module_usersui_Users') }}</a>
    <a class="item disability" data-tab="ldap">{{ t._('module_usersui_LdapConfigTab') }}</a>
</div>

<div class="ui bottom attached tab segment active" data-tab="groups">
    {{ partial("Modules/ModuleUsersUI/Index/tabGroups") }}
</div>
<div class="ui bottom attached tab segment" data-tab="users">
    {{ partial("Modules/ModuleUsersUI/Index/tabUsers") }}
</div>

<div class="ui bottom attached tab segment" data-tab="ldap">
    {{ partial("Modules/ModuleUsersUI/Index/tabLdap") }}
</div>