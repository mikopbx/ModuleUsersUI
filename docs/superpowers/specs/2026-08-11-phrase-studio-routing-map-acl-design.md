# Phrase Studio and Routing Map ACL Design

## Goal

Remove technical REST permissions from the access-group form and expose only permissions that describe user-visible capabilities.

## Routing Map

Routing Map is read-only. Its single `index` permission represents access to the module and grants both graph reads:

- `graph:getIncoming`
- `graph:getOutgoing`

No separate REST API permission is shown.

The displayed `/pbxcore/api/modules/module-routing-map:*` permission is not a real module API. It comes from Core treating the inherited default `ConfigClass::moduleRestAPICallback()` as an overridden legacy callback.

## Phrase Studio

The ModulePhraseStudio controller exposes four semantic permissions:

- `index` — open the module and read engine status, voice catalogue, phrase history, and phrase downloads;
- `save` — save the default voice and sample-rate settings through the MVC controller;
- `generate` — generate, stage, and delete generated phrases;
- `manageEngineAndVoices` — install and remove the Piper engine and voice models.

REST ownership is:

| UI permission | REST endpoint | Operations |
| --- | --- | --- |
| `index` | `/pbxcore/api/v3/module-phrase-studio/engine` | `getList` |
| `index` | `/pbxcore/api/v3/module-phrase-studio/voices` | `getList` |
| `index` | `/pbxcore/api/v3/module-phrase-studio/phrases` | `getList`, `download` |
| `generate` | `/pbxcore/api/v3/module-phrase-studio/phrases` | `create`, `generate`, `promoteToTmp`, `delete` |
| `manageEngineAndVoices` | `/pbxcore/api/v3/module-phrase-studio/engine` | `install`, `delete` |
| `manageEngineAndVoices` | `/pbxcore/api/v3/module-phrase-studio/voices` | `install`, `delete` |

`create` and `generate` are aliases handled by the same Phrase Studio processor and must always belong to the same permission.

Russian and English labels are added for the two virtual actions. The existing `save` label remains limited to saving module defaults and no longer owns unrelated REST writes.

## Virtual owner actions

`AccessGroupsRightsController` currently synthesizes only the generic `save` action. It will also add owner actions declared by `UsersUIACL::getLinkedControllerActions()` when the owner controller is present in Core's permissions response and the action is not a real published action.

This keeps the rights form and runtime grant expansion driven by the same linked-action map. It also avoids adding module-specific action names to the generic CRUD resolver.

## False legacy endpoints

Core's detailed-permissions scanner will include `moduleRestAPICallback` only when reflection shows that the method is declared outside the base `ConfigClass`. Inheriting the base `CHECK` stub is not evidence that a module implements Pattern 2 REST API.

ModuleUsersUI fallback ACLs for Phrase Studio and Routing Map will additionally classify their legacy module paths as always denied. This hides the false entries when ModuleUsersUI runs with an older Core and keeps any future unclassified legacy callback closed until it receives an explicit ACL mapping.

## Compatibility and tests

- Existing saved `index` rights retain their read-only meaning. Existing `save` rights retain only the MVC default-settings save operation.
- No rights migration is performed. Existing groups do not automatically receive Phrase Studio generation or engine/voice management; administrators must grant both new permissions explicitly.
- Unit tests verify the new Phrase Studio ownership, compatibility exclusions, and Routing Map exclusion.
- Core tests verify that an inherited default callback is omitted and an actual override is still discovered.
- Run targeted PHPUnit tests and PHPStan for every changed PHP file. No JavaScript compilation is required.
