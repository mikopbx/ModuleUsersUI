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

use MikoPBX\AdminCabinet\Controllers\AsteriskManagersController;
use MikoPBX\AdminCabinet\Controllers\CallDetailRecordsController;
use MikoPBX\AdminCabinet\Controllers\CallQueuesController;
use MikoPBX\AdminCabinet\Controllers\ConferenceRoomsController;
use MikoPBX\AdminCabinet\Controllers\ConsoleController;
use MikoPBX\AdminCabinet\Controllers\CustomFilesController;
use MikoPBX\AdminCabinet\Controllers\ErrorsController;
use MikoPBX\AdminCabinet\Controllers\ExtensionsController;
use MikoPBX\AdminCabinet\Controllers\Fail2BanController;
use MikoPBX\AdminCabinet\Controllers\FirewallController;
use MikoPBX\AdminCabinet\Controllers\GeneralSettingsController;
use MikoPBX\AdminCabinet\Controllers\IncomingRoutesController;
use MikoPBX\AdminCabinet\Controllers\IvrMenuController;
use MikoPBX\AdminCabinet\Controllers\LanguageController;
use MikoPBX\AdminCabinet\Controllers\LicensingController;
use MikoPBX\AdminCabinet\Controllers\LocalizationController;
use MikoPBX\AdminCabinet\Controllers\MailSettingsController;
use MikoPBX\AdminCabinet\Controllers\NetworkController;
use MikoPBX\AdminCabinet\Controllers\OutboundRoutesController;
use MikoPBX\AdminCabinet\Controllers\OutOffWorkTimeController;
use MikoPBX\AdminCabinet\Controllers\PbxExtensionModulesController;
use MikoPBX\AdminCabinet\Controllers\ProvidersController;
use MikoPBX\AdminCabinet\Controllers\RestartController;
use MikoPBX\AdminCabinet\Controllers\SessionController;
use MikoPBX\AdminCabinet\Controllers\SoundFilesController;
use MikoPBX\AdminCabinet\Controllers\SystemDiagnosticController;
use MikoPBX\AdminCabinet\Controllers\TimeSettingsController;
use MikoPBX\AdminCabinet\Controllers\TopMenuSearchController;
use MikoPBX\AdminCabinet\Controllers\UpdateController;
use MikoPBX\AdminCabinet\Controllers\WikiLinksController;
use MikoPBX\Common\Models\DialplanApplications;
use Modules\ModuleUsersUI\App\Controllers\AccessGroupsController;
use Modules\ModuleUsersUI\App\Controllers\LdapConfigController;
use Modules\ModuleUsersUI\App\Controllers\ModuleUsersUIController;
use Modules\ModuleUsersUI\App\Controllers\UsersCredentialsController;
use Modules\ModuleUsersUI\Models\AccessGroups;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;
use Phalcon\Di;
use Phalcon\Mvc\Model\Query;

class UsersUIACL extends \Phalcon\Di\Injectable
{
    /**
     * Modifies the ACL list based on the database query result.
     *
     * @param AclList $aclList The ACL list to modify.
     * @return void
     */
    public static function modify(AclList $aclList): void
    {
        $query = self::buildAclQuery();
        $aclSettings = $query->execute();

        $previousRole = null;
        $actionsArray = [];
        $linkedControllersActions = self::getLinkedControllersActions();
        foreach ($aclSettings as $index => $aclFromModule) {
            $role = Constants::MODULE_ROLE_PREFIX . $aclFromModule->accessGroupId;
            $isLastAcl = $index === count($aclSettings) - 1;

            if ($previousRole !== $role) {
                // Add components and allow access for previous role
                if ($previousRole !== null) {
                    foreach ($actionsArray as $controller => $actions) {
                        $aclList->addComponent(new Component($controller), $actions);
                        $aclList->allow($previousRole, $controller, $actions);
                    }
                }
                $previousRole = $role;

                // Add a new role to the ACL list
                $aclList->addRole(new AclRole($role, $aclFromModule->name));

                if ($aclFromModule->fullAccess) {
                    // If full access is granted, allow all actions
                    $aclList->allow($role, '*', '*');
                    continue;
                }
                $actionsArray = self::getAlwaysAllowed();
            }
            if (!$aclFromModule->fullAccess && isset($aclFromModule->actions)) {
                $allowedActions = json_decode($aclFromModule->actions, true);

                if (array_key_exists($aclFromModule->controller, $actionsArray)
                    && is_array($actionsArray[$aclFromModule->controller])) {
                    // Merge allowed actions with existing actions for the controller
                    $actionsArray[$aclFromModule->controller] = array_merge($actionsArray[$aclFromModule->controller], $allowedActions);
                    $actionsArray[$aclFromModule->controller] = array_unique($actionsArray[$aclFromModule->controller]);
                } else {
                    // Set allowed actions for the controller
                    $actionsArray[$aclFromModule->controller] = $allowedActions;
                }

                // Process linked controllers and their actions
                if (array_key_exists($aclFromModule->controller, $linkedControllersActions)) {
                    foreach ($linkedControllersActions[$aclFromModule->controller] as $mainAction => $linkedControllers) {
                        if ($allowedActions === '*'
                            || is_array($allowedActions) && in_array($mainAction, $allowedActions)) {
                            foreach ($linkedControllers as $linkedController => $linkedActions) {
                                if (array_key_exists($linkedController, $actionsArray)
                                    && is_array($actionsArray[$linkedController])) {
                                    // Merge linked actions with existing actions for the linked actions
                                    $actionsArray[$linkedController] = array_merge($actionsArray[$linkedController], $linkedActions);
                                    $actionsArray[$linkedController] = array_unique($actionsArray[$linkedController]);
                                } else {
                                    // Set linked actions for the controller
                                    $actionsArray[$linkedController] = $linkedActions;
                                }
                            }
                        }
                    }
                }
            }

            if ($isLastAcl) {
                // Add components and allow access for the last role
                if ($previousRole !== null) {
                    foreach ($actionsArray as $controller => $actions) {
                        $aclList->addComponent(new Component($controller), $actions);
                        $aclList->allow($previousRole, $controller, $actions);
                    }
                }
                // Add a new role to the ACL list
                $aclList->addRole(new AclRole($role, $aclFromModule->name));
            }
        }
    }

