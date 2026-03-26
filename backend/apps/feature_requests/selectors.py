"""
Selectors for the feature_requests app (query layer — read-only).

Critical ordering rule:
The default feature list ordering is strictly:
    vote_count DESC -> created_at DESC -> id DESC
This is mandatory and non-negotiable. rate must NEVER appear in any ORDER BY
expression.

Efficient query composition:
- select_related: author, category, status (avoids N+1 for nested representations)
- annotate: vote_count using Count('votes', distinct=True)
- annotate: has_voted using Exists() subquery when user is authenticated

Design rules:
- Selectors are strictly read-only. They must never mutate state.
- vote_count is NEVER computed per-row inside serializers; it is annotated here.

See docs/architecture/backend-architecture.md — Selectors, Query Design Strategy.
See docs/domain/voting-rules.md — Ranking Rules.
"""

from django.db.models import BooleanField, Count, Exists, OuterRef, Value

from apps.feature_requests.models import FeatureRequest, Vote

# Valid sort parameter values accepted by the API.
# rate is never a permitted sort field — not included here.
VALID_SORT_VALUES = {"-vote_count", "vote_count", "-created_at", "created_at"}

# Maps a sort parameter to the full ORDER BY clause.
# The id desc tie-breaker is always applied last for full determinism.
SORT_MAP = {
    "-vote_count": ["-vote_count", "-created_at", "-id"],
    "vote_count": ["vote_count", "-created_at", "-id"],
    "-created_at": ["-created_at", "-id"],
    "created_at": ["created_at", "-id"],
}


def get_feature_requests_list(
    *,
    user=None,
    category_id=None,
    status_id=None,
    author_id=None,
    sort=None,
):
    """
    Return an annotated, filtered, and ordered queryset of FeatureRequest records.

    Annotations:
    - vote_count: total votes via COUNT aggregation (not stored on the model)
    - has_voted: True if the authenticated user has voted, False otherwise

    Ordering: determined by sort param or defaults to vote_count desc -> created_at desc -> id desc.
    rate never appears in any ordering expression.

    This function is read-only. It must not mutate any state.
    """
    qs = FeatureRequest.objects.select_related("author", "category", "status")
    qs = qs.annotate(vote_count=Count("votes", distinct=True))

    if user and user.is_authenticated:
        user_voted = Vote.objects.filter(user=user, feature_request=OuterRef("pk"))
        qs = qs.annotate(has_voted=Exists(user_voted))
    else:
        qs = qs.annotate(has_voted=Value(False, output_field=BooleanField()))

    if category_id is not None:
        qs = qs.filter(category_id=category_id)
    if status_id is not None:
        qs = qs.filter(status_id=status_id)
    if author_id is not None:
        qs = qs.filter(author_id=author_id)

    ordering = SORT_MAP.get(sort, ["-vote_count", "-created_at", "-id"])
    return qs.order_by(*ordering)


def get_feature_request_detail(*, pk, user=None):
    """
    Return a single annotated FeatureRequest by pk.
    Raises FeatureRequest.DoesNotExist if not found.
    """
    return get_feature_requests_list(user=user).get(pk=pk)
