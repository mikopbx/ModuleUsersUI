#!/usr/bin/env python3
"""
Pytest configuration for ModuleUsersUI integration tests.

Provides:
- API client fixtures
- UsersUI client fixtures
- Test data fixtures
- Cleanup hooks
"""

import json
import os
import warnings
from pathlib import Path
from typing import Dict, Any, Optional, List

import pytest
import requests
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import get_config

# Suppress SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Load configuration
config = get_config()

# Paths
FIXTURES_DIR = Path(__file__).parent / 'fixtures'


class MikoPBXClient:
    """
    MikoPBX REST API client with JWT authentication.

    Handles:
    - JWT token management
    - Automatic token refresh
    - Retry logic for transient failures
    """

    def __init__(self, base_url: str, login: str = None, password: str = None):
        self.base_url = base_url.rstrip('/')
        self.login = login
        self.password = password
        self.access_token: Optional[str] = None
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create session with retry logic."""
        session = requests.Session()
        session.verify = False

        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
            raise_on_status=False
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def authenticate(self) -> None:
        """Authenticate and get JWT access token."""
        response = self.session.post(
            f"{self.base_url}/auth:login",
            data={
                'login': self.login,
                'password': self.password,
                'rememberMe': 'true'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

        response.raise_for_status()
        data = response.json()

        if not data.get('result'):
            raise RuntimeError(f"Authentication failed: {data.get('messages')}")

        self.access_token = data['data']['accessToken']

    def _get_headers(self) -> Dict[str, str]:
        """Get headers with current access token."""
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

    def get_raw(self, path: str, params: Optional[Dict] = None) -> requests.Response:
        """GET request returning raw Response object."""
        return self.session.get(
            f"{self.base_url}/{path.lstrip('/')}",
            params=params,
            headers=self._get_headers(),
            timeout=30
        )

    def get(self, path: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """GET request returning parsed JSON."""
        response = self.get_raw(path, params)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """POST request."""
        response = self.session.post(
            f"{self.base_url}/{path.lstrip('/')}",
            json=data,
            headers=self._get_headers(),
            timeout=30
        )
        response.raise_for_status()
        return response.json()

    def put(self, path: str, data: Dict) -> Dict[str, Any]:
        """PUT request."""
        response = self.session.put(
            f"{self.base_url}/{path.lstrip('/')}",
            json=data,
            headers=self._get_headers(),
            timeout=30
        )
        response.raise_for_status()
        return response.json()

    def delete(self, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """DELETE request."""
        kwargs = {'headers': self._get_headers(), 'timeout': 30}
        if data:
            kwargs['json'] = data

        response = self.session.delete(
            f"{self.base_url}/{path.lstrip('/')}",
            **kwargs
        )
        response.raise_for_status()
        return response.json()

    def logout(self) -> None:
        """Logout and invalidate tokens."""
        if self.access_token:
            try:
                self.session.post(
                    f"{self.base_url}/auth:logout",
                    headers=self._get_headers()
                )
            except Exception:
                pass
            finally:
                self.access_token = None
                self.session.cookies.clear()


# =============================================================================
# Pytest Fixtures
# =============================================================================

@pytest.fixture(scope='session')
def api_client() -> MikoPBXClient:
    """
    Session-scoped authenticated API client.

    Usage:
        def test_something(api_client):
            response = api_client.get('extensions')
    """
    client = MikoPBXClient(config.api_url, config.api_username, config.api_password)
    client.authenticate()

    yield client

    client.logout()


@pytest.fixture(scope='session')
def users_ui_client(api_client):
    """
    Session-scoped UsersUI client for UI controller operations.

    Usage:
        def test_create_group(users_ui_client):
            result = users_ui_client.create_access_group(data)
    """
    from helpers.users_ui_client import UsersUIClient
    return UsersUIClient(config.web_url, api_client.session, api_client.access_token)


@pytest.fixture(scope='session')
def cdr_helper(api_client):
    """
    Session-scoped CDR helper for test data management.

    Usage:
        def test_cdr_filter(cdr_helper):
            cdr_ids = cdr_helper.seed_test_cdr(['201', '202'])
    """
    from helpers.cdr_helper import CDRHelper
    return CDRHelper(api_client)


@pytest.fixture(scope='session')
def fixtures() -> Dict[str, Dict[str, Any]]:
    """
    Load all test fixtures from JSON files.

    Returns:
        Dictionary with fixture name as key and fixture data as value.
    """
    fixtures_data = {}

    index_file = FIXTURES_DIR / 'index.json'
    if not index_file.exists():
        return fixtures_data

    with open(index_file, 'r', encoding='utf-8') as f:
        index = json.load(f)

    for fixture_name, metadata in index.items():
        fixture_file = FIXTURES_DIR / metadata['file']
        if fixture_file.exists():
            with open(fixture_file, 'r', encoding='utf-8') as f:
                fixtures_data[fixture_name] = json.load(f)

    return fixtures_data


@pytest.fixture(scope='session')
def access_group_fixtures(fixtures) -> Dict[str, Any]:
    """Access group test data."""
    return fixtures.get('access_groups', {})


@pytest.fixture(scope='session')
def users_credentials_fixtures(fixtures) -> Dict[str, Any]:
    """Users credentials test data."""
    return fixtures.get('users_credentials', {})


# =============================================================================
# Test Data Management
# =============================================================================

class TestDataManager:
    """Manages test data for cleanup."""
    created_group_ids: List[str] = []
    created_user_ids: List[str] = []
    created_cdr_ids: List[int] = []


@pytest.fixture(scope='session')
def test_data_manager() -> TestDataManager:
    """Session-scoped test data manager."""
    return TestDataManager()


# =============================================================================
# Helper Functions
# =============================================================================

def assert_api_success(response: Dict[str, Any], message: str = "API request failed") -> None:
    """Assert that API response indicates success."""
    assert response.get('result') is True, \
        f"{message}. Messages: {response.get('messages', {})}"


def get_users_with_extensions(api_client, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get users with extensions using SQL query.

    Returns list of dicts with: ext_id, userid, number, username
    """
    sql = f"""SELECT e.id, e.userid, e.number, u.username
              FROM m_Extensions e
              LEFT JOIN m_Users u ON e.userid = u.id
              WHERE e.type='SIP' LIMIT {limit}"""

    response = api_client.post('system:executeSqlRequest', {
        'db': '/cf/conf/mikopbx.db',
        'query': sql
    })

    if not response.get('result'):
        return []

    data = response.get('data', {})
    rows = data.get('rows', [])

    # Map to expected format
    users = []
    for row in rows:
        users.append({
            'ext_id': str(row.get('id', '')),
            'userid': str(row.get('userid', '')),
            'number': str(row.get('number', '')),
            'username': row.get('username', '')
        })

    return users


def assert_ui_success(response: Dict[str, Any], message: str = "UI request failed") -> None:
    """Assert that UI controller response indicates success."""
    assert response.get('success') is True, \
        f"{message}. Response: {response}"


# =============================================================================
# Cleanup Hooks
# =============================================================================

def pytest_sessionfinish(session, exitstatus):
    """Cleanup test data after all tests complete."""
    if not config.enable_full_cleanup:
        print("\n Full cleanup disabled (ENABLE_FULL_CLEANUP=0)")
        return

    print("\n" + "=" * 60)
    print("Cleaning up test data...")
    print("=" * 60)

    # Cleanup logic will be implemented in individual test cleanup fixtures
    print("Cleanup complete")
    print("=" * 60)
