# Deployment Guide

> How to go from `docker compose up -d` on localhost to a real customer clicking `https://app.syncpoint.io` and using the product.
> Assumes the product is feature-complete (Phase A.5 + M2 + M6 + M7 done). If not, don't deploy yet.

## 1. What "deployed" means

The minimum viable deployment for a paying pilot:

- Public URL over HTTPS (`https://app.syncpoint.io`)
- TLS certificate that auto-renews
- Nightly database + evidence backups
- Basic monitoring (uptime + error tracking)
- Manual password reset process
- Roughly-documented incident response
- Backup and restore both tested at least once

Not needed for pilot:
- Zero-downtime deploys
- Multi-region failover
- Auto-scaling
- Kubernetes
- Load balancers

You can add all of that after 3-5 paying customers. Do not add it now.

## 2. Architecture

For pilot: **one VPS, one Docker Compose file, one Caddy in front**.

```
Customer's browser
       │
       │ HTTPS (443)
       ▼
┌──────────────────────────────────────────┐
│ VPS: pilot.syncpoint.io                  │
│                                          │
│  Caddy (auto-TLS from Let's Encrypt)     │
│    │ reverse_proxy                       │
│    ▼                                     │
│  Docker Compose stack (5 containers):    │
│    - postgres:16-alpine                  │
│    - minio                               │
│    - qdrant                              │
│    - syncpoint-backend                   │
│    - syncpoint-ai-service                │
│    - syncpoint-frontend (nginx :4200)    │
│                                          │
│  Named volumes:                          │
│    - postgres-data                       │
│    - minio-data                          │
│    - qdrant-data                         │
│                                          │
│  Cron jobs:                              │
│    - pg_dump every night → S3            │
│    - mc mirror MinIO → S3 every night    │
└──────────────────────────────────────────┘
       │
       │ Backups
       ▼
┌──────────────────────────────────────────┐
│ AWS S3 bucket: syncpoint-pilot-backups   │
│  - 30-day retention                      │
│  - Lifecycle policy: Glacier at day 30   │
└──────────────────────────────────────────┘
```

This runs on **any $6-$20/mo VPS**. At pilot scale (1-3 customers, <500 evidence artifacts), that's overkill in headroom.

## 3. Provider choice

Ranked by ease vs. cost:

| Provider | Plan | Cost/mo | Best for |
|---|---|---|---|
| **Hetzner** — CX22 | 2 vCPU, 4 GB RAM, 40 GB SSD | €5 | Cheapest, Europe |
| **DigitalOcean** — Basic Droplet | 2 vCPU, 4 GB RAM, 80 GB SSD | $24 | US/EU, easy Terraform |
| **Fly.io** | Pay-as-you-go | ~$15-30 | Fastest to deploy, good for multi-region later |
| **Railway** | Hobby | $5 flat + usage | Very easy first-deploy UX |
| **Linode / Akamai** | Nanode 4 GB | $24 | Similar to DO |
| **AWS Lightsail** | 2 GB / 2 vCPU | $10 | If you're going to AWS eventually |

### Recommendation

**Hetzner CX22 or CX32.** Reasons:
- Cheapest at €5-€10/mo for enough headroom
- German data center matters for EU customers (GDPR)
- No hidden bandwidth charges
- SSH keys + firewall config takes 5 minutes

Alternative if you must be on AWS: **Lightsail 2GB**, $10/mo. Same shape, AWS trust story is nicer for enterprise-adjacent customers.

## 4. Domain + DNS

### Domain

Buy `syncpoint.io` or your chosen name from:
- **Cloudflare Registrar** (~$10/yr, at-cost, DNS free) — recommended
- **Porkbun** (~$10/yr) — also cheap
- Avoid GoDaddy (upsells and dark patterns)

### DNS records

Point `pilot.syncpoint.io` at the VPS IP:

```
A    pilot.syncpoint.io   → 65.109.xx.xx (your VPS)
```

That's it for first pilot. Wildcard cert and multiple subdomains come later.

If using Cloudflare DNS: leave the orange cloud OFF (grey cloud, DNS-only) initially. Caddy needs direct TLS negotiation for Let's Encrypt to work.

