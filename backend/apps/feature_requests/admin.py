from django.contrib import admin

from apps.feature_requests.models import FeatureRequest, Vote


@admin.register(FeatureRequest)
class FeatureRequestAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "status", "created_at"]
    list_select_related = True


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["user", "feature_request", "created_at"]
