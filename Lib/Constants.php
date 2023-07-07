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

class Constants
{
    // CDR Filter constants
    public const CDR_FILTER_DISABLED = 'all';
    public const CDR_FILTER_ONLY_SELECTED = 'selected';
    public const CDR_FILTER_EXCEPT_SELECTED = 'not-selected';


    // Module types constants
    public const ADMIN_CABINET = 'AdminCabinet';
    public const PBX_CORE_REST = 'PBXCoreREST';

    public const HIDDEN_PASSWORD = 'xxxxxxxx';

    public const NO_ACCESS_GROUP_ID = 'No access';
}