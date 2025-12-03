"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningSkill, setRunningSkill] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      // Mock data for now - will be replaced with actual API call
      // const response = await fetch('/api/proxy/vm/skills');
      // const data = await response.json();

      // Mock data
      const mockSkills = [
        {
          id: "skill-1",
          name: "Daily LinkedIn Post",
          description: "Automatically create and post daily content to LinkedIn from your Notion notes",
          trigger_type: "schedule",
          trigger_config: { cron: "0 9 * * *" },
          connection_names: ["Notion", "LinkedIn"],
          is_active: true,
          run_count: 24,
          last_run_at: "2024-12-02T09:00:00Z",
        },
        {
          id: "skill-2",
          name: "Customer Feedback Analyzer",
          description: "Analyze customer feedback from multiple sources and create summary reports in NocoDB",
          trigger_type: "webhook",
          trigger_config: { url: "/webhook/skill-2/secret-token" },
          connection_names: ["NocoDB", "Slack"],
          is_active: true,
          run_count: 156,
          last_run_at: "2024-12-03T14:32:00Z",
        },
        {
          id: "skill-3",
          name: "Weekly Report Generator",
          description: "Generate comprehensive weekly reports from project data and send via email",
          trigger_type: "schedule",
          trigger_config: { cron: "0 17 * * 5" },
          connection_names: ["NocoDB", "Gmail"],
          is_active: false,
          run_count: 8,
          last_run_at: "2024-11-29T17:00:00Z",
        },
        {
          id: "skill-4",
          name: "Task Prioritizer",
          description: "Review and prioritize tasks based on urgency and importance using AI analysis",
          trigger_type: "manual",
          trigger_config: null,
          connection_names: ["Notion"],
          is_active: true,
          run_count: 42,
          last_run_at: "2024-12-03T11:15:00Z",
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSkills(mockSkills);
      setError(null);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setError("Failed to load skills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSkill = async (skillId, skillName) => {
    try {
      setRunningSkill(skillId);
      // Mock API call
      // const response = await fetch(`/api/proxy/vm/skills/${skillId}/execute`, {
      //   method: 'POST',
      // });

      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert(`Successfully triggered: ${skillName}`);

      // Refresh skills to update run count
      await fetchSkills();
    } catch (err) {
      console.error("Error running skill:", err);
      alert(`Failed to run skill: ${skillName}`);
    } finally {
      setRunningSkill(null);
    }
  };

  const handleDeleteSkill = async (skillId, skillName) => {
    if (!confirm(`Are you sure you want to delete "${skillName}"?`)) {
      return;
    }

    try {
      // Mock API call
      // const response = await fetch(`/api/proxy/vm/skills/${skillId}`, {
      //   method: 'DELETE',
      // });

      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update local state
      setSkills(skills.filter(skill => skill.id !== skillId));
      alert(`Successfully deleted: ${skillName}`);
    } catch (err) {
      console.error("Error deleting skill:", err);
      alert(`Failed to delete skill: ${skillName}`);
    }
  };

  const getTriggerBadgeColor = (triggerType) => {
    switch (triggerType) {
      case "manual":
        return "badge-primary";
      case "schedule":
        return "badge-secondary";
      case "webhook":
        return "badge-accent";
      default:
        return "badge-ghost";
    }
  };

  const getTriggerIcon = (triggerType) => {
    switch (triggerType) {
      case "manual":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
          </svg>
        );
      case "schedule":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case "webhook":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 bg-base-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-base-content mb-2">
              Skills
            </h1>
            <p className="text-base-content/70">
              Manage your AI-powered automation workflows
            </p>
          </div>
          <Link
            href="/dashboard/skills/new"
            className="btn btn-primary gap-2 self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Skill
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button className="btn btn-sm" onClick={fetchSkills}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && skills.length === 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-16">
              <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">No skills yet</h2>
              <p className="text-base-content/70 mb-6 max-w-md">
                Get started by creating your first skill. Skills are AI-powered workflows that can be triggered manually, on a schedule, or via webhooks.
              </p>
              <Link href="/dashboard/skills/new" className="btn btn-primary">
                Create Your First Skill
              </Link>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        {!loading && !error && skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  !skill.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="card-body">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="card-title text-lg flex-1 pr-2">
                      {skill.name}
                    </h2>
                    {!skill.is_active && (
                      <div className="tooltip tooltip-left" data-tip="Inactive">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-base-content/70 mb-4 line-clamp-2">
                    {skill.description}
                  </p>

                  {/* Trigger Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`badge ${getTriggerBadgeColor(skill.trigger_type)} gap-1 font-medium`}>
                      {getTriggerIcon(skill.trigger_type)}
                      <span className="capitalize">{skill.trigger_type}</span>
                    </div>
                    {skill.trigger_type === "schedule" && skill.trigger_config?.cron && (
                      <div className="text-xs text-base-content/60">
                        {skill.trigger_config.cron}
                      </div>
                    )}
                  </div>

                  {/* Connections */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {skill.connection_names.map((conn, idx) => (
                      <div key={idx} className="badge badge-outline badge-sm">
                        {conn}
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-base-content/60 mb-4 pb-4 border-b border-base-200">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <span>{skill.run_count} runs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{formatDate(skill.last_run_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-actions justify-between">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/skills/${skill.id}/edit`}
                        className="btn btn-sm btn-ghost gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteSkill(skill.id, skill.name)}
                        className="btn btn-sm btn-ghost gap-1 text-error hover:bg-error/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
                    {skill.trigger_type === "manual" && (
                      <button
                        onClick={() => handleRunSkill(skill.id, skill.name)}
                        disabled={runningSkill === skill.id || !skill.is_active}
                        className="btn btn-sm btn-primary gap-1"
                      >
                        {runningSkill === skill.id ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Running...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Run
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
