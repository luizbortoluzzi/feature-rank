"""
Management command: seed_demo_data

Seeds a large, realistic demo dataset for portfolio demonstration:
- 20 users with realistic names and pravatar.cc avatar URLs
- 60 feature requests spread across categories, statuses, and authors
- Realistic vote distribution (popular features get more votes)
- Backdated created_at timestamps spread over the last 12 months

Depends on seed_reference_data having been run first.
Idempotent — safe to run multiple times.

Usage:
    python manage.py seed_demo_data
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest, Vote
from apps.statuses.models import Status

User = get_user_model()

DEMO_USERS = [
    {
        "name": "Alice Johnson",
        "email": "alice.johnson@demo.com",
        "username": "alice_johnson",
        "avatar_url": "https://i.pravatar.cc/150?img=1",
    },
    {
        "name": "Bob Martinez",
        "email": "bob.martinez@demo.com",
        "username": "bob_martinez",
        "avatar_url": "https://i.pravatar.cc/150?img=3",
    },
    {
        "name": "Carol Williams",
        "email": "carol.williams@demo.com",
        "username": "carol_williams",
        "avatar_url": "https://i.pravatar.cc/150?img=5",
    },
    {
        "name": "David Chen",
        "email": "david.chen@demo.com",
        "username": "david_chen",
        "avatar_url": "https://i.pravatar.cc/150?img=7",
    },
    {
        "name": "Emma Thompson",
        "email": "emma.thompson@demo.com",
        "username": "emma_thompson",
        "avatar_url": "https://i.pravatar.cc/150?img=9",
    },
    {
        "name": "Frank Rivera",
        "email": "frank.rivera@demo.com",
        "username": "frank_rivera",
        "avatar_url": "https://i.pravatar.cc/150?img=11",
    },
    {
        "name": "Grace Kim",
        "email": "grace.kim@demo.com",
        "username": "grace_kim",
        "avatar_url": "https://i.pravatar.cc/150?img=13",
    },
    {
        "name": "Henry Patel",
        "email": "henry.patel@demo.com",
        "username": "henry_patel",
        "avatar_url": "https://i.pravatar.cc/150?img=15",
    },
    {
        "name": "Isabel Santos",
        "email": "isabel.santos@demo.com",
        "username": "isabel_santos",
        "avatar_url": "https://i.pravatar.cc/150?img=16",
    },
    {
        "name": "James Wilson",
        "email": "james.wilson@demo.com",
        "username": "james_wilson",
        "avatar_url": "https://i.pravatar.cc/150?img=18",
    },
    {
        "name": "Karen Lee",
        "email": "karen.lee@demo.com",
        "username": "karen_lee",
        "avatar_url": "https://i.pravatar.cc/150?img=20",
    },
    {
        "name": "Lucas Andrade",
        "email": "lucas.andrade@demo.com",
        "username": "lucas_andrade",
        "avatar_url": "https://i.pravatar.cc/150?img=22",
    },
    {
        "name": "Mia Nguyen",
        "email": "mia.nguyen@demo.com",
        "username": "mia_nguyen",
        "avatar_url": "https://i.pravatar.cc/150?img=24",
    },
    {
        "name": "Nathan Brooks",
        "email": "nathan.brooks@demo.com",
        "username": "nathan_brooks",
        "avatar_url": "https://i.pravatar.cc/150?img=26",
    },
    {
        "name": "Olivia Zhang",
        "email": "olivia.zhang@demo.com",
        "username": "olivia_zhang",
        "avatar_url": "https://i.pravatar.cc/150?img=28",
    },
    {
        "name": "Paul Fernandez",
        "email": "paul.fernandez@demo.com",
        "username": "paul_fernandez",
        "avatar_url": "https://i.pravatar.cc/150?img=30",
    },
    {
        "name": "Quinn Murphy",
        "email": "quinn.murphy@demo.com",
        "username": "quinn_murphy",
        "avatar_url": "https://i.pravatar.cc/150?img=32",
    },
    {
        "name": "Rachel Adams",
        "email": "rachel.adams@demo.com",
        "username": "rachel_adams",
        "avatar_url": "https://i.pravatar.cc/150?img=44",
    },
    {
        "name": "Samuel Torres",
        "email": "samuel.torres@demo.com",
        "username": "samuel_torres",
        "avatar_url": "https://i.pravatar.cc/150?img=46",
    },
    {
        "name": "Tina Yamamoto",
        "email": "tina.yamamoto@demo.com",
        "username": "tina_yamamoto",
        "avatar_url": "https://i.pravatar.cc/150?img=48",
    },
]

DEMO_FEATURES = [
    # UI
    {
        "title": "Dark Mode Support",
        "description": "Add a system-level dark theme that automatically switches based on OS preferences. This would improve user experience during night-time usage and reduce eye strain. The implementation should follow the system prefers-color-scheme media query and also allow manual override via user settings.",
        "rate": 5,
        "category": "UI",
        "status": "Planned",
        "author_idx": 0,
        "voter_indices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "days_ago": 180,
    },
    {
        "title": "Customisable Dashboard Widgets",
        "description": "Allow users to rearrange, resize, and pin widgets on their personal dashboard. Each widget should be independently configurable with settings persisted per user. Drag-and-drop reordering with responsive grid layout is the preferred approach.",
        "rate": 4,
        "category": "UI",
        "status": "Under Review",
        "author_idx": 2,
        "voter_indices": [0, 3, 5, 7, 9, 11, 13, 15],
        "days_ago": 150,
    },
    {
        "title": "Inline Editing for Feature Titles",
        "description": "Let authors edit the title of a feature request directly on the detail page without navigating to the full edit form. A double-click or pencil icon should activate the editable field with auto-save on blur.",
        "rate": 3,
        "category": "UI",
        "status": "Open",
        "author_idx": 4,
        "voter_indices": [1, 6, 11],
        "days_ago": 60,
    },
    {
        "title": "Rich Text Description Editor",
        "description": "Replace the plain textarea with a rich text editor (markdown or WYSIWYG) so users can format their descriptions with headings, bullet lists, bold/italic text, and code blocks. Output should be stored as markdown for portability.",
        "rate": 4,
        "category": "UI",
        "status": "Open",
        "author_idx": 6,
        "voter_indices": [0, 2, 4, 8, 12, 14, 16, 18],
        "days_ago": 90,
    },
    {
        "title": "Bulk Export to CSV",
        "description": "Allow admins to export the full feature request list with vote counts, status, and author details to a CSV file. This supports offline analysis and stakeholder reporting without needing direct database access.",
        "rate": 3,
        "category": "UI",
        "status": "Under Review",
        "author_idx": 1,
        "voter_indices": [2, 7, 10, 15, 19],
        "days_ago": 120,
    },
    {
        "title": "Improved Onboarding Flow",
        "description": "Add a guided step-by-step onboarding modal for first-time users that explains how to submit a feature request, how voting works, and how to follow status updates. Progress should be tracked and the flow skippable.",
        "rate": 3,
        "category": "UI",
        "status": "Open",
        "author_idx": 8,
        "voter_indices": [3, 9],
        "days_ago": 45,
    },
    {
        "title": "Keyboard Shortcut Navigation",
        "description": "Add a keyboard shortcut cheat sheet and implement global shortcuts: 'N' for new request, 'V' to vote on focused item, '/' to focus search, and arrow keys to navigate the feature list. Show a help overlay on '?' key press.",
        "rate": 2,
        "category": "UI",
        "status": "Open",
        "author_idx": 10,
        "voter_indices": [],
        "days_ago": 30,
    },
    {
        "title": "Responsive Mobile Layout",
        "description": "Ensure all pages render correctly on mobile devices. The feature list should switch to a card-based stacked layout on small screens, the sidebar should collapse into a drawer, and the vote button should be accessible via a floating action button.",
        "rate": 5,
        "category": "UI",
        "status": "Planned",
        "author_idx": 12,
        "voter_indices": [0, 1, 2, 3, 4, 5, 6, 7, 14, 15],
        "days_ago": 200,
    },
    {
        "title": "Announcement Banner Component",
        "description": "Add a dismissable announcement banner at the top of the app that admins can configure with a message and optional call-to-action link. Useful for communicating planned downtime, new features, or important updates.",
        "rate": 2,
        "category": "UI",
        "status": "Open",
        "author_idx": 14,
        "voter_indices": [5, 11],
        "days_ago": 20,
    },
    {
        "title": "Avatar Upload for User Profiles",
        "description": "Allow users to upload a custom profile picture. Images should be resized to 200x200px on the server, stored in object storage, and served via CDN. Fall back to initials-based avatar if none uploaded.",
        "rate": 3,
        "category": "UI",
        "status": "Open",
        "author_idx": 16,
        "voter_indices": [1, 4, 7, 13, 17],
        "days_ago": 75,
    },
    # Performance
    {
        "title": "Paginated API with Cursor-Based Pagination",
        "description": "Replace the current offset-based pagination with cursor-based pagination for all list endpoints. This improves performance on large datasets by avoiding COUNT queries and ensures consistency when new items are inserted between page loads.",
        "rate": 4,
        "category": "Performance",
        "status": "Under Review",
        "author_idx": 3,
        "voter_indices": [0, 5, 8, 11, 15, 18],
        "days_ago": 100,
    },
    {
        "title": "Query Result Caching with Redis",
        "description": "Introduce a Redis caching layer for the feature list endpoint. Cache the ranked list for 60 seconds and invalidate on vote or status change. This reduces database load during traffic spikes while keeping results acceptably fresh.",
        "rate": 4,
        "category": "Performance",
        "status": "Planned",
        "author_idx": 5,
        "voter_indices": [2, 6, 9, 12, 16, 19],
        "days_ago": 140,
    },
    {
        "title": "Lazy Loading for Long Feature Lists",
        "description": "Implement infinite scroll or on-demand lazy loading for the feature list instead of paginated navigation. Prefetch the next page in the background to create a seamless browsing experience without full page reloads.",
        "rate": 3,
        "category": "Performance",
        "status": "Open",
        "author_idx": 7,
        "voter_indices": [0, 3, 10, 14],
        "days_ago": 55,
    },
    {
        "title": "Image Optimisation Pipeline",
        "description": "Add automatic image compression and WebP conversion for all user-uploaded assets. Implement responsive image srcsets and lazy loading attributes. Expected to reduce average page weight by 40-60%.",
        "rate": 3,
        "category": "Performance",
        "status": "Open",
        "author_idx": 9,
        "voter_indices": [1, 8],
        "days_ago": 25,
    },
    {
        "title": "Database Index Audit and Optimisation",
        "description": "Review all ORM queries using slow query logs and EXPLAIN ANALYSE. Add composite indexes for common filter/sort patterns (category + status + vote_count). Remove unused indexes. Target: reduce p99 list query from 120ms to under 20ms.",
        "rate": 5,
        "category": "Performance",
        "status": "Completed",
        "author_idx": 11,
        "voter_indices": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 19],
        "days_ago": 280,
    },
    {
        "title": "Frontend Bundle Splitting",
        "description": "Implement route-based code splitting so each page only loads its required JavaScript bundle on navigation. Use dynamic imports and React.lazy. This should reduce the initial bundle size and improve Time to Interactive on first load.",
        "rate": 4,
        "category": "Performance",
        "status": "Planned",
        "author_idx": 13,
        "voter_indices": [1, 3, 7, 11, 15, 17, 19],
        "days_ago": 160,
    },
    # API
    {
        "title": "Public API v2 with GraphQL",
        "description": "Complete rewrite of the public API with a GraphQL layer alongside the existing REST interface. Support subscription queries for real-time vote updates. Provide a playground and auto-generated documentation via introspection.",
        "rate": 4,
        "category": "API",
        "status": "Under Review",
        "author_idx": 15,
        "voter_indices": [0, 2, 5, 8, 11, 13, 16],
        "days_ago": 130,
    },
    {
        "title": "Webhook Notifications on Status Change",
        "description": "Send POST webhook payloads to user-configured URLs when a feature request changes status or reaches a vote threshold. Include HMAC signature for payload verification. Support retry with exponential backoff on failure.",
        "rate": 3,
        "category": "API",
        "status": "Open",
        "author_idx": 17,
        "voter_indices": [3, 9, 14],
        "days_ago": 40,
    },
    {
        "title": "API Rate Limiting with Tiered Quotas",
        "description": "Implement per-user and per-IP rate limiting on all public endpoints. Define tiers: anonymous (30/min), authenticated (100/min), admin (500/min). Return standard Retry-After headers. Document quotas in the API reference.",
        "rate": 4,
        "category": "API",
        "status": "Planned",
        "author_idx": 19,
        "voter_indices": [1, 4, 7, 10, 12, 15, 18],
        "days_ago": 170,
    },
    {
        "title": "SDK Generation from OpenAPI Spec",
        "description": "Auto-generate TypeScript and Python client SDKs from the OpenAPI 3.0 schema using openapi-generator. Publish to npm and PyPI on each release. Reduces integration effort for external developers building on the platform.",
        "rate": 3,
        "category": "API",
        "status": "Open",
        "author_idx": 0,
        "voter_indices": [5, 9, 13, 17],
        "days_ago": 65,
    },
    {
        "title": "Idempotency Keys for Mutations",
        "description": "Support Idempotency-Key request headers on POST endpoints (create feature, cast vote). Store the result for 24 hours and return it on duplicate submissions. Prevents double-submission issues in unreliable network conditions.",
        "rate": 3,
        "category": "API",
        "status": "Open",
        "author_idx": 2,
        "voter_indices": [6, 11],
        "days_ago": 35,
    },
    {
        "title": "Versioned API Endpoints",
        "description": "Introduce explicit versioning via URL prefix (/api/v1/, /api/v2/) with a documented deprecation policy. Support the two most recent major versions simultaneously. Version sunset should be announced 90 days in advance.",
        "rate": 4,
        "category": "API",
        "status": "Planned",
        "author_idx": 4,
        "voter_indices": [0, 3, 8, 12, 16, 19],
        "days_ago": 210,
    },
    # Security
    {
        "title": "Two-Factor Authentication (TOTP)",
        "description": "Implement TOTP-based 2FA for all user accounts. On login, prompt for a 6-digit OTP from an authenticator app. Provide recovery codes during setup. Admin accounts should have 2FA enforced by policy. Use the `pyotp` library server-side.",
        "rate": 5,
        "category": "Security",
        "status": "Planned",
        "author_idx": 6,
        "voter_indices": [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13],
        "days_ago": 220,
    },
    {
        "title": "Role-Based Access Control (RBAC)",
        "description": "Introduce granular permission roles beyond the current admin/user binary — moderator, reviewer, and read-only viewer. Permissions should be composable and assignable per user. Needed for organisations managing multiple product areas.",
        "rate": 5,
        "category": "Security",
        "status": "Planned",
        "author_idx": 8,
        "voter_indices": [1, 3, 5, 7, 9, 11, 14, 17, 19],
        "days_ago": 190,
    },
    {
        "title": "Audit Log for Admin Actions",
        "description": "Record all admin actions (status changes, user deactivation, reference data mutations) in a tamper-evident audit log. Each entry should capture actor, action, target, timestamp, and IP address. Expose the log via a read-only admin API endpoint.",
        "rate": 4,
        "category": "Security",
        "status": "Under Review",
        "author_idx": 10,
        "voter_indices": [2, 5, 9, 13, 16],
        "days_ago": 110,
    },
    {
        "title": "Content Security Policy Headers",
        "description": "Implement strict Content-Security-Policy headers on all responses to prevent XSS injection. Configure allowed script, style, and image sources. Set up a CSP report-only mode first to identify violations before enforcement.",
        "rate": 4,
        "category": "Security",
        "status": "Completed",
        "author_idx": 12,
        "voter_indices": [0, 4, 8, 11, 15, 17],
        "days_ago": 260,
    },
    {
        "title": "Session Revocation on Password Change",
        "description": "Invalidate all active JWT refresh tokens when a user changes their password. Track token issuance time against password change time and reject tokens issued before the change. This closes the session-fixation vulnerability window.",
        "rate": 5,
        "category": "Security",
        "status": "Planned",
        "author_idx": 14,
        "voter_indices": [1, 3, 6, 9, 12, 15, 18, 19],
        "days_ago": 145,
    },
    {
        "title": "Dependency Vulnerability Scanning in CI",
        "description": "Add a step to the CI pipeline that runs `pip-audit` and `npm audit` on each pull request. Fail the build on high-severity vulnerabilities. Configure Dependabot alerts for weekly automated PRs on non-critical updates.",
        "rate": 3,
        "category": "Security",
        "status": "Completed",
        "author_idx": 16,
        "voter_indices": [2, 7, 10, 13],
        "days_ago": 300,
    },
    # Developer Experience
    {
        "title": "Jira Integration Sync",
        "description": "Allow linking feature requests to Jira epics or stories via a project key and issue ID. Automatically sync status changes bidirectionally using Jira webhooks. Engineering teams can then drive status from Jira while product teams use the feature board.",
        "rate": 4,
        "category": "Developer Experience",
        "status": "Under Review",
        "author_idx": 18,
        "voter_indices": [0, 3, 6, 9, 12, 15, 18],
        "days_ago": 135,
    },
    {
        "title": "Local Development Docker Compose Setup",
        "description": "Provide a fully self-contained docker-compose.yml for local development that starts the backend, frontend, database, and Redis with a single `docker compose up`. Include a Makefile target and a first-run setup script.",
        "rate": 4,
        "category": "Developer Experience",
        "status": "Completed",
        "author_idx": 1,
        "voter_indices": [2, 4, 6, 8, 10, 12, 14, 16, 18, 19],
        "days_ago": 310,
    },
    {
        "title": "Storybook for UI Component Library",
        "description": "Set up Storybook to document all shared React components in isolation. Each component should have at least one story per variant. Deploy Storybook to a static hosting service on main branch push for design reviews.",
        "rate": 3,
        "category": "Developer Experience",
        "status": "Open",
        "author_idx": 3,
        "voter_indices": [1, 5, 9, 13],
        "days_ago": 70,
    },
    {
        "title": "Automated E2E Test Suite with Playwright",
        "description": "Add end-to-end tests using Playwright covering the critical user flows: login, submit feature request, vote, and admin status change. Run tests in CI against a seeded test database. Keep the suite under 3 minutes total execution time.",
        "rate": 4,
        "category": "Developer Experience",
        "status": "Planned",
        "author_idx": 5,
        "voter_indices": [0, 2, 4, 8, 11, 14, 17],
        "days_ago": 155,
    },
    {
        "title": "Pre-commit Hooks for Code Quality",
        "description": "Configure pre-commit hooks that run Black, Ruff, and ESLint before each commit. Ensure the hooks are included in the `make install` step so all contributors get them automatically. Fail fast to prevent CI failures from trivial formatting issues.",
        "rate": 3,
        "category": "Developer Experience",
        "status": "Completed",
        "author_idx": 7,
        "voter_indices": [1, 6, 11, 16],
        "days_ago": 320,
    },
    {
        "title": "OpenAPI Documentation Portal",
        "description": "Expose a hosted Swagger/Redoc portal from the `/api/docs/` endpoint using drf-spectacular. Documentation should be auto-generated from code and include example requests/responses for all endpoints. Keep it publicly accessible without auth.",
        "rate": 4,
        "category": "Developer Experience",
        "status": "Planned",
        "author_idx": 9,
        "voter_indices": [0, 3, 7, 12, 15, 18],
        "days_ago": 180,
    },
    {
        "title": "Environment Variable Validation on Startup",
        "description": "Add a startup check that validates all required environment variables are present and correctly typed before the server begins accepting requests. Fail fast with a descriptive error listing missing variables instead of crashing mid-request.",
        "rate": 3,
        "category": "Developer Experience",
        "status": "Open",
        "author_idx": 11,
        "voter_indices": [4, 9],
        "days_ago": 22,
    },
    {
        "title": "Changelog Generation from Conventional Commits",
        "description": "Automate CHANGELOG.md generation using `conventional-changelog` based on commit messages following the Conventional Commits spec. Integrate into the release workflow so each tag automatically produces release notes.",
        "rate": 2,
        "category": "Developer Experience",
        "status": "Open",
        "author_idx": 13,
        "voter_indices": [7],
        "days_ago": 15,
    },
    {
        "title": "Hot Module Replacement for Backend Templates",
        "description": "Configure Vite's HMR to also watch backend API responses via a proxy setup. Changes to backend serializers should trigger a soft refresh of the frontend without full page reload during development.",
        "rate": 2,
        "category": "Developer Experience",
        "status": "Open",
        "author_idx": 15,
        "voter_indices": [],
        "days_ago": 10,
    },
    # Other
    {
        "title": "Email Notification on Status Change",
        "description": "Send an email to the feature request author when its status is updated by an admin. Include the new status, a link to the feature, and the admin's comment if provided. Use async task queue (Celery or Django-Q) to avoid blocking the request.",
        "rate": 4,
        "category": "Other",
        "status": "Under Review",
        "author_idx": 17,
        "voter_indices": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
        "days_ago": 125,
    },
    {
        "title": "Feature Request Commenting System",
        "description": "Allow authenticated users to post comments on feature requests. Support threaded replies up to one level deep. Admins should be able to pin a comment and moderate (hide/delete) any comment. Include a comment count on the feature card.",
        "rate": 5,
        "category": "Other",
        "status": "Planned",
        "author_idx": 19,
        "voter_indices": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
        "days_ago": 195,
    },
    {
        "title": "Voting Analytics for Admins",
        "description": "Add an analytics panel visible only to admins showing vote velocity over time, most active voters, and category-level engagement breakdown. Display as simple time-series charts with a 30/60/90-day rolling window selector.",
        "rate": 4,
        "category": "Other",
        "status": "Open",
        "author_idx": 0,
        "voter_indices": [2, 6, 10, 14, 18],
        "days_ago": 80,
    },
    {
        "title": "Multi-language Internationalisation (i18n)",
        "description": "Add i18n support for English, Spanish, French, and Portuguese. Use Django's translation framework on the backend and react-i18next on the frontend. Expose a language preference setting in the user profile.",
        "rate": 3,
        "category": "Other",
        "status": "Open",
        "author_idx": 2,
        "voter_indices": [5, 9, 13],
        "days_ago": 50,
    },
    {
        "title": "Duplicate Detection for Feature Requests",
        "description": "Before a new feature request is submitted, scan existing titles using fuzzy string matching and show a list of similar requests to the author. This reduces duplication and helps users find and vote on existing requests instead.",
        "rate": 4,
        "category": "Other",
        "status": "Planned",
        "author_idx": 4,
        "voter_indices": [1, 3, 7, 11, 15, 19],
        "days_ago": 165,
    },
    {
        "title": "Scheduled Status Review Reminders",
        "description": "Send weekly digest emails to admins listing all feature requests that have been in 'under review' status for more than 30 days. Helps prevent requests from stalling without a decision.",
        "rate": 3,
        "category": "Other",
        "status": "Open",
        "author_idx": 6,
        "voter_indices": [8, 16],
        "days_ago": 28,
    },
    {
        "title": "Public Roadmap View",
        "description": "Create a public-facing roadmap page that groups planned and in-progress feature requests by quarter. Accessible without login. Admins can assign features to roadmap quarters and toggle visibility of individual items.",
        "rate": 5,
        "category": "Other",
        "status": "Planned",
        "author_idx": 8,
        "voter_indices": [0, 1, 2, 3, 5, 7, 9, 11, 13, 15, 17],
        "days_ago": 240,
    },
    {
        "title": "Merge Duplicate Feature Requests",
        "description": "Allow admins to merge two feature requests: votes transfer to the surviving record, the merged request is marked as closed with a reference link. Authors of the merged request receive a notification.",
        "rate": 3,
        "category": "Other",
        "status": "Open",
        "author_idx": 10,
        "voter_indices": [4, 12],
        "days_ago": 42,
    },
    {
        "title": "Feature Request Templates",
        "description": "Allow admins to define submission templates per category — for example, a Security template that pre-fills sections for Threat, Impact, and Proposed Fix. Authors select a template when creating a new request.",
        "rate": 3,
        "category": "Other",
        "status": "Open",
        "author_idx": 12,
        "voter_indices": [6, 10],
        "days_ago": 33,
    },
    {
        "title": "Embed Widget for External Sites",
        "description": "Provide a JavaScript snippet that product teams can embed on external documentation or marketing sites to display a live feature upvote widget. The widget shows the top 5 open requests and allows voting without leaving the page.",
        "rate": 2,
        "category": "Other",
        "status": "Open",
        "author_idx": 14,
        "voter_indices": [3],
        "days_ago": 18,
    },
    # Additional spread across categories
    {
        "title": "Colour Contrast Accessibility Audit",
        "description": "Run a full WCAG 2.1 AA compliance audit on all UI components. Fix any contrast violations in the colour palette and status/category badges. Add automated accessibility tests to the CI pipeline using axe-core.",
        "rate": 4,
        "category": "UI",
        "status": "Completed",
        "author_idx": 16,
        "voter_indices": [0, 4, 8, 12, 16],
        "days_ago": 270,
    },
    {
        "title": "Search with Full-Text Indexing",
        "description": "Replace the current ILIKE search with full-text search using PostgreSQL's tsvector. Index title and description fields. Support stemming and ranked results by relevance. Add a search analytics endpoint to track common search terms.",
        "rate": 4,
        "category": "Performance",
        "status": "Under Review",
        "author_idx": 18,
        "voter_indices": [1, 5, 9, 13, 17],
        "days_ago": 95,
    },
    {
        "title": "API Playground in Developer Portal",
        "description": "Build an interactive API playground accessible at /api/playground where developers can construct requests, view live responses, and save examples. Authentication is supported via pasting a Bearer token.",
        "rate": 3,
        "category": "API",
        "status": "Open",
        "author_idx": 1,
        "voter_indices": [3, 7, 11],
        "days_ago": 52,
    },
    {
        "title": "IP Allow-List for Admin Panel",
        "description": "Restrict access to admin-only endpoints to a configurable list of trusted IP ranges. Configure via environment variable (ADMIN_ALLOWED_IPS). Requests from outside the list receive 403. Essential for SOC2 compliance.",
        "rate": 5,
        "category": "Security",
        "status": "Planned",
        "author_idx": 3,
        "voter_indices": [0, 2, 6, 10, 14, 18],
        "days_ago": 175,
    },
    {
        "title": "CI/CD Pipeline for Automated Deployments",
        "description": "Set up a GitHub Actions workflow that builds, tests, and deploys to staging on every merge to main, and to production on tagged releases. Include smoke tests post-deployment and automatic rollback on failure.",
        "rate": 4,
        "category": "Developer Experience",
        "status": "Completed",
        "author_idx": 5,
        "voter_indices": [1, 3, 7, 11, 15, 17, 19],
        "days_ago": 290,
    },
    {
        "title": "Social Login (OAuth2)",
        "description": "Add Sign in with Google and GitHub as authentication methods alongside the existing username/password flow. Link social accounts to existing user profiles by matching email. Use the `social-auth-app-django` library.",
        "rate": 4,
        "category": "Security",
        "status": "Planned",
        "author_idx": 7,
        "voter_indices": [0, 2, 4, 6, 8, 12, 16],
        "days_ago": 205,
    },
    {
        "title": "Feature Subscription / Follow",
        "description": "Allow users to subscribe to a feature request and receive notifications when its status changes or a new comment is added. Show a follower count on the feature detail page and a 'My Subscriptions' list in the user profile.",
        "rate": 4,
        "category": "Other",
        "status": "Open",
        "author_idx": 9,
        "voter_indices": [1, 5, 8, 13, 18],
        "days_ago": 58,
    },
    {
        "title": "Time-Boxed Voting Windows",
        "description": "Allow admins to open and close voting on specific feature requests or globally within a date range. Closed requests show vote totals as read-only. Useful for quarterly planning cycles where you want a snapshot vote.",
        "rate": 3,
        "category": "Other",
        "status": "Open",
        "author_idx": 11,
        "voter_indices": [4, 14],
        "days_ago": 38,
    },
    {
        "title": "Performance Budgets in CI",
        "description": "Integrate Lighthouse CI into the build pipeline to enforce performance budgets. Fail the build if the Largest Contentful Paint exceeds 2.5s or the Total Blocking Time exceeds 300ms on the feature list page.",
        "rate": 3,
        "category": "Performance",
        "status": "Open",
        "author_idx": 13,
        "voter_indices": [2, 9],
        "days_ago": 27,
    },
    {
        "title": "Request Tracing with OpenTelemetry",
        "description": "Instrument the Django backend with OpenTelemetry to emit distributed traces. Export to Jaeger or an OTLP-compatible collector. Trace each API request end-to-end including database queries, cache hits, and external service calls.",
        "rate": 3,
        "category": "Performance",
        "status": "Open",
        "author_idx": 15,
        "voter_indices": [6, 12, 18],
        "days_ago": 48,
    },
    {
        "title": "Multi-tenant Organisation Support",
        "description": "Allow the platform to host multiple isolated product teams within a single deployment. Each organisation has its own feature board, user pool, and settings. Tenant isolation enforced at the database query level via a shared schema with row-level filtering.",
        "rate": 4,
        "category": "API",
        "status": "Open",
        "author_idx": 17,
        "voter_indices": [0, 4, 8, 12, 16, 19],
        "days_ago": 115,
    },
    {
        "title": "Automated Accessibility Report on Deploy",
        "description": "Run axe-core accessibility scans as part of the post-deploy smoke test suite. Generate a HTML report and post a summary to the team Slack channel. Track accessibility score over time as a deployment quality metric.",
        "rate": 3,
        "category": "Developer Experience",
        "status": "Open",
        "author_idx": 19,
        "voter_indices": [3, 8],
        "days_ago": 32,
    },
    {
        "title": "GDPR Data Export and Deletion",
        "description": "Provide a user-facing flow to request a full data export (JSON archive of all their feature requests and votes) and a deletion request that purges their personal data within 30 days as required by GDPR Article 17.",
        "rate": 5,
        "category": "Security",
        "status": "Under Review",
        "author_idx": 0,
        "voter_indices": [2, 4, 6, 8, 10, 13, 16, 18],
        "days_ago": 105,
    },
]


class Command(BaseCommand):
    help = "Seed a large demo dataset: 20 users, 60 feature requests, realistic votes. Idempotent."

    def handle(self, *args, **options):
        categories = {c.name: c for c in Category.objects.all()}
        statuses = {s.name: s for s in Status.objects.all()}

        if not categories or not statuses:
            raise CommandError(
                "Reference data not found. Run `python manage.py seed_reference_data` first."
            )

        # --- Admin user ---
        admin, admin_created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "name": "Admin",
                "is_admin": True,
            },
        )
        if admin_created:
            admin.set_password("admin1234")
            admin.save(update_fields=["password"])
        self.stdout.write(
            f"Admin user: {'created' if admin_created else 'already existed'} (username=admin, password=admin1234)."
        )

        # --- Users ---
        users_created = 0
        user_objects = []
        for data in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "name": data["name"],
                    "avatar_url": data["avatar_url"],
                    "is_admin": False,
                },
            )
            if created:
                user.set_password("demo1234")
                user.save(update_fields=["password"])
                users_created += 1
            user_objects.append(user)
        self.stdout.write(
            f"Users: {users_created} created, {len(DEMO_USERS) - users_created} already existed."
        )

        # --- Feature Requests ---
        now = timezone.now()
        features_created = 0
        for data in DEMO_FEATURES:
            category = categories.get(data["category"])
            status = statuses.get(data["status"])
            author = user_objects[data["author_idx"]]

            if not category or not status:
                self.stdout.write(
                    self.style.WARNING(f"Skipping '{data['title']}': missing category or status.")
                )
                continue

            feature, created = FeatureRequest.objects.get_or_create(
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "rate": data["rate"],
                    "author": author,
                    "category": category,
                    "status": status,
                },
            )

            if created:
                features_created += 1
                # Backdate created_at — auto_now_add prevents setting it on create
                created_at = now - timedelta(days=data["days_ago"])
                FeatureRequest.objects.filter(pk=feature.pk).update(
                    created_at=created_at,
                    updated_at=created_at + timedelta(hours=random.randint(1, 72)),
                )

        self.stdout.write(
            f"Features: {features_created} created, {len(DEMO_FEATURES) - features_created} already existed."
        )

        # --- Votes ---
        votes_created = 0
        for data in DEMO_FEATURES:
            try:
                feature = FeatureRequest.objects.get(title=data["title"])
            except FeatureRequest.DoesNotExist:
                continue

            for voter_idx in data["voter_indices"]:
                voter = user_objects[voter_idx]
                _, created = Vote.objects.get_or_create(
                    user=voter,
                    feature_request=feature,
                )
                if created:
                    votes_created += 1

        self.stdout.write(f"Votes: {votes_created} created.")
        self.stdout.write(self.style.SUCCESS("Demo data seeding complete."))
