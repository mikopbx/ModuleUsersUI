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

namespace Modules\ModuleUsersUI\App\Forms;

use MikoPBX\AdminCabinet\Forms\BaseForm;
use Modules\ModuleUsersUI\Models\AccessGroupsRights;
use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Select;


class AccessGroupForm extends BaseForm
{

    /**
     * Initializes the form.
     *
     * @param mixed|null $entity   The entity object.
     * @param array|null $options  Additional options.
     *
     * @return void
     */
    public function initialize($entity = null, $options = null): void
    {

        // Add hidden input for id
        $this->add(new Hidden('id'));

        // Add input field for Name
        $this->add(new Text('name'));

        // Add textarea for Description
        $this->addTextArea('description', $entity->description ?? '', 80);

        // Prepare homepages for select dropdown
        $parameters = [
            'columns' => [
                'controller' => 'AccessGroupsRights.controller',
                'actions' => 'AccessGroupsRights.actions',
            ],
            'models' => [
                'AccessGroupsRights' => AccessGroupsRights::class,
            ],
            'conditions' => 'AccessGroupsRights.group_id = :group_id:',
            'binds' => [
                'group_id' => $entity->id,
            ],
            'order' => 'controller'
        ];
        $records = $this->di->get('modelsManager')->createBuilder($parameters)->getQuery()->execute();
        $homepagesForSelect = [];
        foreach ($records as $record) {
            $possibleActions = json_decode($record->actions, true);
            foreach ($possibleActions as $action) {
                $homePage = $record->controller . '/' . $action;
                $homepagesForSelect[$homePage] = $homePage;
            }

        }
        if (empty($homepagesForSelect)) {
            $homepagesForSelect['session/end'] = 'session/end';
        }
        $homePages = new Select('home-page', $homepagesForSelect, [
            'using' => [
                'id',
                'name',
            ],
            'useEmpty' => false,
            'class' => 'ui selection dropdown home-page-dropdown',
        ]);
        $this->add($homePages);

        // Select User to assign the user group field
        $extension = new Select(
            'select-extension-field', [], [
                'using' => [
                    'id',
                    'name',
                ],
                'useEmpty' => true,
                'class' => 'ui selection dropdown search select-extension-field',
            ]
        );
        $this->add($extension);

        // Prepare rights matrix
        foreach ($options['groupRights'] as $module => $types) {
            foreach ($types as $type => $controllers) {
                foreach ($controllers as $controller => $actions) {
                    // Main CheckBox
                    $checkBox = new Check("{$controller}_main");
                    $checkBox->setLabel("<b>" . $this->getControllerTranslation($controller) . '</b>');
                    $this->add($checkBox);

                    foreach ($actions as $action => $allowed) {
                        // Add child checkbox for action
                        $checkBoxId = 'check-box-' . md5($module . $controller . $action);
                        $parameters = [
                            'class' => 'access-group-checkbox hidden',
                            'data-module' => $module,
                            'data-controller' => $controller,
                            'data-action' => $action,
                            'tabindex' => '0'
                        ];
                        if ($allowed) {
                            $parameters['checked'] = 'checked';
                        }
                        $checkBox = new Check($checkBoxId, $parameters);
                        $checkBox->setLabel($this->getActionTranslation($module, $controller, $action));
                        $this->add($checkBox);
                    }
                }
            }
        }

        // Use CDR filter
        $parameters = [];
        if ($entity->useCDRFilter) {
            $parameters['checked'] = 'checked';
        }
        $checkBox = new Check('useCDRFilter', $parameters);
        $this->add($checkBox);

    }

    /**
     * Retrieves the translated controller name.
     *
     * @param string $controllerName The controller name.
     *
     * @return string The translated controller name.
     */
    private function getControllerTranslation(string $controllerName): string
    {
        // Remove "Controller" from the controller name
        $controllerName = str_replace("Controller", "", $controllerName);

        // Create the translation template
        $translationTemplate = "mm_{$controllerName}";

        // Retrieve the translated controller name
        $controllerTranslation = $this->translation->_($translationTemplate);

        // If the translation is not found, return the original controller name
        if ($controllerTranslation === $translationTemplate) {
            return $controllerName;
        }

        return $controllerTranslation;
    }

    /**
     * Retrieves the translated action name.
     *
     * @param string $module         The module name.
     * @param string $controllerName The controller name.
     * @param string $actionName     The action name.
     *
     * @return string The translated action name.
     */
    private function getActionTranslation(string $module, string $controllerName, string $actionName): string
    {
        // Remove "Module" from the module name
        $module = str_replace("Module", "", $module);

        // Remove "Controller" and "/" from the controller name
        $controllerName = str_replace(["Controller", "/"], ["", "_"], $controllerName);

        // Remove "Action" and "/" from the action name
        $actionName = str_replace(["Action", "/"], ["", ""], $actionName);

        // Create the translation template
        $translationTemplate = "module_usersui_CheckBox_{$module}_{$controllerName}_{$actionName}";

        // Retrieve the translated action name
        $actionTranslation = $this->translation->_($translationTemplate);

        // If the translation is not found, return the action name with a comment indicating the missing translation
        if ($actionTranslation === $translationTemplate) {
            return $actionName . "<!--{$translationTemplate}-->";
        }

        return $actionTranslation;
    }
}