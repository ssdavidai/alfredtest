"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ButtonAccount from "@/components/ButtonAccount";
import AnthropicKeyModal from "@/components/AnthropicKeyModal";
import Quickstart from "@/components/Quickstart";
import ProvisioningStatus from "@/components/ProvisioningStatus";
import apiClient from "@/libs/api";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user status and config on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch user status (vmStatus, vmSubdomain, etc.)
      const status = await apiClient.get("/user/status");
      setUserStatus(status);

      // Only fetch VM config if VM is ready
      if (status.vmStatus === "ready") {
        try {
          const config = await apiClient.get("/proxy/vm/config");
          setConfigStatus(config);

          // Auto-open modal if API key is not set
          if (!config.has_anthropic_key) {
            setIsModalOpen(true);
          }
        } catch (error) {
          console.error("Error checking VM config:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    // Refresh the config status after successful save
    fetchDashboardData();
  };

  const handleApiKeyGenerated = (newApiKey) => {
    setApiKey(newApiKey);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          <ButtonAccount />
          <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </section>
      </main>
    );
  }

  // Show provisioning status only if user has access AND VM is not ready
  const showProvisioning = userStatus?.hasAccess && userStatus?.vmStatus && userStatus.vmStatus !== "ready";

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>

        {/* VM Provisioning Status (shown while VM is being set up) */}
        {showProvisioning && (
          <ProvisioningStatus initialStatus={userStatus.vmStatus} />
        )}

        {/* Quickstart (shown when VM is ready) */}
        {userStatus?.vmStatus === "ready" && (
          <Quickstart
            subdomain={userStatus.vmSubdomain}
            apiKey={apiKey || userStatus.maskedApiKey}
            onApiKeyGenerated={handleApiKeyGenerated}
          />
        )}

        {/* API Key Configuration Section (shown when VM is ready) */}
        {userStatus?.vmStatus === "ready" && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Anthropic API Configuration</h2>

              {configStatus?.has_anthropic_key ? (
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
        )}

        {/* No subscription message */}
        {!userStatus?.hasAccess && !showProvisioning && (
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <h2 className="card-title justify-center">Get Started with Alfred</h2>
              <p className="text-base-content/70">
                Subscribe to get your dedicated AI automation VM with LibreChat, NocoDB, and unlimited MCP connections.
              </p>
              <div className="card-actions justify-center mt-4">
                <Link href="/#pricing" className="btn btn-primary">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        )}
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
