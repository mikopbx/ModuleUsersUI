# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is ModuleUsersUI, a MikoPBX module that provides user rights management and access control functionality. It allows multi-user access to MikoPBX with role-based permissions and includes LDAP/AD authentication support.

## Development Commands

### Code Quality
- Use `phpstan` to check code quality after creating or modifying PHP files
- PHP version requirement: ^7.4 (platform version: 7.4.0)

### JavaScript Build Process
- Source JS files are in `public/assets/js/src/`
- Compiled JS files are in `public/assets/js/`
- Use Babel for JS compilation: `/Users/nb/PhpstormProjects/mikopbx/MikoPBXUtils/node_modules/.bin/babel "$INPUT_FILE" --out-dir "$OUTPUT_DIR" --source-maps inline --presets airbnb`

### Dependencies
- Run `composer install` to install PHP dependencies
- Main dependency: `directorytree/ldaprecord` for LDAP functionality

## Architecture Overview

### Core Components
1. **Module Structure** - Standard MikoPBX module following Phalcon framework patterns
2. **Access Control System** - Multi-layered ACL implementation with role-based permissions
3. **Authentication** - Dual authentication: local credentials and LDAP/AD integration
4. **User Interface** - Tabbed interface using Semantic UI with Volt templating

### Key Directories
- `App/` - Main application logic (Controllers, Forms, Views, Providers)
- `Lib/` - Core libraries and ACL system
- `Models/` - Phalcon ORM models for database entities
- `Setup/` - Module installation and configuration
- `Messages/` - Internationalization files
- `public/assets/` - Frontend assets (CSS, JS, images)

### Database Models
- `AccessGroups` - User access groups with permissions
- `AccessGroupsRights` - Granular rights assignment to groups
- `AccessGroupCDRFilter` - CDR filtering rules per group
- `UsersCredentials` - User authentication credentials
- `LdapConfig` - LDAP/AD server configuration

### Controllers Architecture
- `ModuleUsersUIBaseController` - Base controller with common functionality
- `ModuleUsersUIController` - Main module interface (groups, users, LDAP tabs)
- `AccessGroupsController` - Access group management
- `AccessGroupsRightsController` - Rights assignment
- `AccessGroupCDRFilterController` - CDR filtering configuration
- `UsersCredentialsController` - User credential management
- `LdapConfigController` - LDAP configuration

### ACL System
The module implements a sophisticated ACL system:
- `UsersUIACL` - Main ACL modifier that integrates with MikoPBX core ACL
- `CoreACL` and various `Module*ACL` classes - Define permissions for different MikoPBX modules
- Role-based access with prefix: `Constants::MODULE_ROLE_PREFIX`
- Dynamic permission assignment based on access group configuration

### Authentication Flow
1. `UsersUIAuthenticator` - Handles login authentication
2. Supports both local password and LDAP authentication
3. `UsersUILdapAuth` - LDAP authentication implementation
4. Session management integrated with MikoPBX core

### Frontend Architecture
- Uses Semantic UI framework for styling
- JavaScript modules for each tab functionality:
  - `module-users-ui-index.js` - Main module initialization
  - `module-users-ui-index-users.js` - Users tab functionality
  - `module-users-ui-index-ldap.js` - LDAP configuration tab
  - `module-users-ui-modify-ag.js` - Access group modification
  - `module-users-ui-extensions-modify.js` - Extension modifications
- Volt templating engine for server-side rendering

### Configuration
- `module.json` - Module metadata and release settings
- `composer.json` - PHP dependencies and autoloading (PSR-4)
- License: GPL-3.0-or-later

## Development Patterns
- Follow MikoPBX module development standards
- Use Phalcon ORM for database operations
- Implement proper ACL checks in all controllers
- Maintain separation between frontend source and compiled assets
- Use dependency injection container for service registration
- Follow PSR-4 autoloading standards with namespace `Modules\ModuleUsersUI\`

## Key Files to Understand
- `App/Module.php` - Main module definition and service registration
- `Setup/PbxExtensionSetup.php` - Module installation and sidebar integration
- `Lib/UsersUIACL.php` - Core ACL modification logic
- `Lib/UsersUIAuthenticator.php` - Authentication handler
- `App/Controllers/ModuleUsersUIController.php` - Main controller