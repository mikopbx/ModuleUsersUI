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


use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

/**
 * Class AnswerStructure
 *
 * @package Modules\ModuleUsersUI\Lib
 *
 */
class AnswerStructure
{
    /**
     * Request result
     *
     * @var bool
     */
    public bool $success = false;

    /**
     * Array of result fields
     *
     * @var array
     */
    public array $data;

    /**
     * Error messages, description of failure
     *
     * @var array
     */
    public array $messages;

    /**
     * AnswerStructure constructor.
     *
     * @param PBXApiResult|null $res The PBXApiResult object to initialize from (optional).
     */
    public function __construct(PBXApiResult $res = null)
    {
        // Initialize default values
        $this->success = false;
        $this->data = [];
        $this->messages = [];

        // If PBXApiResult is provided, copy attributes
        if ($res) {
            $this->copyAttributesFrom($res);
        }
    }


    /**
     * Prepare structured result
     *
     * @return array The structured result as an array
     */
    public function getResult(): array
    {
        return [
            'result'    => $this->success,
            'data'      => $this->data,
            'messages'  => $this->messages,
        ];
    }

    /**
     * Copies attributes from a PBXApiResult to this AnswerStructure.
     *
     * @param PBXApiResult $res The PBXApiResult object to copy attributes from.
     */
    private function copyAttributesFrom(PBXApiResult $res): void
    {
        // Iterate through the attributes of this object and copy values from PBXApiResult
        foreach ($this as $attribute => $value) {
            if (!empty($res->$attribute)) {
                $this->$attribute = $res->$attribute;
            }
        }
    }

}