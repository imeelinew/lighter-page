# lighter-page

A lightweight self-hosted start page built with Docker and Nginx.

`lighter-page` is a clean homepage for daily use: one Google search box, grouped bookmarks, local editing, drag sorting, mobile support, and a calm visual style. It is designed to be simple to deploy on a VPS and easy to maintain.

## Features

- Google search homepage
- Grouped bookmarks
- Create, edit, delete bookmarks and groups
- Drag to reorder bookmarks
- Responsive mobile layout
- Docker-based deployment
- Default bookmarks loaded from JSON
- Per-browser persistence with `localStorage`

## Stack

- HTML / CSS / JavaScript
- Nginx
- Docker / Docker Compose

## Project Structure

```text
.
|-- Dockerfile
|-- docker-compose.yml
|-- nginx.conf
`-- public
    |-- app.js
    |-- assets
    |-- data
    |   `-- bookmarks.json
    |-- index.html
    `-- styles.css
```

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

### 3. Start the container

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
8080 -> 80
```

If your VPS firewall is enabled:

```bash
sudo ufw allow 8080/tcp
```

Then access:

```text
http://YOUR_SERVER_IP:8080
```

## Domain and HTTPS

The recommended setup is to keep this container on `127.0.0.1:8080` and place a reverse proxy in front of it.

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

This gives you:

```text
https://start.example.com
```

## Bookmarks Data

Default bookmarks live in:

`public/data/bookmarks.json`

Important behavior:

- The JSON file is the default source
- On first load, bookmarks are initialized in the browser
- After a user edits bookmarks, that browser uses its own local state
- To reload the default JSON, use the in-page reset action

Example structure:

```json
{
  "groups": [
    {
      "title": "Daily",
      "items": [
        {
          "name": "Google",
          "url": "https://www.google.com"
        }
      ]
    }
  ]
}
```

## Updating

After changing code:

```bash
docker compose up -d --build
```

After changing only the default bookmarks file:

```bash
docker compose restart
```

## Notes

- `docker-compose.yml` uses `restart: unless-stopped`
- `bookmarks.json` is mounted read-only into the container
- User-edited bookmarks are stored in browser `localStorage`
- This is currently a single-user browser-local persistence model, not multi-device sync

## Next Steps

If you want to evolve this into a more complete self-hosted homepage, the most useful next steps are:

1. Add server-side persistence
2. Add authentication
3. Add a production reverse proxy config
4. Add CI/CD or auto-deploy