## 5. Server provisioning — step by step

Assumes Hetzner Ubuntu 24.04 LTS VPS.

### 5.1 Create the VPS

1. Sign up at hetzner.com/cloud
2. Create project "Syncpoint Pilot"
3. Add SSH key (generate with `ssh-keygen -t ed25519 -C "your@email"` locally if you don't have one)
4. Create server:
   - Location: Nuremberg or Falkenstein (EU) or Ashburn (US)
   - Image: Ubuntu 24.04
   - Type: CX22 (€5/mo, 2 vCPU / 4 GB RAM)
   - SSH key: the one you added
5. Note the IPv4 address

### 5.2 First SSH login

```bash
ssh root@<VPS_IP>
```

### 5.3 Basic hardening

```bash
# Update
apt update && apt upgrade -y

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key to the deploy user
mkdir /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Firewall (allow SSH + HTTPS + HTTP for cert renewal)
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

Log out. Log back in as `deploy` from now on:

```bash
ssh deploy@<VPS_IP>
```

### 5.4 Install Docker

```bash
# Docker
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let deploy user run docker
sudo usermod -aG docker deploy

# Log out and back in for group to take effect
exit
```

Log back in, verify:

```bash
docker --version
docker compose version
```

### 5.5 Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Caddy auto-starts. Verify:

```bash
sudo systemctl status caddy
```

## 6. Deploy the app

### 6.1 Pull deployment files

```bash
mkdir /srv/syncpoint
cd /srv/syncpoint
curl -O https://raw.githubusercontent.com/SuryawanshiAdarsh/syncpoint-dev/main/deploy/docker-compose.hub.yml
mv docker-compose.hub.yml docker-compose.yml
```

### 6.2 Create the environment file

Generate secure secrets (run locally):

```bash
openssl rand -hex 24    # for POSTGRES_PASSWORD
openssl rand -hex 48    # for JWT_SECRET
openssl rand -hex 24    # for S3_SECRET_KEY
openssl rand -base64 32 # for SECRET_STORE_MASTER_KEY
```

Create `/srv/syncpoint/.env`:

```env
POSTGRES_DB=compliance
POSTGRES_USER=compliance
POSTGRES_PASSWORD=<paste the first openssl output>

JWT_SECRET=<paste the second>

S3_ACCESS_KEY=minio
S3_SECRET_KEY=<paste the third>
S3_BUCKET=evidence

SECRET_STORE_MASTER_KEY=<paste the fourth>

LLM_PROVIDER=openai
LLM_API_KEY=sk-...your-openai-key...
LLM_MODEL=gpt-4o-mini

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

CORS_ALLOWED_ORIGINS=https://app.syncpoint.io
```

Protect it:

```bash
chmod 600 /srv/syncpoint/.env
```

### 6.3 Start the stack

```bash
cd /srv/syncpoint
docker compose up -d
```

Wait ~30 seconds. Verify:

```bash
docker compose ps
docker logs syncpoint-backend --tail 50
```

All containers should be `healthy` or `up`.

### 6.4 Configure Caddy

Edit `/etc/caddy/Caddyfile`:

```
app.syncpoint.io {
    reverse_proxy 127.0.0.1:4200

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options SAMEORIGIN
        X-Content-Type-Options nosniff
        Referrer-Policy no-referrer-when-downgrade
    }

    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Caddy will fetch a Let's Encrypt cert automatically. Wait ~30 seconds. Test:

```bash
curl https://app.syncpoint.io/
```

Should return the Angular index HTML. If it doesn't:

```bash
sudo journalctl -u caddy --since "5 minutes ago"
```

Look for "obtain certificate" success.

## 7. Backups

### 7.1 Prepare an S3 bucket

Somewhere off the VPS. AWS S3 or Backblaze B2 (cheaper).

```
aws s3 mb s3://syncpoint-pilot-backups
```

Set lifecycle policy (via console): "Move to Glacier after 30 days, delete after 365 days."

Create an IAM user with **write-only** access to that bucket. Note the access key + secret.

### 7.2 Install rclone

```bash
sudo apt install -y rclone
rclone config
# Choose "n" for new remote
# Name: pilot-backups
# Type: 5 (Amazon S3)
# Provider: 1 (AWS)
# Enter access key + secret
# Region: us-east-1 (or your choice)
# Leave everything else default
# Save
```

### 7.3 Backup script

Save as `/srv/syncpoint/backup.sh`:

```bash
#!/bin/bash
set -eu

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR=/var/backups/syncpoint
mkdir -p "$BACKUP_DIR"

# Postgres dump
docker exec syncpoint-postgres \
    pg_dump -U compliance -d compliance -Fc \
  > "$BACKUP_DIR/db-${STAMP}.dump"

# MinIO snapshot (uses rclone on the host to copy the volume contents)
docker run --rm \
    -v /var/lib/docker/volumes/syncpoint_minio-data/_data:/data:ro \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/minio-${STAMP}.tar.gz" -C /data .

# Push to S3
rclone copy "$BACKUP_DIR/db-${STAMP}.dump" pilot-backups:syncpoint-pilot-backups/db/
rclone copy "$BACKUP_DIR/minio-${STAMP}.tar.gz" pilot-backups:syncpoint-pilot-backups/minio/

# Local retention: keep last 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Backup complete: $STAMP"
```

Make executable:

```bash
chmod +x /srv/syncpoint/backup.sh
```

### 7.4 Cron

```bash
crontab -e
```

Add:

```
0 3 * * * /srv/syncpoint/backup.sh >> /var/log/syncpoint-backup.log 2>&1
```

Runs nightly at 3 AM UTC.

### 7.5 Test the restore path — DO THIS ONCE

Before a customer trusts you with data, prove restore works:

1. On a *different* server (not the pilot VPS), start a fresh Docker Compose stack
2. Restore the latest `db-*.dump` into it: `docker exec -i syncpoint-postgres pg_restore -U compliance -d compliance < db-*.dump`
3. Restore the MinIO tarball into the volume
4. Log in with a known user; verify evidence downloads
5. Document the exact commands in `/srv/syncpoint/RESTORE.md`

Skipping this step means the backup is theoretical. Auditors and customers ask: "have you tested restore?" If the answer is no, it counts against you.

## 8. Monitoring

Absolute minimum:

### 8.1 UptimeRobot (or Better Uptime) — public URL health

- Sign up free tier at uptimerobot.com
- Monitor: `https://app.syncpoint.io/actuator/health/liveness`
- Interval: 5 min
- Alert to your email + SMS

Free tier is fine for pilot. Better Uptime ($20/mo) adds a public status page, which is worth having.

### 8.2 Sentry — error tracking

- Sign up free tier at sentry.io
- Create two projects: `syncpoint-backend` (Java) and `syncpoint-frontend` (Angular)
- Get the DSN for each
- Add to `.env`:
  ```
  SENTRY_DSN_BACKEND=https://...
  SENTRY_DSN_FRONTEND=https://...
  ```
- Wire into the code (M10 has a stub for this — do the minimal wiring for the pilot)

Free tier: 5,000 errors/mo. Plenty for pilot.

### 8.3 Server-level

Optional but recommended:

- `htop` — poor man's monitoring, run on the VPS during onboarding calls
- `docker stats` — see CPU/mem per container
- **Netdata** — real-time server dashboard, free, `curl -Ss https://get.netdata.cloud/kickstart.sh | bash`

## 9. Password reset — the manual workaround

Real password reset is deferred. Until it exists:

### Customer forgets password

1. Customer emails you
2. You SSH into the VPS
3. Reset via SQL:

```bash
docker exec syncpoint-postgres psql -U compliance -d compliance
```

```sql
-- Generate BCrypt hash of the new password locally with htpasswd or an online BCrypt tool
UPDATE users SET password_hash = '$2a$12$NEW_HASH_HERE' WHERE email = 'user@customer.com';
```

4. Email them the new temporary password
5. Tell them to log in and change it immediately in Account Settings (once that feature exists)

Document this in a runbook `/srv/syncpoint/RUNBOOK.md`. Not scalable but fine for 1-3 pilots.

## 10. Deployment cadence

### First deploy

Done above.

### Subsequent deploys

New image tag on Docker Hub → pull + up.

```bash
cd /srv/syncpoint
sed -i 's|syncpoint-backend:.*|syncpoint-backend:0.7.0|' docker-compose.yml
sed -i 's|syncpoint-ai-service:.*|syncpoint-ai-service:0.7.0|' docker-compose.yml
sed -i 's|syncpoint-frontend:.*|syncpoint-frontend:0.7.0|' docker-compose.yml
docker compose pull
docker compose up -d
```

Downtime: ~10-15 seconds during container swap. Fine for pilot.

### Emergency rollback

If a new version breaks:

```bash
cd /srv/syncpoint
sed -i 's|syncpoint-backend:.*|syncpoint-backend:0.6.0|' docker-compose.yml
docker compose up -d
```

Data volume is unchanged so no data loss. Rollback in ~30 seconds.

## 11. Runbook — what to do when things go wrong

Save as `/srv/syncpoint/RUNBOOK.md`. Update every time you learn something new.

### Container is unhealthy

```bash
docker compose ps
docker logs syncpoint-<container> --tail 100
```

Common: OOM (out of memory) — check `docker stats`, restart the container. If persistent, upgrade VPS.

### Backend won't start

```bash
docker logs syncpoint-backend
```

Usually one of:
- Postgres not ready (wait, it will retry)
- JWT_SECRET missing or wrong length (check `.env`)
- Master key wrong length (must be 32 bytes → base64 must decode to 32 bytes)

### Disk full

```bash
df -h
docker system prune -a  # careful — removes unused images
```

If persistent, resize VPS or move old backups off (they should already be in S3).

### TLS renewal failed

```bash
sudo journalctl -u caddy --since "1 day ago" | grep -i cert
```

Common: firewall blocking port 80 during ACME challenge. Check `sudo ufw status`.

### Customer reports "can't log in"

```bash
docker logs syncpoint-backend --tail 200 | grep -i error
```

Check if their org was recently created and if `TenantContext` is resolving. Reset password as needed (§9).

### Complete data restore

Follow `/srv/syncpoint/RESTORE.md` (which you wrote when you tested restore in §7.5).

## 12. Cost summary

Minimum monthly cost of running the pilot deployment:

| Item | Cost/mo |
|---|---|
| Hetzner CX22 VPS | €5 |
| Domain (amortized) | $1 |
| AWS S3 backup storage (<10 GB) | $0.30 |
| Sentry free tier | $0 |
| UptimeRobot free tier | $0 |
| Cloudflare DNS free tier | $0 |
| **Total** | **~$7/mo** |

If you upgrade to Better Uptime ($20) + a paid Sentry plan ($26): **~$55/mo total.**

At 1 paying customer at $1,500/mo: 96 % gross margin. Deployment is not the cost problem for a pilot.

## 13. When you'll outgrow this setup

You'll know it's time to graduate when:

- You have 5+ paying customers → move to managed Postgres (RDS / Neon) so `pg_dump` isn't your DR strategy
- Single VPS regularly hits 80%+ CPU → move to a load balancer + 2 backend instances (which requires Redis-backed async + rate limiter — Phase E in ROADMAP.md)
- Compliance customers require region residency → deploy to multiple regions
- You want auto-scaling for demo traffic → move to Fly.io or Railway

For now: **one VPS, one Compose, one Caddy, nightly backup, manual password reset. It'll take you to 3–5 paying customers comfortably.**

## Summary — the smallest deployment that works for a pilot

1. Hetzner CX22 VPS (€5/mo)
2. Docker + Compose + Caddy installed
3. Domain pointed at VPS
4. `docker-compose.hub.yml` + `.env` with real secrets
5. Nightly `pg_dump` + MinIO tar → S3
6. UptimeRobot + Sentry free tiers
7. `RUNBOOK.md` for the 5-6 things that will actually break

**Total setup time**: 1 day if you've done it before, 2-3 days first time.
**Total cost**: ~$7/mo, ~$55/mo with optional upgrades.
