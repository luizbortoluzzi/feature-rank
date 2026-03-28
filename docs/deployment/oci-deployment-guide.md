# OCI Deployment Guide

## Overview

This guide deploys Feature Rank to a single Oracle Cloud Infrastructure (OCI) VM
using Docker Compose and Traefik as the reverse proxy.

**Architecture:** One VM → Traefik (TLS) → nginx (React SPA + API proxy) → Django → MySQL

See [architecture.md](./architecture.md) for the full runtime diagram.

---

## Prerequisites

Before starting:

- [ ] Oracle Cloud account with Always Free tier enabled
- [ ] A domain name you control (e.g. `feature-rank.yourdomain.com`)
- [ ] SSH access to a terminal
- [ ] Basic familiarity with Linux and Docker

---

## Step 1: Provision the OCI VM

### Recommended shape

| Shape               | OCPU | RAM  | Notes                                        |
|---------------------|------|------|----------------------------------------------|
| VM.Standard.A1.Flex | 2    | 4 GB | Recommended. ARM-based, Always Free eligible |
| VM.Standard.E2.1.Micro | 1  | 1 GB | Minimal; suitable for a single-app setup    |

### Steps in OCI Console

1. Navigate to **Compute → Instances → Create Instance**
2. Select your region (choose one close to your audience)
3. Choose **VM.Standard.A1.Flex** (ARM), set **2 OCPU / 4 GB RAM**
4. Image: **Ubuntu 22.04** (recommended)
5. Networking: create or select a VCN with a public subnet
6. Generate or upload an SSH key pair; download the private key
7. Click **Create**

### Configure OCI Security List

After the instance is created, update the **Security List** or **NSG** for the subnet:

**Ingress rules (add these):**

| Protocol | Source CIDR     | Port | Notes                               |
|----------|-----------------|------|-------------------------------------|
| TCP      | Your IP/32      | 22   | SSH — use your actual IP            |
| TCP      | 0.0.0.0/0       | 80   | HTTP — required for ACME challenge  |
| TCP      | 0.0.0.0/0       | 443  | HTTPS — application traffic         |

> OCI VMs also have an OS-level firewall. The bootstrap script configures UFW.
> Both the OCI Security List AND UFW must allow a port for it to be reachable.

---

## Step 2: Bootstrap the VM

SSH into the VM:

```bash
ssh -i /path/to/private-key.pem ubuntu@<VM_PUBLIC_IP>
```

Clone the repository and run the bootstrap script (requires root):

```bash
# Clone to the apps directory
sudo mkdir -p /opt/demo-apps
sudo chown ubuntu:ubuntu /opt/demo-apps
cd /opt/demo-apps
git clone https://github.com/your-username/feature-rank.git
cd feature-rank

# Bootstrap: installs Docker, configures UFW, creates traefik_net
sudo ./scripts/bootstrap-vm.sh
```

The bootstrap script:
- Updates system packages
- Installs Docker Engine + Docker Compose plugin
- Adds the deploy user to the `docker` group
- Configures UFW (allows SSH, 80, 443; denies everything else)
- Creates the shared `traefik_net` Docker network
- Creates the `/opt/demo-apps` directory

**After the script completes, log out and back in** so the docker group membership
takes effect:

```bash
exit
ssh -i /path/to/private-key.pem ubuntu@<VM_PUBLIC_IP>
```

Verify Docker is working:

```bash
docker info
```

---

## Step 3: Configure DNS

Point your domain's DNS to the VM's public IP **before** proceeding.
Let's Encrypt requires the domain to resolve to this VM for the HTTP-01 challenge.

In your DNS provider, create an A record:

| Name                       | Type | Value           |
|----------------------------|------|-----------------|
| `feature-rank`             | A    | `<VM_PUBLIC_IP>`|
| `traefik.feature-rank`     | A    | `<VM_PUBLIC_IP>`|

> DNS propagation can take a few minutes. Verify with:
> `dig feature-rank.yourdomain.com` or `nslookup feature-rank.yourdomain.com`

---

## Step 4: Configure production secrets

```bash
cd /opt/demo-apps/feature-rank

# Copy the production env template
cp .env.prod.example .env.prod

# Edit with your values
nano .env.prod
```

**Required values in `.env.prod`:**

```bash
# Your actual domain
DOMAIN=feature-rank.yourdomain.com

# Your email for Let's Encrypt notifications
ACME_EMAIL=you@example.com

# Generate Traefik dashboard credentials:
#   docker run --rm httpd:alpine htpasswd -nbB admin 'your-strong-password' \
#     | sed 's/\$\$/\$/g'
# Paste the output here (dollar signs are doubled to escape shell interpolation)
TRAEFIK_DASHBOARD_USERS=admin:$$2y$$05$$...paste-here...

# Database credentials (generate strong random values)
MYSQL_DATABASE=feature_rank
MYSQL_USER=feature_rank_user
MYSQL_PASSWORD=$(openssl rand -hex 24)
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)

# Django secret key
DJANGO_SECRET_KEY=$(python3 -c "import secrets, string; c=string.ascii_letters+string.digits+'!@#%^&*(-_=+)'; print(''.join(secrets.choice(c) for _ in range(50)))")
```

Secure the file:

```bash
chmod 600 .env.prod
```

---

## Step 5: First deployment

```bash
cd /opt/demo-apps/feature-rank

# Build images and start all services (health-check gated)
make prod-up
```

