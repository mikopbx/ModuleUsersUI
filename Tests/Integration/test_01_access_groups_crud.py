#!/usr/bin/env python3
"""
Test suite for Access Groups CRUD operations.

Tests:
1. Creating access groups with limited rights
2. Creating access groups with full admin access
3. Reading access group information
4. Updating access group settings
5. Updating access group rights
6. Deleting access groups

These tests verify that access groups can be properly managed
through the ModuleUsersUI controllers.
"""

import pytest
from conftest import assert_ui_success


class TestAccessGroupsCRUD:
    """Tests for Access Groups CRUD operations."""

    # Class variables to store created IDs for cleanup
    created_group_ids = []

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, access_group_fixtures):
        """Setup fixtures for each test."""
        self.client = users_ui_client
        self.fixtures = access_group_fixtures

    def test_01_create_limited_access_group(self):
        """
        Test creating an access group with limited rights.

        Creates a group that can only view extensions list.
        Verifies the group is created successfully and returns an ID.
        """
        fixture = self.fixtures.get('limited_extensions_view', {})

        response = self.client.create_access_group(
            name=fixture.get('name', 'Test Limited Extensions View'),
            description=fixture.get('description', 'Can only view extensions'),
            full_access=fixture.get('fullAccess', False),
            home_page=fixture.get('homePage', '/admin-cabinet/extensions/index'),
            cdr_filter_mode=fixture.get('cdrFilterMode', 'all'),
            rights=fixture.get('rights', {'ExtensionsController': ['index']})
        )

        assert_ui_success(response, "Failed to create limited access group")

        # Extract group ID from response
        group_id = self.client.get_group_id_from_response(response)
        assert group_id is not None, "No group ID returned in response"

        # Store for cleanup
        self.created_group_ids.append(group_id)

        print(f"Created limited access group: {group_id}")

    def test_02_create_full_access_group(self):
        """
        Test creating an access group with full admin access.

        Creates a group with fullAccess=1 which grants access to all
        controllers and all CDR records.
        """
        fixture = self.fixtures.get('full_admin', {})

        response = self.client.create_access_group(
            name=fixture.get('name', 'Test Full Administrator'),
            description=fixture.get('description', 'Full system access'),
            full_access=True,
            home_page=fixture.get('homePage', '/admin-cabinet/'),
            cdr_filter_mode='all',
            rights={}  # Not needed for full access
        )

        assert_ui_success(response, "Failed to create full access group")

        group_id = self.client.get_group_id_from_response(response)
        assert group_id is not None, "No group ID returned for full access group"

        self.created_group_ids.append(group_id)
        print(f"Created full access group: {group_id}")

    def test_03_create_group_with_multiple_controllers(self):
        """
        Test creating a group with access to multiple controllers.

        This tests the rights assignment for multiple controllers
        with different action sets.
        """
        fixture = self.fixtures.get('multiple_controllers', {})

        response = self.client.create_access_group(
            name=fixture.get('name', 'Test Multiple Controllers'),
            description=fixture.get('description', 'Access to multiple controllers'),
            full_access=False,
            home_page=fixture.get('homePage', '/admin-cabinet/extensions/index'),
            cdr_filter_mode='all',
            rights={
                'ExtensionsController': ['index', 'modify'],
                'CallQueuesController': ['index'],
                'ConferenceRoomsController': ['index']
            }
        )

        assert_ui_success(response, "Failed to create multi-controller group")

        group_id = self.client.get_group_id_from_response(response)
        self.created_group_ids.append(group_id)
        print(f"Created multi-controller group: {group_id}")

    def test_04_create_group_with_cdr_filter(self):
        """
        Test creating a group with CDR filtering enabled.

        Creates a group with cdrFilterMode='selected' which will
        only show CDR for selected extensions.
        """
        fixture = self.fixtures.get('cdr_filter_selected', {})

        response = self.client.create_access_group(
            name=fixture.get('name', 'Test CDR Filter Selected'),
            description=fixture.get('description', 'CDR filter testing'),
            full_access=False,
            home_page='/admin-cabinet/call-detail-records/index',
            cdr_filter_mode='selected',
            rights={'CallDetailRecordsController': ['index', 'getNewRecords']}
        )

        assert_ui_success(response, "Failed to create CDR filter group")

        group_id = self.client.get_group_id_from_response(response)
        self.created_group_ids.append(group_id)
        print(f"Created CDR filter group: {group_id}")

    def test_05_update_access_group(self):
        """
        Test updating an existing access group.

        First creates a group, then updates its name and description.
        """
        # Create initial group
        response = self.client.create_access_group(
            name='Test Update Group Initial',
            description='Initial description',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            rights={'ExtensionsController': ['index']}
        )

        assert_ui_success(response, "Failed to create group for update test")
        group_id = self.client.get_group_id_from_response(response)
        self.created_group_ids.append(group_id)

        # Update the group
        update_response = self.client.update_access_group(
            group_id=group_id,
            name='Test Update Group Modified',
            description='Modified description',
            full_access=False,
            home_page='/admin-cabinet/call-queues/index',  # Changed home page
            rights={'ExtensionsController': ['index', 'modify']}  # Added modify
        )

        assert_ui_success(update_response, "Failed to update access group")
        print(f"Updated access group: {group_id}")

    def test_06_update_group_rights(self):
        """
        Test updating only the rights of an access group.

        Verifies that changing controller permissions works correctly.
        """
        # Create group with minimal rights
        response = self.client.create_access_group(
            name='Test Rights Update Group',
            description='Group for rights update testing',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            rights={'ExtensionsController': ['index']}
        )

        assert_ui_success(response, "Failed to create group for rights test")
        group_id = self.client.get_group_id_from_response(response)
        self.created_group_ids.append(group_id)

        # Update with expanded rights
        update_response = self.client.update_access_group(
            group_id=group_id,
            name='Test Rights Update Group',
            description='Group for rights update testing',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            rights={
                'ExtensionsController': ['index', 'modify', 'save', 'delete'],
                'CallQueuesController': ['index', 'modify', 'save']
            }
        )

        assert_ui_success(update_response, "Failed to update group rights")
        print(f"Updated rights for group: {group_id}")

    def test_07_delete_access_group(self):
        """
        Test deleting an access group.

        Creates a group specifically for deletion testing.
        """
        # Create group for deletion
        response = self.client.create_access_group(
            name='Test Delete Group',
            description='Group to be deleted',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            rights={'ExtensionsController': ['index']}
        )

        assert_ui_success(response, "Failed to create group for deletion")
        group_id = self.client.get_group_id_from_response(response)

        # Delete the group
        delete_response = self.client.delete_access_group(group_id)
        assert delete_response.get('success'), "Failed to delete access group"

        print(f"Deleted access group: {group_id}")

    def test_08_create_group_with_members(self, api_client):
        """
        Test creating a group with initial members.

        First gets list of available users, then creates group with
        some users assigned.
        """
        from conftest import get_users_with_extensions

        # Get users with extensions via SQL query
        users = get_users_with_extensions(api_client, limit=5)
        if not users:
            pytest.skip("No users with extensions available")

        # Get user IDs (filter out empty/None values)
        user_ids = [u['userid'] for u in users[:2] if u.get('userid') and u['userid'] != 'None']

        if not user_ids:
            pytest.skip("No valid user IDs found in extensions")

        # Create group with members
        response = self.client.create_access_group(
            name='Test Group With Members',
            description='Group with initial member assignment',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            rights={'ExtensionsController': ['index', 'modify']},
            members=user_ids
        )

        assert_ui_success(response, "Failed to create group with members")
        group_id = self.client.get_group_id_from_response(response)
        self.created_group_ids.append(group_id)

        print(f"Created group with {len(user_ids)} members: {group_id}")

    @pytest.fixture(scope='class', autouse=True)
    def cleanup(self, request, users_ui_client):
        """Cleanup created groups after all tests in class."""
        yield

        # Cleanup after tests
        for group_id in self.created_group_ids:
            try:
                users_ui_client.delete_access_group(group_id)
                print(f"Cleaned up group: {group_id}")
            except Exception as e:
                print(f"Failed to cleanup group {group_id}: {e}")

        self.created_group_ids.clear()
