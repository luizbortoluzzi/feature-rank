"""
Selector tests for feature_requests app.

Tests verify:
- Default ordering: vote_count desc → created_at desc → id desc
- sort=vote_count (ascending) is respected
- rate does NOT affect ordering
- has_voted=True for user who voted, False for user who did not, False for anonymous
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.feature_requests.selectors import get_feature_requests_list
from apps.statuses.models import Status

User = get_user_model()


def make_user(username, email):
    return User.objects.create_user(username=username, email=email, password="pass", name="Test")


def make_category():
    return Category.objects.create(name="Sel Category", icon="code", color="#000000")


def make_status():
    return Status.objects.create(name="open_sel", color="#6B7280", is_terminal=False, sort_order=99)


def make_feature(user, category, status, title, rate=3):
    return FeatureRequest.objects.create(
        title=title, description="desc", rate=rate, author=user, category=category, status=status
    )


class DefaultOrderingTest(TestCase):
    def setUp(self):
        self.user = make_user("seluser", "sel@example.com")
        self.user2 = make_user("seluser2", "sel2@example.com")
        self.category = make_category()
        self.status = make_status()

    def test_features_ordered_by_vote_count_desc(self):
        """
        Default ordering must be vote_count DESC. Feature with more votes appears first.
        """
        fr_popular = make_feature(self.user, self.category, self.status, "Popular")
        fr_unpopular = make_feature(self.user, self.category, self.status, "Unpopular")

        Vote.objects.create(user=self.user, feature_request=fr_popular)
        Vote.objects.create(user=self.user2, feature_request=fr_popular)
        Vote.objects.create(user=self.user, feature_request=fr_unpopular)

        qs = list(get_feature_requests_list())
        ids = [fr.pk for fr in qs]
        self.assertLess(ids.index(fr_popular.pk), ids.index(fr_unpopular.pk))

    def test_tie_broken_by_created_at_desc(self):
        """
        When vote_count is tied, the newer feature (higher created_at) appears first.
        """
        fr_older = make_feature(self.user, self.category, self.status, "Older")
        fr_newer = make_feature(self.user, self.category, self.status, "Newer")

        qs = list(get_feature_requests_list())
        ids = [fr.pk for fr in qs]
        # Newer was created after older so its created_at is higher — appears first
        self.assertLess(ids.index(fr_newer.pk), ids.index(fr_older.pk))

    def test_tie_broken_by_id_desc_when_same_created_at(self):
        """
        When vote_count and created_at are the same, higher id appears first.
        """
        now = timezone.now()
        fr_low = FeatureRequest.objects.create(
            title="Low",
            description="d",
            rate=3,
            author=self.user,
            category=self.category,
            status=self.status,
        )
        fr_high = FeatureRequest.objects.create(
            title="High",
            description="d",
            rate=3,
            author=self.user,
            category=self.category,
            status=self.status,
        )
        # Force same created_at
        FeatureRequest.objects.filter(pk=fr_low.pk).update(created_at=now)
        FeatureRequest.objects.filter(pk=fr_high.pk).update(created_at=now)

        qs = list(get_feature_requests_list())
        ids = [fr.pk for fr in qs]
        self.assertLess(ids.index(fr_high.pk), ids.index(fr_low.pk))


class SortAscendingTest(TestCase):
    def setUp(self):
        self.user = make_user("sortasc", "sortasc@example.com")
        self.user2 = make_user("sortasc2", "sortasc2@example.com")
        self.category = make_category()
        self.status = make_status()

    def test_sort_vote_count_ascending(self):
        """
        sort='vote_count' returns features with fewer votes first.
        """
        fr_popular = make_feature(self.user, self.category, self.status, "Popular2")
        fr_unpopular = make_feature(self.user, self.category, self.status, "Unpopular2")

        Vote.objects.create(user=self.user, feature_request=fr_popular)
        Vote.objects.create(user=self.user2, feature_request=fr_popular)

        qs = list(get_feature_requests_list(sort="vote_count"))
        ids = [fr.pk for fr in qs]
        self.assertLess(ids.index(fr_unpopular.pk), ids.index(fr_popular.pk))


class RateDoesNotAffectOrderingTest(TestCase):
    def setUp(self):
        self.user = make_user("rateorder", "rateorder@example.com")
        self.user2 = make_user("rateorder2", "rateorder2@example.com")
        self.category = make_category()
        self.status = make_status()

    def test_rate_does_not_influence_ranking(self):
        """
        A feature with rate=1 but more votes must appear above one with rate=5 but fewer votes.
        rate must never affect ordering.
        """
        fr_low_rate = make_feature(self.user, self.category, self.status, "LowRate", rate=1)
        fr_high_rate = make_feature(self.user, self.category, self.status, "HighRate", rate=5)

        Vote.objects.create(user=self.user, feature_request=fr_low_rate)
        Vote.objects.create(user=self.user2, feature_request=fr_low_rate)
        # fr_high_rate has 0 votes

        qs = list(get_feature_requests_list())
        ids = [fr.pk for fr in qs]
        self.assertLess(ids.index(fr_low_rate.pk), ids.index(fr_high_rate.pk))


class HasVotedAnnotationTest(TestCase):
    def setUp(self):
        self.user = make_user("hasvoted", "hasvoted@example.com")
        self.user2 = make_user("hasvoted2", "hasvoted2@example.com")
        self.category = make_category()
        self.status = make_status()

    def test_has_voted_true_for_user_who_voted(self):
        """Authenticated user who voted must have has_voted=True."""
        fr = make_feature(self.user, self.category, self.status, "Voted")
        Vote.objects.create(user=self.user, feature_request=fr)
        result = get_feature_requests_list(user=self.user).get(pk=fr.pk)
        self.assertTrue(result.has_voted)

    def test_has_voted_false_for_user_who_did_not_vote(self):
        """Authenticated user who did not vote must have has_voted=False."""
        fr = make_feature(self.user, self.category, self.status, "NotVoted")
        Vote.objects.create(user=self.user2, feature_request=fr)
        result = get_feature_requests_list(user=self.user).get(pk=fr.pk)
        self.assertFalse(result.has_voted)

    def test_has_voted_false_for_anonymous_user(self):
        """Unauthenticated user (None) must always get has_voted=False."""
        fr = make_feature(self.user, self.category, self.status, "AnonCheck")
        Vote.objects.create(user=self.user, feature_request=fr)
        result = get_feature_requests_list(user=None).get(pk=fr.pk)
        self.assertFalse(result.has_voted)
