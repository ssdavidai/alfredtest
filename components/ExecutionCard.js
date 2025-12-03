"use client";

import { formatDistanceToNow } from "date-fns";

// Status configuration for styling and labels
const statusConfig = {
  pending: {
    label: "Pending",
    badgeClass: "badge-warning",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  running: {
    label: "Running",
    badgeClass: "badge-info",
    icon: (
      <span className="loading loading-spinner loading-xs"></span>
    ),
  },
  completed: {
    label: "Completed",
    badgeClass: "badge-success",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  failed: {
    label: "Failed",
    badgeClass: "badge-error",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "badge-ghost",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
    ),
  },
};

// Format duration in human-readable format
const formatDuration = (ms) => {
  if (!ms || ms < 0) return "-";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${ms}ms`;
  }
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "-";
  }
};

const ExecutionCard = ({ execution, onViewDetails }) => {
  const status = execution.status || "pending";
  const config = statusConfig[status] || statusConfig.pending;

  // Calculate duration if we have start and end times
  const duration =
    execution.startedAt && execution.completedAt
      ? new Date(execution.completedAt) - new Date(execution.startedAt)
      : execution.duration || null;

  return (
    <div className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Left: Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">
                {execution.name || execution.workflowName || "Unnamed Execution"}
              </h3>
              <div className={`badge ${config.badgeClass} gap-1`}>
                {config.icon}
                {config.label}
              </div>
            </div>

            {/* Execution ID */}
            <p className="text-xs text-base-content/50 mt-1 font-mono truncate">
              ID: {execution._id || execution.id}
            </p>

            {/* Workflow info if available */}
            {execution.workflowId && (
              <p className="text-sm text-base-content/70 mt-2">
                Workflow: {execution.workflowId}
              </p>
            )}

            {/* Input preview if available */}
            {execution.input && (
              <p className="text-sm text-base-content/60 mt-2 truncate">
                Input: {typeof execution.input === "string"
                  ? execution.input
                  : JSON.stringify(execution.input).slice(0, 100)}
                {JSON.stringify(execution.input).length > 100 ? "..." : ""}
              </p>
            )}

            {/* Error message for failed executions */}
            {status === "failed" && execution.error && (
              <div className="mt-2 p-2 bg-error/10 rounded text-error text-sm">
                {execution.error.message || execution.error}
              </div>
            )}
          </div>

          {/* Right: Meta Info & Actions */}
          <div className="flex flex-col items-start sm:items-end gap-2 min-w-fit">
            {/* Timestamps */}
            <div className="text-sm text-base-content/60">
              <span title={execution.createdAt}>
                Created {formatDate(execution.createdAt)}
              </span>
            </div>

            {/* Duration */}
            {duration !== null && (
              <div className="text-sm text-base-content/60">
                Duration: {formatDuration(duration)}
              </div>
            )}

            {/* Steps count if available */}
            {execution.steps && (
              <div className="text-sm text-base-content/60">
                {execution.steps.length} step{execution.steps.length !== 1 ? "s" : ""}
              </div>
            )}

            {/* View Details Button */}
            <button
              className="btn btn-sm btn-primary mt-2"
              onClick={() => onViewDetails(execution)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionCard;
