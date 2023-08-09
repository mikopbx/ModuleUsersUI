<div class="ui top attached tabular menu" id="main-users-ui-tab-menu">
    <a class="item active disability" data-tab="groups">{{ t._('module_usersui_Groups') }}</a>
    <a class="item disability" data-tab="users">{{ t._('module_usersui_Users') }}</a>
    <a class="item disability" data-tab="ldap">{{ t._('module_usersui_LdapConfigTab') }}</a>
</div>

<div class="ui bottom attached tab segment active disability" data-tab="groups">
    {{ partial("Modules/ModuleUsersUI/ModuleUsersUI/IndexTabs/tabGroups") }}
</div>
<div class="ui bottom attached tab segment disability" data-tab="users">
    {{ partial("Modules/ModuleUsersUI/ModuleUsersUI/IndexTabs/tabUsers") }}
</div>
<div class="ui bottom attached tab segment disability" data-tab="ldap">
    {{ partial("Modules/ModuleUsersUI/ModuleUsersUI/IndexTabs/tabLdap") }}
</div>