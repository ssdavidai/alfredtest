"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import apiClient from "@/libs/api";

const AnthropicKeyModal = ({ isOpen, setIsOpen, existingKeyMasked = null, onSaveSuccess }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const hasExistingKey = existingKeyMasked !== null;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setApiKey("");
      setShowKey(false);
      setError("");
    }
  }, [isOpen]);

  const validateApiKey = (key) => {
    // Anthropic API keys must start with sk-ant-
    if (!key.startsWith("sk-ant-")) {
      return "API key must start with 'sk-ant-'";
    }
    if (key.length < 20) {
      return "API key appears to be too short";
    }
    return null;
  };

  const handleSave = async () => {
    setError("");

    // Validate the API key
    const validationError = validateApiKey(apiKey);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/proxy/vm/config", {
        anthropic_api_key: apiKey,
      });

      // Success - close modal and notify parent
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      setIsOpen(false);
    } catch (error) {
      setError(error.message || "Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !isLoading && setIsOpen(false)}
      >
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
          <div className="flex min-h-full overflow-hidden items-start md:items-center justify-center p-2">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl h-full overflow-visible transform text-left align-middle shadow-xl transition-all rounded-xl bg-base-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h2" className="text-xl font-semibold">
                    {hasExistingKey ? "Update" : "Set"} Anthropic API Key
                  </Dialog.Title>
                  <button
                    className="btn btn-square btn-ghost btn-sm"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
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

                <section className="space-y-4">
                  {/* Security Warning */}
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
                      <h3 className="font-bold">Your key is secure</h3>
                      <div className="text-sm">
                        Your API key is stored only on your VM, never on our servers.
                        We cannot access or view your key.
                      </div>
                    </div>
                  </div>

                  {/* Current Key Status (if exists) */}
                  {hasExistingKey && (
                    <div className="space-y-2">
                      <label className="label">
                        <span className="label-text font-medium">Current API Key</span>
                      </label>
                      <div className="bg-base-200 p-3 rounded-lg font-mono text-sm">
                        {existingKeyMasked}
                      </div>
                    </div>
                  )}

                  {/* API Key Input */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">
                        {hasExistingKey ? "New " : ""}Anthropic API Key
                      </span>
                      <span className="label-text-alt text-xs">
                        Required format: sk-ant-...
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        placeholder="sk-ant-api03-..."
                        className={`input input-bordered w-full ${
                          error ? "input-error" : ""
                        }`}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setError("");
                        }}
                        disabled={isLoading}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
                        onClick={() => setShowKey(!showKey)}
                        tabIndex={-1}
                      >
                        {showKey ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {error && (
                      <label className="label">
                        <span className="label-text-alt text-error">{error}</span>
                      </label>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="text-sm space-y-2 text-base-content/70">
                    <p className="font-medium">How to get your API key:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        Visit{" "}
                        <a
                          href="https://console.anthropic.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          console.anthropic.com
                        </a>
                      </li>
                      <li>Navigate to API Keys section</li>
                      <li>Create a new API key or use an existing one</li>
                      <li>Copy and paste it above</li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={handleSave}
                      disabled={isLoading || !apiKey}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        <>{hasExistingKey ? "Update" : "Save"} API Key</>
                      )}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AnthropicKeyModal;
