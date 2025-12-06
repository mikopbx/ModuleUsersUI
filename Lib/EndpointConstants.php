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

namespace Modules\ModuleUsersUI\Lib;

/**
 * REST API v3 Endpoint and Action Constants
 *
 * URL Patterns:
 * - Collection: GET /pbxcore/api/v3/{resource} → getList
 * - Resource: GET /pbxcore/api/v3/{resource}/{id} → getRecord
 * - Custom collection: GET /pbxcore/api/v3/{resource}:action → action
 * - Custom resource: POST /pbxcore/api/v3/{resource}/{id}:action → action
 */
class EndpointConstants
{
    // =========================================================================
    // REST API v3 Endpoints (base paths)
    // =========================================================================

    // Core API Endpoints
    public const API_V3_ADVICE = '/pbxcore/api/v3/advice';
    public const API_V3_API_KEYS = '/pbxcore/api/v3/api-keys';
    public const API_V3_ASTERISK_MANAGERS = '/pbxcore/api/v3/asterisk-managers';
    public const API_V3_ASTERISK_REST_USERS = '/pbxcore/api/v3/asterisk-rest-users';
    public const API_V3_AUTH = '/pbxcore/api/v3/auth';
    public const API_V3_CALL_QUEUES = '/pbxcore/api/v3/call-queues';
    public const API_V3_CDR = '/pbxcore/api/v3/cdr';
    public const API_V3_CONFERENCE_ROOMS = '/pbxcore/api/v3/conference-rooms';
    public const API_V3_CUSTOM_FILES = '/pbxcore/api/v3/custom-files';
    public const API_V3_DIALPLAN_APPLICATIONS = '/pbxcore/api/v3/dialplan-applications';
    public const API_V3_EMPLOYEES = '/pbxcore/api/v3/employees';
    public const API_V3_EXTENSIONS = '/pbxcore/api/v3/extensions';
    public const API_V3_FAIL2BAN = '/pbxcore/api/v3/fail2ban';
    public const API_V3_FILES = '/pbxcore/api/v3/files';
    public const API_V3_FIREWALL = '/pbxcore/api/v3/firewall';
    public const API_V3_GENERAL_SETTINGS = '/pbxcore/api/v3/general-settings';
    public const API_V3_IAX = '/pbxcore/api/v3/iax';
    public const API_V3_IAX_PROVIDERS = '/pbxcore/api/v3/iax-providers';
    public const API_V3_INCOMING_ROUTES = '/pbxcore/api/v3/incoming-routes';
    public const API_V3_IVR_MENU = '/pbxcore/api/v3/ivr-menu';
    public const API_V3_LICENSE = '/pbxcore/api/v3/license';
    public const API_V3_MAIL_SETTINGS = '/pbxcore/api/v3/mail-settings';
    public const API_V3_MODULES = '/pbxcore/api/v3/modules';
    public const API_V3_NCHAN = '/pbxcore/api/v3/nchan';
    public const API_V3_NETWORK = '/pbxcore/api/v3/network';
    public const API_V3_NETWORK_FILTERS = '/pbxcore/api/v3/network-filters';
    public const API_V3_OFF_WORK_TIMES = '/pbxcore/api/v3/off-work-times';
    public const API_V3_OPENAPI = '/pbxcore/api/v3/openapi';
    public const API_V3_OUTBOUND_ROUTES = '/pbxcore/api/v3/outbound-routes';
    public const API_V3_PASSKEYS = '/pbxcore/api/v3/passkeys';
    public const API_V3_PASSWORDS = '/pbxcore/api/v3/passwords';
    public const API_V3_PBX_STATUS = '/pbxcore/api/v3/pbx-status';
    public const API_V3_PROVIDERS = '/pbxcore/api/v3/providers';
    public const API_V3_S3_STORAGE = '/pbxcore/api/v3/s3-storage';
    public const API_V3_SEARCH = '/pbxcore/api/v3/search';
    public const API_V3_SIP = '/pbxcore/api/v3/sip';
    public const API_V3_SIP_PROVIDERS = '/pbxcore/api/v3/sip-providers';
    public const API_V3_SOUND_FILES = '/pbxcore/api/v3/sound-files';
    public const API_V3_STORAGE = '/pbxcore/api/v3/storage';
    public const API_V3_SYSINFO = '/pbxcore/api/v3/sysinfo';
    public const API_V3_SYSLOG = '/pbxcore/api/v3/syslog';
    public const API_V3_SYSTEM = '/pbxcore/api/v3/system';
    public const API_V3_TIME_SETTINGS = '/pbxcore/api/v3/time-settings';
    public const API_V3_USER_PAGE_TRACKER = '/pbxcore/api/v3/user-page-tracker';
    public const API_V3_USERS = '/pbxcore/api/v3/users';
    public const API_V3_WIKI_LINKS = '/pbxcore/api/v3/wiki-links';

