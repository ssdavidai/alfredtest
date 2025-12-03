"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { format } from "date-fns";

// Status badge configuration
const statusConfig = {
  pending: { label: "Pending", badgeClass: "badge-warning" },
  running: { label: "Running", badgeClass: "badge-info" },
  completed: { label: "Completed", badgeClass: "badge-success" },
  failed: { label: "Failed", badgeClass: "badge-error" },
  cancelled: { label: "Cancelled", badgeClass: "badge-ghost" },
};

// Format date for display
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy HH:mm:ss");
  } catch {
    return "-";
  }
};

// Format duration
const formatDuration = (ms) => {
  if (!ms || ms < 0) return "-";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  if (seconds > 0) return `${seconds}s`;
  return `${ms}ms`;
};

// JSON Viewer component for displaying structured data
const JsonViewer = ({ data, label }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className="mt-2">
      <button
        className="btn btn-xs btn-ghost gap-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        {label}
      </button>
      {isExpanded && (
        <pre className="mt-2 p-3 bg-base-300 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
          <code>{jsonString}</code>
        </pre>
      )}
    </div>
  );
};

// Step trace component
const StepTrace = ({ step, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const stepStatus = step.status || "completed";
  const config = statusConfig[stepStatus] || statusConfig.pending;

  return (
    <div className="border-l-2 border-base-300 pl-4 py-2">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">Step {index + 1}: {step.name || step.type || "Unnamed"}</span>
        <div className={`badge badge-sm ${config.badgeClass}`}>{config.label}</div>
        {step.duration && (
          <span className="text-xs text-base-content/50">{formatDuration(step.duration)}</span>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 pl-6 space-y-2">
          {/* Step timestamps */}
          {step.startedAt && (
            <p className="text-xs text-base-content/60">
              Started: {formatDateTime(step.startedAt)}
            </p>
          )}
          {step.completedAt && (
            <p className="text-xs text-base-content/60">
              Completed: {formatDateTime(step.completedAt)}
            </p>
          )}

          {/* Step input */}
          {step.input && <JsonViewer data={step.input} label="Input" />}

          {/* Step output */}
          {step.output && <JsonViewer data={step.output} label="Output" />}

          {/* Step error */}
          {step.error && (
            <div className="p-2 bg-error/10 rounded text-error text-sm">
              <strong>Error:</strong> {step.error.message || step.error}
            </div>
          )}

          {/* Step logs */}
          {step.logs && step.logs.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium">Logs:</span>
              <div className="mt-1 p-2 bg-base-300 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {step.logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    {typeof log === "string" ? log : JSON.stringify(log)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExecutionDetailModal = ({ execution, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!execution) return null;

  const status = execution.status || "pending";
  const config = statusConfig[status] || statusConfig.pending;

  const duration =
    execution.startedAt && execution.completedAt
      ? new Date(execution.completedAt) - new Date(execution.startedAt)
      : execution.duration || null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-focus bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start md:items-center justify-center p-2 md:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden transform text-left align-middle shadow-xl transition-all rounded-xl bg-base-100">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-base-300">
                  <div>
                    <Dialog.Title as="h2" className="text-xl font-bold">
                      Execution Details
                    </Dialog.Title>
                    <p className="text-xs text-base-content/50 font-mono mt-1">
                      {execution._id || execution.id}
                    </p>
                  </div>
                  <button
                    className="btn btn-square btn-ghost btn-sm"
                    onClick={onClose}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="tabs tabs-boxed bg-base-200 mx-4 mt-4 md:mx-6">
                  <button
                    className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`tab ${activeTab === "trace" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("trace")}
                  >
                    Trace ({execution.steps?.length || 0})
                  </button>
                  <button
                    className={`tab ${activeTab === "io" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("io")}
                  >
                    Input/Output
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      {/* Status Card */}
                      <div className="card bg-base-200">
                        <div className="card-body p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-xs text-base-content/50">Status</span>
                              <div className={`badge ${config.badgeClass} mt-1`}>
                                {config.label}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-base-content/50">Duration</span>
                              <p className="font-medium">{formatDuration(duration)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-base-content/50">Steps</span>
                              <p className="font-medium">{execution.steps?.length || 0}</p>
                            </div>
                            <div>
                              <span className="text-xs text-base-content/50">Workflow</span>
                              <p className="font-medium truncate">
                                {execution.workflowName || execution.workflowId || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="card bg-base-200">
                        <div className="card-body p-4">
                          <h3 className="font-semibold mb-2">Timestamps</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-base-content/50">Created:</span>
                              <p>{formatDateTime(execution.createdAt)}</p>
                            </div>
                            <div>
                              <span className="text-base-content/50">Started:</span>
                              <p>{formatDateTime(execution.startedAt)}</p>
                            </div>
                            <div>
                              <span className="text-base-content/50">Completed:</span>
                              <p>{formatDateTime(execution.completedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Error (if failed) */}
                      {status === "failed" && execution.error && (
                        <div className="alert alert-error">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <h4 className="font-bold">Execution Failed</h4>
                            <p>{execution.error.message || execution.error}</p>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {execution.metadata && (
                        <div className="card bg-base-200">
                          <div className="card-body p-4">
                            <h3 className="font-semibold mb-2">Metadata</h3>
                            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
                              {JSON.stringify(execution.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trace Tab */}
                  {activeTab === "trace" && (
                    <div className="space-y-2">
                      {execution.steps && execution.steps.length > 0 ? (
                        execution.steps.map((step, index) => (
                          <StepTrace key={step.id || index} step={step} index={index} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-base-content/50">
                          No steps recorded for this execution.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input/Output Tab */}
                  {activeTab === "io" && (
                    <div className="space-y-4">
                      {/* Input */}
                      <div className="card bg-base-200">
                        <div className="card-body p-4">
                          <h3 className="font-semibold mb-2">Input</h3>
                          {execution.input ? (
                            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                              {typeof execution.input === "string"
                                ? execution.input
                                : JSON.stringify(execution.input, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-base-content/50 text-sm">No input provided</p>
                          )}
                        </div>
                      </div>

                      {/* Output */}
                      <div className="card bg-base-200">
                        <div className="card-body p-4">
                          <h3 className="font-semibold mb-2">Output</h3>
                          {execution.output ? (
                            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                              {typeof execution.output === "string"
                                ? execution.output
                                : JSON.stringify(execution.output, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-base-content/50 text-sm">No output yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ExecutionDetailModal;
