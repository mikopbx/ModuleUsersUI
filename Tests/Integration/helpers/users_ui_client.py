#!/usr/bin/env python3
"""
HTTP client for ModuleUsersUI AdminCabinet controllers.

This client interacts with UI controllers through HTTP POST/GET requests,
not REST API. Controllers return HTML or JSON (for AJAX requests).

Endpoints:
- /admin-cabinet/module-users-u-i/access-groups/save
- /admin-cabinet/module-users-u-i/access-groups/modify/{id}
- /admin-cabinet/module-users-u-i/access-groups/delete/{id}
- /admin-cabinet/module-users-u-i/users-credentials/changeUserGroupAction
- /admin-cabinet/module-users-u-i/users-credentials/changeUserCredentialsAction
"""

import json
from typing import Dict, Any, Optional, List
import requests


class UsersUIClient:
    """
    HTTP client for ModuleUsersUI controller operations.

    This client makes HTTP requests to MikoPBX AdminCabinet controllers
    for managing access groups and user credentials.
    """

    def __init__(self, base_url: str, session: requests.Session, access_token: str):
        """
        Initialize UsersUI client.

        Args:
            base_url: MikoPBX web base URL (e.g., http://localhost:8189)
            session: Requests session with cookies (used to copy cookies only)
            access_token: JWT access token for API authentication
        """
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token

        # Create own session without retry adapter to avoid hanging on redirects
        self.session = requests.Session()
        self.session.verify = False
        # Copy cookies from API session
        self.session.cookies.update(session.cookies)

    def _get_headers(self, ajax: bool = True) -> Dict[str, str]:
        """Get headers for requests."""
        headers = {
            'Authorization': f'Bearer {self.access_token}',
        }
        if ajax:
            headers['X-Requested-With'] = 'XMLHttpRequest'
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
        return headers

    def _post(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make POST request to controller."""
        url = f"{self.base_url}{path}"
        response = self.session.post(
            url,
            data=data,
            headers=self._get_headers(),
            timeout=30
        )
        response.raise_for_status()

        # Try to parse as JSON, otherwise return text
        try:
            return response.json()
        except json.JSONDecodeError:
            return {'success': response.ok, 'html': response.text}

    def _get(self, path: str, params: Optional[Dict] = None) -> requests.Response:
        """Make GET request to controller."""
        url = f"{self.base_url}{path}"
        response = self.session.get(
            url,
            params=params,
            headers=self._get_headers(ajax=False),
            timeout=30
        )
        return response

    # =========================================================================
    # Access Groups Operations
    # =========================================================================

    def create_access_group(
            self,
            name: str,
            description: str = '',
            full_access: bool = False,
            home_page: str = '/admin-cabinet/session/end',
            cdr_filter_mode: str = 'all',
            rights: Optional[Dict[str, List[str]]] = None,
            members: Optional[List[str]] = None,
            cdr_filter_users: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new access group.

        Args:
            name: Group name
            description: Group description
            full_access: Whether group has full admin access
            home_page: Home page after login
            cdr_filter_mode: CDR filter mode ('all', 'selected', 'not-selected', 'outgoing-selected')
            rights: Dictionary of controller -> actions (e.g., {'ExtensionsController': ['index', 'modify']})
            members: List of user IDs to add to group
            cdr_filter_users: List of user IDs for CDR filter

        Returns:
            Response dict with 'success' and optionally 'reload' (new group URL)
        """
        data = {
            'id': '',
            'name': name,
            'description': description,
            'fullAccess': '1' if full_access else '0',
            'homePage': home_page,
            'cdrFilterMode': cdr_filter_mode,
            'access_group_rights': json.dumps(self._format_rights(rights or {})),
            'members': json.dumps(members or []),
            'cdrFilter': json.dumps(cdr_filter_users or [])
        }

        return self._post('/admin-cabinet/module-users-u-i/access-groups/save', data)

    def update_access_group(
            self,
            group_id: str,
            name: str,
            description: str = '',
            full_access: bool = False,
            home_page: str = '/admin-cabinet/session/end',
            cdr_filter_mode: str = 'all',
            rights: Optional[Dict[str, List[str]]] = None,
            members: Optional[List[str]] = None,
            cdr_filter_users: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update an existing access group.

        Args:
            group_id: Group ID to update
            (other args same as create_access_group)

        Returns:
            Response dict with 'success'
        """
        data = {
            'id': group_id,
            'name': name,
            'description': description,
            'fullAccess': '1' if full_access else '0',
            'homePage': home_page,
            'cdrFilterMode': cdr_filter_mode,
            'access_group_rights': json.dumps(self._format_rights(rights or {})),
            'members': json.dumps(members or []),
            'cdrFilter': json.dumps(cdr_filter_users or [])
        }

        return self._post('/admin-cabinet/module-users-u-i/access-groups/save', data)

    def delete_access_group(self, group_id: str) -> Dict[str, Any]:
        """
        Delete an access group.

        Args:
            group_id: Group ID to delete

        Returns:
            Response dict with 'success'
        """
        response = self._get(f'/admin-cabinet/module-users-u-i/access-groups/delete/{group_id}')
        return {'success': response.ok}

    def _format_rights(self, rights: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """
        Format rights dictionary to the expected JSON format for saveAccessGroupRights.

        Input:
            {'ExtensionsController': ['index', 'modify']}

        Output:
            [
              {
                "module": "AdminCabinet",
                "controllers": [
                  {"controller": "MikoPBX\\AdminCabinet\\Controllers\\ExtensionsController", "actions": ["index", "modify"]}
                ]
              }
            ]
        """
        # Group controllers by module
        modules_map = {}  # module_name -> list of controller dicts

        for controller, actions in rights.items():
            # Determine module and full controller path
            if controller.startswith('MikoPBX\\'):
                full_controller = controller
                # Extract module name from namespace
                parts = controller.split('\\')
                if len(parts) >= 2:
                    module_name = parts[1]  # e.g., "AdminCabinet"
                else:
                    module_name = 'AdminCabinet'
            else:
                full_controller = f'MikoPBX\\AdminCabinet\\Controllers\\{controller}'
                module_name = 'AdminCabinet'

            if module_name not in modules_map:
                modules_map[module_name] = []

            modules_map[module_name].append({
                'controller': full_controller,
                'actions': actions
            })

        # Convert to expected format
        formatted = []
        for module_name, controllers in modules_map.items():
            formatted.append({
                'module': module_name,
                'controllers': controllers
            })

        return formatted

    # =========================================================================
    # User Credentials Operations
    # =========================================================================

    def change_user_group(self, user_id: str, group_id: str) -> Dict[str, Any]:
        """
        Change user's access group.

        Args:
            user_id: User ID (from Users table)
            group_id: New access group ID (or 'No access' to disable)

        Returns:
            Response dict with 'success'
        """
        data = {
            'user_id': user_id,
            'group_id': group_id
        }
        return self._post('/admin-cabinet/module-users-u-i/users-credentials/change-user-group', data)

    def change_user_credentials(
            self,
            user_id: str,
            login: str,
            password: str
    ) -> Dict[str, Any]:
        """
        Update user login and password.

        Args:
            user_id: User ID
            login: New login name
            password: New password

        Returns:
            Response dict with 'success'
        """
        data = {
            'user_id': user_id,
            'login': login,
            'password': password
        }
        return self._post('/admin-cabinet/module-users-u-i/users-credentials/change-user-credentials', data)

    def change_user_ldap_auth(self, user_id: str, use_ldap: bool) -> Dict[str, Any]:
        """
        Enable or disable LDAP authentication for user.

        Args:
            user_id: User ID
            use_ldap: Whether to use LDAP authentication

        Returns:
            Response dict with 'success'
        """
        data = {
            'user_id': user_id,
            'useLdap': 'true' if use_ldap else 'false'
        }
        return self._post('/admin-cabinet/module-users-u-i/users-credentials/change-user-use-ldap', data)

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def get_group_id_from_response(self, response: Dict[str, Any]) -> Optional[str]:
        """
        Extract group ID from create response.

        The 'reload' field contains URL like '/admin-cabinet/module-users-u-i/access-groups/modify/3'
        """
        reload_url = response.get('reload', '')
        if reload_url:
            parts = reload_url.rstrip('/').split('/')
            if parts:
                return parts[-1]
        return None
