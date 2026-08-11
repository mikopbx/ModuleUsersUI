<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit;

use PHPUnit\Framework\TestCase;

class PhraseStudioPermissionLabelsTest extends TestCase
{
    public function testPhraseStudioSemanticOwnerLabelsAreTranslated(): void
    {
        $moduleRoot = dirname(__DIR__, 2);
        $translations = [
            'en' => require $moduleRoot . '/Messages/en.php',
            'ru' => require $moduleRoot . '/Messages/ru.php',
        ];
        $keys = [
            'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_generate',
            'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_manageEngineAndVoices',
        ];

        foreach ($translations as $messages) {
            foreach ($keys as $key) {
                self::assertArrayHasKey($key, $messages);
                self::assertIsString($messages[$key]);
                self::assertNotSame('', $messages[$key]);
                self::assertNotSame($key, $messages[$key]);
            }
        }
    }
}
