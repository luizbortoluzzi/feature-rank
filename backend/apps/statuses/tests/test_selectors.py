"""
Selector tests for the statuses app.
"""

from django.test import TestCase

from apps.statuses.models import Status
from apps.statuses.selectors import get_status, get_statuses_list


class GetStatusesListSelectorTest(TestCase):
    def test_returns_all_statuses_ordered_by_sort_order(self):
        """get_statuses_list returns all statuses ordered by sort_order ascending."""
        Status.objects.create(name="zzz_status", color="#000", is_terminal=False, sort_order=100)
        Status.objects.create(name="aaa_status", color="#000", is_terminal=False, sort_order=1)
        Status.objects.create(name="mmm_status", color="#000", is_terminal=False, sort_order=50)

        results = list(get_statuses_list())
        orders = [s.sort_order for s in results]
        self.assertEqual(orders, sorted(orders))

    def test_returns_empty_queryset_when_none_exist(self):
        """get_statuses_list returns an empty queryset when no statuses are present."""
        self.assertEqual(get_statuses_list().count(), 0)

    def test_search_returns_matching_statuses_only(self):
        """get_statuses_list with search= filters by name (case-insensitive)."""
        Status.objects.create(name="open_srch", color="#000", is_terminal=False, sort_order=300)
        Status.objects.create(name="completed_srch", color="#000", is_terminal=True, sort_order=400)
        results = list(get_statuses_list(search="open_srch"))
        names = [s.name for s in results]
        self.assertIn("open_srch", names)
        self.assertNotIn("completed_srch", names)


class GetStatusSelectorTest(TestCase):
    def setUp(self):
        self.status = Status.objects.create(
            name="sel_status", color="#6B7280", is_terminal=False, sort_order=200
        )

    def test_returns_correct_status_by_pk(self):
        """get_status returns the status matching the given pk."""
        result = get_status(pk=self.status.pk)
        self.assertEqual(result.pk, self.status.pk)
        self.assertEqual(result.name, "sel_status")

    def test_raises_does_not_exist_for_unknown_pk(self):
        """get_status raises Status.DoesNotExist for an unknown pk."""
        with self.assertRaises(Status.DoesNotExist):
            get_status(pk=999999)
