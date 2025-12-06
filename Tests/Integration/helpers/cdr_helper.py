#!/usr/bin/env python3
"""
CDR helper for creating and cleaning up test CDR records.

Uses REST API system:executeSqlRequest to insert/delete CDR records
in the SQLite database.
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


class CDRHelper:
    """
    Helper for managing test CDR records.

    CDR records cannot be created via REST API - they are only created
    by actual phone calls. This helper uses SQL to insert test data
    directly into the CDR database.
    """

    # CDR database path inside container
    CDR_DB_PATH = '/storage/usbdisk1/mikopbx/astlogs/asterisk/cdr.db'

    # Test data marker - all test records have this prefix in UNIQUEID
    TEST_MARKER = 'MODULEUSERSUI_TEST_'

    def __init__(self, api_client):
        """
        Initialize CDR helper.

        Args:
            api_client: Authenticated MikoPBXClient instance
        """
        self.api_client = api_client
        self.seeded_ids: List[int] = []

    def execute_sql(self, sql: str, db_path: str = None) -> Dict[str, Any]:
        """
        Execute SQL query via REST API.

        Args:
            sql: SQL query to execute
            db_path: Database path (defaults to CDR database)

        Returns:
            API response
        """
        if db_path is None:
            db_path = self.CDR_DB_PATH

        return self.api_client.post('system:executeSqlRequest', {
            'sql': sql,
            'dbPath': db_path
        })

    def seed_test_cdr(
            self,
            extensions: List[str],
            count_per_extension: int = 3,
            include_incoming: bool = True,
            include_outgoing: bool = True
    ) -> List[int]:
        """
        Create test CDR records for specified extensions.

        Args:
            extensions: List of extension numbers to create CDR for
            count_per_extension: Number of records per extension (both directions)
            include_incoming: Include incoming calls to extensions
            include_outgoing: Include outgoing calls from extensions

        Returns:
            List of created CDR IDs
        """
        created_ids = []
        base_time = datetime.now() - timedelta(days=7)
        external_numbers = ['79991234567', '79992345678', '79993456789']

        for i, extension in enumerate(extensions):
            for j in range(count_per_extension):
                call_time = base_time + timedelta(hours=i*24 + j)
                duration = 60 + (j * 30)  # 60, 90, 120 seconds

                # Outgoing call from extension
                if include_outgoing:
                    cdr_id = self._create_cdr_record(
                        src_num=extension,
                        dst_num=external_numbers[j % len(external_numbers)],
                        start_time=call_time,
                        duration=duration,
                        disposition='ANSWERED'
                    )
                    if cdr_id:
                        created_ids.append(cdr_id)

                # Incoming call to extension
                if include_incoming:
                    call_time = call_time + timedelta(hours=1)
                    cdr_id = self._create_cdr_record(
                        src_num=external_numbers[j % len(external_numbers)],
                        dst_num=extension,
                        start_time=call_time,
                        duration=duration,
                        disposition='ANSWERED'
                    )
                    if cdr_id:
                        created_ids.append(cdr_id)

        self.seeded_ids.extend(created_ids)
        return created_ids

    def _create_cdr_record(
            self,
            src_num: str,
            dst_num: str,
            start_time: datetime,
            duration: int,
            disposition: str = 'ANSWERED'
    ) -> Optional[int]:
        """
        Create a single CDR record.

        Args:
            src_num: Source (caller) number
            dst_num: Destination (callee) number
            start_time: Call start time
            duration: Call duration in seconds
            disposition: Call result (ANSWERED, NO ANSWER, BUSY, FAILED)

        Returns:
            Created record ID or None on failure
        """
        unique_id = f"{self.TEST_MARKER}{uuid.uuid4().hex[:12]}"
        linked_id = unique_id

        # Format times for SQLite
        start_str = start_time.strftime('%Y-%m-%d %H:%M:%S')
        end_time = start_time + timedelta(seconds=duration)
        end_str = end_time.strftime('%Y-%m-%d %H:%M:%S')
        answer_str = (start_time + timedelta(seconds=5)).strftime('%Y-%m-%d %H:%M:%S')

        billsec = duration - 5 if disposition == 'ANSWERED' else 0

        sql = f"""
        INSERT INTO cdr_general (
            UNIQUEID, linkedid, start, src_num, dst_num,
            disposition, billsec, duration,
            src_chan, dst_chan, answer, endtime
        ) VALUES (
            '{unique_id}', '{linked_id}', '{start_str}', '{src_num}', '{dst_num}',
            '{disposition}', {billsec}, {duration},
            'PJSIP/{src_num}-{uuid.uuid4().hex[:8]}',
            'PJSIP/{dst_num}-{uuid.uuid4().hex[:8]}',
            '{answer_str}', '{end_str}'
        )
        """

        response = self.execute_sql(sql)
        if response.get('result'):
            # Get the last inserted ID
            id_response = self.execute_sql("SELECT last_insert_rowid() as id")
            if id_response.get('result') and id_response.get('data'):
                data = id_response['data']
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get('id')
        return None

    def cleanup_test_cdr(self, cdr_ids: Optional[List[int]] = None) -> int:
        """
        Delete test CDR records.

        Args:
            cdr_ids: List of specific IDs to delete, or None to delete all test records

        Returns:
            Number of deleted records
        """
        if cdr_ids is None:
            # Delete all records with test marker
            sql = f"DELETE FROM cdr_general WHERE UNIQUEID LIKE '{self.TEST_MARKER}%'"
        else:
            if not cdr_ids:
                return 0
            ids_str = ','.join(str(id) for id in cdr_ids)
            sql = f"DELETE FROM cdr_general WHERE id IN ({ids_str})"

        response = self.execute_sql(sql)
        if response.get('result'):
            # Get affected rows count
            changes_response = self.execute_sql("SELECT changes() as count")
            if changes_response.get('result') and changes_response.get('data'):
                data = changes_response['data']
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get('count', 0)
        return 0

    def get_test_cdr_ids(self) -> List[int]:
        """
        Get IDs of all test CDR records.

        Returns:
            List of test record IDs
        """
        sql = f"SELECT id FROM cdr_general WHERE UNIQUEID LIKE '{self.TEST_MARKER}%'"
        response = self.execute_sql(sql)

        if response.get('result') and response.get('data'):
            data = response['data']
            if isinstance(data, list):
                return [row['id'] for row in data if 'id' in row]
        return []

    def get_cdr_count_for_extension(self, extension: str, as_user_token: Optional[str] = None) -> int:
        """
        Get count of CDR records visible for a specific extension.

        This is useful for testing CDR filtering - authenticate as a user
        and count how many records they can see for a given extension.

        Args:
            extension: Extension number to filter by
            as_user_token: JWT token to use for request (for testing as different user)

        Returns:
            Number of visible CDR records
        """
        params = {
            'src_num': extension,
            'limit': 1000
        }

        # If testing as different user, we need to create a new client
        # For now, just use current client
        response = self.api_client.get('cdr', params=params)

        if response.get('result'):
            data = response.get('data', {})
            if isinstance(data, dict):
                pagination = data.get('pagination', {})
                return pagination.get('total', 0)
            elif isinstance(data, list):
                return len(data)
        return 0
