#!/usr/bin/env python3
"""Debug test for enabled field behavior."""

import requests
import urllib3
import time
import subprocess

urllib3.disable_warnings()

base_url = 'https://192.168.107.3:8460'
api_url = base_url + '/pbxcore/api/v3'
admin_pass = '123456789MikoPBX#1'

session = requests.Session()
session.verify = False

# Authenticate as admin
auth_resp = session.post(api_url + '/auth:login', json={'login': 'admin', 'password': admin_pass})
auth_data = auth_resp.json().get('data', {})
token = auth_data.get('accessToken')
session.headers.update({'Authorization': 'Bearer ' + token})
print('Admin authenticated')

# Get users via SQL
sql = 'SELECT e.id, e.userid, e.number FROM m_Extensions e WHERE e.type="SIP" LIMIT 5'
resp = session.post(api_url + '/system:executeSqlRequest', json={'db': '/cf/conf/mikopbx.db', 'query': sql})
users_data = resp.json().get('data', {})
users = users_data.get('rows', []) if isinstance(users_data, dict) else []
print(f'Found {len(users)} users')

user_id = str(users[3]['userid'])  # Use 4th user to avoid conflicts
print(f'Using user_id: {user_id}')

# Use existing group 60
group_id = '60'

headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded'
}

def get_user_creds():
    cmd = f'sqlite3 /storage/usbdisk1/mikopbx/custom_modules/ModuleUsersUI/db/module.db "SELECT id, user_id, user_access_group_id, enabled, user_login FROM m_ModuleUsersUI_UsersCredentials WHERE user_id={user_id};"'
    result = subprocess.run(['docker', 'exec', 'mikopbx_modules-api-refactoring', 'sh', '-c', cmd], capture_output=True, text=True)
    return result.stdout.strip()

print('')
print('Before any changes:', get_user_creds())

# Step 1: Call change-user-group
ui_url = base_url + '/admin-cabinet/module-users-u-i/users-credentials/change-user-group'
resp = session.post(ui_url, data={'user_id': user_id, 'group_id': group_id}, headers=headers)
print('change-user-group response:', resp.text[:150])

state1 = get_user_creds()
print('After change-user-group:', state1)

time.sleep(0.5)

# Step 2: Call change-user-credentials
cred_url = base_url + '/admin-cabinet/module-users-u-i/users-credentials/change-user-credentials'
test_login = 'enabled_test_' + str(int(time.time()))[-6:]
test_pass = 'EnabledTestPass123!'
resp = session.post(cred_url, data={'user_id': user_id, 'login': test_login, 'password': test_pass}, headers=headers)
print('change-user-credentials response:', resp.text[:150])

state2 = get_user_creds()
print('After change-user-credentials:', state2)

# Parse and compare enabled
print('')
print('=== ANALYSIS ===')
enabled1 = 'N/A'
enabled2 = 'N/A'

if state1:
    parts1 = state1.split('|')
    enabled1 = parts1[3] if len(parts1) > 3 else 'N/A'
    print(f'enabled AFTER change-user-group: {enabled1}')
else:
    print('No record after change-user-group')

if state2:
    parts2 = state2.split('|')
    enabled2 = parts2[3] if len(parts2) > 3 else 'N/A'
    print(f'enabled AFTER change-user-credentials: {enabled2}')
else:
    print('No record after change-user-credentials')

if state1 and state2 and enabled1 != enabled2:
    print('')
    print(f'>>> BUG CONFIRMED: enabled changed from {enabled1} to {enabled2}')
    print('>>> This is a MODULE BUG in changeUserCredentialsAction()')
elif state1 and state2:
    print('')
    print('enabled value preserved correctly')
