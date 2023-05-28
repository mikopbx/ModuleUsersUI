{{ link_to("module-users-u-i/modify", '<i class="add circle icon"></i> '~t._('module_usersui_AddNewAccessGroup'), "class": "ui blue button", "id":"add-new-button") }}
<div class="ui top attached tabular menu" id="main-users-ui-tab-menu">
    <a class="item active disability" data-tab="groups">{{ t._('module_usersui_Groups') }}</a>
    <a class="item disability" data-tab="users">{{ t._('module_usersui_Users') }}</a>
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
                    'edit' : 'module-users-u-i/modify/',
                    'delete': 'module-users-u-i/delete/'
                ])
            }}
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


<select id="users-groups-list" style="display: none;">
    {% for record in groups %}
        <option value="{{ record.id }}">{{ record.name }}</option>
    {% endfor %}
</select>