import { useState, useEffect } from "react";
import type { ConnectionInfo } from "@atomic-sync/shared";
import { listConnections } from "./lib/api.js";
import { ConnectPage } from "./pages/ConnectPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";

export function App() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);

  const loadConnections = async () => {
    try {
      const conns = await listConnections();
      setConnections(conns);
      // Auto-select if there's a connection ID in the URL
      const match = window.location.pathname.match(/\/connections\/(.+)/);
      if (match) {
        setSelectedConnectionId(match[1]);
      } else if (conns.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(conns[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <h1 className="text-lg font-semibold text-white">Atomic Sync</h1>
          {connections.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                value={selectedConnectionId ?? ""}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-sm"
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.atomicUrl}
                  </option>
                ))}
              </select>
              <ConnectButton onConnected={loadConnections} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {selectedConnectionId ? (
          <DashboardPage
            connectionId={selectedConnectionId}
            onDisconnected={loadConnections}
          />
        ) : (
          <ConnectPage onConnected={loadConnections} />
        )}
      </main>
    </div>
  );
}

function ConnectButton({ onConnected }: { onConnected: () => void }) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm text-purple-400 hover:text-purple-300"
      >
        + Connect
      </button>
    );
  }

  return (
    <ConnectPage
      inline
      onConnected={() => {
        setShowForm(false);
        onConnected();
      }}
    />
  );
}
