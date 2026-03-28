"""
Serializers for the users app.

Responsibilities:
- Input validation for user-facing writable fields
- Output representation for API responses
- Field exposure policy (never expose password hash, tokens, or internal flags
  to clients that should not see them)

Protected fields:
- is_admin must never be client-writable in non-admin flows.
- author_id must never appear in create/update payloads received from clients.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.services import register_user

User = get_user_model()


class UserRegistrationSerializer(serializers.Serializer):
    """
    Handles new user registration. Calls register_user service on valid input.
    password is write-only and must never appear in output representations.
    """

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_email(self, value: str) -> str:
        return value.lower()

    def create(self, validated_data: dict) -> User:
        return register_user(
            username=validated_data["username"],
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
        )


class UserMeSerializer(serializers.ModelSerializer):
    """
    Read-only representation of the current authenticated user.
    Used by the /api/users/me/ endpoint.
    """

    class Meta:
        model = User
        fields = ["id", "username", "name", "email", "is_admin", "date_joined", "avatar_url"]
        read_only_fields = fields
