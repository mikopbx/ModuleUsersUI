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


class EndpointConstants
{
    // API Endpoints
    const API_CDR = '/pbxcore/api/cdr';
    const API_SIP = '/pbxcore/api/sip';
    const API_IAX = '/pbxcore/api/iax';
    const API_EXTENSIONS = '/pbxcore/api/extensions';
    const API_DIALPLAN_APPLICATIONS = '/pbxcore/api/dialplan-applications';
    const API_CONFERENCE_ROOMS = '/pbxcore/api/conference-rooms';
    const API_CALL_QUEUES = '/pbxcore/api/call-queues';
    const API_FILES = '/pbxcore/api/files';
    const API_IVR_MENU = '/pbxcore/api/ivr-menu';
    const API_USERS = '/pbxcore/api/users';
    const API_SYSTEM = '/pbxcore/api/system';
    const API_LICENSE = '/pbxcore/api/license';
    const API_NCHAN = '/pbxcore/api/nchan';
    const API_FIREWALL = '/pbxcore/api/firewall';
    const API_MODULES_CORE = '/pbxcore/api/modules/core';
    const API_SYSLOG = '/pbxcore/api/syslog';
    const API_SYSINFO = '/pbxcore/api/sysinfo';
    const API_STORAGE = '/pbxcore/api/storage';
    const API_ADVICE = '/pbxcore/api/advice';
    const API_USER_PAGE_TRACKER = '/pbxcore/api/user-page-tracker';
    const API_SOME_ENDPOINT = '/pbxcore/api/someendpoint';

    // CDR (Call Detail Records) API Actions
    const ACTION_CDR_API_GET_ACTIVE_CHANNELS = '/getActiveChannels';
    const ACTION_CDR_API_GET_ACTIVE_CALLS = '/getActiveCalls';
    const ACTION_CDR_PLAYBACK = '/playback';
    const ACTION_CDR_API_PLAYBACK_V2 = '/v2/playback';
    const ACTION_CDR_API_GET_RECORD_FILE_V2 = '/v2/getRecordFile';
    const ACTION_CDR_API_GET_LATEST_RECORD_DATE = '/getLatestRecordDate';

    // SIP API Actions
    const ACTION_SIP_API_GET_PEER = '/getSipPeer';
    const ACTION_SIP_API_GET_SECRET = '/getSecret';
    const ACTION_SIP_API_GET_PEERS_STATUSES = '/getPeersStatuses';

    // Extensions API Actions
    const ACTION_EXT_API_GET_FOR_SELECT = '/getForSelect';
    const ACTION_EXT_API_GET_PHONE_REPRESENT = '/getPhoneRepresent';
    const ACTION_EXT_API_GET_PHONES_REPRESENT = '/getPhonesRepresent';
    const ACTION_EXT_API_GET_RECORD = '/getRecord';
    const ACTION_EXT_API_SAVE_RECORD = '/saveRecord';
    const ACTION_EXT_API_AVAILABLE = '/available';

    // Files API Actions
    const ACTION_FILES_API_UPLOAD_FILE = '/uploadFile';
    const ACTION_FILES_API_REMOVE_AUDIO_FILE = '/removeAudioFile';
    const ACTION_FILES_FIRMWARE_DOWNLOAD_STATUS = '/firmwareDownloadStatus';
    const ACTION_FILES_DOWNLOAD_NEW_FIRMWARE = '/downloadNewFirmware';
    const ACTION_FILES_GET_FILE_CONTENT = '/getFileContent';
    const ACTION_FILES_STATUS_UPLOAD = '/statusUpload';

    // System Actions
    const ACTION_SYS_CONVERT_AUDIO_FILE = '/convertAudioFile';
    const ACTION_SYS_PING = '/ping';
    const ACTION_SYS_UPGRADE = '/upgrade';
    const ACTION_SYS_SET_DATE = '/setDate';
    const ACTION_SYS_REBOOT = '/reboot';
    const ACTION_SYS_SHUTDOWN = '/shutdown';
    const ACTION_SYS_GET_DATE = '/getDate';
    const ACTION_SYS_UPDATE_MAIL_SETTINGS = '/updateMailSettings';
    const ACTION_SYS_RESTORE_DEFAULT = '/restoreDefault';
    const ACTION_SYS_SEND_MAIL = '/sendMail';

    // License API Actions
    const ACTION_LIC_SEND_PBX_METRICS = '/sendPBXMetrics';

    // Advice API Actions
    const ACTION_ADVICE_GET_LIST = '/getList';

    // Sound File Actions
    const ACTION_SOUND_GET_PATH_BY_ID = 'getPathById';
    const ACTION_SOUND_GET_FILES = 'getSoundFiles';

    // User Page Tracker API Actions
    const ACTION_USER_PAGE_TRACKER_PAGE_VIEW = '/pageView';
    const ACTION_USER_PAGE_TRACKER_PAGE_LEAVE = '/pageLeave';

    // Generic Actions
    const ACTION_API_DELETE_RECORD = '/deleteRecord';
    const ACTION_API_GET_REGISTRY = '/getRegistry';
    const ACTION_CHANGE_PRIORITY = 'changePriority';
    const ACTION_GET_NEW_RECORDS = 'getNewRecords';
    const ACTION_ENABLE = 'enable';
    const ACTION_DISABLE = 'disable';
    const ACTION_API_AVAILABLE = 'available';
    const ACTION_INDEX = 'index';
    const ACTION_SAVE = 'save';
    const ACTION_DELETE = 'delete';
    const ACTION_MODIFY = 'modify';
}
