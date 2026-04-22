# Deployment Guide

This guide covers deploying LoL Cheatsheet on a self-hosted server using **Komodo** (recommended) or plain Docker Compose.

---

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker + Docker Compose v2 installed
- [Komodo](https://komo.do) installed on the server *(or skip to the plain Docker section)*
- The repo pushed to GitHub / Gitea / any Git host

---

## Option A — Komodo (recommended)

Komodo is a self-hosted container management platform. It pulls your repo, runs `docker compose up --build`, and lets you redeploy from its UI with one click.

### 1. Add your Git provider in Komodo

In the Komodo UI:

1. Go to **Settings → Git Providers**
2. Add your provider (GitHub, Gitea, etc.)
3. If the repo is private, add a personal access token with `read` scope

### 2. Create the Stack

1. Go to **Stacks → New Stack**
2. Fill in:
   - **Name:** `lol-cheatsheet`
   - **Repo:** `your-username/lol-cheatsheet`
   - **Branch:** `main` (or your default branch)
   - **Compose file path:** `docker-compose.yml`
3. Under **Environment**, add:
   ```
   KOMODO_VOLUME_DIR=/opt/komodo-volumes/lol-cheatsheet/data
   ```
   This is informational — it records where your data lives on the host.
   The actual data is stored in the `lol_data` named Docker volume managed by Docker.

4. Leave **Auto update** off unless you want automatic redeploys on every push.

### 3. Deploy

Click **Deploy**. Komodo will:
1. Clone the repo to the server
2. Run `docker compose up --build`
3. Build both images (~2–3 min on first run)
4. Start the containers

The app will be available at `http://your-server-ip:8080`.

### 4. Redeploy after a push

When you push new code:
1. Open the Stack in Komodo
2. Click **Pull** (to fetch latest code)
3. Click **Deploy** (rebuilds changed images and restarts)

Or enable **Auto update** in the Stack settings to let Komodo do this automatically on push via webhook.

---

## Option B — Plain Docker Compose (no Komodo)

SSH into your server and run:

```bash
# Clone the repo
git clone https://github.com/your-username/lol-cheatsheet.git
cd lol-cheatsheet

# Build and start
docker compose up -d --build
```

The app runs at `http://your-server-ip:8080`.

### Update

```bash
git pull
docker compose up -d --build
```

---

## Reverse proxy — HTTPS + custom domain (optional but recommended)

### With Caddy (simplest)

Install Caddy on the server, then add to `/etc/caddy/Caddyfile`:

```caddyfile
lol.yourdomain.com {
    reverse_proxy localhost:8080
}
```

Caddy automatically provisions and renews a TLS certificate. Reload:

```bash
sudo systemctl reload caddy
```

### With Nginx

```nginx
server {
    listen 80;
    server_name lol.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name lol.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/lol.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lol.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Get a certificate with Certbot:

```bash
sudo certbot --nginx -d lol.yourdomain.com
```

### Local network only (no domain)

If you only need it on your home network, `http://server-ip:8080` is sufficient — no TLS needed.

---

## Port conflict

If port 8080 is already in use, change the mapping in `docker-compose.yml`:

```yaml
ports:
  - "9090:80"   # change 8080 to any free port
```

---

## Data & backups

All data is stored in the `lol_data` named Docker volume (SQLite file).

**Backup:**
```bash
docker run --rm \
  -v lol_data:/data \
  -v $(pwd):/backup \
  alpine cp /data/db.sqlite /backup/db-$(date +%Y%m%d).sqlite
```

**Restore:**
```bash
docker compose down
docker run --rm \
  -v lol_data:/data \
  -v $(pwd):/backup \
  alpine cp /backup/db-20240101.sqlite /data/db.sqlite
docker compose up -d
```

**Automate with cron** (runs daily at 3am):
```bash
crontab -e
# Add:
0 3 * * * docker run --rm -v lol_data:/data -v /opt/backups:/backup alpine cp /data/db.sqlite /opt/backups/lol-db-$(date +\%Y\%m\%d).sqlite
```

---

## Troubleshooting

### Container won't start

```bash
# View logs
docker compose logs backend
docker compose logs frontend
```

### Database migration error

```bash
# Wipe the volume and start fresh (loses all data)
docker compose down -v
docker compose up -d --build
```

### App loads but icons don't show

The app fetches icons from Riot's CDN (`ddragon.leagueoflegends.com`). Your server needs outbound internet access to port 443. Check:

```bash
curl -I https://ddragon.leagueoflegends.com/api/versions.json
```

### Check running containers

```bash
docker compose ps
docker stats
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `/data/db.sqlite` | Path to the SQLite database inside the container |
| `UPLOADS_PATH` | `/data/uploads` | Path for file uploads (future use) |
| `PORT` | `3001` | Backend HTTP port (internal) |
| `VITE_API_URL` | *(empty)* | API base URL for the frontend build — leave empty when using nginx proxy |

---

## First run

On first start the backend automatically:
1. Runs migrations (creates all tables)
2. Seeds sample data: **Garen** (Top), **Jinx** (Bot), **Ahri** (Mid) with builds, rune pages, and matchups

You can safely delete the seeded champions from **My Pool** once you've added your own.
