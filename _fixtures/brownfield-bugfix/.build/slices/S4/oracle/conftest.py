# FROZEN ORACLE — conftest for S4 slice oracle. Do NOT edit (B4); needing to edit = escape with a diagnosis.
# Contract-level mock fixtures for S4 slice seams: CT2 (C1/Data Store), CT3 (C2/Identity & Auth),
# CT9 (C3/Project Management as callee of C6).
# All mocks follow frozen contract specs — never configure mock attributes as assertions (Rule 10).

import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_data_store():
    """Mock for C1 (Data Store) — contract-level spec for CT2 seam.
    Provides: create_project, get_project, list_projects, update_project, delete_project.
    """
    m = MagicMock(name="DataStore")
    m.create_project = MagicMock(name="create_project")
    m.get_project = MagicMock(name="get_project")
    m.list_projects = MagicMock(name="list_projects", return_value=[])
    m.update_project = MagicMock(name="update_project")
    m.delete_project = MagicMock(name="delete_project")
    return m


@pytest.fixture
def mock_identity_auth():
    """Mock for C2 (Identity & Auth) — contract-level spec for CT3 seam.
    Provides: resolve_session → returns freelancer identity dict or None.
    High-blast component (auth).
    """
    m = MagicMock(name="IdentityAuth")
    m.resolve_session = MagicMock(name="resolve_session", return_value=None)
    return m


@pytest.fixture
def mock_project_management():
    """Mock for C3 (Project Management) — contract-level spec for CT9 seam (C6 caller).
    Provides: handle_request → returns response dict {status, body, content_type}.
    """
    m = MagicMock(name="ProjectManagement")
    m.handle_request = MagicMock(
        name="handle_request",
        return_value={"status": 200, "body": "<html></html>", "content_type": "text/html"},
    )
    return m