    // =========================================================================
    // Standard CRUD Actions (RESTful)
    // =========================================================================

    // Collection-level actions (no {id} required)
    public const ACTION_GET_LIST = 'getList';
    public const ACTION_GET_DEFAULT = 'getDefault';
    public const ACTION_CREATE = 'create';

    // Resource-level actions (require {id})
    public const ACTION_GET_RECORD = 'getRecord';
    public const ACTION_SAVE_RECORD = 'saveRecord';  // Create or update record
    public const ACTION_UPDATE = 'update';
    public const ACTION_PATCH = 'patch';
    public const ACTION_DELETE = 'delete';
    public const ACTION_UPLOAD = 'upload';

    // =========================================================================
    // Common Custom Actions
    // =========================================================================

    public const ACTION_COPY = 'copy';
    public const ACTION_ENABLE = 'enable';
    public const ACTION_DISABLE = 'disable';
    public const ACTION_CHANGE_PRIORITY = 'changePriority';
    public const ACTION_CHANGE_PRIORITIES = 'changePriorities';

    // =========================================================================
    // CDR Actions
    // =========================================================================

    public const ACTION_CDR_GET_METADATA = 'getMetadata';
    public const ACTION_CDR_PLAYBACK = 'playback';
    public const ACTION_CDR_DOWNLOAD = 'download';

    // =========================================================================
    // PBX Status Actions
    // =========================================================================

    public const ACTION_PBX_STATUS_GET_ACTIVE_CALLS = 'getActiveCalls';
    public const ACTION_PBX_STATUS_GET_ACTIVE_CHANNELS = 'getActiveChannels';

    // =========================================================================
    // Extensions Actions
    // =========================================================================

    public const ACTION_EXT_GET_FOR_SELECT = 'getForSelect';
    public const ACTION_EXT_AVAILABLE = 'available';
    public const ACTION_EXT_GET_PHONE_REPRESENT = 'getPhoneRepresent';
    public const ACTION_EXT_GET_PHONES_REPRESENT = 'getPhonesRepresent';

    // =========================================================================
    // Employees Actions
    // =========================================================================

    public const ACTION_EMPLOYEES_EXPORT = 'export';
    public const ACTION_EMPLOYEES_EXPORT_TEMPLATE = 'exportTemplate';
    public const ACTION_EMPLOYEES_IMPORT = 'import';
    public const ACTION_EMPLOYEES_CONFIRM_IMPORT = 'confirmImport';
    public const ACTION_EMPLOYEES_BATCH_CREATE = 'batchCreate';
    public const ACTION_EMPLOYEES_BATCH_DELETE = 'batchDelete';

    // =========================================================================
    // SIP/IAX Actions
    // =========================================================================

    public const ACTION_SIP_GET_STATUSES = 'getStatuses';
    public const ACTION_SIP_GET_STATUS = 'getStatus';
    public const ACTION_SIP_GET_HISTORY = 'getHistory';
    public const ACTION_SIP_GET_STATS = 'getStats';
    public const ACTION_SIP_GET_PEERS_STATUSES = 'getPeersStatuses';
    public const ACTION_SIP_GET_REGISTRY = 'getRegistry';
    public const ACTION_SIP_GET_SECRET = 'getSecret';
    public const ACTION_SIP_FORCE_CHECK = 'forceCheck';
    public const ACTION_SIP_UPDATE_STATUS = 'updateStatus';
    public const ACTION_SIP_GET_AUTH_FAILURE_STATS = 'getAuthFailureStats';
    public const ACTION_SIP_PROCESS_AUTH_FAILURES = 'processAuthFailures';
    public const ACTION_SIP_CLEAR_AUTH_FAILURE_STATS = 'clearAuthFailureStats';

