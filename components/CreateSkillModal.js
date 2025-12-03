"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

const STEPS = [
  { id: 1, name: "Basic Info", description: "Name and description" },
  { id: 2, name: "Trigger", description: "How to activate" },
  { id: 3, name: "Configuration", description: "Skill settings" },
  { id: 4, name: "Review", description: "Confirm and create" },
];

const TRIGGER_OPTIONS = [
  {
    id: "manual",
    name: "Manual",
    description: "Run on-demand via dashboard or API",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M10.5 1.875a1.125 1.125 0 012.25 0v8.219c.517.162 1.02.382 1.5.659V3.375a1.125 1.125 0 012.25 0v10.937a4.505 4.505 0 00-3.25 2.373 8.963 8.963 0 014-.935A.75.75 0 0018 15v-2.266a3.368 3.368 0 01.988-2.37 1.125 1.125 0 011.591 1.59 1.118 1.118 0 00-.329.79v3.006h-.005a6 6 0 01-1.752 4.007l-1.736 1.736a6 6 0 01-4.242 1.757H10.5a7.5 7.5 0 01-7.5-7.5V6.375a1.125 1.125 0 012.25 0v5.519c.46-.452.965-.832 1.5-1.141V3.375a1.125 1.125 0 012.25 0v6.526c.495-.1.997-.151 1.5-.151V1.875z" />
      </svg>
    ),
  },
  {
    id: "schedule",
    name: "Scheduled",
    description: "Run automatically on a schedule",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Triggered by external HTTP requests",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const SCHEDULE_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Daily at 9 AM", value: "0 9 * * *" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
  { label: "Weekly on Monday", value: "0 9 * * 1" },
  { label: "Monthly on 1st", value: "0 9 1 * *" },
  { label: "Custom", value: "custom" },
];

export default function CreateSkillModal({ isOpen, onClose, onCreate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    schedule: "",
    customSchedule: "",
    webhookUrl: "",
    prompt: "",
    model: "gpt-4",
    maxTokens: 2000,
  });
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      description: "",
      trigger: "",
      schedule: "",
      customSchedule: "",
      webhookUrl: "",
      prompt: "",
      model: "gpt-4",
      maxTokens: 2000,
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      }
    }

    if (step === 2) {
      if (!formData.trigger) {
        newErrors.trigger = "Please select a trigger type";
      }
      if (formData.trigger === "schedule" && !formData.schedule) {
        newErrors.schedule = "Please select a schedule";
      }
      if (
        formData.trigger === "schedule" &&
        formData.schedule === "custom" &&
        !formData.customSchedule.trim()
      ) {
        newErrors.customSchedule = "Please enter a cron expression";
      }
    }

    if (step === 3) {
      if (!formData.prompt.trim()) {
        newErrors.prompt = "Prompt is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreate = () => {
    const skillData = {
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      ...(formData.trigger === "schedule" && {
        schedule:
          formData.schedule === "custom"
            ? formData.customSchedule
            : formData.schedule,
      }),
      ...(formData.trigger === "webhook" && {
        webhookUrl: `/api/webhooks/${formData.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
      }),
      prompt: formData.prompt,
      model: formData.model,
      maxTokens: formData.maxTokens,
    };

    onCreate(skillData);
    resetForm();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Skill Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Daily Report Generator"
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.name}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                placeholder="Describe what this skill does..."
                className={`textarea textarea-bordered w-full h-24 ${
                  errors.description ? "textarea-error" : ""
                }`}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.description}
                  </span>
                </label>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRIGGER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.trigger === option.id
                      ? "border-primary bg-primary/10"
                      : "border-base-300 hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, trigger: option.id })
                  }
                >
                  <div className="text-primary mb-2">{option.icon}</div>
                  <div className="font-semibold">{option.name}</div>
                  <div className="text-sm text-base-content/70">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
            {errors.trigger && (
              <p className="text-error text-sm">{errors.trigger}</p>
            )}

            {formData.trigger === "schedule" && (
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-medium">Schedule</span>
                </label>
                <select
                  className={`select select-bordered w-full ${
                    errors.schedule ? "select-error" : ""
                  }`}
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                >
                  <option value="">Select a schedule...</option>
                  {SCHEDULE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                {errors.schedule && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.schedule}
                    </span>
                  </label>
                )}

                {formData.schedule === "custom" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Enter cron expression (e.g., 0 9 * * 1-5)"
                      className={`input input-bordered w-full ${
                        errors.customSchedule ? "input-error" : ""
                      }`}
                      value={formData.customSchedule}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customSchedule: e.target.value,
                        })
                      }
                    />
                    {errors.customSchedule && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.customSchedule}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {formData.trigger === "webhook" && (
              <div className="alert alert-info mt-4">
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
                  />
                </svg>
                <span>
                  A unique webhook URL will be generated when you create the
                  skill.
                </span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">System Prompt</span>
              </label>
              <textarea
                placeholder="Enter the instructions for this skill..."
                className={`textarea textarea-bordered w-full h-32 ${
                  errors.prompt ? "textarea-error" : ""
                }`}
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
              />
              {errors.prompt && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.prompt}
                  </span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Model</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Max Tokens</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTokens: parseInt(e.target.value) || 2000,
                    })
                  }
                  min={100}
                  max={8000}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-base-content/60">Name</span>
                <p className="font-semibold">{formData.name}</p>
              </div>
              <div>
                <span className="text-sm text-base-content/60">
                  Description
                </span>
                <p>{formData.description}</p>
              </div>
              <div>
                <span className="text-sm text-base-content/60">Trigger</span>
                <p className="capitalize">{formData.trigger}</p>
                {formData.trigger === "schedule" && (
                  <p className="text-sm text-base-content/70">
                    Schedule:{" "}
                    {formData.schedule === "custom"
                      ? formData.customSchedule
                      : formData.schedule}
                  </p>
                )}
              </div>
              <div>
                <span className="text-sm text-base-content/60">Model</span>
                <p>{formData.model}</p>
              </div>
              <div>
                <span className="text-sm text-base-content/60">Prompt</span>
                <p className="text-sm bg-base-300 p-2 rounded mt-1 whitespace-pre-wrap">
                  {formData.prompt}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-base-100 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h2" className="text-xl font-bold">
                    Create New Skill
                  </Dialog.Title>
                  <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={handleClose}
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

                {/* Steps indicator */}
                <ul className="steps steps-horizontal w-full mb-8">
                  {STEPS.map((step) => (
                    <li
                      key={step.id}
                      className={`step ${
                        currentStep >= step.id ? "step-primary" : ""
                      }`}
                    >
                      <span className="hidden sm:inline text-xs">
                        {step.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Step content */}
                <div className="min-h-[300px]">{renderStepContent()}</div>

                {/* Footer actions */}
                <div className="flex justify-between mt-8 pt-4 border-t border-base-300">
                  <button
                    className={`btn btn-ghost ${
                      currentStep === 1 ? "invisible" : ""
                    }`}
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={handleClose}>
                      Cancel
                    </button>
                    {currentStep < STEPS.length ? (
                      <button className="btn btn-primary" onClick={handleNext}>
                        Next
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                      >
                        Create Skill
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
