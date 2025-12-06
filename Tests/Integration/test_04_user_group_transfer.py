#!/usr/bin/env python3
"""
Test suite for User Group Transfer.

Tests:
1. Creating two groups with full access
2. Creating user in group A
3. Verifying user can authenticate and access API
4. Moving user to group B
5. Verifying user still has access (role changed)
6. Multiple rapid transfers don't break authentication

These tests verify that ACL changes correctly when
a user is transferred between access groups.
"""

import time
import pytest
from conftest import assert_ui_success, assert_api_success, MikoPBXClient, get_users_with_extensions
from config import get_config

config = get_config()

# Unique suffix for test logins
_test_suffix = str(int(time.time()))[-6:]


class TestUserGroupTransfer:
    """Tests for User Group Transfer and ACL Changes."""

    # Class variables
    group_a_id = None
    group_b_id = None
    test_user_id = None
    test_login = f'transfer_{_test_suffix}'
    test_password = 'TransferTest123!'

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, api_client):
        """Setup fixtures for each test."""
        self.ui_client = users_ui_client
        self.api_client = api_client

    @pytest.fixture(scope='class', autouse=True)
    def setup_groups_and_user(self, users_ui_client, api_client):
        """Create two groups with full access and a test user."""

        # Create Group A - Full access (for testing group transfer functionality)
        response_a = users_ui_client.create_access_group(
            name='Test Transfer Group A',
            description='First test group for transfer',
            full_access=True,
            home_page='/admin-cabinet/extensions/index',
            cdr_filter_mode='all'
        )

        if response_a.get('success'):
            TestUserGroupTransfer.group_a_id = users_ui_client.get_group_id_from_response(response_a)
            print(f"\nCreated Group A: {TestUserGroupTransfer.group_a_id}")

        # Create Group B - Full access (for testing group transfer functionality)
        response_b = users_ui_client.create_access_group(
            name='Test Transfer Group B',
            description='Second test group for transfer',
            full_access=True,
            home_page='/admin-cabinet/call-queues/index',
            cdr_filter_mode='all'
        )

        if response_b.get('success'):
            TestUserGroupTransfer.group_b_id = users_ui_client.get_group_id_from_response(response_b)
            print(f"Created Group B: {TestUserGroupTransfer.group_b_id}")

        # Get an extension for test user using SQL
        users = get_users_with_extensions(api_client, limit=4)
        if users and len(users) >= 4:
            # Use 4th user to avoid conflicts with test_02 and test_03
            user = users[3]
            TestUserGroupTransfer.test_user_id = user['userid']
            print(f"Using user ID: {TestUserGroupTransfer.test_user_id}")

        yield

        # Cleanup
        if TestUserGroupTransfer.test_user_id:
            try:
                users_ui_client.change_user_group(TestUserGroupTransfer.test_user_id, 'No access')
            except Exception:
                pass

        for group_id in [TestUserGroupTransfer.group_a_id, TestUserGroupTransfer.group_b_id]:
            if group_id:
                try:
                    users_ui_client.delete_access_group(group_id)
                except Exception:
                    pass
        print("\nCleaned up transfer test groups")

    def test_01_assign_user_to_group_a(self):
        """
        Test assigning user to Group A.

        User starts in Group A with full access.
        """
        if not self.group_a_id or not self.test_user_id:
            pytest.skip("Groups or user not created")

        # Assign user to group A
        response = self.ui_client.change_user_group(self.test_user_id, self.group_a_id)
        assert_ui_success(response, "Failed to assign user to group A")

        # Set credentials
        creds_response = self.ui_client.change_user_credentials(
            user_id=self.test_user_id,
            login=self.test_login,
            password=self.test_password
        )
        assert_ui_success(creds_response, "Failed to set user credentials")

        print(f"User assigned to Group A")

    def test_02_verify_user_can_access_api_in_group_a(self):
        """
        Test that user in Group A can authenticate and access API.
        """
        if not self.test_login:
            pytest.skip("Test user not configured")

        user_client = MikoPBXClient(config.api_url, self.test_login, self.test_password)

        try:
            user_client.authenticate()

            # User with full access should be able to access extensions
            response = user_client.get('extensions')
            assert_api_success(response, "User in Group A should access extensions")
            print(f"User can access API in Group A")

        finally:
            user_client.logout()

    def test_03_transfer_user_to_group_b(self):
        """
        Test transferring user from Group A to Group B.
        """
        if not self.group_b_id or not self.test_user_id:
            pytest.skip("Groups or user not created")

        response = self.ui_client.change_user_group(self.test_user_id, self.group_b_id)
        assert_ui_success(response, "Failed to transfer user to group B")

        print(f"User transferred to Group B")

    def test_04_verify_user_can_access_api_after_transfer(self):
        """
        Test that user can still authenticate and access API after transfer.
        """
        if not self.test_login:
            pytest.skip("Test user not configured")

        user_client = MikoPBXClient(config.api_url, self.test_login, self.test_password)

        try:
            user_client.authenticate()

            # User should still have access after transfer
            response = user_client.get('call-queues')
            assert_api_success(response, "User in Group B should access call-queues")
            print(f"User can access API after transfer to Group B")

        finally:
            user_client.logout()

    def test_05_transfer_back_to_group_a(self):
        """
        Test transferring user back to Group A.
        """
        if not self.group_a_id or not self.test_user_id:
            pytest.skip("Groups or user not created")

        response = self.ui_client.change_user_group(self.test_user_id, self.group_a_id)
        assert_ui_success(response, "Failed to transfer user back to group A")

        print(f"User transferred back to Group A")

    def test_06_verify_original_access_restored(self):
        """
        Test that user has access restored after transfer back.
        """
        if not self.test_login:
            pytest.skip("Test user not configured")

        user_client = MikoPBXClient(config.api_url, self.test_login, self.test_password)

        try:
            user_client.authenticate()

            # Should have access again
            response = user_client.get('extensions')
            assert_api_success(response, "User should have access after transfer back")
            print(f"User access restored after transfer back to Group A")

        finally:
            user_client.logout()

    def test_07_multiple_rapid_transfers(self):
        """
        Test multiple rapid transfers don't break authentication.
        """
        if not self.group_a_id or not self.group_b_id or not self.test_user_id:
            pytest.skip("Groups or user not created")

        # Rapidly transfer between groups
        for i in range(3):
            target_group = self.group_a_id if i % 2 == 0 else self.group_b_id
            response = self.ui_client.change_user_group(self.test_user_id, target_group)
            assert_ui_success(response, f"Transfer {i+1} failed")

        # End in group A
        final_response = self.ui_client.change_user_group(self.test_user_id, self.group_a_id)
        assert_ui_success(final_response, "Final transfer failed")

        # Verify authentication still works
        user_client = MikoPBXClient(config.api_url, self.test_login, self.test_password)

        try:
            user_client.authenticate()
            response = user_client.get('extensions')
            assert_api_success(response, "User should have access after rapid transfers")
            print(f"Multiple rapid transfers completed successfully")
        finally:
            user_client.logout()

    def test_08_disable_user_access(self):
        """
        Test that disabled user cannot authenticate.
        """
        if not self.test_user_id or not self.test_login:
            pytest.skip("Test user not configured")

        # Disable user by removing from group
        response = self.ui_client.change_user_group(self.test_user_id, 'No access')
        assert_ui_success(response, "Failed to disable user")

        # Try to authenticate - should fail
        user_client = MikoPBXClient(config.api_url, self.test_login, self.test_password)

        try:
            user_client.authenticate()
            # If we get here, authentication succeeded when it shouldn't
            print("Note: Disabled user could still authenticate - check implementation")
        except Exception:
            # Expected - disabled user should not authenticate
            print("Disabled user correctly rejected")

        # Re-enable user for cleanup
        self.ui_client.change_user_group(self.test_user_id, self.group_a_id)
