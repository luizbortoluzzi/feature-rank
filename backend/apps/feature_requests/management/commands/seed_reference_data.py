"""
Management command: seed_reference_data

Seeds all controlled reference data required at startup:
- Roles (user, admin)
- Categories (UI, Performance, API, Security, Developer Experience, Other)
- Statuses (open, under review, planned, completed, rejected)
- Dev users (one regular user, one admin) — for local development only

This command is idempotent — safe to run multiple times. It uses get_or_create
for every record so running it again does not create duplicates.

Usage:
    python manage.py seed_reference_data

See docs/architecture/backend-architecture.md — Reference Data Strategy.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.categories.models import Category
from apps.roles.models import Role
from apps.statuses.models import Status

User = get_user_model()

# Dev-only users. Passwords are intentionally weak — for local use only.
USERS = [
    {
        "username": "admin",
        "email": "admin@example.com",
        "name": "Admin User",
        "password": "admin1234",
        "is_admin": True,
    },
    {
        "username": "user",
        "email": "user@example.com",
        "name": "Regular User",
        "password": "user1234",
        "is_admin": False,
    },
]

ROLES = [
    {"name": "user", "description": "Standard authenticated user"},
    {"name": "admin", "description": "Administrator with elevated privileges"},
]

CATEGORIES = [
    {"name": "UI", "icon": "palette", "color": "#3B82F6"},
    {"name": "Performance", "icon": "zap", "color": "#F59E0B"},
    {"name": "API", "icon": "code", "color": "#10B981"},
    {"name": "Security", "icon": "shield", "color": "#EF4444"},
    {"name": "Developer Experience", "icon": "terminal", "color": "#8B5CF6"},
    {"name": "Other", "icon": "dots-horizontal", "color": "#6B7280"},
]

STATUSES = [
    {"name": "open", "color": "#6B7280", "is_terminal": False, "sort_order": 0},
    {"name": "under review", "color": "#F59E0B", "is_terminal": False, "sort_order": 1},
    {"name": "planned", "color": "#3B82F6", "is_terminal": False, "sort_order": 2},
    {"name": "completed", "color": "#10B981", "is_terminal": True, "sort_order": 3},
    {"name": "rejected", "color": "#EF4444", "is_terminal": True, "sort_order": 4},
]


class Command(BaseCommand):
    help = "Seed reference data: roles, categories, statuses, dev users. Idempotent."

    def handle(self, *args, **options):
        roles_created = 0
        for data in ROLES:
            _, created = Role.objects.get_or_create(
                name=data["name"], defaults={"description": data["description"]}
            )
            if created:
                roles_created += 1
        self.stdout.write(
            f"Roles: {roles_created} created, {len(ROLES) - roles_created} already existed."
        )

        categories_created = 0
        for data in CATEGORIES:
            _, created = Category.objects.get_or_create(
                name=data["name"],
                defaults={"icon": data["icon"], "color": data["color"]},
            )
            if created:
                categories_created += 1
        self.stdout.write(
            f"Categories: {categories_created} created, {len(CATEGORIES) - categories_created} already existed."
        )

        statuses_created = 0
        for data in STATUSES:
            _, created = Status.objects.get_or_create(
                name=data["name"],
                defaults={
                    "color": data["color"],
                    "is_terminal": data["is_terminal"],
                    "sort_order": data["sort_order"],
                },
            )
            if created:
                statuses_created += 1
        self.stdout.write(
            f"Statuses: {statuses_created} created, {len(STATUSES) - statuses_created} already existed."
        )

        users_created = 0
        for data in USERS:
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "name": data["name"],
                    "is_admin": data["is_admin"],
                },
            )
            if created:
                user.set_password(data["password"])
                user.save(update_fields=["password"])
                users_created += 1
        self.stdout.write(
            f"Users: {users_created} created, {len(USERS) - users_created} already existed."
        )

        self.stdout.write(self.style.SUCCESS("Reference data seeding complete."))
