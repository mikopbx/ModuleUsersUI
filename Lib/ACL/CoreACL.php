<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
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

use MikoPBX\AdminCabinet\Controllers\AclController;
use MikoPBX\AdminCabinet\Controllers\ApiKeysController;
use Modules\ModuleUsersUI\App\Controllers\UserProfileController;
use MikoPBX\AdminCabinet\Controllers\AsteriskManagersController;
use MikoPBX\AdminCabinet\Controllers\CallDetailRecordsController;
use MikoPBX\AdminCabinet\Controllers\CallQueuesController;
use MikoPBX\AdminCabinet\Controllers\ConferenceRoomsController;
use MikoPBX\AdminCabinet\Controllers\ConsoleController;
use MikoPBX\AdminCabinet\Controllers\CustomFilesController;
use MikoPBX\AdminCabinet\Controllers\DialplanApplicationsController;
use MikoPBX\AdminCabinet\Controllers\ErrorsController;
use MikoPBX\AdminCabinet\Controllers\ExtensionsController;
use MikoPBX\AdminCabinet\Controllers\Fail2BanController;
use MikoPBX\AdminCabinet\Controllers\FirewallController;
use MikoPBX\AdminCabinet\Controllers\GeneralSettingsController;
use MikoPBX\AdminCabinet\Controllers\IncomingRoutesController;
use MikoPBX\AdminCabinet\Controllers\IvrMenuController;
use MikoPBX\AdminCabinet\Controllers\LicensingController;
use MikoPBX\AdminCabinet\Controllers\LocalizationController;
use MikoPBX\AdminCabinet\Controllers\MailSettingsController;
use MikoPBX\AdminCabinet\Controllers\NetworkController;
use MikoPBX\AdminCabinet\Controllers\OffWorkTimesController;
use MikoPBX\AdminCabinet\Controllers\OutboundRoutesController;
use MikoPBX\AdminCabinet\Controllers\PbxExtensionModulesController;
use MikoPBX\AdminCabinet\Controllers\ProvidersController;
use MikoPBX\AdminCabinet\Controllers\RestartController;
use MikoPBX\AdminCabinet\Controllers\SessionController;
use MikoPBX\AdminCabinet\Controllers\SoundFilesController;
use MikoPBX\AdminCabinet\Controllers\StorageController;
use MikoPBX\AdminCabinet\Controllers\SystemDiagnosticController;
use MikoPBX\AdminCabinet\Controllers\TimeSettingsController;
use MikoPBX\AdminCabinet\Controllers\UpdateController;
use Modules\ModuleUsersUI\Lib\EndpointConstants as E;

/**
 * Core ACL Configuration
 *
 * Defines ACL rules for AdminCabinet controllers and REST API v3 endpoints.
 * This class provides:
 * - Linked actions: when allowing one action automatically allows related actions
 * - Always allowed: public actions that don't require permission checks
 * - Always denied: admin-only actions that regular users cannot access
 */
