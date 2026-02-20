import { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { feeds, syncRecords, connections } from "../db/schema.js";
import { fetchFeed } from "../services/rss.js";
import { SYNC_FEED_JOB } from "../workers/feed-sync.js";
import type { CreateFeedRequest, UpdateFeedRequest } from "@atomic-sync/shared";

export async function feedRoutes(app: FastifyInstance) {
  // List feeds for a connection
  app.get<{ Params: { connectionId: string } }>(
    "/connections/:connectionId/feeds",
    async (request) => {
      const { connectionId } = request.params;

      const rows = await db
        .select({
          feed: feeds,
          syncedItemCount: sql<number>`count(${syncRecords.id})::int`,
        })
        .from(feeds)
        .leftJoin(syncRecords, eq(syncRecords.feedId, feeds.id))
        .where(eq(feeds.connectionId, connectionId))
        .groupBy(feeds.id)
        .orderBy(feeds.createdAt);

      return rows.map((r) => ({
        ...r.feed,
        syncedItemCount: r.syncedItemCount,
      }));
    },
  );

  // Add a feed
  app.post<{ Params: { connectionId: string }; Body: CreateFeedRequest }>(
    "/connections/:connectionId/feeds",
    async (request, reply) => {
      const { connectionId } = request.params;
      const { url, tagName, pollIntervalMinutes } = request.body;

      // Verify connection exists
      const [conn] = await db
        .select()
        .from(connections)
        .where(eq(connections.id, connectionId));

      if (!conn) {
        return reply.status(404).send({ error: "Connection not found" });
      }

      // Try to fetch the feed to validate URL and get title
      let feedTitle: string | undefined;
      try {
        const parsed = await fetchFeed(url);
        feedTitle = parsed.title;
      } catch (err) {
        return reply.status(400).send({
          error: `Could not parse feed at ${url}: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const [feed] = await db
        .insert(feeds)
        .values({
          connectionId,
          url,
          title: feedTitle ?? null,
          tagName: tagName ?? null,
          pollIntervalMinutes: pollIntervalMinutes ?? 60,
        })
        .returning();

      return reply.status(201).send(feed);
    },
  );

  // Update a feed
  app.patch<{ Params: { id: string }; Body: UpdateFeedRequest }>(
    "/feeds/:id",
    async (request, reply) => {
      const { id } = request.params;
      const updates: Record<string, unknown> = {};

      if (request.body.url !== undefined) updates.url = request.body.url;
      if (request.body.tagName !== undefined)
        updates.tagName = request.body.tagName;
      if (request.body.pollIntervalMinutes !== undefined)
        updates.pollIntervalMinutes = request.body.pollIntervalMinutes;
      if (request.body.enabled !== undefined)
        updates.enabled = request.body.enabled;

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(feeds)
        .set(updates)
        .where(eq(feeds.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Feed not found" });
      }

      return updated;
    },
  );

  // Delete a feed
  app.delete<{ Params: { id: string } }>(
    "/feeds/:id",
    async (request, reply) => {
      const { id } = request.params;
      const deleted = await db
        .delete(feeds)
        .where(eq(feeds.id, id))
        .returning();

      if (deleted.length === 0) {
        return reply.status(404).send({ error: "Feed not found" });
      }

      return { ok: true };
    },
  );

  // Trigger an immediate sync for a feed
  app.post<{ Params: { id: string } }>(
    "/feeds/:id/sync",
    async (request, reply) => {
      const { id } = request.params;

      const [feed] = await db
        .select()
        .from(feeds)
        .where(eq(feeds.id, id));

      if (!feed) {
        return reply.status(404).send({ error: "Feed not found" });
      }

      await app.boss.send(SYNC_FEED_JOB, { feedId: id }, {
        singletonKey: id,
      });

      return { ok: true, message: "Sync queued" };
    },
  );

  // Get sync history for a feed
  app.get<{ Params: { id: string } }>(
    "/feeds/:id/history",
    async (request) => {
      const { id } = request.params;

      const records = await db
        .select()
        .from(syncRecords)
        .where(eq(syncRecords.feedId, id))
        .orderBy(syncRecords.syncedAt);

      return records;
    },
  );
}
