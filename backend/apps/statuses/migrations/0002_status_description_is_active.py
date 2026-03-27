from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("statuses", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="status",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="status",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
