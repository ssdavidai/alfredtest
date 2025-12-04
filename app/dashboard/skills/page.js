"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TeachSkillModal from "@/components/TeachSkillModal";

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningSkill, setRunningSkill] = useState(null);
  const [showTeachModal, setShowTeachModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const router = useRouter();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/proxy/vm/skills');

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          console.warn("VM not ready:", errorData);
          setSkills([]);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch skills');
      }

      const data = await response.json();
      const skillsArray = Array.isArray(data) ? data : (data.skills || []);
      setSkills(skillsArray);
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

      const response = await fetch(`/api/proxy/vm/skills/${skillId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to execute skill');

      const result = await response.json();
      alert(`Successfully triggered: ${skillName}\nExecution ID: ${result.execution_id || result.id || 'N/A'}`);

      await fetchSkills();
    } catch (err) {
      console.error("Error running skill:", err);
      alert(`Failed to run skill: ${skillName}`);
    } finally {
      setRunningSkill(null);
    }
  };

  const handleDeleteSkill = async (skillId, skillName) => {
    if (!confirm(`Are you sure you want to delete "${skillName}"?`)) return;

    try {
      const response = await fetch(`/api/proxy/vm/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete skill');

      setSkills(skills.filter(skill => skill.id !== skillId));
      alert(`Successfully deleted: ${skillName}`);
    } catch (err) {
      console.error("Error deleting skill:", err);
      alert(`Failed to delete skill: ${skillName}`);
    }
  };

  const getTriggerBadgeColor = (type) => {
    const colors = { manual: "badge-primary", schedule: "badge-secondary", webhook: "badge-accent" };
    return colors[type] || "badge-ghost";
  };

  const getTriggerIcon = (type) => {
    if (type === "manual") return (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" /></svg>);
    if (type === "schedule") return (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>);
    if (type === "webhook") return (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>);
    return null;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-base-content mb-2">Skills</h1>
            <p className="text-base-content/70">Manage your AI-powered automation workflows</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={() => setShowTeachModal(true)} className="btn btn-secondary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
              Teach New Skill
            </button>
            <Link href="/dashboard/skills/new" className="btn btn-primary gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Create Skill
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button className="btn btn-sm" onClick={fetchSkills}>Retry</button>
          </div>
        )}

        {!loading && !error && skills.length === 0 && (
          <div className="space-y-6">
            <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer" onClick={() => setShowTeachModal(true)}>
              <div className="card-body items-center text-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
                </div>
                <div className="badge badge-primary badge-lg mb-3">System Skill</div>
                <h2 className="text-2xl font-bold mb-2">Teach Alfred a New Skill</h2>
                <p className="text-base-content/70 mb-6 max-w-2xl">Describe what you want Alfred to do in natural language. Just tell Alfred what task to perform, and it will figure out the rest.</p>
                <button className="btn btn-primary btn-lg gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  Start Teaching
                </button>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Or Create a Custom Skill</h2>
                <p className="text-base-content/70 mb-6 max-w-md">Build a skill from scratch with manual configuration.</p>
                <Link href="/dashboard/skills/new" className="btn btn-outline btn-primary">Create Custom Skill</Link>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div key={skill.id} className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${!skill.is_active ? "opacity-60" : ""}`}>
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="card-title text-lg flex-1 pr-2">{skill.name}</h2>
                    {!skill.is_active && (
                      <div className="tooltip tooltip-left" data-tip="Inactive">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-base-content/70 mb-4 line-clamp-2">{skill.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className={`badge ${getTriggerBadgeColor(skill.trigger_type)} gap-1 font-medium`}>
                      {getTriggerIcon(skill.trigger_type)}
                      <span className="capitalize">{skill.trigger_type}</span>
                    </div>
                    {skill.trigger_type === "schedule" && skill.trigger_config?.cron && (
                      <div className="text-xs text-base-content/60">{skill.trigger_config.cron}</div>
                    )}
                  </div>

                  {skill.connection_names && skill.connection_names.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {skill.connection_names.map((conn, idx) => (
                        <div key={idx} className="badge badge-outline badge-sm">{conn}</div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-base-content/60 mb-4 pb-4 border-b border-base-200">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                      <span>{skill.run_count || 0} runs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      <span>{formatDate(skill.last_run_at)}</span>
                    </div>
                  </div>

                  <div className="card-actions justify-between">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/skills/${skill.id}/edit`} className="btn btn-sm btn-ghost gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteSkill(skill.id, skill.name)} className="btn btn-sm btn-ghost gap-1 text-error hover:bg-error/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Delete
                      </button>
                    </div>
                    <button onClick={() => handleRunSkill(skill.id, skill.name)} disabled={runningSkill === skill.id || !skill.is_active} className="btn btn-sm btn-primary gap-1">
                      {runningSkill === skill.id ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Running...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                          Run
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <TeachSkillModal isOpen={showTeachModal} onClose={() => setShowTeachModal(false)} onSuccess={fetchSkills} />
      </div>
    </main>
  );
}
