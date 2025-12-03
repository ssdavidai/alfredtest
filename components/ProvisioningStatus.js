"use client";
import { useState, useEffect } from "react";

export default function ProvisioningStatus({ initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "ready" || status === "error") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/user/status");
        const data = await res.json();
        setStatus(data.vmStatus);

        // Estimate progress
        if (data.vmStatus === "provisioning") {
          setProgress((prev) => Math.min(prev + 10, 90));
        } else if (data.vmStatus === "ready") {
          setProgress(100);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  if (status === "ready") return null;

  const messages = {
    pending: "Preparing your AI automation environment...",
    provisioning: "Setting up your dedicated VM (this takes ~3 minutes)...",
    error: "There was an issue provisioning your VM. Please contact support.",
  };

  const steps = [
    { label: "Creating VM", done: progress > 20 },
    { label: "Installing Docker", done: progress > 40 },
    { label: "Configuring services", done: progress > 60 },
    { label: "Setting up DNS", done: progress > 80 },
    { label: "Final checks", done: progress === 100 },
  ];

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">
          {status === "error" ? "⚠️ Setup Issue" : "🚀 Setting Up Your Environment"}
        </h2>
        <p className={status === "error" ? "text-error" : ""}>
          {messages[status] || messages.pending}
        </p>

        {status !== "error" && (
          <>
            <progress
              className="progress progress-primary w-full"
              value={progress}
              max="100"
            />
            <ul className="steps steps-vertical mt-4">
              {steps.map((step, i) => (
                <li key={i} className={\`step \${step.done ? "step-primary" : ""}\`}>
                  {step.label}
                </li>
              ))}
            </ul>
          </>
        )}

        {status === "error" && (
          <button
            className="btn btn-primary mt-4"
            onClick={() => window.location.reload()}
          >
            Retry Setup
          </button>
        )}
      </div>
    </div>
  );
}
