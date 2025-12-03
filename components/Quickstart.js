"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/libs/api";

const Quickstart = ({ subdomain, apiKey, vmStatus, onApiKeyGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const mcpUrl = subdomain ? `mcp://${subdomain}.alfredos.site` : "";
  const webhookUrl = subdomain ? `https://${subdomain}.alfredos.site/webhook` : "";

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", err);
    }
  };

  const generateNewApiKey = async () => {
    if (
      !confirm(
        "This will generate a new API key and invalidate the old one. Continue?"
      )
    ) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiClient.post("/user/api-key");
      toast.success("New API key generated successfully!");

      // Notify parent to refresh the data
      if (onApiKeyGenerated) {
        onApiKeyGenerated(response.apiKey);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to generate API key");
      console.error("API key generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-4">
          Quick Start
        </h2>
        <p className="text-base-content/70 mb-6">
          Use these credentials to connect your Alfred instance.
        </p>

        <div className="space-y-4">
          {/* MCP Connection URL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">MCP Connection URL</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                value={mcpUrl}
                readOnly
                className="input input-bordered join-item flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(mcpUrl, "MCP URL")}
                className="btn btn-primary join-item"
                data-tooltip-id="tooltip"
                data-tooltip-content="Copy to clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Webhook URL</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="input input-bordered join-item flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                className="btn btn-primary join-item"
                data-tooltip-id="tooltip"
                data-tooltip-content="Copy to clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">API Key</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                value={apiKey || "No API key generated"}
                readOnly
                className="input input-bordered join-item flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(apiKey, "API Key")}
                className="btn btn-primary join-item"
                disabled={!apiKey}
                data-tooltip-id="tooltip"
                data-tooltip-content="Copy to clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            {apiKey && (
              <label className="label">
                <span className="label-text-alt text-warning">
                  Keep your API key secure. It won't be shown in full again after you leave this page.
                </span>
              </label>
            )}
          </div>

          {/* Generate New Key Button */}
          <div className="card-actions justify-end mt-4">
            <button
              onClick={generateNewApiKey}
              className="btn btn-outline btn-warning"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Generate New Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quickstart;
