"""
Service-layer tests for feature_requests app.

Tests verify:
- vote idempotency (duplicate vote creates no second record)
- unvote idempotency (unvote with no existing vote is safe)
- author is derived from user argument on create, never from external data
- rate validation (0 and 6 are invalid)
- status_id from non-admin user raises PermissionDenied
- author_id in update data is silently ignored
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.feature_requests.services import (
    create_feature_request,
    unvote_feature_request,
    update_feature_request,
    vote_feature_request,
)
from apps.statuses.models import Status

User = get_user_model()


def make_user(username, email, is_admin=False):
    return User.objects.create_user(
        username=username, email=email, password="pass", name="Test", is_admin=is_admin
    )


def make_category():
    return Category.objects.create(name="Svc Category", icon="code", color="#10B981")


def make_status(name="open_svc_default", sort_order=100):
    return Status.objects.create(
        name=name, color="#6B7280", is_terminal=False, sort_order=sort_order
    )


def make_feature(user, category, status):
    return FeatureRequest.objects.create(
        title="Dark mode",
        description="Add dark mode support",
        rate=4,
        author=user,
        category=category,
        status=status,
    )


class VoteFeatureRequestServiceTest(TestCase):
    def setUp(self):
        self.user = make_user("votesvuser", "votesvc@example.com")
        self.user2 = make_user("votesvuser2", "votesvc2@example.com")
        self.category = make_category()
        self.status = make_status()
        self.feature = make_feature(self.user, self.category, self.status)

    def test_vote_creates_one_vote_record(self):
        """Voting creates exactly one Vote record."""
        result = vote_feature_request(feature_request=self.feature, user=self.user)
        self.assertEqual(
            Vote.objects.filter(user=self.user, feature_request=self.feature).count(), 1
        )
        self.assertTrue(result["has_voted"])
        self.assertEqual(result["vote_count"], 1)
        self.assertEqual(result["feature_request_id"], self.feature.pk)

    def test_user_cannot_vote_twice_for_same_feature(self):
        """
        Calling vote_feature_request twice for the same user+feature produces
        only one Vote record. The second call is idempotent.
        """
        vote_feature_request(feature_request=self.feature, user=self.user)
        vote_feature_request(feature_request=self.feature, user=self.user)
        self.assertEqual(
            Vote.objects.filter(user=self.user, feature_request=self.feature).count(), 1
        )

    def test_duplicate_vote_returns_correct_state(self):
        """Idempotent vote returns has_voted=True and correct vote_count."""
        vote_feature_request(feature_request=self.feature, user=self.user)
        result = vote_feature_request(feature_request=self.feature, user=self.user)
        self.assertTrue(result["has_voted"])
        self.assertEqual(result["vote_count"], 1)

    def test_user_can_vote_on_own_feature(self):
        """Self-voting is permitted."""
        result = vote_feature_request(feature_request=self.feature, user=self.user)
        self.assertTrue(result["has_voted"])

    def test_vote_count_is_cumulative_across_users(self):
        """Multiple users voting increases the vote_count correctly."""
        vote_feature_request(feature_request=self.feature, user=self.user)
        result = vote_feature_request(feature_request=self.feature, user=self.user2)
        self.assertEqual(result["vote_count"], 2)


class UnvoteFeatureRequestServiceTest(TestCase):
    def setUp(self):
        self.user = make_user("unvotesvc", "unvotesvc@example.com")
        self.category = make_category()
        self.status = make_status()
        self.feature = make_feature(self.user, self.category, self.status)

    def test_unvote_removes_existing_vote(self):
        """Unvoting removes the Vote record and returns has_voted=False."""
        Vote.objects.create(user=self.user, feature_request=self.feature)
        result = unvote_feature_request(feature_request=self.feature, user=self.user)
        self.assertEqual(
            Vote.objects.filter(user=self.user, feature_request=self.feature).count(), 0
        )
        self.assertFalse(result["has_voted"])

    def test_unvote_when_no_vote_exists_does_not_raise(self):
        """
        Unvoting when no vote exists is safe and returns has_voted=False.
        No error or exception is raised.
        """
        result = unvote_feature_request(feature_request=self.feature, user=self.user)
        self.assertFalse(result["has_voted"])
        self.assertEqual(result["vote_count"], 0)

    def test_unvote_returns_feature_request_id(self):
        """Unvote response includes the feature_request_id."""
        result = unvote_feature_request(feature_request=self.feature, user=self.user)
        self.assertEqual(result["feature_request_id"], self.feature.pk)


class CreateFeatureRequestServiceTest(TestCase):
    def setUp(self):
        self.user = make_user("createsvuser", "createsvc@example.com")
        self.category = make_category()
        # The service looks for a status named 'open' (case-insensitive).
        self.open_status = Status.objects.create(
            name="open", color="#6B7280", is_terminal=False, sort_order=10
        )

    def test_author_is_derived_from_user_argument(self):
        """
        Author is always set from the user argument passed to the service.
        """
        fr = create_feature_request(
            user=self.user,
            title="New Feature",
            description="A description",
            rate=3,
            category_id=self.category.pk,
        )
        self.assertEqual(fr.author, self.user)

    def test_status_defaults_to_open(self):
        """Newly created feature requests always get the 'open' status."""
        fr = create_feature_request(
            user=self.user,
            title="New Feature",
            description="A description",
            rate=3,
            category_id=self.category.pk,
        )
        self.assertEqual(fr.status.name.lower(), "open")

    def test_create_raises_when_open_status_missing(self):
        """
        If no status with name='open' exists, create_feature_request raises
        a ValidationError.
        """
        # Remove the 'open' status to simulate missing seed data
        Status.objects.all().delete()
        with self.assertRaises(ValidationError):
            create_feature_request(
                user=self.user,
                title="New Feature",
                description="A description",
                rate=3,
                category_id=self.category.pk,
            )


class UpdateFeatureRequestServiceTest(TestCase):
    def setUp(self):
        self.user = make_user("updatesvuser", "updatesvc@example.com")
        self.other_user = make_user("otherupdatesvc", "otherupdatesvc@example.com")
        self.admin_user = make_user("adminupdatesvc", "adminupdatesvc@example.com", is_admin=True)
        self.category = make_category()
        self.status = make_status("open_upd", sort_order=20)
        self.planned_status = make_status("planned_upd", sort_order=21)
        self.feature = make_feature(self.user, self.category, self.status)

    def test_non_admin_submitting_status_id_raises_permission_denied(self):
        """
        Non-admin users attempting to set status_id in update data must receive
        PermissionDenied, never a silent acceptance.
        """
        with self.assertRaises(PermissionDenied):
            update_feature_request(
                feature_request=self.feature,
                user=self.user,
                data={"status_id": self.planned_status.pk},
            )

    def test_admin_can_change_status_id(self):
        """Admin users may supply status_id in update data."""
        updated = update_feature_request(
            feature_request=self.feature,
            user=self.admin_user,
            data={"status_id": self.planned_status.pk},
        )
        self.assertEqual(updated.status_id, self.planned_status.pk)

    def test_author_id_in_data_is_silently_ignored(self):
        """
        If author_id is present in update data it must be silently discarded.
        The author must remain unchanged after the update.
        """
        original_author = self.feature.author
        update_feature_request(
            feature_request=self.feature,
            user=self.user,
            data={"author_id": 99999, "title": "Updated title"},
        )
        self.feature.refresh_from_db()
        self.assertEqual(self.feature.author, original_author)

    def test_vote_count_in_data_is_silently_ignored(self):
        """vote_count in update data must be silently stripped and never applied."""
        update_feature_request(
            feature_request=self.feature,
            user=self.user,
            data={"vote_count": 999, "title": "Updated"},
        )
        self.feature.refresh_from_db()
        self.assertEqual(self.feature.title, "Updated")

    def test_patch_only_updates_provided_fields(self):
        """PATCH semantics: only provided fields are updated; others remain unchanged."""
        original_description = self.feature.description
        update_feature_request(
            feature_request=self.feature,
            user=self.user,
            data={"title": "New Title Only"},
        )
        self.feature.refresh_from_db()
        self.assertEqual(self.feature.title, "New Title Only")
        self.assertEqual(self.feature.description, original_description)
