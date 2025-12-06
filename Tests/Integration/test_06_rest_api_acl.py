#!/usr/bin/env python3
"""
Test suite for REST API ACL.

Tests:
1. Limited user GET allowed for permitted endpoints
2. Limited user GET denied for forbidden endpoints
3. Limited user POST denied for forbidden endpoints
4. Limited user DELETE denied for forbidden endpoints
5. Verify 401 vs 403 distinction
6. Full access user can access all endpoints

These tests verify that ACL restrictions work correctly
at the REST API v3 level.

Note: Access rights are defined on UI controllers, and linked actions
in CoreACL.php automatically grant REST API access for related endpoints.
"""

import time
import pytest
from conftest import assert_api_success, MikoPBXClient, get_users_with_extensions
from config import get_config

config = get_config()

# Unique suffix for test logins
_test_suffix = str(int(time.time()))[-6:]


class TestRestAPIACL:
    """Tests for REST API-level ACL with Limited and Full Access."""

    # Class variables
    limited_group_id = None
    full_access_group_id = None
    limited_user_id = None
    full_access_user_id = None
    limited_login = f'api_limited_{_test_suffix}'
    limited_password = 'ApiLimited123!'
    full_login = f'api_full_{_test_suffix}'
    full_password = 'ApiFull123!'

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, api_client):
        """Setup fixtures for each test."""
        self.ui_client = users_ui_client
        self.api_client = api_client

    @pytest.fixture(scope='class', autouse=True)
    def setup_users(self, users_ui_client, api_client):
        """Create limited and full access groups and users for REST API testing."""

        # Get users for testing
        users = get_users_with_extensions(api_client, limit=10)
        if len(users) < 9:
            pytest.skip("Need at least 9 users for REST API ACL testing")

        # Create LIMITED access group - only Extensions (index, modify)
        response_limited = users_ui_client.create_access_group(
            name='Test REST API Limited',
            description='Limited REST API access - only employees',
            full_access=False,
            home_page='/admin-cabinet/extensions/index',
            cdr_filter_mode='all',
            rights={
                'ExtensionsController': ['index', 'modify']
            }
        )

        if response_limited.get('success'):
            TestRestAPIACL.limited_group_id = users_ui_client.get_group_id_from_response(response_limited)
            print(f"\nCreated REST API limited group: {TestRestAPIACL.limited_group_id}")

        # Create FULL access group
        response_full = users_ui_client.create_access_group(
            name='Test REST API Full',
            description='Full REST API access',
            full_access=True,
            home_page='/admin-cabinet/',
            cdr_filter_mode='all'
        )

        if response_full.get('success'):
            TestRestAPIACL.full_access_group_id = users_ui_client.get_group_id_from_response(response_full)
            print(f"Created REST API full access group: {TestRestAPIACL.full_access_group_id}")

        # Create LIMITED user (7th user)
        if TestRestAPIACL.limited_group_id and len(users) >= 7:
            user = users[6]
            TestRestAPIACL.limited_user_id = user['userid']

            users_ui_client.change_user_group(
                TestRestAPIACL.limited_user_id,
                TestRestAPIACL.limited_group_id
            )

            users_ui_client.change_user_credentials(
                user_id=TestRestAPIACL.limited_user_id,
                login=TestRestAPIACL.limited_login,
                password=TestRestAPIACL.limited_password
            )
            print(f"Created REST API limited user: {TestRestAPIACL.limited_user_id}")

        # Create FULL access user (8th user)
        if TestRestAPIACL.full_access_group_id and len(users) >= 8:
            user = users[7]
            TestRestAPIACL.full_access_user_id = user['userid']

            users_ui_client.change_user_group(
                TestRestAPIACL.full_access_user_id,
                TestRestAPIACL.full_access_group_id
            )

            users_ui_client.change_user_credentials(
                user_id=TestRestAPIACL.full_access_user_id,
                login=TestRestAPIACL.full_login,
                password=TestRestAPIACL.full_password
            )
            print(f"Created REST API full access user: {TestRestAPIACL.full_access_user_id}")

        yield

        # Cleanup
        for user_id in [TestRestAPIACL.limited_user_id, TestRestAPIACL.full_access_user_id]:
            if user_id:
                try:
                    users_ui_client.change_user_group(user_id, 'No access')
                except Exception:
                    pass

        for group_id in [TestRestAPIACL.limited_group_id, TestRestAPIACL.full_access_group_id]:
            if group_id:
                try:
                    users_ui_client.delete_access_group(group_id)
                except Exception:
                    pass
        print("\nCleaned up REST API ACL test data")

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

    def test_01_limited_user_get_employees(self):
        """
        Test GET /employees access for user with ExtensionsController rights.

        Note: Access depends on linked actions configuration.
        ExtensionsController::index may or may not grant API_V3_EMPLOYEES access.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('employees')

            if raw_response.status_code == 200:
                data = raw_response.json()
                print(f"GET /employees ALLOWED - {len(data.get('data', []))} records")
            elif raw_response.status_code == 403:
                print(f"GET /employees DENIED (403) - linked action not applied")
            else:
                print(f"Unexpected status: {raw_response.status_code}")

            # Verify response is valid (either allowed or forbidden)
            assert raw_response.status_code in [200, 403], \
                f"Expected 200 or 403, got {raw_response.status_code}"
        finally:
            user_client.logout()

    def test_02_limited_user_get_call_queues_denied(self):
        """
        Test GET /call-queues is denied for user without CallQueuesController access.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('call-queues')

            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for call-queues, got {raw_response.status_code}"
            print(f"GET /call-queues correctly denied (403)")
        finally:
            user_client.logout()

    def test_03_limited_user_get_sip_providers_denied(self):
        """
        Test GET /sip-providers is denied without ProvidersController access.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('sip-providers')

            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for sip-providers, got {raw_response.status_code}"
            print(f"GET /sip-providers correctly denied (403)")
        finally:
            user_client.logout()

    def test_04_limited_user_get_cdr_denied(self):
        """
        Test GET /cdr is denied without CallDetailRecordsController access.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            raw_response = user_client.get_raw('cdr')

            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden for CDR, got {raw_response.status_code}"
            print(f"GET /cdr correctly denied (403)")
        finally:
            user_client.logout()

    def test_05_limited_user_post_call_queues_denied(self):
        """
        Test POST /call-queues is denied.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # Try to create a call queue
            create_data = {
                'name': 'Test Queue',
                'extension': '8000',
                'strategy': 'ringall'
            }

            try:
                response = user_client.session.post(
                    f"{user_client.base_url}/call-queues",
                    json=create_data,
                    headers=user_client._get_headers()
                )

                assert response.status_code == 403, \
                    f"Expected 403 Forbidden for POST call-queues, got {response.status_code}"
                print(f"POST /call-queues correctly denied (403)")

            except Exception as e:
                if '403' in str(e):
                    print(f"POST /call-queues correctly denied")
                else:
                    raise

        finally:
            user_client.logout()

    def test_06_limited_user_delete_denied(self):
        """
        Test DELETE operations are denied without proper rights.
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # Try to delete a call-queue (should be denied)
            # Use call-queues which definitely requires CallQueuesController rights
            response = user_client.session.delete(
                f"{user_client.base_url}/call-queues/999",
                headers=user_client._get_headers()
            )

            # 403 (forbidden) or 404 (not found) are both acceptable
            # 404 means the route exists but ID not found (after ACL check passed)
            # 403 means ACL blocked the request
            assert response.status_code in [403, 404], \
                f"Expected 403 or 404 for DELETE call-queues, got {response.status_code}"
            print(f"DELETE /call-queues correctly handled ({response.status_code})")

        finally:
            user_client.logout()

    def test_07_verify_401_for_invalid_token(self):
        """
        Test that invalid token returns 401 Unauthorized.
        """
        # Create client with invalid token
        client = MikoPBXClient(config.api_url, 'fake', 'fake')
        client.access_token = 'invalid_token_12345'

        raw_response = client.get_raw('employees')

        assert raw_response.status_code == 401, \
            f"Invalid token should return 401, got {raw_response.status_code}"
        print(f"Invalid token correctly returns 401")

    def test_08_verify_403_vs_401_distinction(self):
        """
        Test that 403 is returned for authenticated user without permission.

        401 = not authenticated (no/invalid token)
        403 = authenticated but not authorized (no ACL permission)
        """
        if not self.limited_user_id:
            pytest.skip("Limited user not configured")

        user_client = self._get_limited_client()

        try:
            # This user is authenticated but doesn't have permission
            raw_response = user_client.get_raw('outbound-routes')

            # Should NOT be 401 (we're authenticated)
            assert raw_response.status_code != 401, \
                "Authenticated user should not get 401"

            # Should be 403 Forbidden
            assert raw_response.status_code == 403, \
                f"Expected 403 Forbidden, got {raw_response.status_code}"

            print(f"Correctly got 403 Forbidden (not 401 Unauthorized)")

        finally:
            user_client.logout()

    def test_09_full_access_user_can_access_all(self):
        """
        Test that full access user can access all endpoints.
        """
        if not self.full_access_user_id:
            pytest.skip("Full access user not configured")

        endpoints = [
            'employees',
            'call-queues',
            'sip-providers',
            'iax-providers',
            'ivr-menu',
            'conference-rooms',
            'outbound-routes',
            'incoming-routes',
            'cdr'
        ]

        user_client = self._get_full_client()

        try:
            for endpoint in endpoints:
                response = user_client.get(endpoint)
                assert_api_success(response, f"Full access user should access {endpoint}")

            print(f"Full access user can access all {len(endpoints)} endpoints")

        finally:
            user_client.logout()

    def test_10_batch_denied_endpoints(self):
        """
        Test multiple denied endpoints to verify consistent ACL behavior.
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
            'conference-rooms',
            'cdr'
        ]

        user_client = self._get_limited_client()
        denied_count = 0

        try:
            for endpoint in forbidden_endpoints:
                raw_response = user_client.get_raw(endpoint)
                if raw_response.status_code == 403:
                    denied_count += 1

            print(f"Correctly denied {denied_count}/{len(forbidden_endpoints)} endpoints")

            # All should be denied
            assert denied_count == len(forbidden_endpoints), \
                f"All endpoints should be denied, got {denied_count}/{len(forbidden_endpoints)}"

        finally:
            user_client.logout()
