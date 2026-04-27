<form method="post" autocomplete="off" action="module-users-u-i/ldap-config/save" role="form" class="ui large form" id="module-users-ui-ldap-form">

<div class="field">
    <div class="ui toggle checkbox" id="use-ldap-auth-method">
        {{ ldapForm.render('useLdapAuthMethod') }}
        <label for="useLdapAuthMethod">{{ t._('module_usersui_LdapCheckbox') }}</label>
    </div>
</div>

<div class="inline field disable-if-no-ldap">
    <label for="ldapType">{{ t._('module_usersui_LdapType') }}</label>
    {{ ldapForm.render('ldapType') }}
</div>

<div class="ui top attached tabular menu disable-if-no-ldap" id="module-users-ui-ldap-sub-tabs">
    <a class="item active" data-tab="ldap-connection">{{ t._('module_usersui_TabConnection') }}</a>
    <a class="item ldap-cert-tab" data-tab="ldap-certificate" style="display:none;">
        {{ t._('module_usersui_TabCertificate') }}
        <i class="exclamation triangle icon ca-missing-warning" style="display:none; margin-left:0.3em;"></i>
    </a>
</div>

<div class="ui bottom attached tab segment active disable-if-no-ldap" data-tab="ldap-connection">

    <div class="fields">
        {{ ldapForm.render('tlsMode') }}
        <div class="six wide field">
            <label for="serverName">{{ t._('module_usersui_LdapServerName') }}</label>
            <div class="ui left labeled input">
                <div class="ui dropdown label use-tls-dropdown">
                    <div class="text">ldap://</div>
                    <i class="dropdown icon"></i>
                </div>
                {{ ldapForm.render('serverName') }}
            </div>
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

    <div class="field tls-settings" style="display:none;">
        <div class="ui segment">
            <div class="ui toggle checkbox">
                {{ ldapForm.render('verifyCert') }}
                <label for="verifyCert">{{ t._('module_usersui_VerifyCertificate') }}</label>
            </div>
            <div class="ui warning message insecure-tls-warning" style="display:none; margin-top:1em;">
                <i class="exclamation triangle icon"></i>
                <span>{{ t._('module_usersui_InsecureTlsWarning') }}</span>
            </div>
        </div>
    </div>

    <div class="field">
        <label>{{ t._('module_usersui_LdapAdminLogin') }}</label>
        <div class="fields">
            <div class="seven wide field">
                {{ ldapForm.render('administrativeLogin') }}
            </div>
            <div class="seven wide field">
                {{ ldapForm.render('administrativePasswordHidden') }}
            </div>
            <div class="two wide field">
                <div class="ui icon basic button test-ldap-bind"
                     data-tooltip="{{ t._('module_usersui_TestBindButton') }}"
                     data-position="top right"
                     data-variation="tiny">
                    <i class="key icon"></i>
                </div>
            </div>
        </div>
        <div class="ui message test-bind-result" style="display:none;"></div>
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
    <div class="field">
        <label for="userFilter">{{ t._('module_usersui_LdapUserFilter') }}</label>
        {{ ldapForm.render('userFilter') }}
    </div>
    <div class="field">
        <div class="ui segment">
            <div class="ui header">{{ t._('module_usersui_LdapCheckGetListHeader') }}</div>
            <p>{{ t._('module_usersui_LdapCheckGetUsersList') }}</p>
            <div class="field" id="ldap-check-get-users">
                <div class="ui labeled icon basic button check-ldap-get-users"><i
                            class="ui icon check"></i>{{ t._('module_usersui_LdapGetUsersButton') }}</div>
            </div>
        </div>
    </div>
    <div class="field">
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
</div>

<div class="ui bottom attached tab segment disable-if-no-ldap ca-certificate-field" data-tab="ldap-certificate">
    <div class="ui basic segment">
        <div class="ui header">{{ t._('module_usersui_CaCertificate') }}</div>
        <div class="ui info message">
            <div class="content">
                <p>{{ t._('module_usersui_CaCertificateHint') }}</p>
            </div>
        </div>
        {{ ldapForm.render('caCertificate') }}
    </div>
</div>

{{ partial("partials/submitbutton",['indexurl':'']) }}
<div class="ui clearing hidden divider"></div>
</form>
