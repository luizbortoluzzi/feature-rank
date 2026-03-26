from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "name", "is_admin", "is_active"]
    fieldsets = BaseUserAdmin.fieldsets + (("Domain fields", {"fields": ("name", "is_admin")}),)
