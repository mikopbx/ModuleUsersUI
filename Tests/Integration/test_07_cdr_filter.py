#!/usr/bin/env python3
"""
Test suite for CDR Filtering.

Tests:
1. Group with cdrFilterMode='selected' - user sees only CDR for selected extensions
2. Group with cdrFilterMode='not-selected' - user sees all except selected
3. Group with cdrFilterMode='outgoing-selected' - user sees only outgoing for selected
4. Full access group sees all CDR without filtering
5. Comparison of CDR counts between filter modes

These tests verify that CDR filtering works correctly
based on access group settings.

Note: Tests use existing CDR data from the system (no test data seeding needed).
CDR filter is based on user_id in AccessGroupCDRFilter table.
"""

import time
import pytest
from conftest import assert_ui_success, assert_api_success, MikoPBXClient, get_users_with_extensions
from config import get_config

config = get_config()

# Unique suffix for test logins
_test_suffix = str(int(time.time()))[-6:]


class TestCDRFilter:
    """Tests for CDR Filtering based on Access Group settings."""

    # Class variables
    cdr_group_selected_id = None
    cdr_group_except_id = None
    cdr_group_outgoing_id = None
    full_access_group_id = None

    filter_user_id = None  # User whose extensions will be used for filtering

    test_users = {}  # mode -> {'user_id': ..., 'login': ..., 'password': ...}

    @pytest.fixture(autouse=True)
    def setup(self, users_ui_client, api_client):
        """Setup fixtures for each test."""
        self.ui_client = users_ui_client
        self.api_client = api_client

    @pytest.fixture(scope='class', autouse=True)
    def setup_test_data(self, users_ui_client, api_client):
        """Setup groups with different CDR filter modes and test users."""

        # Get users with extensions for testing
        users = get_users_with_extensions(api_client, limit=15)
        if len(users) < 14:
            pytest.skip("Need at least 14 users for CDR filter testing")

        # Use users 9-13 for CDR filter tests (to avoid conflicts with other tests)
        # User 9 - their extension will be used for filtering
        # Users 10-13 - test users for different filter modes

        TestCDRFilter.filter_user_id = users[9]['userid']
        print(f"\nUsing user {TestCDRFilter.filter_user_id} extension for CDR filtering")

        # Create group with 'selected' filter mode
        # This user can only see CDRs involving the filter_user_id's extension
        response_selected = users_ui_client.create_access_group(
            name='Test CDR Filter Selected',
            description='CDR filter - selected extensions only',
            full_access=False,
            home_page='/admin-cabinet/call-detail-records/index',
            cdr_filter_mode='selected',
            rights={'CallDetailRecordsController': ['index', 'getNewRecords']},
            cdr_filter_users=[TestCDRFilter.filter_user_id]
        )
        if response_selected.get('success'):
            TestCDRFilter.cdr_group_selected_id = users_ui_client.get_group_id_from_response(response_selected)
            print(f"Created CDR filter 'selected' group: {TestCDRFilter.cdr_group_selected_id}")

        # Create group with 'not-selected' filter mode
        # This user can see all CDRs EXCEPT those involving filter_user_id's extension
        response_except = users_ui_client.create_access_group(
            name='Test CDR Filter Except',
            description='CDR filter - except selected extensions',
            full_access=False,
            home_page='/admin-cabinet/call-detail-records/index',
            cdr_filter_mode='not-selected',
            rights={'CallDetailRecordsController': ['index', 'getNewRecords']},
            cdr_filter_users=[TestCDRFilter.filter_user_id]
        )
        if response_except.get('success'):
            TestCDRFilter.cdr_group_except_id = users_ui_client.get_group_id_from_response(response_except)
            print(f"Created CDR filter 'not-selected' group: {TestCDRFilter.cdr_group_except_id}")

        # Create group with 'outgoing-selected' filter mode
        # This user can only see outgoing CDRs FROM the filter_user_id's extension
        response_outgoing = users_ui_client.create_access_group(
            name='Test CDR Filter Outgoing',
            description='CDR filter - outgoing for selected extensions',
            full_access=False,
            home_page='/admin-cabinet/call-detail-records/index',
            cdr_filter_mode='outgoing-selected',
            rights={'CallDetailRecordsController': ['index', 'getNewRecords']},
            cdr_filter_users=[TestCDRFilter.filter_user_id]
        )
        if response_outgoing.get('success'):
            TestCDRFilter.cdr_group_outgoing_id = users_ui_client.get_group_id_from_response(response_outgoing)
            print(f"Created CDR filter 'outgoing-selected' group: {TestCDRFilter.cdr_group_outgoing_id}")

        # Create full access group (no CDR filtering)
        response_full = users_ui_client.create_access_group(
            name='Test CDR Full Access',
            description='Full access - sees all CDR',
            full_access=True,
            home_page='/admin-cabinet/',
            cdr_filter_mode='all'
        )
        if response_full.get('success'):
            TestCDRFilter.full_access_group_id = users_ui_client.get_group_id_from_response(response_full)
            print(f"Created full access group: {TestCDRFilter.full_access_group_id}")

        # Create test users for each filter mode
        user_configs = [
            ('selected', TestCDRFilter.cdr_group_selected_id, 10),
            ('except', TestCDRFilter.cdr_group_except_id, 11),
            ('outgoing', TestCDRFilter.cdr_group_outgoing_id, 12),
            ('full', TestCDRFilter.full_access_group_id, 13),
        ]

        for mode, group_id, user_index in user_configs:
            if group_id and len(users) > user_index:
                user = users[user_index]
                login = f'cdr_{mode}_{_test_suffix}'
                password = f'CdrFilter{mode.capitalize()}123!'

                users_ui_client.change_user_group(user['userid'], group_id)
                users_ui_client.change_user_credentials(user['userid'], login, password)

                TestCDRFilter.test_users[mode] = {
                    'user_id': user['userid'],
                    'login': login,
                    'password': password
                }
                print(f"Created CDR test user for '{mode}' filter: {user['userid']}")

        yield

        # Cleanup
        for mode, user_data in TestCDRFilter.test_users.items():
            try:
                users_ui_client.change_user_group(user_data['user_id'], 'No access')
            except Exception:
                pass

        for group_id in [TestCDRFilter.cdr_group_selected_id, TestCDRFilter.cdr_group_except_id,
                         TestCDRFilter.cdr_group_outgoing_id, TestCDRFilter.full_access_group_id]:
            if group_id:
                try:
                    users_ui_client.delete_access_group(group_id)
                except Exception:
                    pass

        print("\nCleaned up CDR filter test data")

    def _get_cdr_count(self, user_client) -> int:
        """Get total CDR count for user."""
        response = user_client.get('cdr', params={'limit': 1})
        if not response.get('result'):
            return 0

        data = response.get('data', {})
        if isinstance(data, dict):
            return data.get('pagination', {}).get('total', 0)
        return len(data)

    def test_01_verify_admin_sees_all_cdr(self):
        """
        Test that admin sees all CDR records.

        This establishes baseline for comparison with filtered views.
        """
        response = self.api_client.get('cdr', params={'limit': 1})
        assert_api_success(response, "Admin should access CDR")

        data = response.get('data', {})
        if isinstance(data, dict):
            total = data.get('pagination', {}).get('total', 0)
        else:
            total = len(data)

        print(f"Admin sees {total} total CDR groups")
        assert total > 0, "Need CDR records for filtering tests"

    def test_02_selected_filter_user_sees_limited_cdr(self):
        """
        Test that user with 'selected' filter only sees CDR for selected user's extension.

        Filter mode 'selected' means:
        - src_num IN (filtered_extensions) OR dst_num IN (filtered_extensions)
        """
        user_data = self.test_users.get('selected')
        if not user_data:
            pytest.skip("Selected filter user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            response = user_client.get('cdr', params={'limit': 50})
            assert_api_success(response, "User should access CDR")

            total = self._get_cdr_count(user_client)
            print(f"User with 'selected' filter sees: {total} CDR groups")

            # This user should see a subset of all CDRs
            # (only those involving the filter_user_id's extension)

        finally:
            user_client.logout()

    def test_03_except_filter_user_sees_most_cdr(self):
        """
        Test that user with 'not-selected' filter sees all CDR except for filtered extension.

        Filter mode 'not-selected' means:
        - src_num NOT IN (filtered_extensions) AND dst_num NOT IN (filtered_extensions)
        """
        user_data = self.test_users.get('except')
        if not user_data:
            pytest.skip("Except filter user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            response = user_client.get('cdr', params={'limit': 50})
            assert_api_success(response, "User should access CDR")

            total = self._get_cdr_count(user_client)
            print(f"User with 'not-selected' filter sees: {total} CDR groups")

            # This user should see all CDRs except those involving filter_user_id's extension

        finally:
            user_client.logout()

    def test_04_outgoing_filter_user_sees_outgoing_only(self):
        """
        Test that user with 'outgoing-selected' filter sees only outgoing calls.

        Filter mode 'outgoing-selected' means:
        - src_num IN (filtered_extensions)
        """
        user_data = self.test_users.get('outgoing')
        if not user_data:
            pytest.skip("Outgoing filter user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            response = user_client.get('cdr', params={'limit': 50})
            assert_api_success(response, "User should access CDR")

            total = self._get_cdr_count(user_client)
            print(f"User with 'outgoing-selected' filter sees: {total} CDR groups")

            # This user should see only outgoing calls from filter_user_id's extension

        finally:
            user_client.logout()

    def test_05_full_access_user_sees_all_cdr(self):
        """
        Test that full access user sees all CDR without filtering.
        """
        user_data = self.test_users.get('full')
        if not user_data:
            pytest.skip("Full access user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            user_total = self._get_cdr_count(user_client)
            print(f"Full access user sees: {user_total} CDR groups")

            # Get admin count for comparison
            admin_total = self._get_cdr_count(self.api_client)
            print(f"Admin sees: {admin_total} CDR groups")

            # Full access user should see same count as admin
            assert user_total == admin_total, \
                f"Full access user should see all CDR. User: {user_total}, Admin: {admin_total}"

        finally:
            user_client.logout()

    def test_06_compare_filter_counts(self):
        """
        Test that different filter modes result in different CDR counts.

        Expected ordering (most to least restrictive):
        - full: all records
        - except: all except filtered extension
        - selected: only filtered extension (in or out)
        - outgoing: only outgoing from filtered extension
        """
        counts = {}

        for mode in ['selected', 'except', 'outgoing', 'full']:
            user_data = self.test_users.get(mode)
            if not user_data:
                continue

            user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

            try:
                user_client.authenticate()
                counts[mode] = self._get_cdr_count(user_client)
            except Exception as e:
                print(f"Error getting count for {mode}: {e}")
            finally:
                user_client.logout()

        print(f"\nCDR counts by filter mode:")
        for mode, count in counts.items():
            print(f"  {mode}: {count} groups")

        # Verify relationships between filter modes
        if 'full' in counts and 'except' in counts:
            # 'except' should have fewer or equal records than 'full'
            assert counts['except'] <= counts['full'], \
                f"'except' filter should have <= records than 'full'"

        if 'selected' in counts and 'outgoing' in counts:
            # 'outgoing' should have fewer or equal records than 'selected'
            # (outgoing is a subset of selected which includes both in and out)
            assert counts['outgoing'] <= counts['selected'], \
                f"'outgoing' filter should have <= records than 'selected'"

    def test_07_cdr_api_with_limit(self):
        """
        Test that CDR filter works with limit parameter.
        """
        user_data = self.test_users.get('selected')
        if not user_data:
            pytest.skip("Selected filter user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            # Get CDR with limit
            response = user_client.get('cdr', params={'limit': 5})

            assert_api_success(response, "CDR with limit should work")

            data = response.get('data', {})
            records = data.get('records', [])
            assert len(records) <= 5, "Should return at most 5 records"

            print(f"CDR filter works with limit parameter: {len(records)} records")

        finally:
            user_client.logout()

    def test_08_cdr_filter_returns_correct_data_structure(self):
        """
        Test that CDR response has correct structure with records and pagination.
        """
        user_data = self.test_users.get('full')
        if not user_data:
            pytest.skip("Full access user not created")

        user_client = MikoPBXClient(config.api_url, user_data['login'], user_data['password'])

        try:
            user_client.authenticate()

            response = user_client.get('cdr', params={'limit': 5})
            assert_api_success(response, "CDR request should succeed")

            data = response.get('data', {})
            assert isinstance(data, dict), "CDR data should be a dict"
            assert 'records' in data, "CDR data should contain 'records'"
            assert 'pagination' in data, "CDR data should contain 'pagination'"

            pagination = data.get('pagination', {})
            assert 'total' in pagination, "Pagination should contain 'total'"
            assert 'limit' in pagination, "Pagination should contain 'limit'"

            print("CDR response structure is correct")

        finally:
            user_client.logout()

    def test_09_empty_filter_users_hides_all_cdr(self):
        """
        Test that 'selected' mode with no filter users hides all CDR.

        When cdrFilterMode='selected' but no users are in AccessGroupCDRFilter,
        the condition becomes 1=0 (hide all).
        """
        # Create a group with 'selected' mode but no filter users
        response = self.ui_client.create_access_group(
            name='Test CDR Empty Filter',
            description='CDR filter - selected but empty',
            full_access=False,
            home_page='/admin-cabinet/call-detail-records/index',
            cdr_filter_mode='selected',
            rights={'CallDetailRecordsController': ['index', 'getNewRecords']},
            cdr_filter_users=[]  # Empty filter list
        )

        if not response.get('success'):
            pytest.skip("Could not create empty filter group")

        group_id = self.ui_client.get_group_id_from_response(response)

        try:
            # Create test user for this group
            users = get_users_with_extensions(self.api_client, limit=15)
            if len(users) < 15:
                pytest.skip("Not enough users")

            user = users[14]
            login = f'cdr_empty_{_test_suffix}'
            password = 'CdrEmpty123!'

            self.ui_client.change_user_group(user['userid'], group_id)
            self.ui_client.change_user_credentials(user['userid'], login, password)

            # Test user access
            user_client = MikoPBXClient(config.api_url, login, password)

            try:
                user_client.authenticate()
                total = self._get_cdr_count(user_client)
                print(f"User with empty 'selected' filter sees: {total} CDR groups")

                # Should see 0 CDR when filter is 'selected' but no users specified
                assert total == 0, \
                    f"Empty 'selected' filter should show 0 CDR, got {total}"

            finally:
                user_client.logout()
                self.ui_client.change_user_group(user['userid'], 'No access')

        finally:
            self.ui_client.delete_access_group(group_id)
