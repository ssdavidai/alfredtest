"use client";

import { useState, useEffect } from "react";
import ButtonAccount from "@/components/ButtonAccount";
import AnthropicKeyModal from "@/components/AnthropicKeyModal";
import apiClient from "@/libs/api";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if API key is configured on mount
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      setIsLoading(true);
      const config = await apiClient.get("/proxy/vm/config");
      setConfigStatus(config);

      // Auto-open modal if API key is not set
      if (!config.has_anthropic_key) {
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error checking API key status:", error);
      // If we can't check, don't auto-open the modal
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    // Refresh the config status after successful save
    checkApiKeyStatus();
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>

        {/* API Key Configuration Section */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Anthropic API Configuration</h2>

            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Checking configuration...</span>
              </div>
            ) : configStatus?.has_anthropic_key ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">API key configured</span>
                </div>
                {configStatus.anthropic_key_masked && (
                  <div className="text-sm">
                    <span className="text-base-content/70">Current key: </span>
                    <span className="font-mono">{configStatus.anthropic_key_masked}</span>
                  </div>
                )}
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsModalOpen(true)}
                >
                  Update API Key
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">No API key configured</span>
                </div>
                <p className="text-sm text-base-content/70">
                  You need to configure your Anthropic API key to use Alfred&apos;s AI features.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Set API Key
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anthropic Key Modal */}
      <AnthropicKeyModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        existingKeyMasked={configStatus?.anthropic_key_masked}
        onSaveSuccess={handleSaveSuccess}
      />
    </main>
  );
}
