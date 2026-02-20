CREATE INDEX "idx_feeds_connection" ON "feeds" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_feeds_enabled_sync" ON "feeds" USING btree ("enabled","last_synced_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sync_records_feed_guid" ON "sync_records" USING btree ("feed_id","guid");--> statement-breakpoint
CREATE INDEX "idx_sync_records_atom" ON "sync_records" USING btree ("atom_id");