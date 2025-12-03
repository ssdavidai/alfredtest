"use client";

import { useState } from "react";
import ConnectionCard from "@/components/ConnectionCard";
import AddConnectionModal from "@/components/AddConnectionModal";

// Mock data for demonstration
const MOCK_CONNECTIONS = [
  {
    id: "1",
    name: "Production API",
    type: "api",
    status: "connected",
    description: "Main production API endpoint",
    lastSync: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Analytics Database",
    type: "database",
    status: "connected",
    description: "PostgreSQL analytics database",
    lastSync: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    name: "Payment Webhook",
    type: "webhook",
    status: "pending",
    description: "Stripe payment notifications",
    lastSync: null,
  },
  {
    id: "4",
    name: "Legacy System",
    type: "api",
    status: "disconnected",
    description: "Deprecated API - scheduled for removal",
    lastSync: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Connections dashboard page - lists all connections with their status
export default function ConnectionsPage() {
  const [connections, setConnections] = useState(MOCK_CONNECTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const filteredConnections = connections.filter((conn) => {
    if (filter === "all") return true;
    return conn.status === filter;
  });

  const statusCounts = {
    all: connections.length,
    connected: connections.filter((c) => c.status === "connected").length,
    pending: connections.filter((c) => c.status === "pending").length,
    disconnected: connections.filter((c) => c.status === "disconnected").length,
  };

  const handleAddConnection = (newConnection) => {
    setConnections((prev) => [
      ...prev,
      { ...newConnection, id: Date.now().toString() },
    ]);
  };

  const handleEditConnection = (connection) => {
    console.log("Edit connection:", connection);
    // TODO: Implement edit functionality
  };

  const handleDeleteConnection = (connection) => {
    if (window.confirm(`Are you sure you want to delete "${connection.name}"?`)) {
      setConnections((prev) => prev.filter((c) => c.id !== connection.id));
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Connections</h1>
            <p className="text-base-content/70 mt-1">
              Manage your integrations and API connections
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
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

        {/* Status Filter Tabs */}
        <div className="tabs tabs-boxed mb-6 inline-flex">
          {["all", "connected", "pending", "disconnected"].map((status) => (
            <button
              key={status}
              className={`tab ${filter === status ? "tab-active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="badge badge-sm ml-2">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        {/* Connections Grid */}
        {filteredConnections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onEdit={handleEditConnection}
                onDelete={handleDeleteConnection}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="w-16 h-16 mx-auto text-base-content/30"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-base-content/70">
              No connections found
            </h3>
            <p className="text-base-content/50 mt-1">
              {filter === "all"
                ? "Add your first connection to get started"
                : `No ${filter} connections`}
            </p>
            {filter === "all" && (
              <button
                className="btn btn-primary mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Add Connection
              </button>
            )}
          </div>
        )}

        {/* Add Connection Modal */}
        <AddConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddConnection}
        />
      </div>
    </main>
  );
}
