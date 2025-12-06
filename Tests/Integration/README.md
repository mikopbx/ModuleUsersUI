# ModuleUsersUI Integration Tests

Integration tests for ModuleUsersUI - MikoPBX user rights management and ACL module.

## Requirements

- Python 3.8+
- Running MikoPBX instance
- Admin credentials

## Installation

```bash
cd Tests/Integration
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MikoPBX credentials
```

## Configuration

Edit `.env` file:

```env
MIKOPBX_API_URL=http://localhost:8189/pbxcore/api/v3
MIKOPBX_API_USERNAME=admin
MIKOPBX_API_PASSWORD=your_password
```

## Running Tests

Run all tests:
```bash
pytest -v
```

Run specific test file:
```bash
pytest test_01_access_groups_crud.py -v
```

Run with output:
```bash
pytest -v -s
```

Run only ACL tests:
```bash
pytest -v -k "acl"
```

## Test Files

| File | Description |
|------|-------------|
| test_01_access_groups_crud.py | CRUD operations for access groups |
| test_02_users_crud.py | User credentials management |
| test_03_admin_access.py | Administrative access testing |
| test_04_user_group_transfer.py | User transfer between groups |
| test_05_controller_acl.py | Controller-level ACL checks |
| test_06_rest_api_acl.py | REST API ACL checks |
| test_07_cdr_filter.py | CDR filtering by access group |

## Test Scenarios

1. **Access Groups CRUD** - Creating, reading, updating, deleting access groups
2. **Users CRUD** - Creating users with limited rights and password authentication
3. **Admin Access** - Testing groups with full administrative access
4. **User Transfer** - Moving users between groups and verifying ACL changes
5. **Controller ACL** - Verifying access restrictions at controller level
6. **REST API ACL** - Verifying access restrictions at REST API level
7. **CDR Filter** - Testing CDR record filtering based on group settings

## Cleanup

Tests automatically clean up created data. To disable cleanup:

```env
ENABLE_FULL_CLEANUP=0
ENABLE_CDR_CLEANUP=0
```
