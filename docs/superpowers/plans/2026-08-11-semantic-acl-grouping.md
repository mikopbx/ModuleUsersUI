# Semantic ACL Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group technical Core/module permissions under meaningful UI rights and make unnamed REST endpoints display their full path.

**Architecture:** Static fallback ACL classes describe ownership of helper actions without modifying extension modules themselves. Core links remain in `CoreACL`; reusable strings live in `EndpointConstants`. A small pure `PermissionLabelResolver` isolates REST-specific label fallback from the Phalcon form so the behavior is unit-testable.

**Tech Stack:** PHP 8.1, Phalcon AdminCabinet forms, PHPUnit 10, PHPStan.

## Global Constraints

- Do not bind write or destructive operations to a read-only `index` permission.
- Unknown operations remain visible until explicitly classified.
- Change only PHP code; no Babel compilation is required.
- Run PHPStan after implementation.
- Do not stage or commit changes.

---

### Task 1: Core semantic links and exclusions

**Files:**
- Create: `Tests/bootstrap.php`
- Modify: `Lib/EndpointConstants.php`
- Modify: `Lib/ACL/CoreACL.php`
- Create: `Tests/Unit/ACL/CoreACLTest.php`

**Interfaces:**
- Produces: a local test bootstrap that loads Core dependencies and maps `Modules\\ModuleUsersUI\\` to this checkout.
- Consumes: `CoreACL::getLinkedControllerActions(): array`, `CoreACL::getAlwaysDenied(): array`.
- Produces: constants for `firewall-bouncer`, `getStatsByProvider`, `getUniqueDIDs`, and `checkClientIpVisibility`.

- [ ] **Step 1: Add the local test bootstrap and establish the baseline**

```php
require '/Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php';
spl_autoload_register(static function (string $class): void { /* map this module namespace to the repository root */ });
```

- [ ] **Step 2: Write failing Core mapping tests**

```php
$links = CoreACL::getLinkedControllerActions();
self::assertContains(E::ACTION_CDR_GET_STATS_BY_PROVIDER, $links[CallDetailRecordsController::class][E::ACTION_INDEX][E::API_V3_CDR]);
self::assertContains(E::ACTION_INCOMING_ROUTES_GET_UNIQUE_DIDS, $links[IncomingRoutesController::class][E::ACTION_MODIFY][E::API_V3_INCOMING_ROUTES]);
self::assertSame('*', CoreACL::getAlwaysDenied()[E::API_V3_FIREWALL_BOUNCER]);
self::assertContains(E::ACTION_SYS_CHECK_CLIENT_IP_VISIBILITY, CoreACL::getAlwaysDenied()[E::API_V3_SYSTEM]);
```

- [ ] **Step 3: Run the focused test and verify the missing constants/rules fail**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/CoreACLTest.php
```

- [ ] **Step 4: Add the constants and minimal Core rules**

```php
public const API_V3_FIREWALL_BOUNCER = '/pbxcore/api/v3/firewall-bouncer';
public const ACTION_CDR_GET_STATS_BY_PROVIDER = 'getStatsByProvider';
public const ACTION_INCOMING_ROUTES_GET_UNIQUE_DIDS = 'getUniqueDIDs';
public const ACTION_SYS_CHECK_CLIENT_IP_VISIBILITY = 'checkClientIpVisibility';
```

- [ ] **Step 5: Re-run the focused test and require PASS**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --no-configuration --bootstrap Tests/bootstrap.php Tests/Unit/ACL/CoreACLTest.php
```

### Task 2: Existing extension fallback ACLs

**Files:**
- Rename: `Lib/ACL/ModuleExtendedCDRs.php` to `Lib/ACL/ModuleExtendedCDRsACL.php`
- Modify: `Lib/ACL/ModuleCallTrackingACL.php`
- Modify: `Lib/ACL/ModuleZabbixAgent5ACL.php`
- Modify: `Lib/ACL/ModulePhoneBookACL.php`
- Create: `Tests/Unit/ACL/ExistingModuleACLTest.php`

**Interfaces:**
- Consumes: `ACLInterface` and module controller names expressed with `::class`.
- Produces: discoverable `ModuleExtendedCDRsACL` and semantic mappings for four installed modules.

- [ ] **Step 1: Write data-driven failing assertions for each owner action and linked target**

```php
self::assertSame(
    ['saveSettings'],
    ModulePhoneBookACL::getLinkedControllerActions()[ModulePhoneBookController::class]['save'][ModulePhoneBookController::class]
);
self::assertSame(
    ['deleteAllRecords'],
    ModulePhoneBookACL::getLinkedControllerActions()[ModulePhoneBookController::class]['delete'][ModulePhoneBookController::class]
);
```

The same test asserts every exact Extended CDR read/mutation helper, Call Tracking link, and Zabbix legacy plus v3 status link from the approved specification.

- [ ] **Step 2: Run the focused test and verify it fails against the empty/incomplete fallback classes**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/ACL/ExistingModuleACLTest.php
```

- [ ] **Step 3: Rename the Extended CDR class/file and implement only the asserted mappings**

```php
class ModuleExtendedCDRsACL implements ACLInterface
{
    public static function getLinkedControllerActions(): array
    {
        return [ModuleExtendedCDRsController::class => [E::ACTION_INDEX => [], E::ACTION_SAVE => []]];
    }
}
```

- [ ] **Step 4: Implement Call Tracking, Zabbix, and PhoneBook mappings and require the focused test to pass**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/ACL/ExistingModuleACLTest.php
```

