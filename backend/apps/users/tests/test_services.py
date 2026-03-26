"""
Service tests for the users app.

Tests verify:
- register_user creates user with correct fields
- email normalization
- password hashing
- duplicate email rejection
"""

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.users.services import register_user


class RegisterUserServiceTest(TestCase):
    def test_creates_user_with_correct_fields(self):
        """register_user creates a User with the supplied fields."""
        user = register_user(
            username="newuser",
            email="new@example.com",
            name="New User",
            password="securepass123",
        )
        self.assertIsNotNone(user.pk)
        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.email, "new@example.com")
        self.assertEqual(user.name, "New User")

    def test_email_normalized_to_lowercase(self):
        """register_user normalizes the email to lowercase before saving."""
        user = register_user(
            username="caseuser",
            email="UPPER@EXAMPLE.COM",
            name="Case User",
            password="securepass123",
        )
        self.assertEqual(user.email, "upper@example.com")

    def test_password_is_hashed_not_plaintext(self):
        """Password stored in the database must not be the plaintext value."""
        user = register_user(
            username="hashuser",
            email="hash@example.com",
            name="Hash User",
            password="plaintextpass",
        )
        self.assertNotEqual(user.password, "plaintextpass")
        self.assertTrue(user.check_password("plaintextpass"))

    def test_duplicate_email_raises_validation_error(self):
        """Attempting to register with a duplicate email raises ValidationError."""
        register_user(
            username="first",
            email="dup@example.com",
            name="First",
            password="pass123",
        )
        with self.assertRaises(ValidationError):
            register_user(
                username="second",
                email="dup@example.com",
                name="Second",
                password="pass123",
            )

    def test_duplicate_email_check_is_case_insensitive(self):
        """Duplicate email check treats UPPER@example.com and upper@example.com as the same."""
        register_user(
            username="first",
            email="casedupe@example.com",
            name="First",
            password="pass123",
        )
        with self.assertRaises(ValidationError):
            register_user(
                username="second",
                email="CASEDUPE@EXAMPLE.COM",
                name="Second",
                password="pass123",
            )
