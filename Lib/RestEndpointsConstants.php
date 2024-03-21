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


class RestEndpointsConstants
{
    // API Endpoints
    const API_CDR = '/pbxcore/api/cdr';
    const API_IAX = '/pbxcore/api/iax';
    const API_SIP = '/pbxcore/api/sip';
    const API_USERS = '/pbxcore/api/users';
    const API_SYSTEM = '/pbxcore/api/system';
    const API_LICENSE = '/pbxcore/api/license';
    const API_NCHAN = '/pbxcore/api/nchan';
    const API_SOME_ENDPOINT = '/pbxcore/api/someendpoint';
    const API_FIREWALL = '/pbxcore/api/firewall';
    const API_MODULES_CORE = '/pbxcore/api/modules/core';
    const API_SYSLOG = '/pbxcore/api/syslog';
    const API_SYSINFO = '/pbxcore/api/sysinfo';
    const API_STORAGE = '/pbxcore/api/storage';
    const API_ADVICES = '/pbxcore/api/advices';
    const API_EXTENSIONS = '/pbxcore/api/extensions';
    const API_DIALPLAN_APPLICATIONS = '/pbxcore/api/dialplan-applications';
    const API_CONFERENCE_ROOMS = '/pbxcore/api/conference-rooms';
    const API_CALL_QUEUES = '/pbxcore/api/call-queues';
    const API_FILES = '/pbxcore/api/files';
    const API_IVR_MENU = '/pbxcore/api/ivr-menu';

    // Generic Actions
    const ACTION_GET_ACTIVE_CHANNELS = '/getActiveChannels';
    const ACTION_GET_ACTIVE_CALLS = '/getActiveCalls';
    const ACTION_DELETE_RECORD = '/deleteRecord';
    const ACTION_GET_REGISTRY = '/getRegistry';

    const ACTION_CDR_PLAYBACK = '/playback';
    const ACTION_CDR_PLAYBACK_V2 = '/v2/playback';
    const ACTION_CDR_GET_RECORD_FILE_V2 = '/v2/getRecordFile';
    const ACTION_UPLOAD_FILE = '/uploadFile';
    const ACTION_REMOVE_AUDIO_FILE = '/removeAudioFile';
    const ACTION_CHANGE_PRIORITY = 'changePriority';
    const ACTION_GET_NEW_RECORDS = 'getNewRecords';
    const ACTION_ENABLE = 'enable';
    const ACTION_DISABLE = 'disable';
    const ACTION_GET_FOR_SELECT = '/getForSelect';
    const ACTION_GET_PHONE_REPRESENT = '/getPhoneRepresent';
    const ACTION_GET_PHONES_REPRESENT = '/getPhonesRepresent';
    const ACTION_CONVERT_AUDIO_FILE = '/convertAudioFile';
    const ACTION_PING = '/ping';

    const ACTION_API_AVAILABLE = '/available';

    const ACTION_AVAILABLE = 'available';


    // SIP Actions
    const ACTION_SIP_GET_PEER = '/getSipPeer';
    const ACTION_SIP_GET_SECRET = '/getSecret';
    const ACTION_EXT_GET_RECORD = '/getRecord';
    const ACTION_EXT_SAVE_RECORD = '/saveRecord';
    const ACTION_SIP_GET_PEERS_STATUSES = '/getPeersStatuses';

    // System Actions
    const ACTION_SYS_FIRMWARE_DOWNLOAD_STATUS = '/firmwareDownloadStatus';
    const ACTION_SYS_DOWNLOAD_NEW_FIRMWARE = '/downloadNewFirmware';
    const ACTION_SYS_GET_FILE_CONTENT = '/getFileContent';
    const ACTION_SYS_SEND_PBX_METRICS = '/sendPBXMetrics';
    const ACTION_SYS_STATUS_UPLOAD = '/statusUpload';
    const ACTION_SYS_UPGRADE = '/upgrade';
    const ACTION_SYS_SET_DATE = '/setDate';
    const ACTION_SYS_REBOOT = '/reboot';
    const ACTION_SYS_SHUTDOWN = '/shutdown';
    const ACTION_SYS_GET_DATE = '/getDate';
    const ACTION_SYS_UPDATE_MAIL_SETTINGS = '/updateMailSettings';
    const ACTION_SYS_RESTORE_DEFAULT = '/restoreDefault';
    const ACTION_SYS_SEND_MAIL = '/sendMail';
    const ACTION_SYS_GET_LIST = '/getList';

    // Sound File Actions
    const ACTION_SOUND_GET_PATH_BY_ID = 'getPathById';
    const ACTION_SOUND_GET_FILES = 'getSoundFiles';

    const ACTION_INDEX = 'index';
    const ACTION_CREATE = 'create';

    const ACTION_SAVE = 'save';
    const ACTION_DELETE = 'delete';
    const ACTION_MODIFY = 'modify';

}