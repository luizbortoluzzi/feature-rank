#!/usr/bin/env bash
# =============================================================================
# bootstrap-vm.sh — One-time Oracle Cloud VM setup
# =============================================================================
# Run this once on a fresh OCI instance (Ubuntu 22.04 / Oracle Linux 8+).
# Installs Docker, Docker Compose plugin, configures firewall, and prepares
# the directory layout for multi-app hosting.
#
# Usage:
#   chmod +x scripts/bootstrap-vm.sh
#   sudo ./scripts/bootstrap-vm.sh
# =============================================================================
set -euo pipefail

# ── Detect OS ─────────────────────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="$ID"
else
  echo "ERROR: Cannot detect OS. Exiting." >&2
  exit 1
fi

echo "==> Detected OS: $OS_ID $VERSION_ID"

# ── Update system packages ────────────────────────────────────────────────────
echo "==> Updating system packages..."
if [ "$OS_ID" = "ubuntu" ] || [ "$OS_ID" = "debian" ]; then
  apt-get update -y
  apt-get upgrade -y
  apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release \
    apache2-utils git make ufw
elif [ "$OS_ID" = "ol" ] || [ "$OS_ID" = "centos" ] || [ "$OS_ID" = "rhel" ]; then
  yum update -y
  yum install -y ca-certificates curl gnupg git make firewalld httpd-tools
fi

# ── Install Docker ────────────────────────────────────────────────────────────
echo "==> Installing Docker..."
if command -v docker &>/dev/null; then
  echo "    Docker already installed: $(docker --version)"
else
  if [ "$OS_ID" = "ubuntu" ] || [ "$OS_ID" = "debian" ]; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  elif [ "$OS_ID" = "ol" ]; then
    dnf install -y dnf-plugins-core
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable --now docker
  fi
fi

# ── Add current (non-root) user to docker group ───────────────────────────────
DEPLOY_USER="${SUDO_USER:-$(logname 2>/dev/null || echo ubuntu)}"
echo "==> Adding $DEPLOY_USER to the docker group..."
usermod -aG docker "$DEPLOY_USER"

# ── Configure firewall ────────────────────────────────────────────────────────
echo "==> Configuring firewall (UFW)..."
if command -v ufw &>/dev/null; then
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  # SSH — restrict to your IP in production (replace 'any' with your IP/range)
  ufw allow 22/tcp comment "SSH"
  # HTTP and HTTPS — required for Let's Encrypt and normal traffic
  ufw allow 80/tcp  comment "HTTP (Traefik + ACME challenge)"
  ufw allow 443/tcp comment "HTTPS (Traefik)"
  ufw --force enable
  echo "    UFW enabled. Active rules:"
  ufw status numbered
else
  echo "    UFW not available. Configure OCI Security List / NSG manually:"
  echo "    - Allow TCP 22   (SSH, source: your IP only)"
  echo "    - Allow TCP 80   (HTTP — needed for Let's Encrypt challenge)"
  echo "    - Allow TCP 443  (HTTPS)"
  echo "    - Block all other inbound ports"
fi

# ── Enable and start Docker ───────────────────────────────────────────────────
echo "==> Enabling Docker service..."
systemctl enable docker
systemctl start docker

# ── Create shared Traefik network ─────────────────────────────────────────────
echo "==> Creating shared traefik_net Docker network..."
docker network create traefik_net 2>/dev/null && echo "    Created." \
  || echo "    Already exists — skipping."

# ── Create application directory ──────────────────────────────────────────────
APP_BASE="/opt/demo-apps"
echo "==> Creating application directory at $APP_BASE..."
mkdir -p "$APP_BASE"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_BASE"

echo ""
echo "==> Bootstrap complete!"
echo ""
echo "    Next steps:"
echo "    1. Log out and back in (or run: newgrp docker) so group membership takes effect"
echo "    2. Clone your application into $APP_BASE:"
echo "       cd $APP_BASE && git clone <repo-url> feature-rank"
echo "    3. Configure production secrets:"
echo "       cp feature-rank/.env.prod.example feature-rank/.env.prod"
echo "       # Edit .env.prod with real values"
echo "    4. Create the seed dump (first deploy only):"
echo "       cd feature-rank && ./scripts/create-seed-dump.sh"
echo "    5. Deploy the application:"
echo "       ./scripts/deploy.sh"
echo "    6. Install the daily reset cron job:"
echo "       (crontab -l 2>/dev/null; echo '0 2 * * * /opt/demo-apps/feature-rank/scripts/cron-reset.sh') | crontab -"
echo ""
