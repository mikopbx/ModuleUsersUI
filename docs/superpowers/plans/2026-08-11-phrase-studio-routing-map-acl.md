# Phrase Studio and Routing Map ACL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace technical Phrase Studio and Routing Map REST permissions with explicit user-facing capabilities and stop Core from publishing inherited legacy callback stubs.

**Architecture:** ModuleUsersUI derives virtual UI owner actions from the same linked-action snapshot used for runtime grant expansion and REST-action exclusion. Core uses reflection to distinguish a real module callback override from the inherited `ConfigClass` stub; ModuleUsersUI keeps compatibility denials for older Core versions.

**Tech Stack:** PHP 8.1+ in ModuleUsersUI, PHP 8.4 in Core, Phalcon 5, PHPUnit, PHPStan.

## Global Constraints

- Do not run `git add`, commit, or push; the user has authorized implementation only.
- Preserve unrelated existing changes, especially `/Volumes/DevDisk/Developement/mikopbx/Core/.claude/skills/**`.
- Existing groups receive no automatic migration to `generate` or `manageEngineAndVoices`.
- `index` remains read-only; `save` remains limited to Phrase Studio default settings.
- `create` and `generate` must always be owned by the same Phrase Studio permission.
- Follow PSR-12, use `declare(strict_types=1);`, and run PHPStan for every changed PHP file.
- No JavaScript files are changed, so Babel is not required.

---

### Task 1: Semantic owner actions in ModuleUsersUI

**Files:**
- Create: `Lib/ACL/LinkedActionOwnerResolver.php`
- Create: `Tests/Unit/ACL/LinkedActionOwnerResolverTest.php`
- Create: `Tests/Unit/PhraseStudioPermissionLabelsTest.php`
- Modify: `App/Controllers/AccessGroupsRightsController.php`
- Modify: `Lib/ACL/ModulePhraseStudioACL.php`
- Modify: `Lib/ACL/ModuleRoutingMapACL.php`
- Modify: `Tests/Unit/ACL/NewModuleACLTest.php`
- Modify: `Messages/en.php`
- Modify: `Messages/ru.php`

**Interfaces:**
- Produces: `LinkedActionOwnerResolver::merge(array $publishedActions, string $controllerClass, array $linkedControllerActions, array $excludedActions = []): array`.
- Consumes: one immutable snapshot from `UsersUIACL::getLinkedControllerActions()` for virtual owners and exclusion calculation.
- Produces Phrase Studio owners: `index`, real MVC `save`, virtual `generate`, virtual `manageEngineAndVoices`.

- [ ] **Step 1: Write the failing resolver tests**

Create tests asserting:

```php
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
```

Add separate tests showing an absent controller adds nothing and an excluded virtual action is not returned.

- [ ] **Step 2: Run the resolver test and verify RED**

Run:

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/LinkedActionOwnerResolverTest.php
```

Expected: failure because `LinkedActionOwnerResolver` does not exist.

- [ ] **Step 3: Implement the pure resolver and integrate one linked-action snapshot**

Implement `merge()` so it preserves all published values, adds missing owner keys with `false`, and omits owner keys listed in `$excludedActions`.

In `AccessGroupsRightsController::getAvailableControllersFromApi()`:

```php
$linkedControllerActions = UsersUIACL::getLinkedControllerActions();
[$excludedControllers, $excludedActions] =
    $this->getExclusionsActionsControllers($linkedControllerActions);
