"use client";

export default function DashboardError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="text-error text-6xl">⚠️</div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-base-content/70 text-center max-w-md">
        {error?.message || "An unexpected error occurred while loading the dashboard."}
      </p>
      <button onClick={reset} className="btn btn-primary">
        Try Again
      </button>
    </div>
  );
}
