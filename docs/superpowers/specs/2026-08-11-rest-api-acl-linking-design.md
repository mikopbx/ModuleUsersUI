# Semantic ACL grouping for Core and extension modules

## Goal

Keep technical helper actions and REST operations out of the standalone permission list when they are implementation details of a meaningful AdminCabinet permission. Preserve separate high-level rights such as view, edit, and delete. Hide service-only APIs from ordinary limited user groups.

When a REST endpoint cannot provide its own meaningful title, show its full path instead of repeating the module title. This keeps an unlinked permission understandable and configurable.

## Grouping rules

- Link only operations required to perform the selected high-level UI action.
- Do not bind write or destructive operations to a read-only `index` permission.
- A linked operation is granted at runtime with its owner action and is hidden from the separate permission tree.
- An always-denied operation is hidden and cannot be granted to a limited user-group role.
- Unknown operations remain visible so new functionality does not silently inherit broader access.

## Core mappings

| High-level permission | Linked or excluded operation | Reason |
| --- | --- | --- |
| `CallDetailRecordsController::index` | `/pbxcore/api/v3/cdr:getStatsByProvider` | Provider statistics are read-only CDR data used by the CDR page. |
| `IncomingRoutesController::modify` | `/pbxcore/api/v3/incoming-routes:getUniqueDIDs` | The route editor uses it to suggest DID values. |
| always denied | `/pbxcore/api/v3/system:checkClientIpVisibility` | Internal helper of the administrative Firewall page. |
| always denied | all actions of `/pbxcore/api/v3/firewall-bouncer` | Service API authenticated and managed through API keys, not ordinary user roles. |

## Extension-module mappings

### ModuleExtendedCDRs

- Rename the fallback ACL class/file to `ModuleExtendedCDRsACL` so the existing module loader can discover it.
- `index` owns read-only page helpers: `getTablesDescription`, `getNewRecords`, `getState`, `getHistory`, `getCdrQueue`, and `getOutgoingEmployeeCalls`.
- `index` owns all actions of the legacy callback endpoint `/pbxcore/api/modules/module-extended-c-d-rs` and the additional-route read/export actions `downloads`, `exportHistory`, `exportHistoryDetail`, `recordsAction`, and `exportOutgoingEmployeeCalls` published by Core under the legacy `/` controller key.
- `save` owns mutation helpers: `delete`, `saveTableData`, `changePriority`, `saveMainVariantReport`, `removeVariantReport`, and `saveSearchSettings`.
- No wildcard is attached to `index`, so a future write-capable REST action will remain visible until it is classified.

### ModuleCallTracking

- `index` owns `save` and all actions of `/pbxcore/api/modules/module-call-tracking`, because the module exposes one configuration page and its REST callback is an internal part of that page.

### ModuleZabbixAgent5

- `index` owns `save`, the existing legacy `/pbxcore/api/modules/module-zabbix-agent5` endpoint, and `getStatus` plus `downloadTemplate` on `/pbxcore/api/v3/module-zabbix-agent5/status`.

### ModuleMonitorActiveCalls

- Add a fallback `ModuleMonitorActiveCallsACL` definition.
- `index` owns the read helpers `getActiveChannels` and `getActiveChannelsV2`, plus all actions of the legacy `/pbxcore/api/modules/module-monitor-active-calls` endpoint.
- `save` owns `backandEnable`, `saveUser`, and `executeCall`. These operations change user settings, create a backend service token, or control a live call, so they must not be inherited from read-only access.

### ModuleRoutingMap

- Add a fallback `ModuleRoutingMapACL` definition.
- `index` owns `getIncoming` and `getOutgoing` on `/pbxcore/api/v3/module-routing-map/graph`; both are read-only data sources for the routing-map page.

### ModulePhraseStudio

- Add a fallback `ModulePhraseStudioACL` definition.
- `index` owns `getList` and `download` operations on the `engine`, `voices`, and `phrases` endpoints.
- `save` owns `install`, `generate`, `promoteToTmp`, and `delete` operations on those endpoints.

### ModulePhoneBook

- Preserve the existing `index` links for `getNewRecords` and the legacy module REST endpoint.
- `save` owns `saveSettings`.
- `delete` owns `deleteAllRecords`.

### ModuleUsersGroups

- Keep the existing mapping unchanged: it already separates viewing/modification helpers from mutations.

### ModuleLocalSpeechToText

- Add a fallback `ModuleLocalSpeechToTextACL` definition.
- `transcripts` owns list and event-feed operations under `call-transcripts`, `transcripts`, and their `/events` endpoints.
- `transcript` owns individual transcript-record retrieval.
- Worker-facing `/jobs` and `/workers` endpoints are always denied for limited UI roles because they use localhost or bearer-token service authentication.
- Meaningful page actions such as model management, retry, recording, logs, and worker API-key management remain separate configurable permissions unless a direct helper relationship is established.

## REST endpoint title fallback

`AccessGroupForm` treats path-like controller identifiers beginning with `/` specially, covering both `/pbxcore/...` endpoints and the legacy `/` route group:

1. Use the detailed-permissions description only when it is a usable, endpoint-specific label.
2. Reject an empty/unresolved label and a label equal to the translated module breadcrumb; the latter is Core's generic fallback and does not identify the endpoint.
3. Return the complete endpoint path as the final fallback, for example `/pbxcore/api/v3/module-phrase-studio/voices`.
4. Do not apply MVC `mm_*`, controller breadcrumb, or module breadcrumb fallbacks to REST paths.

Ordinary MVC controllers retain the current translation and breadcrumb fallback chain.

## Implementation boundaries

- Define reusable endpoint/action constants in `EndpointConstants` where they improve clarity.
- Extend `CoreACL` for Core mappings and create or update only the affected fallback ACL classes under `Lib/ACL`.
- Change only PHP code; no frontend JavaScript or Babel compilation is required.
- Do not introduce blanket hiding for unknown operations.
- Do not stage or commit changes.

## Compatibility

Fallback ACL rules are static and tolerate module/Core versions that do not publish every listed action: absent permission targets do not become visible entries. Existing CRUD auto-linking remains unchanged.

## Verification

- Add focused unit tests for every fallback ACL mapping and Core rule.
- Add form-label tests proving that a meaningful endpoint label is preserved, an absent or module-generic REST label falls back to the full path, and an ordinary MVC controller still uses its breadcrumb.
- First run the new focused tests and observe the expected failures, then implement the mappings.
- Run the available PHPUnit suite, PHP syntax checks, code-style checks, and PHPStan as required by the repository instructions.
- Inspect the final diff and leave all files unstaged.
