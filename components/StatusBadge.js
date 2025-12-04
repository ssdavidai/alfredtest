export function VmStatusBadge({ status }) {
  const styles = {
    pending: "badge-warning",
    provisioning: "badge-info",
    ready: "badge-success",
    error: "badge-error",
  };

  const labels = {
    pending: "Pending",
    provisioning: "Provisioning...",
    ready: "Ready",
    error: "Error",
  };

  return (
    <span className={`badge ${styles[status] || "badge-ghost"}`}>
      {labels[status] || status}
    </span>
  );
}

export function ExecutionStatusBadge({ status }) {
  const styles = {
    running: "badge-warning animate-pulse",
    in_progress: "badge-warning animate-pulse",
    completed: "badge-success",
    success: "badge-success",
    failed: "badge-error",
    error: "badge-error",
    pending: "badge-info",
  };

  const labels = {
    running: "Running",
    in_progress: "Running",
    completed: "Completed",
    success: "Completed",
    failed: "Failed",
    error: "Failed",
    pending: "Pending",
  };

  const normalizedStatus = status?.toLowerCase();

  return (
    <span className={`badge badge-lg ${styles[normalizedStatus] || "badge-ghost"}`}>
      {labels[normalizedStatus] || status || "Unknown"}
    </span>
  );
}

export function ConnectionStatusBadge({ isActive }) {
  return (
    <span className={`badge ${isActive ? "badge-success" : "badge-ghost"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function SubscriptionBadge({ hasAccess }) {
  return (
    <span className={`badge ${hasAccess ? "badge-primary" : "badge-ghost"}`}>
      {hasAccess ? "Pro" : "Free"}
    </span>
  );
}
