import type {
  ConnectionInfo,
  FeedWithStats,
  CreateFeedRequest,
  UpdateFeedRequest,
  OAuthStartResponse,
} from "@atomic-sync/shared";

const BASE = "/api";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json() as Promise<T>;
}

// Auth
export async function startOAuth(
  atomicUrl: string,
): Promise<OAuthStartResponse> {
  return request("POST", "/auth/connect", { atomicUrl });
}

export async function listConnections(): Promise<ConnectionInfo[]> {
  return request("GET", "/auth/connections");
}

export async function deleteConnection(id: string): Promise<void> {
  await request("DELETE", `/auth/connections/${id}`);
}

// Feeds
export async function listFeeds(
  connectionId: string,
): Promise<FeedWithStats[]> {
  return request("GET", `/connections/${connectionId}/feeds`);
}

export async function createFeed(
  connectionId: string,
  data: Omit<CreateFeedRequest, "connectionId">,
): Promise<FeedWithStats> {
  return request("POST", `/connections/${connectionId}/feeds`, data);
}

export async function updateFeed(
  id: string,
  data: UpdateFeedRequest,
): Promise<FeedWithStats> {
  return request("PATCH", `/feeds/${id}`, data);
}

export async function deleteFeed(id: string): Promise<void> {
  await request("DELETE", `/feeds/${id}`);
}

export async function syncFeedNow(id: string): Promise<void> {
  await request("POST", `/feeds/${id}/sync`);
}
