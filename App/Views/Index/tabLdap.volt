{{ form('module-users-u-i/ldap-config/save', 'role': 'form', 'class': 'ui large form','id':'module-users-ui-ldap-form') }}

<div class="field">
    <div class="ui toggle checkbox" id="use-ldap-auth-method">
        {{ ldapForm.render('useLdapAuthMethod') }}
        <label for="useLdapAuthMethod">{{ t._('module_usersui_LdapCheckbox') }}</label>
    </div>
</div>

<div class="fields disable-if-no-ldap">
    <div class="six wide field">
        <label for="serverName">{{ t._('module_usersui_LdapServerName') }}</label>
        {{ ldapForm.render('serverName') }}
    </div>
    <div class="two wide field">
        <label for="serverPort">{{ t._('module_usersui_LdapServerPort') }}</label>
        <div class="field max-width-200">
            {{ ldapForm.render('serverPort') }}
        </div>
    </div>
    <div class="eight wide field">
        <label for="baseDN">{{ t._('module_usersui_LdapBaseDN') }}</label>
        {{ ldapForm.render('baseDN') }}
    </div>
</div>

<div class="field disable-if-no-ldap">
    <label>{{ t._('module_usersui_LdapAdminLogin') }}</label>
    <div class="equal width fields">
        <div class="field max-width-250">
            {{ ldapForm.render('administrativeLogin') }}
        </div>
        <div class="field max-width-400">
            {{ ldapForm.render('administrativePasswordHidden') }}
        </div>
    </div>
</div>
<div class="field disable-if-no-ldap">
    <label for="userIdAttribute">{{ t._('module_usersui_LdapUserIdAttribute') }}</label>
    <div class="field max-width-300">
        {{ ldapForm.render('userIdAttribute') }}
    </div>
</div>
<div class="field disable-if-no-ldap">
    <label for="organizationalUnit">{{ t._('module_usersui_LdapOrganizationalUnit') }}</label>
    {{ ldapForm.render('organizationalUnit') }}
</div>
<div class="field disable-if-no-ldap">
    <label for="userFilter">{{ t._('module_usersui_LdapUserFilter') }}</label>
    {{ ldapForm.render('userFilter') }}
</div>
<div class="field disable-if-no-ldap">
    <div class="ui segment">
        <div class="ui header">{{ t._('module_usersui_LdapCheckHeader') }}</div>
        <p>{{ t._('module_usersui_LdapCheckLogin') }}</p>
        <div class="equal width fields" id="ldap-check-auth">
            <div class="field max-width-250">
                <input name="testLogin" id="testLogin" type="text" placeholder="DomainUser"/>
            </div>

            <div class="field">
                <input name="testPassword" id="testPassword" type="password" placeholder="Domain password"
                       autocomplete="off"/>
            </div>
            <div class="field">
                <div class="ui labeled icon basic button check-ldap-credentials"><i
                            class="ui icon check"></i>{{ t._('module_usersui_LdapCheckButton') }}</div>
            </div>
        </div>
    </div>
</div>
{{ partial("partials/submitbutton",['indexurl':'']) }}
<div class="ui clearing hidden divider"></div>
{{ endform() }}