"""
Management command: seed_features

Seeds sample feature requests and votes for local development.
Depends on seed_reference_data having been run first (categories, statuses, users).

This command is idempotent — safe to run multiple times. It skips feature
requests that already exist by title and skips votes that already exist.

Usage:
    python manage.py seed_features
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.statuses.models import Status

User = get_user_model()

FEATURES = [
    {
        "title": "Dark Mode Support",
        "description": (
            "Add a system-level dark theme that automatically switches based on OS "
            "preferences. This would improve user experience during night-time usage "
            "and reduce eye strain."
        ),
        "rate": 5,
        "category": "UI",
        "status": "planned",
        "author": "admin",
        "votes": ["admin", "user"],
    },
    {
        "title": "Public API v2",
        "description": (
            "Complete rewrite of our public API with GraphQL support and better rate "
            "limiting. This will enable developers to build more powerful integrations."
        ),
        "rate": 4,
        "category": "API",
        "status": "under review",
        "author": "user",
        "votes": ["admin"],
    },
    {
        "title": "Jira Integration Sync",
        "description": (
            "Allow linking feature requests directly to Jira epics or stories so "
            "engineering status can sync automatically. This would streamline workflow "
            "between product and engineering teams."
        ),
        "rate": 4,
        "category": "Developer Experience",
        "status": "under review",
        "author": "admin",
        "votes": [],
    },
    {
        "title": "Two-Factor Authentication (2FA)",
        "description": (
            "Implement TOTP and SMS based 2FA for all user accounts to improve security. "
            "Essential for enterprise customers and compliance requirements."
        ),
        "rate": 5,
        "category": "Security",
        "status": "planned",
        "author": "user",
        "votes": ["admin", "user"],
    },
    {
        "title": "Bulk Export to CSV",
        "description": (
            "Allow admins to export all feature requests and vote data to CSV for "
            "offline analysis and reporting."
        ),
        "rate": 3,
        "category": "UI",
        "status": "under review",
        "author": "admin",
        "votes": ["user"],
    },
    {
        "title": "Keyboard Shortcut Navigation",
        "description": (
            "Add keyboard shortcuts for common actions such as voting, submitting a "
            "request, and navigating between features. Power users would benefit greatly "
            "from this."
        ),
        "rate": 2,
        "category": "UI",
        "status": "open",
        "author": "user",
        "votes": [],
    },
    {
        "title": "Performance Dashboard",
        "description": (
            "Build a real-time dashboard showing API response times, error rates, and "
            "database query performance. Helps the team catch regressions early."
        ),
        "rate": 4,
        "category": "Performance",
        "status": "open",
        "author": "admin",
        "votes": ["admin"],
    },
    {
        "title": "Role-Based Access Control",
        "description": (
            "Introduce granular permission roles beyond admin/user — such as "
            "moderator and viewer. Needed for larger teams managing multiple projects."
        ),
        "rate": 5,
        "category": "Security",
        "status": "planned",
        "author": "user",
        "votes": ["admin", "user"],
    },
    {
        "title": "Webhook Notifications",
        "description": (
            "Send webhook payloads to configured URLs when feature status changes or "
            "vote thresholds are reached. Enables third-party automation workflows."
        ),
        "rate": 3,
        "category": "API",
        "status": "open",
        "author": "admin",
        "votes": ["user"],
    },
    {
        "title": "Improved Onboarding Flow",
        "description": (
            "Add a guided onboarding walkthrough for new users explaining how to "
            "submit and vote on feature requests. Reduces time-to-first-action."
        ),
        "rate": 3,
        "category": "UI",
        "status": "open",
        "author": "user",
        "votes": [],
    },
]


class Command(BaseCommand):
    help = "Seed sample feature requests and votes. Idempotent."

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.get(username="admin")
            regular_user = User.objects.get(username="user")
        except User.DoesNotExist as e:
            raise CommandError(
                "Dev users not found. Run `python manage.py seed_reference_data` first."
            ) from e

        user_map = {"admin": admin_user, "user": regular_user}

        categories = {c.name: c for c in Category.objects.all()}
        statuses = {s.name: s for s in Status.objects.all()}

        features_created = 0
        votes_created = 0

        for data in FEATURES:
            category = categories.get(data["category"])
            status = statuses.get(data["status"])

            if not category:
                self.stdout.write(
                    self.style.WARNING(
                        f"Category '{data['category']}' not found — skipping '{data['title']}'."
                    )
                )
                continue

            if not status:
                self.stdout.write(
                    self.style.WARNING(
                        f"Status '{data['status']}' not found — skipping '{data['title']}'."
                    )
                )
                continue

            feature, created = FeatureRequest.objects.get_or_create(
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "rate": data["rate"],
                    "author": user_map[data["author"]],
                    "category": category,
                    "status": status,
                },
            )
            if created:
                features_created += 1

            for username in data["votes"]:
                voter = user_map[username]
                _, vote_created = Vote.objects.get_or_create(
                    user=voter,
                    feature_request=feature,
                )
                if vote_created:
                    votes_created += 1

        self.stdout.write(
            f"Features: {features_created} created, "
            f"{len(FEATURES) - features_created} already existed."
        )
        self.stdout.write(f"Votes: {votes_created} created.")
        self.stdout.write(self.style.SUCCESS("Feature seeding complete."))
