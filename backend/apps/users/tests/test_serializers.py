"""
Serializer tests for the users app.

Tests verify:
- UserRegistrationSerializer field validation
- UserMeSerializer field exposure
"""

from django.test import TestCase

from apps.users.models import User
from apps.users.serializers import UserMeSerializer, UserRegistrationSerializer


class UserRegistrationSerializerTest(TestCase):
    def _valid_data(self, **overrides):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "name": "Test User",
            "password": "strongpassword123",
        }
        data.update(overrides)
        return data

    def test_valid_data_is_valid(self):
        """Serializer with all valid fields passes validation."""
        s = UserRegistrationSerializer(data=self._valid_data())
        self.assertTrue(s.is_valid(), s.errors)

    def test_missing_username_raises_validation_error(self):
        """Missing username produces a validation error."""
        data = self._valid_data()
        del data["username"]
        s = UserRegistrationSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("username", s.errors)

    def test_missing_email_raises_validation_error(self):
        """Missing email produces a validation error."""
        data = self._valid_data()
        del data["email"]
        s = UserRegistrationSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("email", s.errors)

    def test_missing_password_raises_validation_error(self):
        """Missing password produces a validation error."""
        data = self._valid_data()
        del data["password"]
        s = UserRegistrationSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("password", s.errors)

    def test_missing_name_raises_validation_error(self):
        """Missing name produces a validation error."""
        data = self._valid_data()
        del data["name"]
        s = UserRegistrationSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("name", s.errors)

    def test_duplicate_email_raises_validation_error(self):
        """Email already in use raises a validation error on save."""
        User.objects.create_user(
            username="existing", email="test@example.com", password="pass", name="Existing"
        )
        s = UserRegistrationSerializer(data=self._valid_data(username="newuser"))
        self.assertTrue(s.is_valid(), s.errors)
        with self.assertRaises(Exception):
            s.save()

    def test_email_normalized_to_lowercase_on_validation(self):
        """Email is normalized to lowercase in validate_email."""
        s = UserRegistrationSerializer(data=self._valid_data(email="UPPER@EXAMPLE.COM"))
        self.assertTrue(s.is_valid(), s.errors)
        self.assertEqual(s.validated_data["email"], "upper@example.com")

    def test_password_is_write_only(self):
        """
        Password must not appear in the serializer's output representation.
        UserRegistrationSerializer is a write-only serializer — no to_representation,
        but the field is declared write_only=True so it won't be in output.
        """
        s = UserRegistrationSerializer(data=self._valid_data())
        self.assertTrue(s.is_valid(), s.errors)
        # password field is write_only, so it must not appear in validated data output
        self.assertNotIn("password", s.data)


class UserMeSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="meuser",
            email="me@example.com",
            name="Me User",
            password="pass",
            is_admin=False,
        )
        self.admin = User.objects.create_user(
            username="adminme",
            email="adminme@example.com",
            name="Admin Me",
            password="pass",
            is_admin=True,
        )

    def test_serializes_expected_fields(self):
        """Serializer output includes id, username, name, email, is_admin, date_joined."""
        data = UserMeSerializer(self.user).data
        for field in ["id", "username", "name", "email", "is_admin", "date_joined"]:
            self.assertIn(field, data)

    def test_password_absent_from_output(self):
        """Password is never present in the serializer output."""
        data = UserMeSerializer(self.user).data
        self.assertNotIn("password", data)

    def test_is_admin_false_for_regular_user(self):
        """Regular user's is_admin field is False."""
        data = UserMeSerializer(self.user).data
        self.assertFalse(data["is_admin"])

    def test_is_admin_true_for_admin_user(self):
        """Admin user's is_admin field is True."""
        data = UserMeSerializer(self.admin).data
        self.assertTrue(data["is_admin"])