```

After collecting published actions for a controller:

```php
$actions = LinkedActionOwnerResolver::merge(
    $actions,
    $controllerClass,
    $linkedControllerActions,
    $controllerExcludedActions
);
```

Change `getExclusionsActionsControllers()` to accept the snapshot instead of calling `UsersUIACL::getLinkedControllerActions()` again. Remove the generic-only virtual `save` insertion block; automatic CRUD mappings already place `save` in the linked-action snapshot.

- [ ] **Step 4: Run the resolver test and verify GREEN**

Run the command from Step 2. Expected: all resolver tests pass with pristine output.

- [ ] **Step 5: Write failing Phrase Studio and Routing Map ACL tests**

Update `NewModuleACLTest` to expect:

```php
'index' => [
    ModulePhraseStudioACL::API_V3_ENGINE => ['getList'],
    ModulePhraseStudioACL::API_V3_VOICES => ['getList'],
    ModulePhraseStudioACL::API_V3_PHRASES => ['getList', 'download'],
],
'generate' => [
    ModulePhraseStudioACL::API_V3_PHRASES => ['create', 'generate', 'promoteToTmp', 'delete'],
],
'manageEngineAndVoices' => [
    ModulePhraseStudioACL::API_V3_ENGINE => ['install', 'delete'],
    ModulePhraseStudioACL::API_V3_VOICES => ['install', 'delete'],
],
```

Assert there is no linked `save` owner, and assert these denials:

```php
['/pbxcore/api/modules/module-phrase-studio' => '*']
['/pbxcore/api/modules/module-routing-map' => '*']
```

- [ ] **Step 6: Run the ACL test and verify RED**

Run:

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/NewModuleACLTest.php
```

Expected: failures show the old `save` ownership, missing `create`, and empty compatibility denials.

- [ ] **Step 7: Implement the semantic ACL maps**

Change `ModulePhraseStudioACL` to match Step 5 exactly. Define constants for both legacy module paths and return wildcard denials from each module's `getAlwaysDenied()`.

Keep Routing Map ownership unchanged:

```php
'index' => [
    self::API_V3_MODULE_ROUTING_MAP_GRAPH => ['getIncoming', 'getOutgoing'],
],
```

- [ ] **Step 8: Run the ACL test and verify GREEN**

Run the command from Step 6. Expected: all `NewModuleACLTest` tests pass with pristine output.

- [ ] **Step 9: Write failing translation tests**

Create `PhraseStudioPermissionLabelsTest` that loads `Messages/en.php` and `Messages/ru.php` and asserts non-empty, resolved values for:

```php
module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_generate
module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_manageEngineAndVoices
```

- [ ] **Step 10: Run the label test and verify RED**

Run:

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/PhraseStudioPermissionLabelsTest.php
```

Expected: failure because both keys are absent.

- [ ] **Step 11: Add English and Russian labels**

Use these exact labels:

```php
// en.php
'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_generate' => 'phrase generation',
'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_manageEngineAndVoices' => 'engine and voice management',

// ru.php
'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_generate' => 'генерация фраз',
'module_usersui_CheckBox_PhraseStudio_ModulePhraseStudio_manageEngineAndVoices' => 'управление движком и голосами',
```

- [ ] **Step 12: Run all three targeted ModuleUsersUI test files**

Run each file separately because the available PHPUnit 9 runner accepts multiple paths unreliably:

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/LinkedActionOwnerResolverTest.php
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/NewModuleACLTest.php
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --do-not-cache-result --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/PhraseStudioPermissionLabelsTest.php
```

Expected: every command exits 0 with no failures or errors.

---

### Task 2: Ignore inherited legacy callbacks in Core discovery

**Files:**
- Create: `/Volumes/DevDisk/Developement/mikopbx/Core/tests/Unit/PBXCoreREST/Lib/OpenAPI/GetDetailedPermissionsActionTest.php`
- Modify: `/Volumes/DevDisk/Developement/mikopbx/Core/src/PBXCoreREST/Lib/OpenAPI/GetDetailedPermissionsAction.php`

**Interfaces:**
- Consumes: enabled module config objects, all of which are `ConfigClass` instances.
- Produces: a legacy wildcard only when `ReflectionMethod::getDeclaringClass()->getName() !== ConfigClass::class`.

- [ ] **Step 1: Write the failing discovery test**

Create two fixtures: one inherits `ConfigClass::moduleRestAPICallback()` unchanged; the other overrides it. Build a minimal `Phalcon\Di\Di`, register both under `PBXConfModulesProvider::SERVICE_NAME`, invoke private `scanModuleRestControllers()` through reflection, and assert the exact result contains only:

```php
[
    'OverriddenLegacyModule' => [
        'type' => 'REST',
        'controllers' => [
            '/pbxcore/api/modules/overridden-legacy-module' => [
                'name' => 'OverriddenLegacyModule',
                'label' => 'OverriddenLegacyModule',
                'actions' => ['*'],
            ],
        ],
    ],
]
```