class CoreACL implements ACLInterface
{
    /**
     * Prepares list of linked controller actions.
     *
     * When a user is granted access to a main action (e.g., 'index'),
     * they automatically get access to all linked actions.
     * This simplifies permission management for the UI administrator.
     *
     * Structure:
     * [MainController => [
     *     'mainAction' => [
     *         TargetController/Endpoint => ['linkedAction1', 'linkedAction2']
     *     ]
     * ]]
     *
     * @return array<string, array<string, array<string, array<string>>>>
     */
    public static function getLinkedControllerActions(): array
    {
        return [
            // Restart page needs to show active calls/channels
            RestartController::class => [
                E::ACTION_MANAGE => [
                    E::API_V3_PBX_STATUS => [
                        E::ACTION_PBX_STATUS_GET_ACTIVE_CHANNELS,
                        E::ACTION_PBX_STATUS_GET_ACTIVE_CALLS,
                    ],
                ],
            ],

            // CDR page needs playback and metadata access
            CallDetailRecordsController::class => [
                E::ACTION_INDEX => [
                    CallDetailRecordsController::class => [
                        E::ACTION_GET_NEW_RECORDS,
                    ],
                    E::API_V3_CDR => [
                        E::ACTION_GET_LIST,
                        E::ACTION_GET_RECORD,
                        E::ACTION_CDR_PLAYBACK,
                        E::ACTION_CDR_DOWNLOAD,
                        E::ACTION_CDR_GET_METADATA,
                    ],
                ],
                E::ACTION_SAVE => [
                    E::API_V3_CDR => [
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // Sound files need playback for preview
            SoundFilesController::class => [
                E::ACTION_INDEX => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_PLAYBACK,
                    ],
                ],
                E::ACTION_MODIFY => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_PLAYBACK,
                        E::ACTION_SOUND_UPLOAD_FILE,
                    ],
                ],
                E::ACTION_SAVE => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_UPLOAD_FILE,
                        E::ACTION_SOUND_CONVERT_AUDIO,
                    ],
                    E::API_V3_FILES => [
                        E::ACTION_DELETE,
                        E::ACTION_UPLOAD,
                    ],
                ],
                E::ACTION_DELETE => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // IVR menu modification needs sound playback
            IvrMenuController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_PLAYBACK,
                    ],
                    E::API_V3_IVR_MENU => [
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // Call queues modification needs sound playback
            CallQueuesController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_PLAYBACK,
                    ],
                    E::API_V3_CALL_QUEUES => [
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // General settings needs sound playback for MOH preview
            GeneralSettingsController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_SOUND_FILES => [
                        E::ACTION_SOUND_PLAYBACK,
                    ],
                ],
            ],

            // Providers need registry status and CRUD operations
            ProvidersController::class => [
                E::ACTION_INDEX => [
                    E::API_V3_SIP_PROVIDERS => [
                        E::ACTION_GET_LIST,
                        E::ACTION_SIP_GET_STATUSES,
                    ],
                    E::API_V3_IAX_PROVIDERS => [
                        E::ACTION_GET_LIST,
                        E::ACTION_SIP_GET_STATUSES,
                    ],
                    E::API_V3_PROVIDERS => [
                        E::ACTION_SIP_GET_STATUSES,
                        E::ACTION_SIP_GET_STATUS,
                        E::ACTION_SIP_GET_HISTORY,
                        E::ACTION_SIP_GET_STATS,
                        E::ACTION_SIP_UPDATE_STATUS,
                    ],
                ],
                E::ACTION_MODIFY_IAX => [
                    E::API_V3_IAX => [
                        E::ACTION_SIP_GET_REGISTRY,
                    ],
                    E::API_V3_IAX_PROVIDERS => [
                        E::ACTION_GET_RECORD,
                        E::ACTION_GET_DEFAULT,
                        E::ACTION_COPY,
                        E::ACTION_SIP_GET_STATUS,
                        E::ACTION_SIP_GET_HISTORY,
                        E::ACTION_SIP_GET_STATS,
                        E::ACTION_SIP_FORCE_CHECK,
                        E::ACTION_SIP_UPDATE_STATUS,
                    ],
                ],
                E::ACTION_MODIFY_SIP => [
                    E::API_V3_SIP => [
                        E::ACTION_SIP_GET_REGISTRY,
                    ],
                    E::API_V3_SIP_PROVIDERS => [
                        E::ACTION_GET_RECORD,
                        E::ACTION_GET_DEFAULT,
                        E::ACTION_COPY,
                        E::ACTION_SIP_GET_STATUS,
                        E::ACTION_SIP_GET_HISTORY,
                        E::ACTION_SIP_GET_STATS,
                        E::ACTION_SIP_FORCE_CHECK,
                        E::ACTION_SIP_UPDATE_STATUS,
                    ],
                ],
                E::ACTION_SAVE => [
                    ProvidersController::class => [
                        E::ACTION_ENABLE,
                        E::ACTION_DISABLE,
                    ],
                    E::API_V3_SIP_PROVIDERS => [
                        E::ACTION_CREATE,
                        E::ACTION_UPDATE,
                        E::ACTION_PATCH,
                        E::ACTION_DELETE,
                    ],
                    E::API_V3_IAX_PROVIDERS => [
                        E::ACTION_CREATE,
                        E::ACTION_UPDATE,
                        E::ACTION_PATCH,
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // Extensions need SIP peer statuses and employees data
            ExtensionsController::class => [
                E::ACTION_INDEX => [
                    ExtensionsController::class => [
                        E::ACTION_GET_NEW_RECORDS,
                    ],
                    E::API_V3_SIP => [
                        E::ACTION_SIP_GET_PEERS_STATUSES,
                        E::ACTION_SIP_GET_STATUSES,
                        E::ACTION_SIP_GET_HISTORY,
                        E::ACTION_SIP_GET_STATS,
                        E::ACTION_SIP_FORCE_CHECK,
                    ],
                    E::API_V3_EMPLOYEES => [
                        E::ACTION_GET_LIST,
                    ],
                ],
                E::ACTION_MODIFY => [
                    E::API_V3_SIP => [
                        E::ACTION_SIP_GET_STATUS,
                        E::ACTION_SIP_GET_SECRET,
                    ],
                    E::API_V3_EMPLOYEES => [
                        E::ACTION_GET_RECORD,
                        E::ACTION_GET_DEFAULT,
                        E::ACTION_PATCH,
                        E::ACTION_CREATE,
                        E::ACTION_UPDATE,
                        E::ACTION_DELETE,
                    ],
                ],
                E::ACTION_BULK_UPLOAD => [
                    E::API_V3_EMPLOYEES => [
                        E::ACTION_EMPLOYEES_EXPORT,
                        E::ACTION_EMPLOYEES_EXPORT_TEMPLATE,
                        E::ACTION_EMPLOYEES_IMPORT,
                        E::ACTION_EMPLOYEES_CONFIRM_IMPORT,
                        E::ACTION_EMPLOYEES_BATCH_CREATE,
                        E::ACTION_EMPLOYEES_BATCH_DELETE,
                    ],
                ],
            ],

            // Routes need priority changes and provider selection
            IncomingRoutesController::class => [
                E::ACTION_INDEX => [
                    E::API_V3_INCOMING_ROUTES => [
                        E::ACTION_ROUTES_GET_DEFAULT_ROUTE,
                    ],
                ],
                E::ACTION_MODIFY => [
                    E::API_V3_PROVIDERS => [
                        E::ACTION_EXT_GET_FOR_SELECT,
                    ],
                ],
                E::ACTION_SAVE => [
                    E::API_V3_INCOMING_ROUTES => [
                        E::ACTION_CHANGE_PRIORITY,
                        E::ACTION_COPY,
                    ],
                ],
            ],

            OutboundRoutesController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_PROVIDERS => [
                        E::ACTION_EXT_GET_FOR_SELECT,
                    ],
                ],
                E::ACTION_SAVE => [
                    E::API_V3_OUTBOUND_ROUTES => [
                        E::ACTION_CHANGE_PRIORITY,
                        E::ACTION_COPY,
                    ],
                ],
            ],

            // Conference rooms modification
            ConferenceRoomsController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_CONFERENCE_ROOMS => [
                        E::ACTION_DELETE,
                    ],
                ],
            ],

            // Dialplan applications modification
            DialplanApplicationsController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_DIALPLAN_APPLICATIONS => [
                        E::ACTION_DELETE,
                        E::ACTION_COPY,
                    ],
                ],
            ],

            // Off work times need priority changes, provider selection and CRUD
            OffWorkTimesController::class => [
                E::ACTION_MODIFY => [
                    E::API_V3_PROVIDERS => [
                        E::ACTION_EXT_GET_FOR_SELECT,
                    ],
                    E::API_V3_OFF_WORK_TIMES => [
                        E::ACTION_GET_RECORD,
                        E::ACTION_GET_DEFAULT,
                    ],
                ],
                E::ACTION_SAVE => [
                    E::API_V3_OFF_WORK_TIMES => [
                        E::ACTION_CREATE,
                        E::ACTION_UPDATE,
                        E::ACTION_PATCH,
                        E::ACTION_DELETE,
                        E::ACTION_CHANGE_PRIORITIES,
                        E::ACTION_COPY,
                    ],
                ],
            ],

            // Storage page needs storage API access
            StorageController::class => [
                E::ACTION_INDEX => [
                    E::API_V3_STORAGE => [
                        E::ACTION_STORAGE_USAGE,
                        E::ACTION_STORAGE_LIST,
                    ],
                ],
            ],
        ];
    }

    /**
     * Returns list of controllers/actions that are always allowed.
     *
     * These are public actions that don't require permission checks.
     * Used for common functionality like localization, session management,
     * and helper endpoints needed by the UI.
     *
     * @return array<string, string|array<string>>
     */
    public static function getAlwaysAllowed(): array
    {
        return [
            // AdminCabinet controllers
            AsteriskManagersController::class => [
                E::ACTION_EXT_AVAILABLE,
            ],
            ErrorsController::class => '*',
            LocalizationController::class => '*',
            SessionController::class => '*',
            SoundFilesController::class => [
                E::ACTION_GET_PATH_BY_ID,
                E::ACTION_GET_SOUND_FILES,
            ],

            // REST API v3 endpoints
            E::API_V3_EXTENSIONS => [
                E::ACTION_EXT_GET_FOR_SELECT,
                E::ACTION_EXT_AVAILABLE,
                E::ACTION_EXT_GET_PHONE_REPRESENT,
                E::ACTION_EXT_GET_PHONES_REPRESENT,
            ],
            E::API_V3_USERS => [
                E::ACTION_EXT_AVAILABLE,
            ],
            E::API_V3_FILES => [
                E::ACTION_FILES_UPLOAD_STATUS,
            ],
            E::API_V3_SYSTEM => [
                E::ACTION_SYS_CONVERT_AUDIO_FILE,
                E::ACTION_SYS_PING,
                E::ACTION_SYS_CHECK_AUTH,
                E::ACTION_SYS_GET_AVAILABLE_LANGUAGES,
                E::ACTION_SYS_CHANGE_LANGUAGE,
            ],
            E::API_V3_LICENSE => [
                E::ACTION_LICENSE_SEND_METRICS,
            ],
            E::API_V3_NCHAN => '*',
            E::API_V3_USER_PAGE_TRACKER => [
                E::ACTION_PAGE_TRACKER_PAGE_VIEW,
                E::ACTION_PAGE_TRACKER_PAGE_LEAVE,
            ],
            E::API_V3_SOUND_FILES => [
                E::ACTION_SOUND_GET_FOR_SELECT,
            ],
            E::API_V3_NETWORK_FILTERS => [
                E::ACTION_EXT_GET_FOR_SELECT,
                E::ACTION_GET_LIST,
            ],
            E::API_V3_PROVIDERS => [
                E::ACTION_EXT_GET_FOR_SELECT,
            ],
            E::API_V3_WIKI_LINKS => '*',
            E::API_V3_SEARCH => '*',
            E::API_V3_AUTH => '*',
            E::API_V3_OPENAPI => '*',

            // Passkeys - users can manage their own passkeys
            // API filters by user_name from JWT token
            E::API_V3_PASSKEYS => '*',

            // Module controllers - self-service actions
            // Users can manage their own profile (password, passkeys)
            UserProfileController::class => '*',

            // ACL controller - needed for UI to check permissions and show/hide buttons
            AclController::class => [
                E::ACTION_CHECK_PERMISSIONS,
            ],
        ];
    }

    /**
     * Returns list of controllers/actions that are always denied.
     *
     * These are admin-only actions that regular users cannot access.
     * Only superusers (admins) can access these controllers/actions.
     *
     * @return array<string, string|array<string>>
     */
    public static function getAlwaysDenied(): array
    {
        return [
            // AdminCabinet controllers - admin only
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
            StorageController::class => '*',
            SystemDiagnosticController::class => '*',
            TimeSettingsController::class => '*',
            UpdateController::class => '*',
            ApiKeysController::class => '*',

            // REST API v3 endpoints - admin only
            E::API_V3_FILES => [
                E::ACTION_GET_RECORD,
                E::ACTION_UPDATE,
                E::ACTION_FILES_FIRMWARE_STATUS,
                E::ACTION_FILES_DOWNLOAD_FIRMWARE,
            ],
            E::API_V3_FIREWALL => '*',
            E::API_V3_LICENSE => '*',
            E::API_V3_MODULES => '*',
            E::API_V3_NETWORK_FILTERS => [
                E::ACTION_GET_RECORD,
            ],
            E::API_V3_SYSTEM => [
                E::ACTION_SYS_UPGRADE,
                E::ACTION_SYS_DATETIME,
                E::ACTION_SYS_REBOOT,
                E::ACTION_SYS_SHUTDOWN,
                E::ACTION_SYS_UPDATE_MAIL_SETTINGS,
                E::ACTION_SYS_RESTORE_DEFAULT,
                E::ACTION_SYS_GET_DELETE_STATISTICS,
                E::ACTION_SYS_CHECK_FOR_UPDATES,
                E::ACTION_SYS_CHECK_IF_NEW_RELEASE_AVAILABLE,
                E::ACTION_SYS_EXECUTE_BASH_COMMAND,
                E::ACTION_SYS_EXECUTE_SQL_REQUEST,
            ],
            E::API_V3_SYSLOG => '*',
            E::API_V3_SYSINFO => '*',
            E::API_V3_STORAGE => '*',
            E::API_V3_ADVICE => [
                E::ACTION_ADVICE_GET_LIST,
                E::ACTION_ADVICE_REFRESH,
            ],
            E::API_V3_NETWORK => '*',
            E::API_V3_CUSTOM_FILES => '*',
            E::API_V3_FAIL2BAN => '*',
            E::API_V3_GENERAL_SETTINGS => '*',
            E::API_V3_MAIL_SETTINGS => '*',
            E::API_V3_TIME_SETTINGS => '*',
            E::API_V3_S3_STORAGE => '*',
            E::API_V3_API_KEYS => '*',
            E::API_V3_ASTERISK_REST_USERS => '*',
            E::API_V3_PASSWORDS => '*',
            E::API_V3_SIP => [
                E::ACTION_SIP_GET_AUTH_FAILURE_STATS,
                E::ACTION_SIP_PROCESS_AUTH_FAILURES,
                E::ACTION_SIP_CLEAR_AUTH_FAILURE_STATS,
            ],
        ];
    }
}
