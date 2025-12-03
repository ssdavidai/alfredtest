"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/libs/api";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "badge-success";
      case "running":
      case "in_progress":
        return "badge-info";
      case "failed":
      case "error":
        return "badge-error";
      case "pending":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className={`badge ${getStatusColor()} badge-lg`}>
      {status || "Unknown"}
    </div>
  );
};

// Trace step item component with accordion
const TraceStepItem = ({ step, index, isOpen, toggleOpen }) => {
  return (
    <div className="collapse collapse-arrow bg-base-200 rounded-lg">
      <input
        type="checkbox"
        checked={isOpen}
        onChange={toggleOpen}
        className="peer"
      />
      <div className="collapse-title text-lg font-medium flex items-center gap-3">
        <span className="badge badge-primary badge-sm">{index + 1}</span>
        <span>{step.name || step.type || `Step ${index + 1}`}</span>
        {step.duration && (
          <span className="text-sm text-base-content-secondary ml-auto">
            {step.duration}ms
          </span>
        )}
      </div>
      <div className="collapse-content">
        <div className="space-y-3 pt-2">
          {step.description && (
            <div>
              <h4 className="text-sm font-semibold text-base-content-secondary mb-1">
                Description
              </h4>
              <p className="text-sm">{step.description}</p>
            </div>
          )}

          {step.input && (
            <div>
              <h4 className="text-sm font-semibold text-base-content-secondary mb-1">
                Input
              </h4>
              <pre className="bg-base-300 p-3 rounded text-xs overflow-x-auto">
                {typeof step.input === "string"
                  ? step.input
                  : JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}

          {step.output && (
            <div>
              <h4 className="text-sm font-semibold text-base-content-secondary mb-1">
                Output
              </h4>
              <pre className="bg-base-300 p-3 rounded text-xs overflow-x-auto">
                {typeof step.output === "string"
                  ? step.output
                  : JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}

          {step.error && (
            <div>
              <h4 className="text-sm font-semibold text-error mb-1">Error</h4>
              <pre className="bg-error bg-opacity-10 text-error p-3 rounded text-xs overflow-x-auto">
                {typeof step.error === "string"
                  ? step.error
                  : JSON.stringify(step.error, null, 2)}
              </pre>
            </div>
          )}

          {step.metadata && (
            <div>
              <h4 className="text-sm font-semibold text-base-content-secondary mb-1">
                Metadata
              </h4>
              <pre className="bg-base-300 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(step.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Format duration from milliseconds
const formatDuration = (ms) => {
  if (!ms) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

// Calculate estimated cost based on token usage
const calculateCost = (tokens) => {
  if (!tokens) return "N/A";
  // Example pricing: $0.015 per 1K input tokens, $0.075 per 1K output tokens (Claude Sonnet 4.5 pricing)
  const inputCost = ((tokens.input || 0) / 1000) * 0.015;
  const outputCost = ((tokens.output || 0) / 1000) * 0.075;
  const total = inputCost + outputCost;
  return `$${total.toFixed(4)}`;
};

export default function ExecutionDetailView({ executionId }) {
  const router = useRouter();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSteps, setOpenSteps] = useState({});

  useEffect(() => {
    fetchExecution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionId]);

  const fetchExecution = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get(`/proxy/vm/executions/${executionId}`);
      setExecution(data);
      // Open first step by default
      if (data.trace?.length > 0) {
        setOpenSteps({ 0: true });
      }
    } catch (err) {
      console.error("Failed to fetch execution:", err);
      setError(err.message || "Failed to load execution details");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (index) => {
    setOpenSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content-secondary">Loading execution details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card bg-error bg-opacity-10 max-w-md">
          <div className="card-body">
            <h2 className="card-title text-error">Error Loading Execution</h2>
            <p className="text-base-content-secondary">{error}</p>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-ghost"
                onClick={() => router.push("/dashboard/executions")}
              >
                Back to Executions
              </button>
              <button className="btn btn-primary" onClick={fetchExecution}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-base-content-secondary">Execution not found</p>
          <button
            className="btn btn-ghost mt-4"
            onClick={() => router.push("/dashboard/executions")}
          >
            Back to Executions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/dashboard/executions")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Executions
        </button>
      </div>

      {/* Execution Header */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {execution.skillName || execution.skill || "Unknown Skill"}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={execution.status} />
                <div className="badge badge-outline">
                  Duration: {formatDuration(execution.duration)}
                </div>
                {execution.createdAt && (
                  <div className="text-sm text-base-content-secondary">
                    {new Date(execution.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat place-items-center">
                <div className="stat-title">Tokens</div>
                <div className="stat-value text-2xl">
                  {(execution.tokens?.total ||
                    (execution.tokens?.input || 0) +
                      (execution.tokens?.output || 0) ||
                    0).toLocaleString()}
                </div>
                <div className="stat-desc">
                  Est. Cost: {calculateCost(execution.tokens)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      {execution.input && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl">Input</h2>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-x-auto">
              {typeof execution.input === "string"
                ? execution.input
                : JSON.stringify(execution.input, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Output Section */}
      {execution.output && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl">Output</h2>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-x-auto">
              {typeof execution.output === "string"
                ? execution.output
                : JSON.stringify(execution.input, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Trace/Steps Section */}
      {execution.trace && execution.trace.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-xl">Execution Trace</h2>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    const allOpen = {};
                    execution.trace.forEach((_, idx) => {
                      allOpen[idx] = true;
                    });
                    setOpenSteps(allOpen);
                  }}
                >
                  Expand All
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setOpenSteps({})}
                >
                  Collapse All
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {execution.trace.map((step, index) => (
                <TraceStepItem
                  key={index}
                  step={step}
                  index={index}
                  isOpen={openSteps[index] || false}
                  toggleOpen={() => toggleStep(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Steps Section (alternative field name) */}
      {execution.steps && execution.steps.length > 0 && !execution.trace && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-xl">Execution Steps</h2>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    const allOpen = {};
                    execution.steps.forEach((_, idx) => {
                      allOpen[idx] = true;
                    });
                    setOpenSteps(allOpen);
                  }}
                >
                  Expand All
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setOpenSteps({})}
                >
                  Collapse All
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {execution.steps.map((step, index) => (
                <TraceStepItem
                  key={index}
                  step={step}
                  index={index}
                  isOpen={openSteps[index] || false}
                  toggleOpen={() => toggleStep(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {execution.metadata && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl">Metadata</h2>
            <pre className="bg-base-200 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(execution.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Token Breakdown */}
      {execution.tokens && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-xl">Token Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Input Tokens</div>
                <div className="stat-value text-primary">
                  {(execution.tokens.input || 0).toLocaleString()}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Output Tokens</div>
                <div className="stat-value text-secondary">
                  {(execution.tokens.output || 0).toLocaleString()}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Total Cost</div>
                <div className="stat-value text-accent">
                  {calculateCost(execution.tokens)}
                </div>
                <div className="stat-desc">Estimated</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