    /**
     * Builds the ACL database query.
     *
     * @return Query The built database query.
     */
    private static function buildAclQuery(): Query
    {
        $parameters = [
            'columns' => [
                'accessGroupId' => 'AccessGroups.id',
                'name' => 'AccessGroups.name',
                'controller' => 'AccessGroupsRights.controller',
                'actions' => 'AccessGroupsRights.actions',
                'fullAccess' => 'AccessGroups.fullAccess'
            ],
            'models' => [
                'AccessGroups' => AccessGroups::class,
            ],
            'joins' => [
                'AccessGroupsRights' => [
                    0 => AccessGroupsRights::class,
                    1 => 'AccessGroupsRights.group_id = AccessGroups.id',
                    2 => 'AccessGroupsRights',
                    3 => 'LEFT',
                ],
            ],
            'group' => 'AccessGroups.id, AccessGroupsRights.controller',
            'order' => 'AccessGroups.id, AccessGroupsRights.controller'
        ];

        $di = Di::getDefault();
        $query = $di->get('modelsManager')->createBuilder($parameters)->getQuery();

        return $query;
    }

    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * @return array[]
     */
    public static function getLinkedControllersActions(): array
    {
        return [
            RestartController::class => [
                'index' => [ // if index allowed
                    '/pbxcore/api/cdr' => [
                        '/getActiveChannels', // Then this action allowed as well
                        '/getActiveCalls' // And this action allowed as well
                    ]
                ]
            ],
            CallDetailRecordsController::class => [
                'index' => [
                    CallDetailRecordsController::class => [
                        'getNewRecords',
                    ],
                    '/pbxcore/api/cdr' => [
                        '/v2/playback',
                        '/playback',
                        '/v2/getRecordFile'
                    ]
                ]
            ],
            SoundFilesController::class => [
                'index' => [
                    '/pbxcore/api/cdr' => [
                        '/v2/playback',
                        '/v2/getRecordFile'
                    ]
                ],
                'save' => [
                    '/pbxcore/api/files' => [
                        '/uploadFile'
                    ]
                ],
                'delete' => [
                    '/pbxcore/api/files' => [
                        '/removeAudioFile'
                    ]
                ]
            ],
            IvrMenuController::class => [
                'modify' => [
                    '/pbxcore/api/cdr' => [
                        '/v2/playback',
                        '/v2/getRecordFile'
                    ],
                    '/pbxcore/api/ivr-menu'=>[
                        '/deleteRecord'
                    ]
                ]
            ],
            CallQueuesController::class => [
                'modify' => [
                    '/pbxcore/api/cdr' => [
                        '/v2/playback',
                        '/v2/getRecordFile'
                    ],
                    '/pbxcore/api/call-queues'=>[
                        '/deleteRecord'
                    ]
                ]
            ],
            GeneralSettingsController::class => [
                'modify' => [
                    '/pbxcore/api/cdr' => [
                        '/v2/playback',
                        '/v2/getRecordFile'
                    ]
                ]
            ],
            ProvidersController::class => [
                'index' => [
                    '/pbxcore/api/iax' => [
                        '/getRegistry'
                    ]
                ],
                'modifyiax' => [
                    '/pbxcore/api/iax' => [
                        '/getRegistry'
                    ]
                ],
                'modifysip' => [
                    '/pbxcore/api/sip' => [
                        '/getRegistry'
                    ]
                ],
                'save' => [
                    ProvidersController::class => [
                        'enable',
                        'disable'
                    ]
                ]
            ],
            ExtensionsController::class =>
                [
                    'index' => [
                        ExtensionsController::class => [
                            'getNewRecords',
                        ],
                        '/pbxcore/api/sip' => [
                            '/getPeersStatuses'
                        ]
                    ],
                    'modify' => [
                        '/pbxcore/api/sip' => [
                            '/getSipPeer',
                            '/getSecret'
                        ],
                        '/pbxcore/api/extensions' => [
                            '/getRecord',
                            '/saveRecord',
                            '/deleteRecord',
                        ]
                    ],
                ],
            IncomingRoutesController::class => [
                'save' => [
                    IncomingRoutesController::class => [
                        'changePriority'
                    ]
                ]
            ],
            OutboundRoutesController::class => [
                'save' => [
                    OutboundRoutesController::class => [
                        'changePriority'
                    ]
                ]
            ],
            ConferenceRoomsController::class => [
                'modify' => [
                    '/pbxcore/api/conference-rooms' => [
                        '/deleteRecord'
                    ],
                ],
            ],
            DialplanApplications::class => [
                'modify' => [
                    '/pbxcore/api/dialplan-applications' => [
                        '/deleteRecord'
                    ],
                ],
            ],
            OutOffWorkTimeController::class => [
                'save' => [
                    OutOffWorkTimeController::class => [
                        'changePriority'
                    ]
                ]
            ],
        ];
    }

