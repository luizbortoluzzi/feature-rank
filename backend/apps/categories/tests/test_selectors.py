"""
Selector tests for the categories app.
"""

from django.test import TestCase

from apps.categories.models import Category
from apps.categories.selectors import get_categories_list, get_category


class GetCategoriesListSelectorTest(TestCase):
    def test_returns_all_categories_ordered_by_name(self):
        """get_categories_list returns all categories in name alphabetical order."""
        Category.objects.create(name="Zeta", icon="", color="")
        Category.objects.create(name="Alpha", icon="", color="")
        Category.objects.create(name="Mu", icon="", color="")

        results = list(get_categories_list())
        names = [c.name for c in results]
        self.assertEqual(names, sorted(names))

    def test_returns_empty_queryset_when_no_categories_exist(self):
        """get_categories_list returns an empty queryset when there are no categories."""
        self.assertEqual(get_categories_list().count(), 0)


class GetCategorySelectorTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Single", icon="icon", color="#123456")

    def test_returns_correct_category_by_pk(self):
        """get_category returns the category matching the supplied pk."""
        result = get_category(pk=self.category.pk)
        self.assertEqual(result.pk, self.category.pk)
        self.assertEqual(result.name, "Single")

    def test_raises_does_not_exist_for_unknown_pk(self):
        """get_category raises Category.DoesNotExist for a pk that does not exist."""
        with self.assertRaises(Category.DoesNotExist):
            get_category(pk=999999)
