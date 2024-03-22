<div class="grouped fields">
    <label>{{ t._('module_usersui_CDRFilterModeLabel') }}</label>
    <div class="field">
        <div class="ui radio checkbox cdr-filter-radio">
            {{ form.render('cdr_filter_mode_off') }}
            <label for="cdr_filter_mode_off">{{ t._('module_usersui_CDRFilterModeOff') }}</label>
        </div>
    </div>
    <div class="field">
        <div class="ui radio checkbox cdr-filter-radio">
            {{ form.render('cdr_filter_mode_by_list') }}
            <label for="cdr_filter_mode_by_list">{{ t._('module_usersui_CDRFilterModeInList') }}</label>
        </div>
    </div>
    <div class="field">
        <div class="ui radio checkbox cdr-filter-radio">
            {{ form.render('cdr_filter_mode_except_list') }}
            <label for="cdr_filter_mode_except_list">{{ t._('module_usersui_CDRFilterModeNotInList') }}</label>
        </div>
    </div>
</div>


{% for member in cdrFilterMembers %}
    {% if loop.first %}
        <table class="ui very compact table" id="cdr-filter-users-table">
        <thead>
        <tr>
            <th></th>
            <th>{{ t._('ex_Name') }}</th>
            <th class="center aligned">{{ t._('ex_Extension') }}</th>
            <th class="center aligned">{{ t._('ex_Mobile') }}</th>
            <th class="center aligned">{{ t._('ex_Email') }}</th>
        </tr>
        </thead>
        <tbody>
    {% endif %}
    <tr data-value="{{ member['userid'] }}">
        <td class="disability" >
            <div class="ui toggle checkbox cdr-filter-toggles" data-value="{{ member['userid'] }}">
                <input type="checkbox" name="cdr-filter-{{ member['userid'] }}"
                       {% if member['selected'] %}checked='checked'{% endif %} />
            </div>
        </td>
        <td class="disability">
            <img src="{{ member['avatar'] }}" class="ui avatar image"/> {{ member['username'] }}
        </td>
        <td class="center aligned disability">{{ member['number'] }}</td>
        <td class="center aligned disability">{{ member['mobile'] }}</td>
        <td class="center aligned disability">{{ member['email'] }}</td>
    </tr>
    {% if loop.last %}
        </tbody>
        </table>
    {% endif %}
{% endfor %}