// A connected atomic instance
export interface Connection {
  id: string;
  atomicUrl: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// An RSS feed configured for sync
export interface Feed {
  id: string;
  connectionId: string;
  url: string;
  title: string | null;
  tagName: string | null; // tag to apply to synced atoms in atomic
  pollIntervalMinutes: number;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

// Record of a synced item (for deduplication)
export interface SyncRecord {
  id: string;
  feedId: string;
  guid: string;
  atomId: string; // ID of the created atom in the user's atomic instance
  syncedAt: string;
}

// API request/response types
export interface CreateFeedRequest {
  connectionId: string;
  url: string;
  tagName?: string;
  pollIntervalMinutes?: number;
}

export interface UpdateFeedRequest {
  url?: string;
  tagName?: string;
  pollIntervalMinutes?: number;
  enabled?: boolean;
}

export interface FeedWithStats extends Feed {
  syncedItemCount: number;
}

export interface SyncStatus {
  feedId: string;
  feedTitle: string | null;
  feedUrl: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  syncedItemCount: number;
  enabled: boolean;
}

// OAuth types
export interface OAuthStartResponse {
  authUrl: string;
}

export interface ConnectionInfo {
  id: string;
  atomicUrl: string;
  connectedAt: string;
}
