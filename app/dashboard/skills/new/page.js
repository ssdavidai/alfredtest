"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";

// Multi-step skill creation wizard with excellent UX
export default function NewSkillPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [skillData, setSkillData] = useState({
    name: "",
    description: "",
    triggerType: "manual",
    triggerConfig: {},
    steps: [
      {
        id: 1,
        prompt: "",
        guidance: "",
        allowedTools: [],
      },
    ],
  });

  // Validation for each step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!skillData.name.trim()) {
          toast.error("Skill name is required");
          return false;
        }
        if (!skillData.description.trim()) {
          toast.error("Skill description is required");
          return false;
        }
        return true;
      case 2:
        if (skillData.steps.length === 0) {
          toast.error("At least one step is required");
          return false;
        }
        for (let i = 0; i < skillData.steps.length; i++) {
          if (!skillData.steps[i].prompt.trim()) {
            toast.error(`Step ${i + 1} prompt is required`);
            return false;
          }
        }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStepAdd = () => {
    setSkillData({
      ...skillData,
      steps: [
        ...skillData.steps,
        {
          id: skillData.steps.length + 1,
          prompt: "",
          guidance: "",
          allowedTools: [],
        },
      ],
    });
  };

  const handleStepRemove = (index) => {
    if (skillData.steps.length > 1) {
      const newSteps = skillData.steps.filter((_, i) => i !== index);
      // Renumber the steps
      const renumberedSteps = newSteps.map((step, i) => ({
        ...step,
        id: i + 1,
      }));
      setSkillData({ ...skillData, steps: renumberedSteps });
    } else {
      toast.error("At least one step is required");
    }
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...skillData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSkillData({ ...skillData, steps: newSteps });
  };

  const handleToolToggle = (stepIndex, tool) => {
    const newSteps = [...skillData.steps];
    const currentTools = newSteps[stepIndex].allowedTools || [];

    if (currentTools.includes(tool)) {
      newSteps[stepIndex].allowedTools = currentTools.filter((t) => t !== tool);
    } else {
      newSteps[stepIndex].allowedTools = [...currentTools, tool];
    }

    setSkillData({ ...skillData, steps: newSteps });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare trigger config based on trigger type
      let triggerConfig = {};
      if (skillData.triggerType === "schedule") {
        triggerConfig = { cron: "0 9 * * *" }; // Default: daily at 9am
      } else if (skillData.triggerType === "webhook") {
        triggerConfig = { method: "POST" }; // Default webhook config
      }

      const payload = {
        name: skillData.name.trim(),
        description: skillData.description.trim(),
        trigger_type: skillData.triggerType,
        trigger_config: triggerConfig,
        steps: skillData.steps.map((step) => ({
          id: step.id,
          prompt: step.prompt.trim(),
          guidance: step.guidance.trim() || undefined,
          allowedTools: step.allowedTools.length > 0 ? step.allowedTools : undefined,
        })),
        is_active: true,
      };

      await apiClient.post("/proxy/vm/skills", payload);

      toast.success("Skill created successfully!");
      router.push("/dashboard/skills");
    } catch (error) {
      console.error("Error creating skill:", error);
      toast.error(error.message || "Failed to create skill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/skills")}
            className="btn btn-ghost btn-sm mb-4"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Skills
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Create New Skill
          </h1>
          <p className="mt-2 text-base-content/70">
            Follow the steps below to create a new AI skill
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <ul className="steps steps-horizontal w-full">
            <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
              Basic Info
            </li>
            <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
              Define Steps
            </li>
            <li className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>
              Review
            </li>
          </ul>
        </div>

        {/* Step Content */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="card-title text-2xl">Basic Information</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Skill Name *
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Daily Email Summary"
                    className="input input-bordered w-full"
                    value={skillData.name}
                    onChange={(e) =>
                      setSkillData({ ...skillData, name: e.target.value })
                    }
                    autoFocus
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Choose a descriptive name for your skill
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Description *
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Describe what this skill does..."
                    value={skillData.description}
                    onChange={(e) =>
                      setSkillData({
                        ...skillData,
                        description: e.target.value,
                      })
                    }
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Explain the purpose and behavior of this skill
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Trigger Type *
                    </span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        skillData.triggerType === "manual"
                          ? "border-primary bg-primary/10"
                          : "border-base-300 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="triggerType"
                        value="manual"
                        className="radio radio-primary"
                        checked={skillData.triggerType === "manual"}
                        onChange={(e) =>
                          setSkillData({
                            ...skillData,
                            triggerType: e.target.value,
                          })
                        }
                      />
                      <div className="ml-3">
                        <div className="font-semibold">Manual</div>
                        <div className="text-sm text-base-content/60">
                          Run on demand
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        skillData.triggerType === "schedule"
                          ? "border-primary bg-primary/10"
                          : "border-base-300 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="triggerType"
                        value="schedule"
                        className="radio radio-primary"
                        checked={skillData.triggerType === "schedule"}
                        onChange={(e) =>
                          setSkillData({
                            ...skillData,
                            triggerType: e.target.value,
                          })
                        }
                      />
                      <div className="ml-3">
                        <div className="font-semibold">Schedule</div>
                        <div className="text-sm text-base-content/60">
                          Run on a schedule
                        </div>
                      </div>
                    </label>

                    <label
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        skillData.triggerType === "webhook"
                          ? "border-primary bg-primary/10"
                          : "border-base-300 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="triggerType"
                        value="webhook"
                        className="radio radio-primary"
                        checked={skillData.triggerType === "webhook"}
                        onChange={(e) =>
                          setSkillData({
                            ...skillData,
                            triggerType: e.target.value,
                          })
                        }
                      />
                      <div className="ml-3">
                        <div className="font-semibold">Webhook</div>
                        <div className="text-sm text-base-content/60">
                          Trigger via HTTP
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Define Steps */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="card-title text-2xl">Define Steps</h2>
                  <button
                    onClick={handleStepAdd}
                    className="btn btn-primary btn-sm"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Step
                  </button>
                </div>

                <div className="space-y-4">
                  {skillData.steps.map((step, index) => (
                    <div key={index} className="border border-base-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="badge badge-primary">Step {step.id}</div>
                        {skillData.steps.length > 1 && (
                          <button
                            onClick={() => handleStepRemove(index)}
                            className="btn btn-ghost btn-xs text-error"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Prompt *
                            </span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered h-20"
                            placeholder="What should the agent do in this step?"
                            value={step.prompt}
                            onChange={(e) =>
                              handleStepChange(index, "prompt", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Guidance (Optional)
                            </span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered h-16"
                            placeholder="Additional context or instructions..."
                            value={step.guidance}
                            onChange={(e) =>
                              handleStepChange(index, "guidance", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Allowed Tools (Optional)
                            </span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="Type tool name and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value.trim()) {
                                handleToolToggle(index, e.target.value.trim());
                                e.target.value = "";
                              }
                            }}
                          />
                          {step.allowedTools && step.allowedTools.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {step.allowedTools.map((tool, toolIndex) => (
                                <div
                                  key={toolIndex}
                                  className="badge badge-outline gap-2"
                                >
                                  {tool}
                                  <button
                                    onClick={() => handleToolToggle(index, tool)}
                                    className="btn btn-ghost btn-xs p-0"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="card-title text-2xl">Review & Create</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
                    <div className="bg-base-200 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="font-semibold">Name:</span>{" "}
                        {skillData.name}
                      </div>
                      <div>
                        <span className="font-semibold">Description:</span>{" "}
                        {skillData.description}
                      </div>
                      <div>
                        <span className="font-semibold">Trigger Type:</span>{" "}
                        <span className="badge badge-primary capitalize">
                          {skillData.triggerType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Steps ({skillData.steps.length})
                    </h3>
                    <div className="space-y-3">
                      {skillData.steps.map((step, index) => (
                        <div
                          key={index}
                          className="bg-base-200 rounded-lg p-4 space-y-2"
                        >
                          <div className="badge badge-primary">Step {step.id}</div>
                          <div>
                            <span className="font-semibold">Prompt:</span>
                            <p className="mt-1 text-sm">{step.prompt}</p>
                          </div>
                          {step.guidance && (
                            <div>
                              <span className="font-semibold">Guidance:</span>
                              <p className="mt-1 text-sm">{step.guidance}</p>
                            </div>
                          )}
                          {step.allowedTools && step.allowedTools.length > 0 && (
                            <div>
                              <span className="font-semibold">Allowed Tools:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {step.allowedTools.map((tool, toolIndex) => (
                                  <span
                                    key={toolIndex}
                                    className="badge badge-sm"
                                  >
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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
                    />
                  </svg>
                  <span>
                    Review your skill configuration carefully before creating it.
                    You can edit it later if needed.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="card-actions justify-between mt-8 pt-6 border-t border-base-300">
              <button
                onClick={handleBack}
                className="btn btn-ghost"
                disabled={currentStep === 1 || isSubmitting}
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  Next
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Create Skill
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
