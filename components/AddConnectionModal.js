"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import apiClient from "@/libs/api";

const CONNECTION_TYPES = [
  { id: "mcp_stdio", name: "MCP Local", description: "Local MCP server via stdio" },
  { id: "mcp_http", name: "MCP Remote", description: "Remote MCP server via HTTP" },
];

// Modal component for adding new connections
const AddConnectionModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    command: "",
    args: "",
    env: "",
    url: "",
    headers: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const config = {};

      if (formData.type === "mcp_stdio") {
        config.command = formData.command;
        if (formData.args) {
          try {
            config.args = JSON.parse(formData.args);
          } catch {
            config.args = formData.args.split(",").map(s => s.trim());
          }
        }
        if (formData.env) {
          try {
            config.env = JSON.parse(formData.env);
          } catch {
            config.env = {};
          }
        }
      } else if (formData.type === "mcp_http") {
        config.url = formData.url;
        if (formData.headers) {
          try {
            config.headers = JSON.parse(formData.headers);
          } catch {
            config.headers = {};
          }
        }
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        config,
      };

      // POST to /api/proxy/vm/connections
      const response = await apiClient.post("/proxy/vm/connections", payload);

      // Call onAdd callback if provided
      await onAdd?.(response);

      // Reset form
      setFormData({
        name: "",
        type: "",
        command: "",
        args: "",
        env: "",
        url: "",
        headers: "",
      });
      onClose();
    } catch (error) {
      console.error("Failed to add connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="flex min-h-full items-start md:items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-base-100 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h2" className="text-xl font-semibold">
                    Add New Connection
                  </Dialog.Title>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Connection Name</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="My MCP Connection"
                      className="input input-bordered w-full"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Connection Type</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="" disabled>
                        Select a type
                      </option>
                      {CONNECTION_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.type === "mcp_stdio" && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Command</span>
                        </label>
                        <input
                          type="text"
                          name="command"
                          value={formData.command}
                          onChange={handleChange}
                          placeholder="node"
                          className="input input-bordered w-full"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Arguments (JSON array or comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          name="args"
                          value={formData.args}
                          onChange={handleChange}
                          placeholder='["/path/to/server.js"] or /path/to/server.js'
                          className="input input-bordered w-full"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Environment Variables (JSON)</span>
                        </label>
                        <textarea
                          name="env"
                          value={formData.env}
                          onChange={handleChange}
                          placeholder='{"API_KEY": "value", "DEBUG": "true"}'
                          className="textarea textarea-bordered w-full"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {formData.type === "mcp_http" && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">URL</span>
                        </label>
                        <input
                          type="url"
                          name="url"
                          value={formData.url}
                          onChange={handleChange}
                          placeholder="https://mcp-server.example.com"
                          className="input input-bordered w-full"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Headers (JSON)</span>
                        </label>
                        <textarea
                          name="headers"
                          value={formData.headers}
                          onChange={handleChange}
                          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                          className="textarea textarea-bordered w-full"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Adding...
                        </>
                      ) : (
                        "Add Connection"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddConnectionModal;
