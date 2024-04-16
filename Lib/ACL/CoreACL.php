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

namespace Modules\ModuleUsersUI\Lib\ACL;

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
use Modules\ModuleUsersUI\Lib\EndpointConstants as RestEndpoints;

class CoreACL implements ACLInterface
{
    /**
     * Prepares list of linked controllers to other controllers to hide it from UI
     * and allow or disallow with the main one.
     *
     * @return array[]
     */
    public static function getLinkedControllerActions(): array
    {

        return [
            RestartController::class => [
                RestEndpoints::ACTION_INDEX => [ // if index allowed
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_GET_ACTIVE_CHANNELS, // Then this action allowed as well
                        RestEndpoints::ACTION_CDR_API_GET_ACTIVE_CALLS // And this action allowed as well
                    ]
                ]
            ],
            CallDetailRecordsController::class => [
                RestEndpoints::ACTION_INDEX => [
                    CallDetailRecordsController::class => [
                        RestEndpoints::ACTION_GET_NEW_RECORDS,
                    ],
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_PLAYBACK_V2,
                        RestEndpoints::ACTION_CDR_PLAYBACK,
                        RestEndpoints::ACTION_CDR_API_GET_RECORD_FILE_V2
                    ]
                ]
            ],
            SoundFilesController::class => [
                RestEndpoints::ACTION_INDEX => [
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_PLAYBACK_V2,
                        RestEndpoints::ACTION_CDR_API_GET_RECORD_FILE_V2
                    ]
                ],
                RestEndpoints::ACTION_SAVE => [
                    RestEndpoints::API_FILES => [
                        RestEndpoints::ACTION_FILES_API_UPLOAD_FILE
                    ]
                ],
                RestEndpoints::ACTION_DELETE => [
                    RestEndpoints::API_FILES => [
                        RestEndpoints::ACTION_FILES_API_REMOVE_AUDIO_FILE
                    ]
                ]
            ],
            IvrMenuController::class => [
                RestEndpoints::ACTION_MODIFY => [
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_PLAYBACK_V2,
                        RestEndpoints::ACTION_CDR_API_GET_RECORD_FILE_V2
                    ],
                    RestEndpoints::API_IVR_MENU => [
                        RestEndpoints::ACTION_API_DELETE_RECORD
                    ]
                ]
            ],
            CallQueuesController::class => [
                RestEndpoints::ACTION_MODIFY => [
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_PLAYBACK_V2,
                        RestEndpoints::ACTION_CDR_API_GET_RECORD_FILE_V2
                    ],
                    RestEndpoints::API_CALL_QUEUES => [
                        RestEndpoints::ACTION_API_DELETE_RECORD
                    ]
                ]
            ],
            GeneralSettingsController::class => [
                RestEndpoints::ACTION_MODIFY => [
                    RestEndpoints::API_CDR => [
                        RestEndpoints::ACTION_CDR_API_PLAYBACK_V2,
                        RestEndpoints::ACTION_CDR_API_GET_RECORD_FILE_V2
                    ]
                ]
            ],
            ProvidersController::class => [
                RestEndpoints::ACTION_INDEX => [
                    RestEndpoints::API_IAX => [
                        RestEndpoints::ACTION_API_GET_REGISTRY
                    ]
                ],
                'modifyiax' => [
                    RestEndpoints::API_IAX => [
                        RestEndpoints::ACTION_API_GET_REGISTRY
                    ]
                ],
                'modifysip' => [
                    RestEndpoints::API_SIP => [
                        RestEndpoints::ACTION_API_GET_REGISTRY
                    ]
                ],
                RestEndpoints::ACTION_SAVE => [
                    ProvidersController::class => [
                        RestEndpoints::ACTION_ENABLE,
                        RestEndpoints::ACTION_DISABLE
                    ]
                ]
            ],
            ExtensionsController::class =>
                [
                    RestEndpoints::ACTION_INDEX => [
                        ExtensionsController::class => [
                            RestEndpoints::ACTION_GET_NEW_RECORDS,
                        ],
                        RestEndpoints::API_SIP => [
                            RestEndpoints::ACTION_SIP_API_GET_PEERS_STATUSES
                        ]
                    ],
                    RestEndpoints::ACTION_MODIFY => [
                        RestEndpoints::API_SIP => [
                            RestEndpoints::ACTION_SIP_API_GET_PEER,
                            RestEndpoints::ACTION_SIP_API_GET_SECRET,
                        ],
                        RestEndpoints::API_EXTENSIONS => [
                            RestEndpoints::ACTION_EXT_API_GET_RECORD,
                            RestEndpoints::ACTION_EXT_API_SAVE_RECORD,
                            RestEndpoints::ACTION_API_DELETE_RECORD,
                        ]
                    ],
                ],
            IncomingRoutesController::class => [
                RestEndpoints::ACTION_SAVE => [
                    IncomingRoutesController::class => [
                        RestEndpoints::ACTION_CHANGE_PRIORITY
                    ]
                ]
            ],
            OutboundRoutesController::class => [
                RestEndpoints::ACTION_SAVE => [
                    OutboundRoutesController::class => [
                        RestEndpoints::ACTION_CHANGE_PRIORITY
                    ]
                ]
            ],
            ConferenceRoomsController::class => [
                RestEndpoints::ACTION_MODIFY => [
                    RestEndpoints::API_CONFERENCE_ROOMS => [
                        RestEndpoints::ACTION_API_DELETE_RECORD
                    ],
                ],
            ],
            DialplanApplications::class => [
                RestEndpoints::ACTION_MODIFY => [
                    RestEndpoints::API_DIALPLAN_APPLICATIONS => [
                        RestEndpoints::ACTION_API_DELETE_RECORD
                    ],
                ],
            ],
            OutOffWorkTimeController::class => [
                RestEndpoints::ACTION_SAVE => [
                    OutOffWorkTimeController::class => [
                        RestEndpoints::ACTION_CHANGE_PRIORITY
                    ]
                ]
            ],
        ];
    }

    /**
     * Returns list of controllers that are always allowed
     * @return array
     */
    public static function getAlwaysAllowed(): array{
        return [
            AsteriskManagersController::class => [
                RestEndpoints::ACTION_API_AVAILABLE,
            ],
            ErrorsController::class => '*',
            LocalizationController::class => '*',
            LanguageController::class => '*',
            SessionController::class => '*',
            SoundFilesController::class => [
                RestEndpoints::ACTION_SOUND_GET_PATH_BY_ID,
                RestEndpoints::ACTION_SOUND_GET_FILES
            ],
            TopMenuSearchController::class => '*',
            WikiLinksController::class => '*',
            RestEndpoints::API_EXTENSIONS => [
                RestEndpoints::ACTION_EXT_API_GET_FOR_SELECT,
                RestEndpoints::ACTION_EXT_API_AVAILABLE,
                RestEndpoints::ACTION_EXT_API_GET_PHONE_REPRESENT,
                RestEndpoints::ACTION_EXT_API_GET_PHONES_REPRESENT
            ],
            RestEndpoints::API_USERS => [
                RestEndpoints::ACTION_EXT_API_AVAILABLE,
            ],
            RestEndpoints::API_FILES => [
                RestEndpoints::ACTION_FILES_STATUS_UPLOAD,
            ],
            RestEndpoints::API_SYSTEM => [
                RestEndpoints::ACTION_SYS_CONVERT_AUDIO_FILE,
                RestEndpoints::ACTION_SYS_PING,
            ],
            RestEndpoints::API_LICENSE => [
                RestEndpoints::ACTION_LIC_SEND_PBX_METRICS
            ],
            RestEndpoints::API_NCHAN => '*',
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
            RestEndpoints::API_SOME_ENDPOINT => '*',
            RestEndpoints::API_FILES => [
                RestEndpoints::ACTION_FILES_FIRMWARE_DOWNLOAD_STATUS,
                RestEndpoints::ACTION_FILES_DOWNLOAD_NEW_FIRMWARE,
                RestEndpoints::ACTION_FILES_GET_FILE_CONTENT
            ],
            RestEndpoints::API_FIREWALL => '*',
            RestEndpoints::API_LICENSE => '*',
            RestEndpoints::API_MODULES_CORE => '*',
            RestEndpoints::API_SYSTEM => [
                RestEndpoints::ACTION_SYS_UPGRADE,
                RestEndpoints::ACTION_SYS_SET_DATE,
                RestEndpoints::ACTION_SYS_REBOOT,
                RestEndpoints::ACTION_SYS_SHUTDOWN,
                RestEndpoints::ACTION_SYS_GET_DATE,
                RestEndpoints::ACTION_SYS_UPDATE_MAIL_SETTINGS,
                RestEndpoints::ACTION_SYS_RESTORE_DEFAULT,
                RestEndpoints::ACTION_SYS_SEND_MAIL
            ],
            RestEndpoints::API_SYSLOG => '*',
            RestEndpoints::API_SYSINFO => '*',
            RestEndpoints::API_STORAGE => '*',
            RestEndpoints::API_ADVICE => [
                RestEndpoints::ACTION_ADVICE_GET_LIST,
            ],

        ];
    }
}