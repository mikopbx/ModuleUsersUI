<?php

declare(strict_types=1);

$moduleRoot = dirname(__DIR__);
$autoloadCandidates = [
    $moduleRoot . '/vendor/autoload.php',
    dirname($moduleRoot, 2) . '/Core/vendor/autoload.php',
];

foreach ($autoloadCandidates as $autoloadFile) {
    if (is_file($autoloadFile)) {
        require $autoloadFile;
        break;
    }
}

if (!class_exists(PHPUnit\Framework\TestCase::class)) {
    throw new RuntimeException('Unable to locate a Composer autoloader with PHPUnit');
}

$namespacePrefix = 'Modules\\ModuleUsersUI\\';

spl_autoload_register(
    static function (string $class) use ($moduleRoot, $namespacePrefix): void {
        if (!str_starts_with($class, $namespacePrefix)) {
            return;
        }

        $relativeClass = substr($class, strlen($namespacePrefix));
        $file = $moduleRoot . '/' . str_replace('\\', '/', $relativeClass) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
);
