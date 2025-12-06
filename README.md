# MikoPBX User Access Control Module

*Read this in other languages: [English](README.md), [Русский](readme.ru.md).*

## Overview

**ModuleUsersUI** is a comprehensive access control module for MikoPBX that enables multi-user access with role-based permissions. It provides granular control over web interface sections, REST API endpoints, and call history visibility.

## Key Features

### Access Groups Management
- **Role-Based Access Control (RBAC)**: Create unlimited access groups with specific permissions
- **Full Access Mode**: Option to grant unrestricted access for administrator groups
- **Custom Home Page**: Configure landing page after login for each group
- **Granular Permissions**: Control access to individual interface sections and actions

### Authentication Methods
- **Local Authentication**: Username/password stored in MikoPBX database
- **LDAP/Active Directory**: Integration with corporate directory services
  - Support for OpenLDAP and Microsoft Active Directory
  - Configurable user filters and attribute mapping
  - Automatic user synchronization

### Permission Categories

#### Web Interface (AdminCabinet)
Fine-grained control over MikoPBX admin panel sections:
- **View**: Access to list and index pages
- **Modify**: Ability to open and view record details
- **Edit/Delete**: Create, update, and remove records

Supported sections include:
- Employees and Extensions
- Call Queues and Conference Rooms
- IVR Menus and Dialplan Applications
- Incoming/Outgoing Routes
- Providers (SIP/IAX)
- Sound Files
- Call History (CDR)
- System Settings
- And more...

#### REST API Access
Control which API endpoints users can access:
- Standard CRUD operations (getList, getRecord, saveRecord, delete)
- Custom actions per endpoint
- Automatic linking between UI and API permissions

### Call History (CDR) Filtering
Restrict call record visibility based on employee assignments:
- **No Filter**: Show all call records
- **Only Selected**: Show only calls involving specific employees
- **Outgoing Only**: Show only outgoing calls from selected employees
- **Except Selected**: Hide calls from specific employees

### User Profile Self-Service
- Password change for local users
- Passkey (WebAuthn) management for passwordless authentication

## Architecture

### Database Models
| Model | Description |
|-------|-------------|
| `AccessGroups` | Access group definitions with permissions |
| `AccessGroupsRights` | Granular permission assignments |
| `AccessGroupCDRFilter` | CDR filter rules per group |
| `UsersCredentials` | User authentication data |
| `LdapConfig` | LDAP server configuration |

### Key Components
- **UsersUIACL**: Core ACL modification logic integrating with MikoPBX
- **UsersUIAuthenticator**: Handles local and LDAP authentication
- **AutoLinkedActionsResolver**: Automatic UI↔API permission linking
- **UsersUICDRFilter**: CDR visibility filtering

## Installation

1. Download module from MikoPBX Marketplace or GitHub Releases
2. Upload via **Modules → Install Module** in MikoPBX admin panel
3. Enable the module
4. Configure access groups and assign users

## Requirements

- MikoPBX 2025.1.1 or higher
- PHP 8.3+
- Valid license (commercial module)

## Configuration

### Creating an Access Group

1. Navigate to **Modules → User Access Control**
2. Click **Add New Access Group**
3. Configure:
   - Group name and description
   - Full access toggle (for admin groups)
   - Home page after login
   - Interface permissions
   - REST API permissions
   - CDR filter settings

### Adding Users

1. Go to **Extensions** section
2. Edit an employee
3. In **MikoPBX Login** tab:
   - Enable login access
   - Set username and password
   - Select access group
   - Optionally enable LDAP authentication

### LDAP Configuration

1. Navigate to **LDAP Settings** tab in module
2. Configure:
   - Server address and port
   - Admin credentials for directory queries
   - Base DN
   - User filter and attributes
3. Test connection and user retrieval

## API Integration

The module automatically manages permissions for REST API v3 endpoints:

```
GET  /pbxcore/api/v3/{resource}          → getList
GET  /pbxcore/api/v3/{resource}/{id}     → getRecord
POST /pbxcore/api/v3/{resource}          → create
PUT  /pbxcore/api/v3/{resource}/{id}     → update
DELETE /pbxcore/api/v3/{resource}/{id}   → delete
```

## Development

### Running Tests

```bash
# Unit tests (PHP)
./vendor/bin/phpunit

# Integration tests (Python)
cd Tests/Integration
pip install -r requirements.txt
cp .env.example .env
# Configure .env with your MikoPBX instance
pytest
```

### Project Structure

```
ModuleUsersUI/
├── App/
│   ├── Controllers/     # MVC Controllers
│   ├── Forms/           # Phalcon Forms
│   └── Views/           # Volt Templates
├── Lib/
│   ├── ACL/             # Access Control Logic
│   └── *.php            # Core Libraries
├── Models/              # Phalcon ORM Models
├── Messages/            # i18n Translations
├── Setup/               # Installation Scripts
├── Tests/               # Test Suites
└── public/assets/       # Frontend Resources
```

## Documentation

Full documentation available at:
- English: [docs.mikopbx.com](https://docs.mikopbx.com/mikopbx/english/modules/miko/module-users-u-i)
- Russian: [docs.mikopbx.ru](https://docs.mikopbx.ru/mikopbx/modules/miko/module-users-u-i)

## Support

- Telegram: [@mikopbx_dev](https://t.me/joinchat/AAPn5xSqZIpQnNnCAa3bBw)
- Email: help@miko.ru
- Issues: [GitHub Issues](https://github.com/mikopbx/ModuleUsersUI/issues)

## License

GPL-3.0-or-later - see [LICENSE](LICENSE) file for details.

Copyright © 2017-2025 MIKO LLC
