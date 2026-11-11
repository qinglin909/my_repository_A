#!/usr/bin/env bash
# ============================================================
# Deploy + restart the REMOTE backend (8.149.237.99:3000)
#
# Usage on the server (after uploading this file):
#   APP_DIR=/opt/my-website bash deploy-restart.sh
# or just:
#   cd /path/to/project && bash deploy-restart.sh
#
# It will: pull code -> check syntax -> restart -> verify /api/health
# /api/health only exists in the NEW local_server.js, so a 200 JSON
# response is proof that the server is running the updated code.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
PORT="${PORT:-3000}"
APP_NAME="${APP_NAME:-solar-lunar}"

cd "$APP_DIR" || { echo "FATAL: cannot cd to $APP_DIR"; exit 1; }
echo "==> APP_DIR=$APP_DIR  PORT=$PORT  APP_NAME=$APP_NAME"
echo "==> node: $(node -v 2>/dev/null || echo 'NOT FOUND')"

# --- 1. Pull latest code (only if this is a git checkout) -------------
if [ -d .git ]; then
  echo "==> [1/5] git pull --ff-only"
  git pull --ff-only
  echo "    HEAD: $(git rev-parse --short HEAD)"
else
  echo "==> [1/5] not a git repo - SKIP pull"
  echo "    Make sure local_server.js / package.json were uploaded manually."
fi

# --- 2. Dependencies ---------------------------------------------------
echo "==> [2/5] dependencies"
if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
else
  echo "    node_modules exists - skip install"
  echo "    (run 'npm install --omit=dev' manually if package.json changed)"
fi

if [ -f .env ]; then
  echo "    .env found"
else
  echo "    WARNING: .env missing -> JWT_SECRET must be exported in the"
  echo "             process environment (>= 32 chars) or the app will throw."
fi

# --- 3. Syntax check BEFORE stopping the old process ------------------
echo "==> [3/5] node --check local_server.js"
node --check local_server.js

# --- 4. Restart --------------------------------------------------------
kill_port() {
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$pids" ]; then kill -9 $pids 2>/dev/null || true; fi
  else
    echo "    WARNING: no fuser/lsof - cannot auto-kill port ${PORT}"
  fi
}

echo "==> [4/5] restart service"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "    pm2 restart $APP_NAME"
    pm2 restart "$APP_NAME" --update-env
  else
    echo "    pm2 start local_server.js --name $APP_NAME"
    pm2 start local_server.js --name "$APP_NAME" --update-env
  fi
  pm2 save || true
else
  echo "    pm2 not found -> fallback to nohup"
  kill_port
  sleep 1
  nohup node local_server.js >> server.log 2>&1 &
  echo $! > server.pid
  echo "    new PID: $(cat server.pid), logs: tail -f $APP_DIR/server.log"
fi

# --- 5. Health check ---------------------------------------------------
echo "==> [5/5] health check http://127.0.0.1:${PORT}/api/health"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if body=$(curl -fsS --max-time 3 "http://127.0.0.1:${PORT}/api/health" 2>/dev/null); then
    echo "    $body"
    echo "==> SUCCESS: new backend is live."
    echo "    Now verify from outside: curl https://www.solar-lunar.cloud/api/health"
    exit 0
  fi
  sleep 1
done

echo "==> FAILED: /api/health did not return 200 within 10s."
echo "    Possible causes: old code still running, JWT_SECRET missing, port blocked."
echo "    Diagnose:  pm2 logs $APP_NAME --lines 50    |    tail -n 50 $APP_DIR/server.log"
echo "               curl -i http://127.0.0.1:${PORT}/api/health"
exit 1
