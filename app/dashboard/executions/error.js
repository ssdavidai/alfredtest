"use client";

export default function ExecutionsError({ error, reset }) {
  return (
    <div className="alert alert-error">
      <div className="flex-1">
        <span className="font-bold">Failed to load executions</span>
        <p className="text-sm">{error?.message}</p>
      </div>
      <button onClick={reset} className="btn btn-sm">Retry</button>
    </div>
  );
}
