import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// A connected atomic instance (one per user/KB)
export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  atomicUrl: text("atomic_url").notNull(),
  accessToken: text("access_token").notNull(),
  // Dynamic client registration details (for potential future token refresh)
  oauthClientId: text("oauth_client_id"),
  oauthClientSecret: text("oauth_client_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RSS feeds configured for sync
export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id")
    .references(() => connections.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  title: text("title"),
  tagName: text("tag_name"), // tag to apply to synced atoms
  pollIntervalMinutes: integer("poll_interval_minutes").notNull().default(60),
  enabled: boolean("enabled").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_feeds_connection").on(t.connectionId),
  index("idx_feeds_enabled_sync").on(t.enabled, t.lastSyncedAt),
]);

// Deduplication: track which RSS items have been synced
export const syncRecords = pgTable("sync_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedId: uuid("feed_id")
    .references(() => feeds.id, { onDelete: "cascade" })
    .notNull(),
  guid: text("guid").notNull(), // RSS item GUID
  atomId: text("atom_id").notNull(), // ID of the created atom in atomic
  title: text("title"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_sync_records_feed_guid").on(t.feedId, t.guid),
  index("idx_sync_records_atom").on(t.atomId),
]);

// Pending OAuth flows (temporary, cleaned up after completion)
export const oauthStates = pgTable("oauth_states", {
  state: text("state").primaryKey(),
  atomicUrl: text("atomic_url").notNull(),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  codeVerifier: text("code_verifier").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
