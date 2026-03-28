# Daily Database Reset

## Purpose

The demo environment resets to a clean, pre-seeded state every day at 02:00 UTC.
This ensures:

- Visitors always find a populated, consistent dataset to interact with
- Demo data modified or deleted during the day is restored the next morning
- No manual cleanup is required

## How it works

### 1. Seed dump (created once)

After the first successful deployment, a MySQL dump is taken of the fully-seeded
database and stored at `/opt/demo-apps/feature-rank/seed.sql` on the VM.

The dump contains:
- Django-applied migrations (all tables)
- Reference data: roles, categories, statuses
- 20 demo users with realistic names and avatars
- 60 feature requests distributed across categories and statuses
- Votes distributed realistically (popular features have more votes)
- Backdated `created_at` timestamps spanning 12 months

The dump is created by `scripts/create-seed-dump.sh` and stored **outside the git
repository** to avoid committing demo user passwords or large binary data.

### 2. Daily cron job

A cron entry on the VM runs `scripts/cron-reset.sh` every night:

```
0 2 * * * /opt/demo-apps/feature-rank/scripts/cron-reset.sh
```

### 3. Reset sequence

`scripts/reset-db.sh` performs the following steps:

| Step | Action | Downtime |
|------|--------|----------|
| 1 | Stop the Django backend container | ~1 second |
| 2 | Drop and recreate the database via `mysql` in the db container | ~2 seconds |
| 3 | Restore from `seed.sql` via `mysqldump` restore | ~10–30 seconds |
| 4 | Start the Django backend container | ~5 seconds |
| 5 | Wait for backend health check to pass | ~20–40 seconds |

**Total downtime: approximately 40–80 seconds.**

During this window, the nginx frontend continues serving the React SPA. API requests
return 502 Bad Gateway from nginx (backend is stopped). The Traefik dashboard remains
available. Visitors attempting API calls during the reset see a brief error state.

### 4. Post-reset state

After the reset, Django's `entrypoint.sh` runs `manage.py migrate --noinput`
automatically before Gunicorn starts. Since the seed dump already contains all
migrations, this is a no-op and adds only ~2 seconds.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/create-seed-dump.sh` | Create or update the baseline seed dump |
| `scripts/reset-db.sh` | Restore the database from the seed dump |
| `scripts/cron-reset.sh` | Cron wrapper with log rotation |

## Installing the cron job

```bash
# Open the crontab editor
crontab -e

# Add this line (2 AM UTC daily)
0 2 * * * /opt/demo-apps/feature-rank/scripts/cron-reset.sh
```

## Logs

Reset activity is logged to `/var/log/feature-rank-reset.log`. The log is automatically
trimmed to the last 500 lines by `cron-reset.sh`.

```bash
# View recent reset logs
tail -50 /var/log/feature-rank-reset.log
```

## Updating the baseline

To change what the demo contains (e.g. after adding new seed data):

```bash
# 1. Make sure the stack is running with fresh seed data
make prod-seed
make prod-seed-demo

# 2. Overwrite the seed dump
make prod-create-dump

# 3. Verify the reset works
make prod-reset-db
```

## Maintenance mode (optional enhancement)

For a more polished experience, Traefik can be configured to serve a maintenance page
during the reset window using a custom error middleware and a static HTML file. This
is not currently implemented but can be added via Traefik's `errors` middleware.

## Why not use Django fixtures?

Django fixtures require the schema to exist before loading. A `mysqldump` restore:
- Is faster (native bulk insert)
- Is database-engine-native (no Django-level serialisation overhead)
- Works even if migrations fail
- Captures the exact state including auto-increment counters

The seed dump approach is also simpler to reason about for a demo app.
