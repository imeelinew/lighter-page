# lighter-page

A self-hosted start page with Google search, grouped bookmarks, and real server-side bookmark sync.

`lighter-page` is built for a VPS workflow: one shared bookmark set stored on the server, editable from any device, with a lightweight single-container deployment.

## Features

- Google search homepage
- Grouped bookmarks
- Create, edit, delete bookmarks and groups
- Drag to reorder bookmarks
- Responsive mobile layout
- Server-side bookmark persistence
- Cross-device sync through a shared VPS data file
- Docker-based deployment
- Default bookmark seed file

## Stack

- HTML / CSS / JavaScript
- Node.js built-in HTTP server
- Docker / Docker Compose

## Project Structure

```text
.
|-- Dockerfile
|-- docker-compose.yml
|-- data
|   `-- bookmarks.runtime.json
|-- package.json
|-- public
|   |-- app.js
|   |-- assets
|   |-- data
|   |   `-- bookmarks.json
|   |-- index.html
|   `-- styles.css
|-- README.md
`-- server.js
```

## How Data Works

There are now two bookmark files:

- `public/data/bookmarks.json`
  This is the bundled default seed file.
- `data/bookmarks.runtime.json`
  This is the live server-side file created after the first edit or import.

Runtime behavior:

- If `data/bookmarks.runtime.json` does not exist, the app serves `public/data/bookmarks.json`
- Once you edit bookmarks in the UI, the app writes to `data/bookmarks.runtime.json`
- All devices connected to the same deployed instance read and write the same server file
- Browser `localStorage` is only used for local UI settings and favicon cache, not bookmark storage

## Quick Start

Run locally:

```bash
docker compose up -d --build
```

Then open:

```text
http://localhost:8080
```

Stop the service:

```bash
docker compose down
```

## VPS Deployment

### 1. Install Docker

Example for Ubuntu / Debian:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Verify installation:

```bash
docker --version
docker compose version
```

### 2. Clone the repository

```bash
git clone https://github.com/imeelinew/lighter-page.git
cd lighter-page
```

### 3. Start the service

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

### 4. Expose the service

Current port mapping:

```text
8080 -> 8080
```

If your VPS firewall is enabled:

```bash
sudo ufw allow 8080/tcp
```

Then access:

```text
http://YOUR_SERVER_IP:8080
```

## Persistence

The live bookmark file is stored on the host through the compose volume:

```text
./data:/app/data
```

That means:

- Rebuilding the container does not erase your live bookmarks
- Backing up `data/bookmarks.runtime.json` backs up your shared bookmarks
- Copying that file to another server migrates your current bookmark set

## Restore Defaults

The in-page restore action now resets the live server file and falls back to:

```text
public/data/bookmarks.json
```

If you want a different default set, edit that file and redeploy.

## Updating

After changing code:

```bash
docker compose up -d --build
```

After changing only the default seed file:

```bash
docker compose up -d --build
```

After changing live bookmarks through the UI:

- No rebuild is needed
- The app writes directly to `data/bookmarks.runtime.json`

## Recommendation

For a real VPS deployment, put a reverse proxy in front of this service and expose it through HTTPS.

Recommended options:

- Caddy
- Nginx Proxy Manager
- Your own Nginx or Caddy config

### Example Caddyfile

```caddyfile
start.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

## Important Note

This project now supports cross-device sync through shared server storage, but it still does not include user accounts or write authentication.

If you expose it on the public internet, protect it with one of these:

- VPN
- Basic auth at the reverse proxy
- Private network only

## Next Steps

If you want to harden it further, the most useful next steps are:

1. Add write authentication for the API
2. Add server-side version history or backups
3. Add multi-user support
4. Add CI/CD or auto-deploy
