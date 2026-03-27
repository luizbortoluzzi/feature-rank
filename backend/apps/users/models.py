from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.

    Design notes:
    - email is the primary human identifier (username remains for auth compatibility)
    - is_admin controls access to admin-only API operations (status management,
      reference data mutations, moderation actions)
    - name is a display-friendly full name field, separate from username
    - Hard deletion via API is prohibited; use is_active=False for deactivation

    The backend enforces that author assignment always derives from the authenticated
    user context. Clients must never supply author_id in create or update requests.
    """

    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=254, unique=True)
    is_admin = models.BooleanField(default=False)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.email or self.username

    def save(self, *args, **kwargs):
        # Normalize email to lowercase for case-insensitive uniqueness
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)
