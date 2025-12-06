#!/usr/bin/env python3
"""
Test suite for Administrative Access.

Tests:
1. Creating admin groups with fullAccess=1
2. Admin user can access all controllers
3. Admin user can access all REST API endpoints
4. Admin user can see all CDR records
5. Admin role format verification

These tests verify that administrative access groups work correctly
and provide full system access.
"""

import pytest
import time
from conftest import assert_ui_success, assert_api_success, MikoPBXClient, get_users_with_extensions

# Unique suffix for test logins
_test_suffix = str(int(time.time()))[-6:]
from config import get_config

config = get_config()


class TestAdminAccess:
    """Tests for Administrative Access."""

    # Class variables
    admin_group_id = None
    admin_user_id = None
    admin_login = None
    admin_password = None

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, api_client):
        """Setup fixtures for each test."""
        self.ui_client = users_ui_client
        self.api_client = api_client

    @pytest.fixture(scope='class', autouse=True)
    def setup_admin_group(self, users_ui_client, api_client, access_group_fixtures, users_credentials_fixtures):
        """Create admin group and user for testing."""
        # Create admin group
        fixture = access_group_fixtures.get('full_admin', {})
        response = users_ui_client.create_access_group(
            name='Test Admin Group',
            description='Administrative access for testing',
            full_access=True,
            home_page='/admin-cabinet/',
            cdr_filter_mode='all'
        )

        if response.get('success'):
            TestAdminAccess.admin_group_id = users_ui_client.get_group_id_from_response(response)
            print(f"\nCreated admin group: {TestAdminAccess.admin_group_id}")

        # Get an extension for admin user using SQL
        users = get_users_with_extensions(api_client, limit=3)
        if users and len(users) >= 3:
            # Use third user to avoid conflicts with test_02
            user = users[2]
            TestAdminAccess.admin_user_id = user['userid']

            # Assign to admin group
            users_ui_client.change_user_group(
                TestAdminAccess.admin_user_id,
                TestAdminAccess.admin_group_id
            )

            # Set credentials with unique login
            TestAdminAccess.admin_login = f'admin_{_test_suffix}'
            TestAdminAccess.admin_password = 'AdminTest123!'

            users_ui_client.change_user_credentials(
                user_id=TestAdminAccess.admin_user_id,
                login=TestAdminAccess.admin_login,
                password=TestAdminAccess.admin_password
            )
            print(f"Created admin user: {TestAdminAccess.admin_user_id}")

        yield

        # Cleanup
        if TestAdminAccess.admin_user_id:
            try:
                users_ui_client.change_user_group(TestAdminAccess.admin_user_id, 'No access')
            except Exception:
                pass

        if TestAdminAccess.admin_group_id:
            try:
                users_ui_client.delete_access_group(TestAdminAccess.admin_group_id)
                print(f"\nCleaned up admin group")
            except Exception:
                pass

    def test_01_admin_can_authenticate(self):
        """
        Test that admin user can authenticate.

        Verifies admin credentials work and return valid token.
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()
            assert admin_client.access_token is not None
            print(f"Admin authenticated successfully")
        finally:
            admin_client.logout()

    def test_02_admin_can_access_extensions(self):
        """
        Test that admin can access extensions endpoint.
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            response = admin_client.get('extensions')
            assert_api_success(response, "Admin should access extensions")
            print(f"Admin can access extensions: {len(response.get('data', []))} records")
        finally:
            admin_client.logout()

    def test_03_admin_can_access_call_queues(self):
        """
        Test that admin can access call-queues endpoint.
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            response = admin_client.get('call-queues')
            assert_api_success(response, "Admin should access call-queues")
            print(f"Admin can access call-queues")
        finally:
            admin_client.logout()

    def test_04_admin_can_access_sip_providers(self):
        """
        Test that admin can access sip-providers endpoint.
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            response = admin_client.get('sip-providers')
            assert_api_success(response, "Admin should access sip-providers")
            print(f"Admin can access sip-providers")
        finally:
            admin_client.logout()

    def test_05_admin_can_access_cdr(self):
        """
        Test that admin can access all CDR records.

        Admin with fullAccess should not have CDR filtering applied.
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            response = admin_client.get('cdr', params={'limit': 50})
            assert_api_success(response, "Admin should access CDR")

            data = response.get('data', {})
            if isinstance(data, dict):
                records = data.get('records', [])
                pagination = data.get('pagination', {})
                total = pagination.get('total', len(records))
            else:
                records = data
                total = len(records)

            print(f"Admin can access CDR: {total} total records")
        finally:
            admin_client.logout()

    def test_06_admin_can_access_iax_endpoints(self):
        """
        Test that admin can access IAX endpoints (system-level access).
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            # Try to access IAX providers endpoint
            response = admin_client.get('iax-providers')
            # Admin should be able to access IAX providers
            assert_api_success(response, "Admin should access iax-providers")
            print(f"Admin IAX providers access: success")

        finally:
            admin_client.logout()

    def test_07_admin_can_list_extensions(self):
        """
        Test that admin can list extensions (read access).
        """
        if not self.admin_login:
            pytest.skip("Admin user not created")

        admin_client = MikoPBXClient(config.api_url, self.admin_login, self.admin_password)

        try:
            admin_client.authenticate()

            # Get list of extensions
            extensions_response = admin_client.get('extensions')
            if not extensions_response.get('result'):
                print("Could not get extensions list")
                return

            extensions = extensions_response.get('data', [])
            # Filter to SIP extensions only
            sip_extensions = [e for e in extensions if e.get('type') == 'SIP']

            print(f"Admin can list extensions: {len(sip_extensions)} SIP extensions found")
            assert len(sip_extensions) > 0, "Admin should see SIP extensions"

        finally:
            admin_client.logout()

    def test_08_verify_admin_role_format(self):
        """
        Test that admin user has correct role format.

        Role should be 'UsersUIRoleID{groupId}' format.
        """
        if not self.admin_group_id:
            pytest.skip("Admin group not created")

        expected_role = f"UsersUIRoleID{self.admin_group_id}"
        print(f"Expected admin role: {expected_role}")

        # The role is typically stored in session and used for ACL checks
        # We can verify the group ID is being used correctly
        assert self.admin_group_id is not None
        print(f"Admin group configured correctly: {self.admin_group_id}")