    /**
     * Returns list of controllers that are always allowed
     * @return array
     */
    public static function getAlwaysAllowed(): array
    {
        return [
            AsteriskManagersController::class => [
                'available',
            ],
            ErrorsController::class => '*',
            LocalizationController::class => '*',
            LanguageController::class => '*',
            SessionController::class => '*',
            SoundFilesController::class => [
                'getPathById',
                'getSoundFiles'
            ],
            TopMenuSearchController::class => '*',
            WikiLinksController::class => '*',
            '/pbxcore/api/extensions' => [
                '/getForSelect',
                '/available',
                '/getPhoneRepresent',
                '/getPhonesRepresent'
            ],
            '/pbxcore/api/users' => [
                '/available',
            ],
            '/pbxcore/api/files' => [
                '/statusUpload',
            ],
            '/pbxcore/api/system' => [
                '/convertAudioFile',
                '/ping',
            ],
            '/pbxcore/api/license' => [
                '/sendPBXMetrics'
            ],
            '/pbxcore/api/nchan' => '*',
        ];
    }

    /**
     * The list of controllers that are always disallowed
     * only for superusers
     * @return array
     */
    public static function getAlwaysDenied(): array
    {
        return [
            // AdminCabinet controllers
            ConsoleController::class => '*',
            CustomFilesController::class => '*',
            Fail2BanController::class => '*',
            FirewallController::class => '*',
            GeneralSettingsController::class => '*',
            LicensingController::class => '*',
            MailSettingsController::class => '*',
            NetworkController::class => '*',
            PbxExtensionModulesController::class => '*',
            RestartController::class => '*',
            SystemDiagnosticController::class => '*',
            TimeSettingsController::class => '*',
            UpdateController::class => '*',

            // CORE REST API
            '/pbxcore/api/someendpoint' => '*',
            '/pbxcore/api/files' => [
                '/firmwareDownloadStatus',
                '/downloadNewFirmware',
                '/getFileContent'
            ],
            '/pbxcore/api/firewall' => '*',
            '/pbxcore/api/license' => '*',
            '/pbxcore/api/modules/core' => '*',
            '/pbxcore/api/system' => [
                '/upgrade',
                '/setDate',
                '/reboot',
                '/shutdown',
                '/getDate',
                '/updateMailSettings',
                '/restoreDefault',
                '/sendMail'
            ],
            '/pbxcore/api/syslog' => '*',
            '/pbxcore/api/sysinfo' => '*',
            '/pbxcore/api/storage' => '*',
            '/pbxcore/api/advices' => [
                '/getList',
            ],

            // Module UsersUI
            AccessGroupsController::class => '*',
            LdapConfigController::class => '*',
            ModuleUsersUIController::class => '*',
            UsersCredentialsController::class => '*',
            '/pbxcore/api/modules/module-users-u-i' => '*',

        ];
    }
}