This will:
1. Pull/build all Docker images
2. Start MySQL, wait for it to be healthy
3. Start Django (runs `migrate --noinput` automatically), wait for health
4. Start nginx frontend
5. Start Traefik (requests TLS certificate from Let's Encrypt on first request)

Check service status:

```bash
make prod-ps
make prod-logs
```

---

## Step 6: Seed the demo data

After services are healthy, seed the database:

```bash
# Seed reference data (roles, categories, statuses)
make prod-seed

# Seed full demo dataset (20 users, 60 feature requests, votes)
make prod-seed-demo
```

---

## Step 7: Create the seed dump

Capture the clean demo state for daily resets:

```bash
make prod-create-dump
```

This writes the dump to `/opt/demo-apps/feature-rank/seed.sql` (~50–200 KB).
Store this file safely — it is the baseline for all future resets.

---

## Step 8: Install the daily reset cron job

```bash
crontab -e
```

Add this line (resets at 02:00 UTC daily):

```
0 2 * * * /opt/demo-apps/feature-rank/scripts/cron-reset.sh
```

Save and exit. Verify the cron entry:

```bash
crontab -l
```

---

## Step 9: Install the systemd service (optional but recommended)

Ensures the Docker Compose stack starts automatically after VM reboots:

```bash
# Update the username in the service file if not 'ubuntu'
nano deploy/feature-rank.service   # change User= and Group= if needed

sudo cp deploy/feature-rank.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable feature-rank
sudo systemctl start feature-rank

# Verify
sudo systemctl status feature-rank
```

---

## Step 10: Verify the deployment

Open your browser:

- `https://feature-rank.yourdomain.com` — application (with valid TLS certificate)
- `https://traefik.yourdomain.com` — Traefik dashboard (login with dashboard credentials)

Check health:

```bash
curl -f https://feature-rank.yourdomain.com/api/v1/health/
# Expected: {"data": {"status": "ok"}, "meta": null}
```

---

## Routine operations

### Deploy an update

```bash
cd /opt/demo-apps/feature-rank
./scripts/deploy.sh
# or: make prod-deploy
```

This pulls the latest code, rebuilds images, and does a health-check-gated restart.

### View logs

```bash
make prod-logs                           # All services
docker logs feature-rank-backend -f     # Backend only
docker logs feature-rank-frontend -f    # nginx only
docker logs traefik -f                  # Traefik only
```

### Manual database reset

```bash
make prod-reset-db
# or: ./scripts/reset-db.sh
```

### Update the seed baseline

```bash
make prod-seed-demo    # Re-seed
make prod-create-dump  # Overwrite seed dump
```

### Full teardown

```bash
make prod-down
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
# -v also removes volumes — data is gone
```

---

## Troubleshooting

### TLS certificate not issued

- Verify DNS resolves to the correct IP: `dig feature-rank.yourdomain.com`
- Verify port 80 is reachable: `curl http://feature-rank.yourdomain.com`
- Verify OCI Security List allows TCP 80 and 443 inbound
- Verify UFW allows the ports: `sudo ufw status`
- Check Traefik logs: `docker logs traefik -f`
- Check `acme.json` volume: `docker exec traefik cat /acme/acme.json`

### Backend fails to start

```bash
docker logs feature-rank-backend
```

Common causes:
- Database not ready — check `docker logs feature-rank-db`
- Wrong `DATABASE_URL` in `.env.prod`
- Missing `DJANGO_SECRET_KEY`

### nginx returns 502 Bad Gateway

The backend is unhealthy or stopped. Check:

```bash
docker inspect --format='{{.State.Health.Status}}' feature-rank-backend
docker logs feature-rank-backend --tail=50
```

### MySQL container fails to start

Check for a corrupted data volume:

```bash
docker logs feature-rank-db
```

If the volume is corrupted, a full reset may be needed (data loss):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
make prod-up
make prod-seed && make prod-seed-demo
make prod-create-dump
```

### "Permission denied" running Docker commands

The deploy user is not in the `docker` group or the session predates the group add.
Log out and back in, then verify: `groups` should include `docker`.

### Daily reset cron not running

```bash
# Check cron is installed
crontab -l

# Check the log
cat /var/log/feature-rank-reset.log

# Run manually to test
/opt/demo-apps/feature-rank/scripts/cron-reset.sh
```

---

## Environment variable reference

See [`.env.prod.example`](../../.env.prod.example) for the full production variable reference.

| Variable                  | Required | Description                                   |
|---------------------------|----------|-----------------------------------------------|
| `DOMAIN`                  | Yes      | Public hostname (`feature-rank.yourdomain.com`)|
| `ACME_EMAIL`              | Yes      | Email for Let's Encrypt notifications         |
| `TRAEFIK_DASHBOARD_USERS` | Yes      | htpasswd basic auth string for dashboard      |
| `MYSQL_DATABASE`          | Yes      | MySQL database name                           |
| `MYSQL_USER`              | Yes      | MySQL application user                        |
| `MYSQL_PASSWORD`          | Yes      | MySQL application user password               |
| `MYSQL_ROOT_PASSWORD`     | Yes      | MySQL root password                           |
| `DJANGO_SECRET_KEY`       | Yes      | Django secret key (50+ chars, random)         |

---

## Adding a second application to the same VM

This setup is designed for multi-app hosting. To add another app:

1. Clone the second repo into `/opt/demo-apps/<app-name>/`
2. Create its `docker-compose.prod.yml` with `traefik_net` as an external network
3. Add Traefik labels with a different `Host()` rule
4. Create a separate internal network (e.g. `app2_internal`)
5. Do NOT include a Traefik service in the second app's compose file — the existing
   Traefik instance will discover it automatically via Docker labels
6. Configure DNS for the second domain → same VM IP
7. Run: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`

See [architecture.md — Multi-app hosting](./architecture.md#multi-app-hosting) for details.
