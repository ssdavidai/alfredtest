"use client";
import { useState } from "react";

export default function TeachSkillModal({ isOpen, onClose, onSuccess }) {
  const [prompt, setPrompt] = useState("");
  const [skillName, setSkillName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/skills/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, name: skillName }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create skill");

      onSuccess?.(data);
      onClose();
      setPrompt("");
      setSkillName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Teach Alfred a New Skill</h3>
        <p className="py-2 text-sm opacity-70">
          Describe what you want Alfred to do in natural language
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Skill Name (optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Weekly Report Generator"
              className="input input-bordered w-full"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">What should this skill do?</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32"
              placeholder="e.g., Every Monday, read my Notion database of tasks, summarize completed items, and post a summary to Slack..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !prompt}
            >
              {isLoading ? <span className="loading loading-spinner" /> : "Create Skill"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
