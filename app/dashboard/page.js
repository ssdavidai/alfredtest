"use client";

import { useState, useEffect } from "react";
import ButtonAccount from "@/components/ButtonAccount";
import Quickstart from "@/components/Quickstart";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import apiClient from "@/libs/api";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
export default function Dashboard() {
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState(null);

  const fetchUserStatus = async () => {
    try {
      const data = await apiClient.get("/user/status");
      setUserStatus(data);
    } catch (error) {
      console.error("Failed to fetch user status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const handleApiKeyGenerated = (apiKey) => {
    setNewApiKey(apiKey);
    // Refresh status to get updated info
    fetchUserStatus();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
            <ButtonAccount />
          </div>
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </section>
      </main>
    );
  }

  const { hasAccess, vmStatus, vmSubdomain, maskedApiKey } = userStatus || {};

  // Determine which API key to display
  const displayApiKey = newApiKey || maskedApiKey;

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
          <ButtonAccount />
        </div>

        {/* No subscription - Show CTA */}
        {!hasAccess && (
          <>
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <h3 className="font-bold">Get started with Alfred</h3>
                <div className="text-sm">
                  Subscribe to provision your own Alfred instance and start automating your tasks.
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-2xl mb-2">Choose Your Plan</h2>
                <p className="text-base-content/70 mb-6">
                  Select a plan to get started with your Alfred instance
                </p>
                <div className="grid md:grid-cols-2 gap-4 w-full">
                  {config.stripe.plans.map((plan) => (
                    <div
                      key={plan.priceId}
                      className={`card bg-base-200 ${
                        plan.isFeatured ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="card-body">
                        <h3 className="card-title">
                          {plan.name}
                          {plan.isFeatured && (
                            <div className="badge badge-primary">Popular</div>
                          )}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          {plan.description}
                        </p>
                        <div className="my-4">
                          <span className="text-4xl font-bold">${plan.price}</span>
                          {plan.priceAnchor && (
                            <span className="text-base-content/50 line-through ml-2">
                              ${plan.priceAnchor}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <svg
                                className="w-4 h-4 text-success shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {feature.name}
                            </li>
                          ))}
                        </ul>
                        <ButtonCheckout priceId={plan.priceId} mode="payment" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* VM is provisioning - Show progress */}
        {hasAccess && vmStatus === "provisioning" && (
          <div className="alert alert-warning">
            <span className="loading loading-spinner"></span>
            <div>
              <h3 className="font-bold">Provisioning Your Alfred Instance</h3>
              <div className="text-sm">
                Your VM is being set up. This usually takes 3-5 minutes. You'll be able to access your credentials once the process is complete.
              </div>
            </div>
          </div>
        )}

        {/* VM is pending - Show info */}
        {hasAccess && vmStatus === "pending" && (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">VM Provisioning Queued</h3>
              <div className="text-sm">
                Your Alfred instance provisioning is in the queue. It will start shortly.
              </div>
            </div>
          </div>
        )}

        {/* VM has error - Show error */}
        {hasAccess && vmStatus === "error" && (
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
              <h3 className="font-bold">VM Provisioning Error</h3>
              <div className="text-sm">
                There was an error provisioning your VM. Please contact support for assistance.
              </div>
            </div>
          </div>
        )}

        {/* VM is ready - Show Quickstart */}
        {hasAccess && vmStatus === "ready" && (
          <>
            <div className="alert alert-success">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Your Alfred Instance is Ready!</h3>
                <div className="text-sm">
                  Use the credentials below to connect to your instance.
                </div>
              </div>
            </div>

            <Quickstart
              subdomain={vmSubdomain}
              apiKey={displayApiKey}
              vmStatus={vmStatus}
              onApiKeyGenerated={handleApiKeyGenerated}
            />
          </>
        )}
      </section>
    </main>
  );
}
