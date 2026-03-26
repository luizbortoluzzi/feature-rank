"""
Model-level constraint tests for feature_requests app.

Tests verify:
- Vote DB unique constraint prevents duplicate (user, feature_request) pairs
- vote_count annotation returns correct count
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Count
from django.test import TestCase

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.statuses.models import Status

User = get_user_model()


def make_user(username, email):
    return User.objects.create_user(username=username, email=email, password="pass", name="Test")


def make_category():
    return Category.objects.create(name="Test Category", icon="code", color="#000000")


def make_status():
    return Status.objects.create(name="open_model", color="#6B7280", is_terminal=False, sort_order=0)


def make_feature(user, category, status, title="Feature"):
    return FeatureRequest.objects.create(
        title=title, description="desc", rate=3, author=user, category=category, status=status
    )


class VoteUniqueConstraintTest(TestCase):
    def setUp(self):
        self.user = make_user("modeluser", "modeluser@example.com")
        self.user2 = make_user("modeluser2", "modeluser2@example.com")
        self.category = make_category()
        self.status = make_status()
        self.feature = make_feature(self.user, self.category, self.status)

    def test_vote_db_unique_constraint_prevents_duplicate(self):
        """
        Creating two Vote records for the same (user, feature_request) pair must
        raise IntegrityError. The database constraint is the concurrency safety net.
        """
        Vote.objects.create(user=self.user, feature_request=self.feature)
        with self.assertRaises(IntegrityError):
            Vote.objects.create(user=self.user, feature_request=self.feature)

    def test_different_users_can_vote_on_same_feature(self):
        """Two different users may each have one vote on the same feature."""
        Vote.objects.create(user=self.user, feature_request=self.feature)
        Vote.objects.create(user=self.user2, feature_request=self.feature)
        self.assertEqual(Vote.objects.filter(feature_request=self.feature).count(), 2)

    def test_same_user_can_vote_on_different_features(self):
        """A user may vote on multiple different feature requests."""
        fr2 = make_feature(self.user, self.category, self.status, "Feature 2")
        Vote.objects.create(user=self.user, feature_request=self.feature)
        Vote.objects.create(user=self.user, feature_request=fr2)
        self.assertEqual(Vote.objects.filter(user=self.user).count(), 2)


class VoteCountAnnotationTest(TestCase):
    def setUp(self):
        self.user = make_user("annotuser", "annotuser@example.com")
        self.user2 = make_user("annotuser2", "annotuser2@example.com")
        self.category = make_category()
        self.status = make_status()
        self.feature = make_feature(self.user, self.category, self.status)

    def test_vote_count_annotation_reflects_actual_votes(self):
        """vote_count annotation returns the correct count of Vote records."""
        Vote.objects.create(user=self.user, feature_request=self.feature)
        Vote.objects.create(user=self.user2, feature_request=self.feature)
        fr = FeatureRequest.objects.annotate(vote_count=Count("votes")).get(pk=self.feature.pk)
        self.assertEqual(fr.vote_count, 2)

    def test_vote_count_is_zero_with_no_votes(self):
        """vote_count annotation returns 0 when no votes exist."""
        fr = FeatureRequest.objects.annotate(vote_count=Count("votes")).get(pk=self.feature.pk)
        self.assertEqual(fr.vote_count, 0)
