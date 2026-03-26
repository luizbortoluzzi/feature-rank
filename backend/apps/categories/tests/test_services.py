"""
Service tests for the categories app.
"""

from django.db import IntegrityError
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.categories.models import Category
from apps.categories.services import create_category, delete_category, update_category
from apps.feature_requests.models import FeatureRequest
from apps.statuses.models import Status
from apps.users.models import User


class CreateCategoryServiceTest(TestCase):
    def test_creates_category_with_all_fields(self):
        """create_category stores name, icon, and color."""
        cat = create_category(name="Design", icon="brush", color="#FF0000")
        self.assertIsNotNone(cat.pk)
        self.assertEqual(cat.name, "Design")
        self.assertEqual(cat.icon, "brush")
        self.assertEqual(cat.color, "#FF0000")

    def test_creates_category_with_name_only(self):
        """create_category with only name sets icon and color to empty strings."""
        cat = create_category(name="Minimal")
        self.assertEqual(cat.icon, "")
        self.assertEqual(cat.color, "")

    def test_duplicate_name_raises_integrity_error(self):
        """Creating two categories with the same name raises IntegrityError."""
        create_category(name="DupeCategory")
        with self.assertRaises(IntegrityError):
            create_category(name="DupeCategory")


class UpdateCategoryServiceTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Original", icon="old-icon", color="#000000")

    def test_updates_name(self):
        """update_category updates the name field."""
        updated = update_category(category=self.category, name="Updated Name")
        self.assertEqual(updated.name, "Updated Name")

    def test_updates_icon(self):
        """update_category updates the icon field."""
        updated = update_category(category=self.category, icon="new-icon")
        self.assertEqual(updated.icon, "new-icon")

    def test_updates_color(self):
        """update_category updates the color field."""
        updated = update_category(category=self.category, color="#FFFFFF")
        self.assertEqual(updated.color, "#FFFFFF")

    def test_patch_semantics_omitted_fields_unchanged(self):
        """Only provided fields change; omitted fields retain their original value."""
        update_category(category=self.category, name="New Name Only")
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "New Name Only")
        # icon and color must remain unchanged
        self.assertEqual(self.category.icon, "old-icon")
        self.assertEqual(self.category.color, "#000000")


class DeleteCategoryServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="catdeluser", email="catdel@example.com", name="Del", password="pass"
        )
        self.status = Status.objects.create(
            name="open_catdel", color="#000", is_terminal=False, sort_order=200
        )

    def test_deletes_unused_category_successfully(self):
        """delete_category removes a category with no referenced feature requests."""
        cat = Category.objects.create(name="Deletable", icon="", color="")
        delete_category(category=cat)
        self.assertFalse(Category.objects.filter(pk=cat.pk).exists())

    def test_raises_validation_error_when_category_in_use(self):
        """delete_category raises ValidationError when a FeatureRequest references the category."""
        cat = Category.objects.create(name="InUse", icon="", color="")
        FeatureRequest.objects.create(
            title="Ref Feature",
            description="desc",
            rate=3,
            author=self.user,
            category=cat,
            status=self.status,
        )
        with self.assertRaises(ValidationError):
            delete_category(category=cat)
