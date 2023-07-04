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
    <tr class="group-row" id="{{ record['id'] }}">
        <td>{{ record['name'] }}</td>
        <td class="center aligned">{{ record['countUsers'] }}</td>
        <td class="">
            {% if not (record['description'] is empty) and record['description']|length>80 %}
                <div class="ui basic icon button" data-content="{{ record['description'] }}" data-variation="wide">
                    <i class="file text icon"></i>
                </div>
            {% else %}
                {{ record['description'] }}
            {% endif %}
        </td>
        {{ partial("partials/tablesbuttons",
            [
                'id': record['id'],
                'edit' : 'module-users-u-i/access-groups/modify/',
                'delete': 'module-users-u-i/access-groups/delete/'
            ]) }}
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