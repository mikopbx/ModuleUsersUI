# CLAUDE.md

This file records repository-specific contracts and traps that are easy to miss while changing ModuleUsersUI. Do not duplicate information that is obvious from the source tree, `composer.json`, or standard MikoPBX conventions.

## Change discipline

- Do not run `git add`, commit, or push unless the user explicitly requests it.
- Run PHPStan after creating or modifying PHP. Phalcon-dependent analysis may require the MikoPBX runtime/container or appropriate stubs; a local PHP CLI without Phalcon is not sufficient evidence.
- JavaScript under `public/assets/js/src/` is the source of truth. After changing it, regenerate the corresponding file under `public/assets/js/`; do not maintain the generated file independently.
- Use the project Babel installation exactly as follows:

  ```bash
  /Users/nb/PhpstormProjects/mikopbx/MikoPBXUtils/node_modules/.bin/babel "$INPUT_FILE" --out-dir "$OUTPUT_DIR" --source-maps inline --presets airbnb
  ```

## ACL aggregation contract

`Lib/UsersUIACL.php` builds linked permissions from three sources:

1. convention-based CRUD links from `AutoLinkedActionsResolver`;
2. explicit Core rules from `CoreACL`, which replace automatic rules for the same AdminCabinet owner action;
3. enabled-module rules, loaded last.

The standard automatic CRUD ownership is intentionally coarse:

- `index` owns REST `getList`;
- `modify` owns `getRecord` and `getDefault`;
- virtual `save` owns `saveRecord`, `delete`, `create`, `update`, `patch`, and `copy`.

A linked REST operation is hidden from the rights form and granted at runtime together with its owner UI action. Therefore:

- add explicit rules for non-standard semantics instead of broadening the generic mapping;
- never attach bulk exports, destructive operations, service commands, or other writes to a read-only owner merely because they share an endpoint;
- keep an unknown REST operation visible until it is deliberately linked or classified as always denied;
- use `getAlwaysDenied()` for service-only or superuser-only operations that limited roles must neither see nor receive.

The rights form is built from Core's `/pbxcore/api/v3/openapi:getDetailedPermissions` response. When changing discovery or grouping, verify both sides of the contract: what the form hides and what `UsersUIACL::modify()` grants.

## Extension-module ACL loading

For every enabled module with uniqid `<ModuleUniqid>`, `UsersUIACL` tries these classes in order:

1. `Modules\<ModuleUniqid>\Lib\<ModuleUniqid>ACL` from the extension itself;
2. `Modules\ModuleUsersUI\Lib\ACL\<ModuleUniqid>ACL` as the local fallback.

The filename and class name must therefore be exactly `<ModuleUniqid>ACL.php` and `<ModuleUniqid>ACL`. A differently named fallback is silently undiscoverable.

Fallback ACL files must remain loadable when the target extension is absent. Refer to optional module controllers by stable FQCN strings, normally through a private `CONTROLLER` constant; importing or resolving the external class can break autoloading and static analysis.

Legacy module REST discovery has two unusual shapes that mappings must preserve:

- `moduleRestAPICallback` may expose `/pbxcore/api/modules/<kebab-module-id>` with action `*`;
- routes returned by `getPBXCoreRESTAdditionalRoutes()` may be grouped under controller key `/` rather than their public path.

Do not normalize `/` away: any controller identifier beginning with `/` is treated as a REST controller by the permission-label resolver.

## Permission labels

REST and MVC labels intentionally have different fallback behavior in `PermissionLabelResolver`:

- a usable, specific API description wins;
- an empty/untranslated API key, or a REST description equal to the module breadcrumb, falls back to the full REST controller path;
- a REST path must never fall through to an MVC `mm_*` translation or generic module title;
- MVC controllers retain the chain `API description -> mm_* -> controller breadcrumb -> module breadcrumb -> raw controller name`.

This prevents a technical endpoint from being displayed only as a module name and losing the meaning of the permission being configured.

## LDAP contracts

- Keep PHP at `^8.1` or newer and LdapRecord at v3. LdapRecord v2 pulled dependencies whose PHP 8.4 deprecations are converted by the Core error handler into authentication failures before an LDAP request is attempted.
- `WorkerApiCommands` does not register `LoggerAuthProvider`. LDAP failure logging must retain the syslog fallback for worker execution.
- libldap TLS defaults changed with `ldap_set_option(null, ...)` are process-wide. They must be applied before creating an LDAPS connection and reset after use so a reused PHP-FPM/worker process cannot inherit verification policy or a deleted temporary CA path.
- `useTLS` is a legacy persisted field. When `tlsMode` is absent, `useTLS=1` means `starttls`; do not reinterpret it as implicit LDAPS.
- Switching the LDAP server type may replace only empty values or known shipped defaults. Operator-entered DN, filter, login, and attribute values must survive the switch; placeholders may always change.
- Preserve the CA certificate value while TLS is disabled. An operator can configure it before enabling STARTTLS/LDAPS later.