### Task 3: New extension fallback ACLs

**Files:**
- Create: `Lib/ACL/ModuleMonitorActiveCallsACL.php`
- Create: `Lib/ACL/ModuleRoutingMapACL.php`
- Create: `Lib/ACL/ModulePhraseStudioACL.php`
- Create: `Lib/ACL/ModuleLocalSpeechToTextACL.php`
- Create: `Tests/Unit/ACL/NewModuleACLTest.php`

**Interfaces:**
- Consumes: module controller class strings and published legacy/v3 endpoint paths.
- Produces: semantic view/change mappings and LocalSpeechToText service endpoint exclusions.

- [ ] **Step 1: Write failing tests for every approved owner/action mapping**

```php
$links = ModuleMonitorActiveCallsACL::getLinkedControllerActions();
self::assertSame(
    ['getActiveChannels', 'getActiveChannelsV2'],
    $links[ModuleMonitorActiveCallsController::class]['index'][ModuleMonitorActiveCallsController::class]
);
self::assertSame(
    ['backandEnable', 'saveUser', 'executeCall'],
    $links[ModuleMonitorActiveCallsController::class]['save'][ModuleMonitorActiveCallsController::class]
);
```

Tests also assert both Routing Map graph actions, Phrase Studio read/write separation, transcript list/record ownership, and wildcard denial of LocalSpeechToText `/jobs` and `/workers`.

- [ ] **Step 2: Run the focused test and verify the missing classes fail**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/ACL/NewModuleACLTest.php
```

- [ ] **Step 3: Create the four ACL classes with only the asserted semantic mappings**

```php
final class ModuleRoutingMapACL implements ACLInterface
{
    public static function getLinkedControllerActions(): array
    {
        return [ModuleRoutingMapController::class => ['index' => [self::API_GRAPH => ['getIncoming', 'getOutgoing']]]];
    }
}
```

- [ ] **Step 4: Re-run the focused test and require PASS**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/ACL/NewModuleACLTest.php
```

### Task 4: Endpoint-specific label fallback

**Files:**
- Create: `Lib/PermissionLabelResolver.php`
- Modify: `App/Forms/AccessGroupForm.php`
- Create: `Tests/Unit/PermissionLabelResolverTest.php`

**Interfaces:**
- Produces: `PermissionLabelResolver::controller(string $module, string $controllerName, mixed $apiLabel, callable $translate): string` and `PermissionLabelResolver::isUsableApiLabel(mixed $label): bool`.
- Consumes: a translation callback returning either a localized value or its unresolved key.

- [ ] **Step 1: Write failing pure unit tests for the REST and MVC fallback matrix**

```php
self::assertSame('/pbxcore/api/v3/example/items', PermissionLabelResolver::controller(
    'ModuleExample',
    '/pbxcore/api/v3/example/items',
    'Example module',
    static fn(string $key): string => $key === 'BreadcrumbModuleExample' ? 'Example module' : $key,
));
self::assertSame('Items endpoint', PermissionLabelResolver::controller(
    'ModuleExample',
    '/pbxcore/api/v3/example/items',
    'Items endpoint',
    static fn(string $key): string => $key,
));
```

Additional assertions cover empty and unresolved REST labels plus unchanged MVC controller/module breadcrumb fallback.

- [ ] **Step 2: Run the focused test and verify the resolver is missing**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/PermissionLabelResolverTest.php
```

- [ ] **Step 3: Implement the pure resolver and delegate form controller/action label validation to it**

```php
return PermissionLabelResolver::controller(
    $module,
    $controllerName,
    $this->permissionLabels[$module][$controllerName]['label'] ?? '',
    fn(string $key): string => $this->translation->_($key),
);
```

- [ ] **Step 4: Re-run the focused test and require PASS**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit/PermissionLabelResolverTest.php
```

### Task 5: Repository verification

**Files:**
- Verify: all changed PHP files and both design documents.

**Interfaces:**
- Consumes: completed tasks 1-4.
- Produces: syntax-, test-, and static-analysis evidence with an unstaged final diff.

- [ ] **Step 1: Run all PHP unit tests**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpunit --bootstrap /Volumes/DevDisk/Developement/mikopbx/Core/vendor/autoload.php Tests/Unit
```

- [ ] **Step 2: Run syntax checks on every changed PHP file**

```bash
git diff --name-only -- '*.php' | xargs -n1 php -l
```

- [ ] **Step 3: Run PHPStan over changed application files**

```bash
/Volumes/DevDisk/Developement/mikopbx/Core/vendor/bin/phpstan analyse --no-progress App/Forms/AccessGroupForm.php Lib/PermissionLabelResolver.php Lib/EndpointConstants.php Lib/ACL/CoreACL.php Lib/ACL/ModuleExtendedCDRsACL.php Lib/ACL/ModuleCallTrackingACL.php Lib/ACL/ModuleZabbixAgent5ACL.php Lib/ACL/ModuleMonitorActiveCallsACL.php Lib/ACL/ModuleRoutingMapACL.php Lib/ACL/ModulePhraseStudioACL.php Lib/ACL/ModulePhoneBookACL.php Lib/ACL/ModuleLocalSpeechToTextACL.php
```

- [ ] **Step 4: Inspect the final worktree without staging**

```bash
git diff --check
git status --short
git diff --stat
git diff
```
