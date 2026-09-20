# DevForge External Terminal Server

This is the standalone, production-ready external terminal server for DevForge. It provides real PTY shell sessions (`/bin/bash` on Linux, `powershell.exe`/`cmd.exe` on Windows local dev) connected to DevForge's browser-based Cloud IDE over persistent secure WebSockets (`wss://`).

---

## Architecture Overview

```
DevForge Web App (Vercel)
   │
   │ 1. POST /api/terminal/session (user authenticated, project verified)
   │    Returns signed HMAC-SHA256 token
   ▼
Browser (xterm.js in DevForge IDE)
   │
   │ 2. wss://devforge-terminal.<provider>/terminal?token=<signed-token>
   ▼
DevForge Terminal Server (Docker / Render / Railway / Fly.io)
   │
   │ 3. Verifies token signature & expiration
   │ 4. Resolves isolated workspace: /workspaces/:userId/:projectSlug
   ▼
PTY Process (node-pty)
   │
   │ 5. Real Linux shell (/bin/bash or /bin/sh)
   ▼
Interactive stdin / stdout / resize / process execution / signals (Ctrl+C)
```

---

## Deployment Options

### Option 1: Render (Recommended & Fastest)

Render natively supports WebSockets and Docker web services with automatic TLS (`wss://`).

1. Fork or push the `devforge` repository to GitHub/GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
3. Select your repository.
4. Set the following settings:
   - **Name**: `devforge-terminal`
   - **Region**: Choose closest to your database/users (e.g. Frankfurt, Oregon, Singapore).
   - **Root Directory**: `terminal-server`
   - **Runtime**: `Docker`
   - **Instance Type**: Starter or Standard (persistent instance required, do not use free tier spin-down if you want persistent sessions).
5. Add **Environment Variables**:
   - `PORT`: `3001` (Render usually sets this or routes dynamically)
   - `NODE_ENV`: `production`
   - `TERMINAL_AUTH_SECRET`: Generate a random 32+ character secret (e.g. `openssl rand -hex 32`).
   - `WORKSPACES_ROOT`: `/workspaces`
6. (Optional for persistent workspace disk): Under **Disks**, add a Persistent Disk mounted at `/workspaces` (size 5 GB+).
7. Deploy the service.
8. Once deployed, note your service URL: `devforge-terminal.onrender.com`.
9. In your DevForge Vercel project settings, set:
   ```env
   TERMINAL_AUTH_SECRET="<same-secret-as-above>"
   NEXT_PUBLIC_TERMINAL_WS_URL="wss://devforge-terminal.onrender.com/terminal"
   ```

---

### Option 2: Railway

Railway supports Docker builds with persistent volumes and persistent WebSocket connections.

1. In [Railway](https://railway.app), create a **New Project** → **Deploy from GitHub repo**.
2. Go to Service Settings:
   - **Root Directory**: `terminal-server`
   - **Builder**: Dockerfile (will detect `terminal-server/Dockerfile`)
3. Under **Variables**, add:
   - `TERMINAL_AUTH_SECRET`: `<your-random-32-char-secret>`
   - `WORKSPACES_ROOT`: `/workspaces`
   - `NODE_ENV`: `production`
4. Under **Volumes**, add a Volume mounted at `/workspaces`.
5. Under **Networking**, click **Generate Domain** (e.g. `devforge-terminal-production.up.railway.app`).
6. In DevForge on Vercel:
   ```env
   TERMINAL_AUTH_SECRET="<same-secret-as-above>"
   NEXT_PUBLIC_TERMINAL_WS_URL="wss://devforge-terminal-production.up.railway.app/terminal"
   ```

---

### Option 3: Fly.io

1. Navigate to the `terminal-server` directory:
   ```bash
   cd terminal-server
   ```
2. Launch a new Fly app:
   ```bash
   fly launch --no-deploy
   ```
3. Create a persistent volume for workspaces:
   ```bash
   fly volumes create devforge_workspaces --size 10
   ```
4. Configure secrets:
   ```bash
   fly secrets set TERMINAL_AUTH_SECRET="<your-secret>"
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

### Option 4: Self-Hosted Docker Container

```bash
docker build -t devforge-terminal .

docker run -d \
  --name devforge-terminal \
  -p 3001:3001 \
  -v devforge_workspaces:/workspaces \
  -e TERMINAL_AUTH_SECRET="your-32-char-secret" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  devforge-terminal
```

---

## Local Development

To run the terminal server locally alongside DevForge:

```bash
cd terminal-server
npm install
npm run dev
```

The server starts on `http://localhost:3001` with WebSocket endpoint at `ws://localhost:3001/terminal`.
DevForge in local development automatically connects to `ws://localhost:3001/terminal` if `NEXT_PUBLIC_TERMINAL_WS_URL` is unset or set to `ws://localhost:3001/terminal`.

---

## Health Check

Check that the terminal server is responding:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "devforge-terminal",
  "platform": "linux",
  "nodeVersion": "v20.x.x",
  "activeSessions": 0,
  "workspacesRoot": "/workspaces",
  "uptime": 42
}
```