Use `ReflectionClass::newInstanceWithoutConstructor()` for fixtures and set their public `moduleUniqueId` values explicitly.

- [ ] **Step 2: Run the Core test and verify RED**

Inside the production PHP container, from the Core root, run:

```bash
vendor/bin/phpunit -c tests/Unit/phpunit.xml tests/Unit/PBXCoreREST/Lib/OpenAPI/GetDetailedPermissionsActionTest.php
```

Expected: assertion failure because the inherited fixture is also published.

- [ ] **Step 3: Implement the reflection guard**

Import `MikoPBX\Modules\Config\ConfigClass` and `ReflectionMethod`. Replace the `method_exists()` condition with a check that the callback exists and its declaring class is not the base `ConfigClass`:

```php
$callbackImplemented = false;
if (method_exists($configObject, RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK)) {
    $callbackMethod = new ReflectionMethod(
        $configObject,
        RestAPIConfigInterface::MODULE_RESTAPI_CALLBACK
    );
    $callbackImplemented = $callbackMethod->getDeclaringClass()->getName() !== ConfigClass::class;
}

if ($callbackImplemented) {
    // existing legacy wildcard construction
}
```

Do not change `ConfigClass`, `RestAPIConfigInterface`, or module request routing.

- [ ] **Step 4: Run the Core test and verify GREEN**

Run the command from Step 2. Expected: the test passes and proves a real override remains discoverable.

- [ ] **Step 5: Run the Core PBXCoreREST unit slice**

Inside the production PHP container, run:

```bash
vendor/bin/phpunit -c tests/Unit/phpunit.xml tests/Unit/PBXCoreREST
```

Expected: all runnable tests pass; report any environment skips separately.

---

### Task 3: Static analysis and final verification

**Files:**
- Verify all files changed by Tasks 1 and 2.
- Keep: `docs/superpowers/specs/2026-08-11-phrase-studio-routing-map-acl-design.md`
- Keep: `docs/superpowers/plans/2026-08-11-phrase-studio-routing-map-acl.md`

**Interfaces:**
- Consumes: completed code from Tasks 1 and 2.
- Produces: fresh test, syntax, PHPStan, diff, and worktree-state evidence.

- [ ] **Step 1: Run syntax checks**

Run `php -l` for each changed PHP file in ModuleUsersUI and Core. Expected: `No syntax errors detected` for every file.

- [ ] **Step 2: Run ModuleUsersUI PHPStan**

Use Core's PHPStan and configuration for:

```text
App/Controllers/AccessGroupsRightsController.php
Lib/ACL/LinkedActionOwnerResolver.php
Lib/ACL/ModulePhraseStudioACL.php
Lib/ACL/ModuleRoutingMapACL.php
Tests/Unit/ACL/LinkedActionOwnerResolverTest.php
Tests/Unit/ACL/NewModuleACLTest.php
Tests/Unit/PhraseStudioPermissionLabelsTest.php
```

If local Phalcon is unavailable, run in the MikoPBX PHP container or use the established temporary Phalcon-stub approach and state which environment produced the result.

- [ ] **Step 3: Run Core PHPStan**

Inside the production PHP container, from Core root, run:

```bash
vendor/bin/phpstan analyse --configuration=phpstan.neon \
  src/PBXCoreREST/Lib/OpenAPI/GetDetailedPermissionsAction.php \
  tests/Unit/PBXCoreREST/Lib/OpenAPI/GetDetailedPermissionsActionTest.php
```

Expected: zero errors.

- [ ] **Step 4: Re-run all targeted tests on final code**

Repeat all three ModuleUsersUI commands from Task 1 Step 12 and the focused Core command from Task 2 Step 2. Expected: zero failures and zero errors.

- [ ] **Step 5: Inspect both repositories without staging**

Run:

```bash
git diff --check
git status --short
git -C /Volumes/DevDisk/Developement/mikopbx/Core diff --check
git -C /Volumes/DevDisk/Developement/mikopbx/Core status --short
```

Confirm ModuleUsersUI contains only planned changes and Core retains the pre-existing `.claude/skills/**` changes plus the two planned Core files. Do not stage anything.
