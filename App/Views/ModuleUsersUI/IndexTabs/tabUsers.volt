{% for member in members %}
    {% if loop.first %}
        <table class="ui selectable compact table" id="users-table">
        <thead>
        <tr>
            <th class="">{{ t._('ex_Name') }}</th>
            <th class="center aligned collapsing hide-on-mobile">{{ t._('module_usersui_ColumnUserExtension') }}</th>
            <th class="center aligned show-only-if-ldap-enabled collapsing hide-on-mobile">{{ t._('module_usersui_ColumnUseLdap') }}</th>
            <th class="center aligned">{{ t._('module_usersui_ColumnUserLogin') }}</th>
            <th class="center aligned">{{ t._('module_usersui_ColumnUserPassword') }}</th>
            <th class="center aligned collapsing">{{ t._('module_usersui_ColumnGroupName') }}</th>
        </tr>
        </thead>
        <tbody>
    {% endif %}

    <tr class="member-row" id="{{ member['userid'] }}">
        <td class="collapsing">
            <img src="{{ member['avatar'] }}" class="ui avatar image"
                 data-value="{{ member['userid'] }} /"> {{ member['username'] }}
        </td>
        <td class="center aligned collapsing hide-on-mobile">
            {{ member['number'] }}
        </td>
        <td class="center aligned show-only-if-ldap-enabled hide-on-mobile">
            <div class="ui checkbox user-use-ldap-checkbox">
                <input name="use_ldap_auth{{ member['userid'] }}"
                       type="checkbox" {% if member['use_ldap_auth'] == '1' %} checked="checked" {% endif %} >
            </div>
        </td>
        <td class="center aligned login" {% if member['use_ldap_auth'] == '1'%} colspan="2" {% endif %}>
            <div class="ui transparent fluid input search inline-edit icon">
                <input class="user-login-input prompt" data-value="{{ member['userid'] }}"
                       value="{{ member['user_login'] }}" type="text" >
                <i class="ui spinner loading icon" style="display: none"></i>
                <div class="results"></div>
            </div>
        </td>
        <td class="center aligned password" {% if member['use_ldap_auth'] == '1'%} style="display: none" {% endif %}>
            <div class="ui transparent fluid input inline-edit icon">
                <input class="user-password-input" type="password" data-value="{{ member['userid'] }}"
                       value="{{ member['user_password'] }}">
                <i class="ui spinner loading icon" style="display: none"></i>
            </div>
        </td>
        <td class="left aligned collapsing">
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


<select id="users-groups-list" style="display: none;">
    <option value="No access">{{ t._('module_usersui_NoAccessGroupName') }}</option>
    {% for record in groups %}
        <option value="{{ record['id'] }}">{{ record['name'] }}</option>
    {% endfor %}
</select>