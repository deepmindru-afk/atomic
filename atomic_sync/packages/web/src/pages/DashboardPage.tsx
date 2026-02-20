import { useState, useEffect } from "react";
import type { FeedWithStats } from "@atomic-sync/shared";
import { listFeeds, createFeed, deleteFeed, updateFeed, syncFeedNow } from "../lib/api.js";
import { AddFeedForm } from "../components/AddFeedForm.js";
import { FeedCard } from "../components/FeedCard.js";

interface Props {
  connectionId: string;
  onDisconnected: () => void;
}

export function DashboardPage({ connectionId }: Props) {
  const [feeds, setFeeds] = useState<FeedWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeds = async () => {
    try {
      const data = await listFeeds(connectionId);
      setFeeds(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, [connectionId]);

  const handleAddFeed = async (url: string, tagName?: string) => {
    await createFeed(connectionId, { url, tagName });
    await loadFeeds();
  };

  const handleDeleteFeed = async (id: string) => {
    await deleteFeed(id);
    await loadFeeds();
  };

  const handleToggleFeed = async (id: string, enabled: boolean) => {
    await updateFeed(id, { enabled });
    await loadFeeds();
  };

  const handleSyncNow = async (id: string) => {
    await syncFeedNow(id);
    // Poll briefly to show updated status
    setTimeout(loadFeeds, 2000);
  };

  if (loading) {
    return <p className="text-neutral-400">Loading feeds...</p>;
  }

  return (
    <div className="space-y-6">
      <AddFeedForm onAdd={handleAddFeed} />

      {feeds.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p>No feeds configured yet.</p>
          <p className="text-sm mt-1">Add an RSS feed URL above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onDelete={() => handleDeleteFeed(feed.id)}
              onToggle={(enabled) => handleToggleFeed(feed.id, enabled)}
              onSyncNow={() => handleSyncNow(feed.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
