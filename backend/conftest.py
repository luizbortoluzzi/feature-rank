"""
Shared pytest fixtures used across all test files.
"""

import pytest
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.statuses.models import Status
from apps.users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username="testuser",
        email="user@test.com",
        name="Test User",
        password="testpass123",
        is_admin=False,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="adminuser",
        email="admin@test.com",
        name="Admin User",
        password="adminpass123",
        is_admin=True,
    )


@pytest.fixture
def another_user(db):
    return User.objects.create_user(
        username="anotheruser",
        email="another@test.com",
        name="Another User",
        password="anotherpass123",
        is_admin=False,
    )


@pytest.fixture
def auth_client(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def category(db):
    return Category.objects.create(name="UI", icon="palette", color="#3B82F6")


@pytest.fixture
def another_category(db):
    return Category.objects.create(name="API", icon="code", color="#10B981")


@pytest.fixture
def status_open(db):
    return Status.objects.create(name="open", color="#6B7280", is_terminal=False, sort_order=0)


@pytest.fixture
def status_completed(db):
    return Status.objects.create(name="completed", color="#10B981", is_terminal=True, sort_order=99)


@pytest.fixture
def feature_request(db, regular_user, category, status_open):
    return FeatureRequest.objects.create(
        title="Dark mode",
        description="Add dark mode support",
        rate=4,
        author=regular_user,
        category=category,
        status=status_open,
    )


@pytest.fixture
def another_feature_request(db, another_user, category, status_open):
    return FeatureRequest.objects.create(
        title="Better search",
        description="Improve search functionality",
        rate=3,
        author=another_user,
        category=category,
        status=status_open,
    )


@pytest.fixture
def vote(db, regular_user, feature_request):
    return Vote.objects.create(user=regular_user, feature_request=feature_request)
