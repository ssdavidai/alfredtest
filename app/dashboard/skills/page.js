"use client";

import { useState } from "react";
import SkillCard from "@/components/SkillCard";
import CreateSkillModal from "@/components/CreateSkillModal";

// Mock skills data - replace with API call
const mockSkills = [
  {
    id: "1",
    name: "Daily Standup Summary",
    description: "Generates a summary of daily standup messages from Slack",
    trigger: "schedule",
    schedule: "0 9 * * 1-5",
    lastRun: "2024-01-15T09:00:00Z",
    status: "active",
  },
  {
    id: "2",
    name: "PR Review Assistant",
    description: "Automatically reviews pull requests and provides feedback",
    trigger: "webhook",
    webhookUrl: "/api/webhooks/pr-review",
    lastRun: "2024-01-15T14:30:00Z",
    status: "active",
  },
  {
    id: "3",
    name: "Customer Support Responder",
    description: "Drafts responses to common customer support tickets",
    trigger: "manual",
    lastRun: "2024-01-14T16:45:00Z",
    status: "paused",
  },
  {
    id: "4",
    name: "Weekly Report Generator",
    description: "Compiles weekly metrics and generates executive summary",
    trigger: "schedule",
    schedule: "0 17 * * 5",
    lastRun: "2024-01-12T17:00:00Z",
    status: "active",
  },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState(mockSkills);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const filteredSkills = skills.filter((skill) => {
    if (filter === "all") return true;
    if (filter === "active") return skill.status === "active";
    if (filter === "paused") return skill.status === "paused";
    return skill.trigger === filter;
  });

  const handleRunSkill = async (skillId) => {
    // TODO: Implement actual skill execution via API
    console.log(`Running skill: ${skillId}`);
    alert(`Skill ${skillId} triggered successfully!`);
  };

  const handleToggleStatus = (skillId) => {
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId
          ? { ...skill, status: skill.status === "active" ? "paused" : "active" }
          : skill
      )
    );
  };

  const handleDeleteSkill = (skillId) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      setSkills((prev) => prev.filter((skill) => skill.id !== skillId));
    }
  };

  const handleCreateSkill = (newSkill) => {
    const skill = {
      ...newSkill,
      id: Date.now().toString(),
      lastRun: null,
      status: "active",
    };
    setSkills((prev) => [...prev, skill]);
    setIsCreateModalOpen(false);
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Skills</h1>
            <p className="text-base-content/70 mt-2">
              Manage your automated AI skills and workflows
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Skill
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "active", "paused", "schedule", "webhook", "manual"].map(
            (filterOption) => (
              <button
                key={filterOption}
                className={`btn btn-sm ${
                  filter === filterOption ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setFilter(filterOption)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Skills Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onRun={handleRunSkill}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteSkill}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">No skills found</h3>
            <p className="text-base-content/70 mb-6">
              {filter === "all"
                ? "Create your first skill to get started"
                : `No ${filter} skills available`}
            </p>
            {filter === "all" && (
              <button
                className="btn btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Your First Skill
              </button>
            )}
          </div>
        )}

        {/* Create Skill Modal */}
        <CreateSkillModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateSkill}
        />
      </div>
    </main>
  );
}
