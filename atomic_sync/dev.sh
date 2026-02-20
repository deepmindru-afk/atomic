#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
DIM='\033[2m'
RESET='\033[0m'

PIDS=()

cleanup() {
  echo -e "\n${DIM}Shutting down...${RESET}"

  for pid in "${PIDS[@]+"${PIDS[@]}"}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  echo -e "${DIM}Stopping Postgres...${RESET}"
  docker compose -f docker-compose.dev.yml down 2>/dev/null || true

  echo -e "${GREEN}Cleaned up.${RESET}"
}

trap cleanup EXIT INT TERM

# --- Postgres ---
echo -e "${GREEN}Starting Postgres...${RESET}"
docker compose -f docker-compose.dev.yml up -d postgres

# Wait for Postgres to be ready
echo -e "${DIM}Waiting for Postgres...${RESET}"
until docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U atomic_sync -q 2>/dev/null; do
  sleep 0.5
done
echo -e "${GREEN}Postgres ready.${RESET}"

# --- Load .env ---
set -a
source .env
set +a

# --- Migrations ---
echo -e "${GREEN}Running migrations...${RESET}"
npx drizzle-kit migrate --config packages/api/drizzle.config.ts 2>&1 || {
  echo -e "${DIM}No migrations to run (or first run — generate them with: npm run db:generate)${RESET}"
}

# --- API ---
echo -e "${GREEN}Starting API...${RESET}"
npm run dev:api &
PIDS+=($!)

# --- Web ---
echo -e "${GREEN}Starting Web...${RESET}"
npm run dev:web &
PIDS+=($!)

echo -e "\n${GREEN}All services running:${RESET}"
echo -e "  API:      http://localhost:3000"
echo -e "  Web:      http://localhost:5174"
echo -e "  Postgres: localhost:5432"
echo -e "\n${DIM}Press Ctrl+C to stop all services.${RESET}\n"

wait
