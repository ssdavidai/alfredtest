"use client";

import { useState, useEffect } from "react";
import ButtonAccount from "@/components/ButtonAccount";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - will connect to /api/proxy/vm/connections later
      const mockConnections = [
        {
          id: "1",
          name: "LibreChat",
          type: "mcp_http",
          status: "active",
          url: "https://cozy-peanut.alfredos.site/librechat",
          isSystem: true,
        },
        {
          id: "2",
          name: "NocoDB",
          type: "mcp_stdio",
          status: "active",
          url: "https://cozy-peanut.alfredos.site/nocodb",
          isSystem: true,
        },
      ];

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConnections(mockConnections);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (connectionId, connectionName) => {
    if (
      !confirm(`Are you sure you want to delete the "${connectionName}" connection?`)
    ) {
      return;
    }

    setIsDeletingId(connectionId);
    try {
      // TODO: Implement API call to delete connection
      // await apiClient.delete(`/proxy/vm/connections/${connectionId}`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Remove from state
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
    } catch (error) {
      console.error("Failed to delete connection:", error);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleOpen = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getStatusColor = (status) => {
    return status === "active" ? "bg-success" : "bg-error";
  };

  const getTypeBadge = (type) => {
    const badges = {
      mcp_stdio: "MCP Local",
      mcp_http: "MCP Remote",
      http_api: "HTTP API",
    };
    return badges[type] || type;
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              Connections
            </h1>
            <p className="text-base-content/70">
              Manage your integrations and services
            </p>
          </div>
          <ButtonAccount />
        </div>

        {/* Add Connection Button */}
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => alert("Add Connection feature coming soon!")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Connection
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Connections List */}
        {!isLoading && connections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-base-content/50 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mx-auto mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              <p className="text-lg font-medium">No connections yet</p>
              <p className="text-sm">Add your first connection to get started</p>
            </div>
          </div>
        )}

        {!isLoading && connections.length > 0 && (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    {/* Connection Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className="mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            connection.status
                          )}`}
                          title={connection.status}
                        ></div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="card-title text-xl">
                            {connection.name}
                          </h2>
                          <span className="badge badge-sm badge-outline">
                            {getTypeBadge(connection.type)}
                          </span>
                          {connection.isSystem && (
                            <span className="badge badge-sm badge-info">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/70">
                          Status:{" "}
                          <span
                            className={`font-medium ${
                              connection.status === "active"
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {connection.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {connection.url && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpen(connection.url)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Open
                        </button>
                      )}
                      {!connection.isSystem && (
                        <button
                          className="btn btn-sm btn-error btn-outline"
                          onClick={() => handleDelete(connection.id, connection.name)}
                          disabled={isDeletingId === connection.id}
                        >
                          {isDeletingId === connection.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
