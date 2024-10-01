<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2023 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

namespace Modules\ModuleUsersUI\Lib;

use LdapRecord\Auth\Events\Failed;
use LdapRecord\Container;
use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Common\Providers\LoggerAuthProvider;
use Modules\ModuleLdapSync\Lib\AnswerStructure;
use Phalcon\Di\Injectable;

include_once __DIR__.'/../vendor/autoload.php';

/**
 * @property \MikoPBX\Common\Providers\TranslationProvider translation
 */
class UsersUILdapAuth extends Injectable
{
    private string $serverName;
    private string $serverPort;
    private bool $useTLS;
    private string $baseDN;
    private string $administrativeLogin;
    private string $administrativePassword;
    private string $userIdAttribute;
    private string $organizationalUnit;
    private string $userFilter;

    // Ldap connection
    private \LdapRecord\Connection $connection;
    /**
     * The class of the user model based on LDAP type.
     *
     * @var string
     */
    private string $userModelClass;

    public function __construct(array $ldapCredentials)
    {
        $this->serverName = $ldapCredentials['serverName'];
        $this->serverPort = $ldapCredentials['serverPort'];
        $this->baseDN = $ldapCredentials['baseDN'];
        $this->administrativeLogin = $ldapCredentials['administrativeLogin'];
        $this->administrativePassword = $ldapCredentials['administrativePassword'];
        $this->userIdAttribute = $ldapCredentials['userIdAttribute'];
        $this->organizationalUnit = $ldapCredentials['organizationalUnit'];
        $this->userFilter = $ldapCredentials['userFilter'];
        $this->useTLS = $ldapCredentials['useTLS']==='1';

        // Set user model class based on LDAP type
        $this->userModelClass = $this->getUserModelClass($ldapCredentials['ldapType']);
    }

    /**
     * Check authentication via LDAP.
     *
     * @param string $username The username for authentication.
     * @param string $password The password for authentication.
     * @param string $message The error message.
     * @return bool The authentication result.
     */
    public function checkAuthViaLdap(string $username, string $password, string &$message=''): bool
    {
        // Create a new LDAP connection
        $this->connection = new \LdapRecord\Connection([
            'hosts' => [$this->serverName],
            'port' => $this->serverPort,
            'base_dn' => $this->baseDN,
            'username' => $this->administrativeLogin,
            'password' => $this->administrativePassword,
            'timeout'  => 15,
            'use_tls'  => $this->useTLS,
            'options' => [
                // See: http://php.net/ldap_set_option
                LDAP_OPT_X_TLS_REQUIRE_CERT => LDAP_OPT_X_TLS_ALLOW
            ]
        ]);

        $success = false;
        $message = $this->translation->_('module_usersui_ldap_user_not_found');
        try {
            $this->connection->connect();
            Container::addConnection($this->connection);

            $dispatcher = Container::getEventDispatcher();

            // Listen for failed authentication event
            $dispatcher->listen(Failed::class, function (Failed $event) use (&$message) {
                $ldap = $event->getConnection();
                $error = $ldap->getDiagnosticMessage();

                // Update message based on error code
                if (strpos($error, '532') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_password_expired');
                } elseif (strpos($error, '533') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_disabled');
                } elseif (strpos($error, '701') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_expired');
                } elseif (strpos($error, '775') !== false) {
                    $message = $this->translation->_('module_usersui_ldap_account_locked');
                } else {
                    $message = $this->translation->_('module_usersui_ldap_password_incorrect');
                }
            });

            // Query LDAP for the user
            $query = call_user_func([$this->userModelClass, 'query']);

            if ($this->userFilter!==''){
                $query->rawFilter($this->userFilter);
            }
            if ($this->organizationalUnit!==''){
                $query->in($this->organizationalUnit);
            }

            $user = $query->where($this->userIdAttribute, '=', $username)->first();

            if ($user) {
                // Continue with authentication if user is found and attempt authentication
                if ($this->connection->auth()->attempt($user->getDN(), $password)) {
                    $message = $this->translation->_('module_usersui_ldap_successfully_authenticated');
                    $success = true;
                }
            }
        } catch (\Throwable $e) {
            CriticalErrorsHandler::handleExceptionWithSyslog($e);
            $message = $e->getMessage();
        }

        if (!$success) {
            $this->di->get(LoggerAuthProvider::SERVICE_NAME)->warning("LDAP authentication {$username} failed: {$message}");
        }

        return $success;
    }

    /**
     * Get the class of the user model based on LDAP type.
     *
     * @param string $ldapType The LDAP type.
     * @return string The user model class.
     */
    private function getUserModelClass(string $ldapType): string
    {
        switch ($ldapType) {
            case 'OpenLDAP':
                return \LdapRecord\Models\OpenLDAP\User::class;
            case 'DirectoryServer':
                return \LdapRecord\Models\DirectoryServer\User::class;
            case 'FreeIPA':
                return \LdapRecord\Models\FreeIPA\User::class;
            default:
                return \LdapRecord\Models\ActiveDirectory\User::class;
        }
    }

    /**
     * Get available users list via LDAP.
     *
     * @return AnswerStructure list of users.
     */
    public function getUsersList(): AnswerStructure
    {
        $res = new AnswerStructure();
        $res->success=true;

        // Create a new LDAP connection
        $this->connection = new \LdapRecord\Connection([
            'hosts' => [$this->serverName],
            'port' => $this->serverPort,
            'base_dn' => $this->baseDN,
            'username' => $this->administrativeLogin,
            'password' => $this->administrativePassword,
            'timeout'  => 15,
            'use_tls'  => $this->useTLS,
            'options' => [
                // See: http://php.net/ldap_set_option
                LDAP_OPT_X_TLS_REQUIRE_CERT => LDAP_OPT_X_TLS_ALLOW
            ]
        ]);

        $listOfAvailableUsers = [];
        try {
            $this->connection->connect();
            Container::addConnection($this->connection);

            $dispatcher = Container::getEventDispatcher();
            // Listen for failed authentication event
            $dispatcher->listen(Failed::class, function (Failed $event) use (&$message) {
                $ldap = $event->getConnection();
                $message = $ldap->getDiagnosticMessage();
            });

            // Query LDAP for the user
            $query = call_user_func([$this->userModelClass, 'query']);

            if ($this->userFilter!==''){
                $query->rawFilter($this->userFilter);
            }
            if ($this->organizationalUnit!==''){
                $query->in($this->organizationalUnit);
            }
            $users = $query->get();
            foreach ($users as $user) {
                $record = [];
                if ($user->hasAttribute($this->userIdAttribute)
                    && $user->getFirstAttribute($this->userIdAttribute)!==null
                    ){
                    $record['login']=$user->getFirstAttribute($this->userIdAttribute);
                    $record['name']=$user->getFirstAttribute($this->userIdAttribute);
                }
                if ($user->hasAttribute('name')
                    && $user->getFirstAttribute('name')!==null){
                    $record['name']=$user->getFirstAttribute('name');
                }
                if (!empty($record)){
                    $listOfAvailableUsers[] = $record;
                }
            }
            // Sort the array based on the name value
            usort($listOfAvailableUsers, function($a, $b){
                return $a['name'] > $b['name'];
            });
        } catch (\LdapRecord\Auth\BindException $e) {
            $res->messages[] = $this->translation->_('module_usersui_ldap_user_not_found');
            $res->success=false;
        } catch (\Throwable $e) {
            CriticalErrorsHandler::handleExceptionWithSyslog($e);
            $res->messages[] = $e->getMessage();
            $res->success=false;
        }

        $res->data = $listOfAvailableUsers;
        return $res;
    }
}