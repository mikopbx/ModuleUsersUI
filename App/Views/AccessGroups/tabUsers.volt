<div class="ten wide field">
    <label>{{ t._('mod_usrgr_SelectMemberToAddToGroup') }}</label>
    {{ form.render('select-extension-field') }}
</div>

{% for member in members %}
    {% if loop.first %}
        <table class="ui very compact table" id="extensions-table" data-page-length='12'>
        <thead>
        <tr>
            <th>{{ t._('ex_Name') }}</th>
            <th class="center aligned">{{ t._('ex_Extension') }}</th>
            <th class="center aligned">{{ t._('ex_Mobile') }}</th>
            <th class="center aligned">{{ t._('ex_Email') }}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
    {% endif %}

    {% if member['hidden'] %}
<tr class="member-row" style="display: none;" id="ext-{{ member['number'] }}">
    {% else %}
<tr class="member-row selected-member" id="ext-{{ member['number'] }}">
    {% endif %}


    <td class="disability">
        <img src="{{ member['avatar'] }}" class="ui avatar image"
             data-value="{{ member['userid'] }} /"> {{ member['username'] }}
    </td>
    <td class="center aligned disability">{{ member['number'] }}</td>
    <td class="center aligned disability">{{ member['mobile'] }}</td>
    <td class="center aligned disability">{{ member['email'] }}</td>
    <td class="center aligned disability">
        <div class="ui tiny basic icon button delete-user-row" data-value="ext-{{ member['number'] }}"><i
                    class="ui red icon delete"></i></div>
    </td>
</tr>
    {% if loop.last %}
        </tbody>
        </table>
    {% endif %}
{% endfor %}