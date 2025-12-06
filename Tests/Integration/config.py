#!/usr/bin/env python3
"""
Configuration loader for ModuleUsersUI integration tests.

Loads configuration from .env file and provides typed access to settings.
"""

import os
from pathlib import Path
from typing import Optional, Literal
from dotenv import load_dotenv


class TestConfig:
    """
    Test configuration loader for ModuleUsersUI integration tests.

    Environment Variables:
        MIKOPBX_API_URL       - MikoPBX REST API URL (required)
        MIKOPBX_API_USERNAME  - API username (default: admin)
        MIKOPBX_API_PASSWORD  - API password (required)
        MIKOPBX_CONTAINER     - Docker container name (default: mikopbx-php83)
        ENABLE_CDR_SEED       - Enable CDR seeding (default: 1)
        ENABLE_CDR_CLEANUP    - Enable CDR cleanup (default: 1)
        ENABLE_FULL_CLEANUP   - Enable full cleanup (default: 1)
    """

    def __init__(self, env_file: Optional[Path] = None):
        """Initialize configuration loader."""
        if env_file is None:
            env_file = Path(__file__).parent / '.env'

        if env_file.exists():
            load_dotenv(env_file)
        else:
            # Try .env.example as fallback for CI
            example_file = Path(__file__).parent / '.env.example'
            if example_file.exists():
                load_dotenv(example_file)
            else:
                raise FileNotFoundError(
                    f".env file not found: {env_file}\n"
                    "Create .env file from .env.example template"
                )

        self._validate_required_vars()

    def _validate_required_vars(self):
        """Validate required environment variables."""
        missing = []
        if not os.getenv('MIKOPBX_API_URL'):
            missing.append('MIKOPBX_API_URL')
        if not os.getenv('MIKOPBX_API_PASSWORD'):
            missing.append('MIKOPBX_API_PASSWORD')

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Please update your .env file."
            )

    @property
    def api_url(self) -> str:
        """MikoPBX REST API base URL."""
        return os.getenv('MIKOPBX_API_URL', '').rstrip('/')

    @property
    def web_url(self) -> str:
        """MikoPBX Web UI base URL (derived from API URL)."""
        # Replace /pbxcore/api/v3 with empty string to get base URL
        return self.api_url.replace('/pbxcore/api/v3', '')

    @property
    def api_username(self) -> str:
        """API admin username."""
        return os.getenv('MIKOPBX_API_USERNAME', 'admin')

    @property
    def api_password(self) -> str:
        """API admin password."""
        return os.getenv('MIKOPBX_API_PASSWORD', '')

    @property
    def container_name(self) -> str:
        """Docker container name."""
        return os.getenv('MIKOPBX_CONTAINER', 'mikopbx-php83')

    @property
    def enable_cdr_seed(self) -> bool:
        """Enable CDR test data seeding."""
        return os.getenv('ENABLE_CDR_SEED', '1') == '1'

    @property
    def enable_cdr_cleanup(self) -> bool:
        """Enable CDR test data cleanup."""
        return os.getenv('ENABLE_CDR_CLEANUP', '1') == '1'

    @property
    def enable_full_cleanup(self) -> bool:
        """Enable full cleanup after tests."""
        return os.getenv('ENABLE_FULL_CLEANUP', '1') == '1'

    @property
    def cdr_database_path(self) -> str:
        """CDR SQLite database path (inside container)."""
        return os.getenv('MIKOPBX_CDR_DB_PATH',
                         '/storage/usbdisk1/mikopbx/astlogs/asterisk/cdr.db')

    @property
    def module_database_path(self) -> str:
        """ModuleUsersUI SQLite database path (inside container)."""
        return os.getenv('MIKOPBX_MODULE_DB_PATH',
                         '/storage/usbdisk1/mikopbx/custom_modules/ModuleUsersUI/db/module.db')

    @property
    def main_database_path(self) -> str:
        """Main MikoPBX SQLite database path (inside container)."""
        return os.getenv('MIKOPBX_DB_PATH', '/cf/conf/mikopbx.db')

    def __repr__(self) -> str:
        return (
            f"TestConfig(\n"
            f"  api_url={self.api_url},\n"
            f"  web_url={self.web_url},\n"
            f"  container={self.container_name}\n"
            f")"
        )


# Global singleton
_config_instance: Optional[TestConfig] = None


def get_config() -> TestConfig:
    """Get global configuration instance."""
    global _config_instance
    if _config_instance is None:
        _config_instance = TestConfig()
    return _config_instance


if __name__ == '__main__':
    config = get_config()
    print(config)
