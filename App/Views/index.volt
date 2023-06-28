{{ link_to("module-users-u-i/access-groups/modify", '<i class="add circle icon"></i> '~t._('module_usersui_AddNewAccessGroup'), "class": "ui blue button", "id":"add-new-button") }}
<div class="ui top attached tabular menu" id="main-users-ui-tab-menu">
    <a class="item active disability" data-tab="groups">{{ t._('module_usersui_Groups') }}</a>
    <a class="item disability" data-tab="users">{{ t._('module_usersui_Users') }}</a>
    <a class="item disability" data-tab="ldap">{{ t._('module_usersui_LdapConfigTab') }}</a>
</div>

<div class="ui bottom attached tab segment active" data-tab="groups">
    {% for record in groups %}
        {% if loop.first %}
            <table class="ui selectable compact table" id="access-groups-table">
            <thead>
            <tr>
                <th>{{ t._('module_usersui_ColumnGroupName') }}</th>
                <th class="center aligned">{{ t._('module_usersui_ColumnGroupMembersCount') }}</th>
                <th>{{ t._('module_usersui_ColumnGroupDescription') }}</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
        {% endif %}
        <tr class="group-row" id="{{ record.id }}">
            <td>{{ record.name }}</td>
            <td class="center aligned">{{ record.UsersCredentials |length }}</td>
            <td class="">
                {% if not (record.description is empty) and record.description|length>80 %}
                    <div class="ui basic icon button" data-content="{{ record.description }}" data-variation="wide">
                        <i class="file text icon"></i>
                    </div>
                {% else %}
                    {{ record.description }}
                {% endif %}
            </td>
            {{ partial("partials/tablesbuttons",
                [
                    'id': record.id,
                    'edit' : 'module-users-u-i/access-groups/modify/',
                    'delete': 'module-users-u-i/access-groups/delete/'
                ]) }}
        </tr>

        {% if loop.last %}

            </tbody>
            </table>
        {% endif %}
    {% endfor %}
</div>
<div class="ui bottom attached tab segment" data-tab="users">
    {% for member in members %}
        {% if loop.first %}
            <table class="ui selectable compact table" id="users-table" data-page-length='12'>
            <thead>
            <tr>
                <th>{{ t._('ex_Name') }}</th>
                <th class="center aligned">{{ t._('ex_Extension') }}</th>
                <th class="center aligned">{{ t._('ex_Mobile') }}</th>
                <th class="center aligned">{{ t._('ex_Email') }}</th>
                <th class="center aligned">{{ t._('module_usersui_ColumnGroupName') }}</th>
            </tr>
            </thead>
            <tbody>
        {% endif %}

        <tr class="member-row" id="{{ member['userid'] }}">
            <td>
                <img src="{{ member['avatar'] }}" class="ui avatar image"
                     data-value="{{ member['userid'] }} /"> {{ member['username'] }}
            </td>
            <td class="center aligned">{{ member['number'] }}</td>
            <td class="center aligned">{{ member['mobile'] }}</td>
            <td class="center aligned">{{ member['email'] }}</td>
            <td class="left aligned">
                <div class="ui dropdown select-group" data-value="{{ member['group'] }}">
                    <div class="text">{{ member['group'] }}</div>
                    <i class="dropdown icon"></i>
                </div>
            </td>
        </tr>
        {% if loop.last %}
            </tbody>
            </table>
        {% endif %}
    {% endfor %}
</div>

<div class="ui bottom attached tab segment" data-tab="ldap">
    {{ form('module-users-u-i/ldap-config/save', 'role': 'form', 'class': 'ui large form','id':'module-users-ui-ldap-form') }}
    <div class="field">
        <label for="serverName">{{ t._('module_usersui_LdapServerName') }}</label>
        {{ ldapForm.render('serverName') }}
    </div>
    <div class="field">
        <label for="serverPort">{{ t._('module_usersui_LdapServerPort') }}</label>
        {{ ldapForm.render('serverPort') }}
    </div>
    <div class="two fields">
        <div class="field">
            <label for="administrativeLogin">{{ t._('module_usersui_LdapAdminLogin') }}</label>
            <div class="field max-width-300">
                {{ ldapForm.render('administrativeLogin') }}
            </div>
        </div>
        <div class="field">
            <label for="administrativePassword">{{ t._('module_usersui_LdapAdminPassword') }}</label>
            <div class="field max-width-300">
                {{ ldapForm.render('administrativePassword') }}
            </div>
        </div>
    </div>
    <div class="field">
        <label for="baseDN">{{ t._('module_usersui_LdapBaseDN') }}</label>
        {{ ldapForm.render('baseDN') }}
    </div>
    <div class="field">
        <label for="userFilter">{{ t._('module_usersui_LdapUserFilter') }}</label>
        {{ ldapForm.render('userFilter') }}
    </div>
    <div class="field">
        <label for="userIdAttribute">{{ t._('module_usersui_LdapUserIdAttribute') }}</label>
        <div class="field max-width-300">
            {{ ldapForm.render('userIdAttribute') }}
        </div>
    </div>
    <div class="field">
        <label for="organizationalUnit">{{ t._('module_usersui_LdapOrganizationalUnit') }}</label>
        {{ ldapForm.render('organizationalUnit') }}
    </div>

<div class="ui basic segment">
    <div class="inline fields">

        <div class="field">
            <label for="testLogin">{{ t._('module_usersui_LdapCheckLogin') }}</label>
            <input name="testLogin" id="testLogin" type="text" />
        </div>

        <div class="field">
            <label for="testPassword">{{ t._('module_usersui_LdapCheckPassword') }}</label>
            <input name="testPassword" id="testPassword" type="password" />
        </div>

        <div class="field">
            <div class="ui labeled button check-ldap-credentials"><i class="ui icon check"></i>{{ t._('module_usersui_LdapCheckButton') }}</div>
        </div>
    </div>
</div>
    {{ endform() }}
</div>


<select id="users-groups-list" style="display: none;">
    {% for record in groups %}
        <option value="{{ record.id }}">{{ record.name }}</option>
    {% endfor %}
</select>