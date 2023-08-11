{% for record in groups %}
    {% if loop.first %}
        {{ link_to("module-users-u-i/access-groups/modify", '<i class="add circle icon"></i> '~t._('module_usersui_AddNewAccessGroup'), "class": "ui blue button", "id":"add-new-button") }}
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
        <td>
            {% if record['fullAccess'] %}
                <i class="user cog icon"></i>
            {% else %}
                <i class="users icon"></i>
            {% endif %}
            {{ record['name'] }}
        </td>
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

{% if groups is null %}
<div class="ui placeholder segment">
    <div class="ui icon header">
        <i class="users icon"></i>
        {{ t._('module_usersui_NoAnyAccessGroup') }}
    </div>
    {{ link_to("module-users-u-i/access-groups/modify", '<i class="add circle icon"></i> '~t._('module_usersui_AddNewAccessGroupShort'), "class": "ui blue button", "id":"add-new-button") }}
</div>
{% endif %}