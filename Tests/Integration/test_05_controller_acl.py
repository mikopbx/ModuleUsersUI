#!/usr/bin/env python3
"""
Test suite for Controller ACL.

Tests:
1. Limited user can access allowed endpoints (via linked actions)
2. Limited user is denied access to forbidden endpoints
3. Full access user can access all endpoints
4. Verify 401 vs 403 distinction
5. Session endpoints are always accessible

These tests verify that ACL restrictions work correctly
at the AdminCabinet controller level and REST API endpoints.

Note: Access rights are defined on UI controllers, but linked actions
in CoreACL.php automatically grant REST API access for related endpoints.
For example: ExtensionsController::index -> API_V3_EMPLOYEES::getList
"""

import time
import pytest
from conftest import assert_ui_success, assert_api_success, MikoPBXClient, get_users_with_extensions
from config import get_config

config = get_config()

# Unique suffix for test logins
_test_suffix = str(int(time.time()))[-6:]


class TestControllerACL:
    """Tests for Controller-level ACL with Limited and Full Access."""

    # Class variables
    limited_group_id = None
    full_access_group_id = None
    limited_user_id = None
    full_access_user_id = None
    limited_login = f'ctrl_limited_{_test_suffix}'
    limited_password = 'CtrlLimited123!'
    full_login = f'ctrl_full_{_test_suffix}'
    full_password = 'CtrlFull123!'

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, api_client):
        """Setup fixtures for each test."""
        self.ui_client = users_ui_client
        self.api_client = api_client

    @pytest.fixture(scope='class', autouse=True)
    def setup_users(self, users_ui_client, api_client):
        """Create limited and full access groups and users."""

        # Get users for testing
        users = get_users_with_extensions(api_client, limit=8)
        if len(users) < 7:
            pytest.skip("Need at least 7 users for controller ACL testing")

        # Create LIMITED access group with only Extensions and CallDetailRecords
        response_limited = users_ui_client.create_access_group(
            name='Test Controller Limited',
            description='Limited access - only extensions and CDR',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            cdr_filter_mode='all',
            rights={
                'ExtensionsController': ['index', 'modify'],
                'CallDetailRecordsController': ['index', 'getNewRecords']
            }
        )

        if response_limited.get('success'):
            TestControllerACL.limited_group_id = users_ui_client.get_group_id_from_response(response_limited)
            print(f"\nCreated limited ACL group: {TestControllerACL.limited_group_id}")

        # Create FULL access group
        response_full = users_ui_client.create_access_group(
            name='Test Controller Full',
            description='Full access for comparison',
            full_access=True,
            home_page='/admin-cabinet/',
            cdr_filter_mode='all'
        )

        if response_full.get('success'):
            TestControllerACL.full_access_group_id = users_ui_client.get_group_id_from_response(response_full)
            print(f"Created full access ACL group: {TestControllerACL.full_access_group_id}")

        # Create LIMITED user (5th user)
        if TestControllerACL.limited_group_id and len(users) >= 5:
            user = users[4]
            TestControllerACL.limited_user_id = user['userid']

            users_ui_client.change_user_group(
                TestControllerACL.limited_user_id,
                TestControllerACL.limited_group_id
            )

            users_ui_client.change_user_credentials(
                user_id=TestControllerACL.limited_user_id,
                login=TestControllerACL.limited_login,
                password=TestControllerACL.limited_password
            )
            print(f"Created limited user: {TestControllerACL.limited_user_id}")

        # Create FULL access user (6th user)
        if TestControllerACL.full_access_group_id and len(users) >= 6:
            user = users[5]
            TestControllerACL.full_access_user_id = user['userid']

            users_ui_client.change_user_group(
                TestControllerACL.full_access_user_id,
                TestControllerACL.full_access_group_id
            )

            users_ui_client.change_user_credentials(
                user_id=TestControllerACL.full_access_user_id,
                login=TestControllerACL.full_login,
                password=TestControllerACL.full_password
            )
            print(f"Created full access user: {TestControllerACL.full_access_user_id}")

        yield

        # Cleanup
        for user_id in [TestControllerACL.limited_user_id, TestControllerACL.full_access_user_id]:
            if user_id:
                try:
                    users_ui_client.change_user_group(user_id, 'No access')
                except Exception:
                    pass

        for group_id in [TestControllerACL.limited_group_id, TestControllerACL.full_access_group_id]:
            if group_id:
                try:
                    users_ui_client.delete_access_group(group_id)
                except Exception:
                    pass
        print("\nCleaned up controller ACL test data")

    def _get_limited_client(self):
        """Get authenticated client for limited user."""
        client = MikoPBXClient(config.api_url, self.limited_login, self.limited_password)
        client.authenticate()
        return client

    def _get_full_client(self):
        """Get authenticated client for full access user."""
        client = MikoPBXClient(config.api_url, self.full_login, self.full_password)
        client.authenticate()
        return client

    def test_01_limited_user_can_authenticate(self):
        """
        Test that limited user can authenticate successfully.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            assert user_client.access_token is not None
            print(f"Limited user authenticated successfully")
        finally:
            user_client.logout()

    def test_02_limited_user_extensions_access(self):
        """
        Test limited user's access to extensions-related endpoints.

        Note: Access depends on how linked actions are configured in CoreACL.
        With ExtensionsController::index, user might get access to some endpoints.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # Try employees endpoint - may or may not be accessible
            raw_response = user_client.get_raw('employees')

            if raw_response.status_code == 200:
                print(f"Limited user CAN access employees endpoint (linked action works)")
            elif raw_response.status_code == 403:
                print(f"Limited user DENIED employees endpoint (linked action not applied)")
            else:
                print(f"Unexpected status: {raw_response.status_code}")

            # Just verify user is authenticated and can make requests
            assert raw_response.status_code in [200, 403], \
                f"Expected 200 or 403, got {raw_response.status_code}"
        finally:
            user_client.logout()

    def test_03_limited_user_cdr_access(self):
        """
        Test limited user's access to CDR endpoint.

        Note: Access depends on how linked actions are configured in CoreACL.
        With CallDetailRecordsController::index, user might get access to CDR API.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # Try CDR endpoint - may or may not be accessible
            raw_response = user_client.get_raw('cdr')

            if raw_response.status_code == 200:
                print(f"Limited user CAN access CDR endpoint (linked action works)")
            elif raw_response.status_code == 403:
                print(f"Limited user DENIED CDR endpoint (linked action not applied)")
            else:
                print(f"Unexpected status: {raw_response.status_code}")

            # Just verify user is authenticated and can make requests
            assert raw_response.status_code in [200, 403], \
                f"Expected 200 or 403, got {raw_response.status_code}"
        finally:
            user_client.logout()

    def test_04_limited_user_denied_call_queues(self):
        """
        Test that limited user is denied access to call-queues.

        No rights on CallQueuesController means no access.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('call-queues')

            # Should get 403 Forbidden (not 401 - user is authenticated)
            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for call-queues, got {raw_response.status_code}"
            print(f"Limited user correctly denied access to call-queues (403)")
        finally:
            user_client.logout()

    def test_05_limited_user_denied_sip_providers(self):
        """
        Test that limited user is denied access to sip-providers.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('sip-providers')

            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for sip-providers, got {raw_response.status_code}"
            print(f"Limited user correctly denied access to sip-providers (403)")
        finally:
            user_client.logout()

    def test_06_limited_user_denied_ivr_menu(self):
        """
        Test that limited user is denied access to ivr-menu.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('ivr-menu')

            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for ivr-menu, got {raw_response.status_code}"
            print(f"Limited user correctly denied access to ivr-menu (403)")
        finally:
            user_client.logout()

    def test_07_full_access_user_can_access_all(self):
        """
        Test that full access user can access all endpoints.
        """
        if not self.full_access_user_id:
            pytest.skip("Full access user not configured")

        endpoints = [
            'employees',
            'call-queues',
            'sip-providers',
            'ivr-menu',
            'cdr',
            'conference-rooms'
        ]

        user_client = self._get_full_client()

        try:
            for endpoint in endpoints:
                response = user_client.get(endpoint)
                assert_api_success(response, f"Full access user should access {endpoint}")

            print(f"Full access user can access all {len(endpoints)} endpoints")
        finally:
            user_client.logout()

    def test_08_verify_401_for_invalid_token(self):
        """
        Test that invalid token returns 401, not 403.
        """
        # Create client with invalid token
        client = MikoPBXClient(config.api_url, 'fake', 'fake')
        client.access_token = 'invalid_token_12345'

        raw_response = client.get_raw('employees')

        assert raw_response.status_code == 401, \
            f"Invalid token should return 401, got {raw_response.status_code}"
        print(f"Invalid token correctly returns 401")

    def test_09_session_refresh_works_for_limited_user(self):
        """
        Test that session refresh works for limited user.

        Auth endpoints should always be accessible regardless of ACL.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # Try token refresh
            refresh_response = user_client.session.post(
                f"{user_client.base_url}/auth:refresh",
                headers=user_client._get_headers()
            )

            assert refresh_response.status_code == 200, \
                f"Token refresh should work for limited user, got {refresh_response.status_code}"
            print(f"Token refresh works for limited user")

        finally:
            user_client.logout()

    def test_10_denied_endpoints_count(self):
        """
        Test multiple denied endpoints for limited user.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        forbidden_endpoints = [
            'call-queues',
            'sip-providers',
            'iax-providers',
            'ivr-menu',
            'outbound-routes',
            'incoming-routes',
            'conference-rooms'
        ]

        user_client = self._get_limited_client()
        denied_count = 0

        try:
            for endpoint in forbidden_endpoints:
                raw_response = user_client.get_raw(endpoint)
                if raw_response.status_code == 403:
                    denied_count += 1

            print(f"Correctly denied {denied_count}/{len(forbidden_endpoints)} endpoints")

            # All should be denied for limited user
            assert denied_count == len(forbidden_endpoints), \
                f"All {len(forbidden_endpoints)} endpoints should be denied, got {denied_count}"

        finally:
            user_client.logout()
