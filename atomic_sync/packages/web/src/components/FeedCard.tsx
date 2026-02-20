import { useState } from "react";
import type { FeedWithStats } from "@atomic-sync/shared";

interface Props {
  feed: FeedWithStats;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  onSyncNow: () => Promise<void>;
}

export function FeedCard({ feed, onDelete, onToggle, onSyncNow }: Props) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncNow();
    } finally {
      setSyncing(false);
    }
  };
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-medium truncate">
            {feed.title || feed.url}
          </h3>
          {feed.title && (
            <p className="text-sm text-neutral-400 truncate">{feed.url}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
            {feed.tagName && (
              <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">
                {feed.tagName}
              </span>
            )}
            <span>{feed.syncedItemCount} items synced</span>
            <span>every {feed.pollIntervalMinutes}m</span>
            {feed.lastSyncedAt && (
              <span>
                last sync: {new Date(feed.lastSyncedAt).toLocaleString()}
              </span>
            )}
          </div>
          {feed.lastError && (
            <p className="text-xs text-red-400 mt-1">{feed.lastError}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync now"}
          </button>
          <button
            onClick={() => onToggle(!feed.enabled)}
            className={`text-xs px-2 py-1 rounded ${
              feed.enabled
                ? "bg-green-600/20 text-green-300"
                : "bg-neutral-700 text-neutral-400"
            }`}
          >
            {feed.enabled ? "Active" : "Paused"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
