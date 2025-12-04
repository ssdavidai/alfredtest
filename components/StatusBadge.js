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
    running: "badge-info animate-pulse",
    completed: "badge-success",
    failed: "badge-error",
  };

  return (
    <span className={`badge ${styles[status] || "badge-ghost"}`}>
      {status}
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
