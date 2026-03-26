from django.contrib import admin

from apps.statuses.models import Status


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ["name", "color", "is_terminal", "sort_order"]