    // =========================================================================
    // Files Actions
    // =========================================================================

    public const ACTION_FILES_UPLOAD = 'upload';
    public const ACTION_FILES_UPLOAD_STATUS = 'uploadStatus';
    public const ACTION_FILES_FIRMWARE_STATUS = 'firmwareStatus';
    public const ACTION_FILES_DOWNLOAD_FIRMWARE = 'downloadFirmware';

    // =========================================================================
    // Sound Files Actions
    // =========================================================================

    public const ACTION_SOUND_GET_FOR_SELECT = 'getForSelect';
    public const ACTION_SOUND_PLAYBACK = 'playback';
    public const ACTION_SOUND_UPLOAD_FILE = 'uploadFile';
    public const ACTION_SOUND_CONVERT_AUDIO = 'convertAudioFile';

    // =========================================================================
    // System Actions
    // =========================================================================

    public const ACTION_SYS_PING = 'ping';
    public const ACTION_SYS_CHECK_AUTH = 'checkAuth';
    public const ACTION_SYS_DATETIME = 'datetime';
    public const ACTION_SYS_GET_AVAILABLE_LANGUAGES = 'getAvailableLanguages';
    public const ACTION_SYS_CHECK_FOR_UPDATES = 'checkForUpdates';
    public const ACTION_SYS_REBOOT = 'reboot';
    public const ACTION_SYS_SHUTDOWN = 'shutdown';
    public const ACTION_SYS_UPDATE_MAIL_SETTINGS = 'updateMailSettings';
    public const ACTION_SYS_CONVERT_AUDIO_FILE = 'convertAudioFile';
    public const ACTION_SYS_UPGRADE = 'upgrade';
    public const ACTION_SYS_RESTORE_DEFAULT = 'restoreDefault';
    public const ACTION_SYS_CHANGE_LANGUAGE = 'changeLanguage';
    public const ACTION_SYS_GET_DELETE_STATISTICS = 'getDeleteStatistics';
    public const ACTION_SYS_CHECK_IF_NEW_RELEASE_AVAILABLE = 'checkIfNewReleaseAvailable';
    public const ACTION_SYS_EXECUTE_BASH_COMMAND = 'executeBashCommand';
    public const ACTION_SYS_EXECUTE_SQL_REQUEST = 'executeSqlRequest';

    // =========================================================================
    // License Actions
    // =========================================================================

    public const ACTION_LICENSE_GET_INFO = 'getLicenseInfo';
    public const ACTION_LICENSE_PING = 'ping';
    public const ACTION_LICENSE_SEND_METRICS = 'sendPBXMetrics';
    public const ACTION_LICENSE_RESET_KEY = 'resetKey';
    public const ACTION_LICENSE_PROCESS_REQUEST = 'processUserRequest';
    public const ACTION_LICENSE_CAPTURE_FEATURE = 'captureFeatureForProductId';

    // =========================================================================
    // Advice Actions
    // =========================================================================

    public const ACTION_ADVICE_GET_LIST = 'getList';
    public const ACTION_ADVICE_REFRESH = 'refresh';

    // =========================================================================
    // User Page Tracker Actions
    // =========================================================================

    public const ACTION_PAGE_TRACKER_PAGE_VIEW = 'pageView';
    public const ACTION_PAGE_TRACKER_PAGE_LEAVE = 'pageLeave';

    // =========================================================================
    // Modules Actions
    // =========================================================================

    public const ACTION_MODULES_GET_AVAILABLE = 'getAvailableModules';
    public const ACTION_MODULES_GET_INFO = 'getModuleInfo';
    public const ACTION_MODULES_GET_LINK = 'getModuleLink';
    public const ACTION_MODULES_GET_DOWNLOAD_STATUS = 'getDownloadStatus';
    public const ACTION_MODULES_GET_INSTALLATION_STATUS = 'getInstallationStatus';
    public const ACTION_MODULES_INSTALL_FROM_REPO = 'installFromRepo';
    public const ACTION_MODULES_INSTALL_FROM_PACKAGE = 'installFromPackage';
    public const ACTION_MODULES_UNINSTALL = 'uninstall';
    public const ACTION_MODULES_UPDATE_ALL = 'updateAll';
    public const ACTION_MODULES_START_DOWNLOAD = 'startDownload';
    public const ACTION_MODULES_GET_METADATA = 'getMetadataFromPackage';

