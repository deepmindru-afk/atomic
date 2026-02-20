import { useState } from "react";
import { startOAuth } from "../lib/api.js";

interface Props {
  onConnected: () => void;
  inline?: boolean;
}

export function ConnectPage({ onConnected, inline }: Props) {
  const [atomicUrl, setAtomicUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { authUrl } = await startOAuth(atomicUrl);
      // Redirect to atomic's OAuth consent page
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setLoading(false);
    }
  };

  const content = (
    <form onSubmit={handleConnect} className="flex gap-2">
      <input
        type="url"
        value={atomicUrl}
        onChange={(e) => setAtomicUrl(e.target.value)}
        placeholder="https://your-atomic-instance.com"
        required
        className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:border-purple-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
      >
        {loading ? "Connecting..." : "Connect"}
      </button>
    </form>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Connect your Atomic instance
        </h2>
        <p className="text-neutral-400">
          Enter your Atomic server URL to get started
        </p>
      </div>

      <div className="w-full max-w-md">
        {content}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
