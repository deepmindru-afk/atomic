import { useState } from "react";

interface Props {
  onAdd: (url: string, tagName?: string) => Promise<void>;
}

export function AddFeedForm({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onAdd(url, tagName || undefined);
      setUrl("");
      setTagName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Feed URL"
          required
          className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:border-purple-500"
        />
        <input
          type="text"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Tag (optional)"
          className="w-48 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
        >
          {loading ? "Adding..." : "Add Feed"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
