from django.contrib import admin

from apps.roles.models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