    // =========================================================================
    // Syslog Actions
    // =========================================================================

    public const ACTION_SYSLOG_GET_LOGS_LIST = 'getLogsList';
    public const ACTION_SYSLOG_GET_LOG_FROM_FILE = 'getLogFromFile';
    public const ACTION_SYSLOG_START_CAPTURE = 'startCapture';
    public const ACTION_SYSLOG_STOP_CAPTURE = 'stopCapture';
    public const ACTION_SYSLOG_PREPARE_ARCHIVE = 'prepareArchive';
    public const ACTION_SYSLOG_DOWNLOAD_FILE = 'downloadLogFile';
    public const ACTION_SYSLOG_DOWNLOAD_ARCHIVE = 'downloadArchive';
    public const ACTION_SYSLOG_ERASE_FILE = 'eraseFile';

    // =========================================================================
    // Storage Actions
    // =========================================================================

    public const ACTION_STORAGE_USAGE = 'usage';
    public const ACTION_STORAGE_LIST = 'list';
    public const ACTION_STORAGE_MOUNT = 'mount';
    public const ACTION_STORAGE_UMOUNT = 'umount';
    public const ACTION_STORAGE_MKFS = 'mkfs';
    public const ACTION_STORAGE_STATUS_MKFS = 'statusMkfs';

    // =========================================================================
    // Firewall Actions
    // =========================================================================

    public const ACTION_FIREWALL_GET_BANNED_IPS = 'getBannedIps';
    public const ACTION_FIREWALL_UNBAN_IP = 'unbanIp';

    // =========================================================================
    // Mail Settings Actions
    // =========================================================================

    public const ACTION_MAIL_GET_OAUTH2_URL = 'getOAuth2Url';
    public const ACTION_MAIL_GET_DIAGNOSTICS = 'getDiagnostics';
    public const ACTION_MAIL_TEST_CONNECTION = 'testConnection';
    public const ACTION_MAIL_SEND_TEST = 'sendTestEmail';
    public const ACTION_MAIL_REFRESH_TOKEN = 'refreshToken';
    public const ACTION_MAIL_RESET = 'reset';

    // =========================================================================
    // Incoming/Outbound Routes Actions
    // =========================================================================

    public const ACTION_ROUTES_GET_DEFAULT_ROUTE = 'getDefaultRoute';

    // =========================================================================
    // API Keys Actions
    // =========================================================================

    public const ACTION_API_KEYS_GENERATE = 'generateKey';

    // =========================================================================
    // Auth Actions
    // =========================================================================

    public const ACTION_AUTH_VALIDATE_TOKEN = 'validateToken';
    public const ACTION_AUTH_LOGIN = 'login';
    public const ACTION_AUTH_REFRESH = 'refresh';
    public const ACTION_AUTH_LOGOUT = 'logout';

    // =========================================================================
    // AdminCabinet Controller Actions (UI)
    // =========================================================================

    public const ACTION_INDEX = 'index';
    public const ACTION_MODIFY = 'modify';
    public const ACTION_SAVE = 'save';
    public const ACTION_GET_NEW_RECORDS = 'getNewRecords';
    public const ACTION_BULK_UPLOAD = 'bulkupload';
    public const ACTION_MANAGE = 'manage';
    public const ACTION_MODIFY_SIP = 'modifysip';
    public const ACTION_MODIFY_IAX = 'modifyiax';
    public const ACTION_END = 'end';
    public const ACTION_OPENAPI = 'openapi';
    public const ACTION_CHECK_PERMISSIONS = 'checkPermissions';
    public const ACTION_GET_PATH_BY_ID = 'getPathById';
    public const ACTION_GET_SOUND_FILES = 'getSoundFiles';
    public const ACTION_SHOW_404 = 'show404';
    public const ACTION_SHOW_401 = 'show401';
    public const ACTION_SHOW_500 = 'show500';
    public const ACTION_GET_TRANSLATED_ARRAY = 'getTranslatedArray';
}
