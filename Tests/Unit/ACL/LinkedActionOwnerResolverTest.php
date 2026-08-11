<?php

declare(strict_types=1);

namespace Modules\ModuleUsersUI\Tests\Unit\ACL;

use Modules\ModuleUsersUI\Lib\ACL\LinkedActionOwnerResolver;
use PHPUnit\Framework\TestCase;

class LinkedActionOwnerResolverTest extends TestCase
{
    public function testAddsMissingLinkedActionsAsOwners(): void
    {
        $published = ['index' => true, 'save' => false];
        $linked = [
            'ExampleController' => [
                'index' => [],
                'generate' => [],
                'manageEngineAndVoices' => [],
            ],
        ];

        self::assertSame(
            [
                'index' => true,
                'save' => false,
                'generate' => false,
                'manageEngineAndVoices' => false,
            ],
            LinkedActionOwnerResolver::merge($published, 'ExampleController', $linked)
        );
    }

    public function testDoesNotAddActionsForAnAbsentController(): void
    {
        self::assertSame(
            ['index' => true],
            LinkedActionOwnerResolver::merge(
                ['index' => true],
                'MissingController',
                ['ExampleController' => ['generate' => []]]
            )
        );
    }

    public function testOmitsExcludedVirtualActions(): void
    {
        self::assertSame(
            ['index' => true, 'generate' => false],
            LinkedActionOwnerResolver::merge(
                ['index' => true],
                'ExampleController',
                ['ExampleController' => ['generate' => [], 'manageEngineAndVoices' => []]],
                ['manageEngineAndVoices']
            )
        );
    }
}
