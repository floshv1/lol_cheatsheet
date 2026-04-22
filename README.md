# LoL Personal Cheatsheet

A self-hosted personal reference tool for League of Legends — built for champ select and in-game use.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-blue)
![Deploy](https://img.shields.io/badge/deploy-Docker%20%2F%20Komodo-brightgreen)

---

## What it does

**Champ select** — type an enemy name and instantly see which of *your* pool champions to play, with the correct rune page and build for that specific matchup.

**Champion overview** — per champion: full rune tree, itemised build path with gold costs, matchup notes, and personal strategy notes in markdown.

**Library** — browse all champions, items, and runes from the current patch with descriptions and stats.

**Pool management** — manage your champion pool by role, with comfort stars and click-to-navigate.

---

## Features

| Feature | Detail |
|---|---|
| Enemy lookup | Debounced search → sorted results (easy → even → hard) |
| Rune pages | Full visual tree with Data Dragon icons, editable in-app |
| Builds | Drag-to-reorder items, slot groups, gold budget on starter (500g cap) |
| Matchup overrides | Assign a specific rune page **and** build per enemy matchup |
| Champion notes | Markdown editor with bold, italic, bullet lists |
| Library | Champions, items (Mythic/Legendary/Epic/Boots/Component), rune trees |
| Patch sync | Change patch → see diff (new/removed items + champions) → reload |
| Keyboard shortcut | Press `/` anywhere to focus the enemy search |
| Mobile | Responsive layout with bottom tab bar and tab switcher on champion page |

---

## Tech stack

```
frontend/   React 18 + Vite + Tailwind CSS (via nginx in Docker)
backend/    Express + better-sqlite3 (Node 20)
data        SQLite — single file, persisted in a Docker named volume
icons       Riot Data Dragon CDN (no API key needed)
```

---

## Local development

**Prerequisites:** Node 20+, npm

```bash
# Terminal 1 — backend
cd backend
npm install
node src/index.js          # listens on :3001, auto-migrates + seeds

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                # listens on :5173, proxies /api → :3001
```

Open `http://localhost:5173`.

---

## Docker (single machine)

```bash
docker compose up --build
```

Open `http://localhost:8080`.

Data is stored in the `lol_data` named Docker volume and survives container restarts.

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full guide.

Quick summary:
1. Push this repo to GitHub / Gitea
2. In Komodo: create a Stack pointing to the repo
3. Deploy → available at `http://your-server:8080`
4. Optionally put Caddy / Nginx in front for HTTPS + a domain name

---

## Updating the patch

1. Open the app → **Settings**
2. Enter the new patch version (e.g. `16.10.1`)
3. Click **Save & Resync** — the diff panel shows new/removed items
4. Click **↺ Reload to apply icons**

To find the latest patch version: `https://ddragon.leagueoflegends.com/api/versions.json`

---

## Backup

The entire database is a single SQLite file inside the `lol_data` Docker volume.

```bash
# Backup
docker run --rm -v lol_data:/data -v $(pwd):/backup alpine \
  cp /data/db.sqlite /backup/db-backup.sqlite

# Restore
docker run --rm -v lol_data:/data -v $(pwd):/backup alpine \
  cp /backup/db-backup.sqlite /data/db.sqlite
```

---

## Project structure

```
lol-cheatsheet/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── db/
│       │   ├── connection.js     # better-sqlite3, WAL mode
│       │   ├── migrations.js     # idempotent schema setup
│       │   └── seed.js           # sample data (runs once on empty DB)
│       ├── routes/
│       │   ├── champions.js      # CRUD /api/champions
│       │   ├── runes.js          # CRUD /api/champions/:id/runes
│       │   ├── builds.js         # CRUD /api/champions/:id/builds + items
│       │   ├── matchups.js       # CRUD /api/champions/:id/matchups
│       │   ├── lookup.js         # GET /api/lookup?enemy=
│       │   ├── all-matchups.js   # GET /api/all-matchups
│       │   └── settings.js       # GET/PUT /api/settings
│       └── index.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── pages/                # Dashboard, Pool, ChampionOverview, …
│       ├── components/           # BuildDisplay, RunePicker, ItemIcon, …
│       ├── hooks/                # useDDData, useRuneData
│       └── lib/                  # api.js, dataDragon.js
├── docker-compose.yml
└── .gitignore
```

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/lookup?enemy=&role=` | Main champ-select lookup |
| `GET` | `/api/all-matchups?search=&role=` | Enemy-centric matchup matrix |
| `GET/POST/PUT/DELETE` | `/api/champions` | Champion pool |
| `GET/POST/PUT/DELETE` | `/api/champions/:id/runes` | Rune pages |
| `GET/POST/PUT/DELETE` | `/api/champions/:id/builds` | Builds |
| `PUT` | `/api/champions/:id/builds/:bid/items/reorder` | Drag reorder |
| `GET/POST/PUT/DELETE` | `/api/champions/:id/matchups` | Matchups |
| `GET/PUT` | `/api/settings` | App settings (patch version) |
