# Atomic Sync

Atomic Sync is a hosted automation platform that syncs external content sources into [Atomic](../CLAUDE.md) knowledge bases. Users connect their Atomic instance via OAuth, configure sync sources (starting with RSS), and the platform handles polling, fetching, deduplication, and pushing content as atoms to their KB.

The platform is intentionally separate from Atomic itself — Atomic stays a clean knowledge base, and Atomic Sync is the integration layer. It communicates with Atomic instances exclusively via OAuth and the HTTP REST API.

## Architecture

```
┌──────────────────────────────────────────┐
│             Atomic Sync                  │
│                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │   Web   │  │   API   │  │ Workers │  │
│  │ (React) │─▶│(Fastify)│  │(pgboss) │  │
│  └─────────┘  └────┬────┘  └────┬────┘  │
│                    │            │        │
│               ┌────▼────────────▼────┐   │
│               │      Postgres        │   │
│               └──────────────────────┘   │
└──────────────────┬───────────────────────┘
                   │ OAuth + REST API
          ┌────────▼────────┐
          │ Atomic Instance │
          │  (atomic-server)│
          └─────────────────┘
```

- **API**: Fastify server handling OAuth flows, feed CRUD, and health checks
- **Workers**: pgboss-based background jobs that poll RSS feeds on configurable intervals and sync new items to connected Atomic instances
- **Web**: React frontend for connecting Atomic instances and managing feed configurations
- **Postgres**: Stores connections, feed configs, sync records (for deduplication), and job queue state (pgboss)

## Tech Stack

- **API**: Fastify 5, Drizzle ORM, pgboss, rss-parser
- **Web**: React 18, Vite 6, Tailwind CSS v4
- **Database**: PostgreSQL 17
- **Runtime**: Node.js, TypeScript, tsx (dev)
- **Deployment**: Docker (multi-stage: API + nginx for static frontend)

## Workspace Structure

```
atomic_sync/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   │   └── src/types.ts # Connection, Feed, SyncRecord, API contracts
│   ├── api/             # Fastify server + pgboss workers
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point
│   │   │   ├── config.ts          # Environment config
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle schema (connections, feeds, sync_records, oauth_states)
│   │   │   │   └── index.ts       # DB connection pool
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts        # OAuth connect/callback/connections
│   │   │   │   ├── feeds.ts       # Feed CRUD + sync history
│   │   │   │   └── health.ts
│   │   │   ├── services/
│   │   │   │   ├── atomic.ts      # HTTP client for atomic-server REST API
│   │   │   │   └── rss.ts         # RSS fetching + markdown formatting
│   │   │   └── workers/
│   │   │       └── feed-sync.ts   # pgboss scheduler + sync worker
│   │   └── drizzle/               # Generated migration SQL files
│   └── web/             # React frontend
│       └── src/
│           ├── App.tsx            # Connection selector + routing
│           ├── lib/api.ts         # Typed API client
│           ├── pages/
│           │   ├── ConnectPage.tsx
│           │   └── DashboardPage.tsx
│           └── components/
│               ├── AddFeedForm.tsx
│               └── FeedCard.tsx
├── dev.sh               # Start all services for local dev
├── docker-compose.yml   # Production: Postgres + API + Web
├── docker-compose.dev.yml # Dev: Postgres only
├── Dockerfile           # Multi-stage build (api + web/nginx)
└── docker/
    └── nginx.conf       # Proxies /api to the API service
```

## OAuth Flow

Atomic Sync authenticates with Atomic instances using OAuth 2.0 Authorization Code with PKCE:

1. User enters their Atomic server URL
2. Atomic Sync dynamically registers as an OAuth client (`POST /oauth/register`)
3. User is redirected to the Atomic consent page
4. On approval, Atomic Sync exchanges the authorization code for an access token
5. The access token (a standard Atomic API token, `at_` prefixed, non-expiring) is stored for subsequent API calls

## Sync Pipeline

A pgboss scheduler runs every minute and checks which feeds are due for sync based on their `poll_interval_minutes`. For each due feed:

1. Fetch and parse the RSS feed
2. Compare item GUIDs against `sync_records` to find new items
3. For each new item, format as markdown and create an atom via the Atomic REST API
4. Record the sync in `sync_records` for deduplication
5. Update feed status (`last_synced_at`, `last_error`)

Failed syncs record the error on the feed and are retried by pgboss.

## Common Commands

```bash
# Local development (starts Postgres, runs migrations, starts API + Web)
./dev.sh

# Or individually:
docker compose -f docker-compose.dev.yml up -d postgres  # Start Postgres
npm run db:generate                                       # Generate migration from schema changes
npm run db:migrate                                        # Apply migrations
npm run dev:api                                           # API on :3000
npm run dev:web                                           # Web on :5174

# Production
docker compose up -d
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `SESSION_SECRET` | Yes | — | Secret for session signing |
| `PUBLIC_URL` | No | `http://localhost:5174` | Base URL for OAuth redirect callbacks |
| `PORT` | No | `3000` | API server port |
| `HOST` | No | `0.0.0.0` | API server bind address |
