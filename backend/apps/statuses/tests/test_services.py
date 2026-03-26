"""
Service tests for the statuses app.
"""

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest
from apps.statuses.models import Status
from apps.statuses.services import create_status, delete_status, update_status
from apps.users.models import User


class CreateStatusServiceTest(TestCase):
    def test_creates_status_with_all_fields(self):
        """create_status persists all supplied fields."""
        s = create_status(name="planned_svc", color="#FF0000", is_terminal=True, sort_order=5)
        self.assertIsNotNone(s.pk)
        self.assertEqual(s.name, "planned_svc")
        self.assertEqual(s.color, "#FF0000")
        self.assertTrue(s.is_terminal)

    def test_is_terminal_defaults_to_false(self):
        """create_status with no is_terminal argument sets it to False."""
        s = create_status(name="default_svc", color="#000", sort_order=6)
        self.assertFalse(s.is_terminal)


class UpdateStatusServiceTest(TestCase):
    def setUp(self):
        self.status = Status.objects.create(
            name="original_svc", color="#000000", is_terminal=False, sort_order=40
        )

    def test_updates_name(self):
        """update_status updates the name field."""
        updated = update_status(status=self.status, name="updated_svc")
        self.assertEqual(updated.name, "updated_svc")

    def test_updates_color(self):
        """update_status updates the color field."""
        updated = update_status(status=self.status, color="#FFFFFF")
        self.assertEqual(updated.color, "#FFFFFF")

    def test_updates_is_terminal(self):
        """update_status can flip is_terminal to True."""
        updated = update_status(status=self.status, is_terminal=True)
        self.assertTrue(updated.is_terminal)

    def test_omitted_fields_unchanged(self):
        """Only provided (non-None) fields are changed; omitted ones stay unchanged."""
        update_status(status=self.status, name="only_name_changed")
        self.status.refresh_from_db()
        self.assertEqual(self.status.name, "only_name_changed")
        self.assertEqual(self.status.color, "#000000")
        self.assertFalse(self.status.is_terminal)


class DeleteStatusServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="statdeluser", email="statdel@example.com", name="Del", password="pass"
        )
        self.category = Category.objects.create(name="statdel_cat", icon="", color="")

    def test_deletes_unused_status_successfully(self):
        """delete_status removes a status that is not referenced by any feature request."""
        s = Status.objects.create(
            name="deletable_svc", color="#000", is_terminal=False, sort_order=50
        )
        delete_status(status=s)
        self.assertFalse(Status.objects.filter(pk=s.pk).exists())

    def test_raises_validation_error_when_status_in_use(self):
        """delete_status raises ValidationError when a FeatureRequest references the status."""
        s = Status.objects.create(name="inuse_svc", color="#000", is_terminal=False, sort_order=60)
        FeatureRequest.objects.create(
            title="Ref Feature",
            description="desc",
            rate=3,
            author=self.user,
            category=self.category,
            status=s,
        )
        with self.assertRaises(ValidationError):
            delete_status(status=s)
