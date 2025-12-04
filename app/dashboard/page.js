"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ButtonAccount from "@/components/ButtonAccount";
import Quickstart from "@/components/Quickstart";
import ConnectionCard from "@/components/ConnectionCard";
import SkillCard from "@/components/SkillCard";
import AnthropicKeyModal from "@/components/AnthropicKeyModal";
import CreateSkillModal from "@/components/CreateSkillModal";
import AddConnectionModal from "@/components/AddConnectionModal";
import apiClient from "@/libs/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [userStatus, setUserStatus] = useState(null);
  const [connections, setConnections] = useState([]);
  const [skills, setSkills] = useState([]);
  const [vmConfig, setVmConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showAnthropicKeyModal, setShowAnthropicKeyModal] = useState(false);
  const [showCreateSkillModal, setShowCreateSkillModal] = useState(false);
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);

  const fetchUserStatus = async () => {
    try {
      const data = await apiClient.get("/user/status");
      setUserStatus(data);
      if (data.vmStatus === "ready") {
        await Promise.all([fetchVmConfig(), fetchConnections(), fetchSkills()]);
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVmConfig = async () => {
    try {
      const data = await apiClient.get("/proxy/vm/config");
      setVmConfig(data);
      if (!data.has_anthropic_key) setShowAnthropicKeyModal(true);
    } catch (error) {
      console.error("Failed to fetch VM config:", error);
    }
  };

  const fetchConnections = async () => {
    try {
      const data = await apiClient.get("/proxy/vm/connections");
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      setConnections([]);
    }
  };

  const fetchSkills = async () => {
    try {
      const data = await apiClient.get("/proxy/vm/skills");
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
      setSkills([]);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchUserStatus();
  }, [sessionStatus]);

  useEffect(() => {
    if (userStatus?.vmStatus === "provisioning") {
      const interval = setInterval(() => fetchUserStatus(), 5000);
      return () => clearInterval(interval);
    }
  }, [userStatus?.vmStatus]);

  const handleApiKeyGenerated = (apiKey) => {
    setNewApiKey(apiKey);
    fetchUserStatus();
  };

  const handleRunSkill = async (skillId) => {
    try {
      toast.loading("Running skill...", { id: "run-skill" });
      await apiClient.post(\`/skills/\${skillId}/execute\`);
      toast.success("Skill executed successfully!", { id: "run-skill" });
      fetchSkills();
    } catch (error) {
      toast.error(error.message || "Failed to run skill", { id: "run-skill" });
    }
  };

  const handleToggleSkillStatus = async (skillId) => {
    try {
      toast.loading("Updating skill status...", { id: "toggle-skill" });
      await apiClient.put(\`/proxy/vm/skills/\${skillId}/toggle\`);
      toast.success("Skill status updated!", { id: "toggle-skill" });
      fetchSkills();
    } catch (error) {
      toast.error(error.message || "Failed to update skill", { id: "toggle-skill" });
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    try {
      toast.loading("Deleting skill...", { id: "delete-skill" });
      await apiClient.delete(\`/proxy/vm/skills/\${skillId}\`);
      toast.success("Skill deleted successfully!", { id: "delete-skill" });
      fetchSkills();
    } catch (error) {
      toast.error(error.message || "Failed to delete skill", { id: "delete-skill" });
    }
  };

  const handleEditConnection = () => toast.info("Edit connection coming soon!");

  const handleDeleteConnection = async (connection) => {
    if (!confirm(\`Are you sure you want to delete \${connection.name}?\`)) return;
    try {
      toast.loading("Deleting connection...", { id: "delete-connection" });
      await apiClient.delete(\`/proxy/vm/connections/\${connection.id}\`);
      toast.success("Connection deleted successfully!", { id: "delete-connection" });
      fetchConnections();
    } catch (error) {
      toast.error(error.message || "Failed to delete connection", { id: "delete-connection" });
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24 bg-base-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-base-content">Welcome back, {firstName}!</h1>
            <p className="text-base-content/70 mt-2">Manage your AI automation platform</p>
          </div>
          <ButtonAccount />
        </div>

        {userStatus && (
          <>
            {userStatus.vmStatus === "pending" && (
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-bold">Your VM is pending provisioning</h3>
                  <div className="text-sm">Your Alfred instance will be ready shortly.</div>
                </div>
              </div>
            )}
            {userStatus.vmStatus === "provisioning" && (
              <div className="alert alert-warning">
                <span className="loading loading-spinner"></span>
                <div>
                  <h3 className="font-bold">Provisioning your Alfred instance...</h3>
                  <div className="text-sm">This usually takes 2-3 minutes.</div>
                  <progress className="progress progress-warning w-full mt-2"></progress>
                </div>
              </div>
            )}
            {userStatus.vmStatus === "error" && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">VM Provisioning Error</h3>
                  <div className="text-sm">There was an error setting up your VM. Please contact support.</div>
                </div>
              </div>
            )}
          </>
        )}

        {userStatus?.vmStatus === "ready" && (
          <>
            {vmConfig && !vmConfig.has_anthropic_key && (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-bold">Anthropic API Key Required</h3>
                  <div className="text-sm">To start using your AI skills, please add your Anthropic API key.</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setShowAnthropicKeyModal(true)}>Add API Key</button>
              </div>
            )}

            <section><Quickstart subdomain={userStatus.vmSubdomain} apiKey={newApiKey || userStatus.maskedApiKey} onApiKeyGenerated={handleApiKeyGenerated} /></section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Connections</h2>
                  <p className="text-base-content/70 text-sm">MCP servers and external services</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddConnectionModal(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Connection
                </button>
              </div>
              {connections.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body items-center text-center py-12">
                    <h3 className="text-xl font-bold mt-4">No connections yet</h3>
                    <p className="text-base-content/70">Connect MCP servers to extend Alfred capabilities</p>
                    <button className="btn btn-primary mt-4" onClick={() => setShowAddConnectionModal(true)}>Add Your First Connection</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} onEdit={handleEditConnection} onDelete={handleDeleteConnection} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Skills</h2>
                  <p className="text-base-content/70 text-sm">AI-powered automations</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateSkillModal(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Teach New Skill
                </button>
              </div>
              {skills.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body items-center text-center py-12">
                    <h3 className="text-xl font-bold mt-4">No skills yet</h3>
                    <p className="text-base-content/70">Teach Alfred your first automation skill</p>
                    <button className="btn btn-primary mt-4" onClick={() => setShowCreateSkillModal(true)}>Teach Your First Skill</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((skill) => (
                    <SkillCard key={skill.id} skill={skill} onRun={handleRunSkill} onToggleStatus={handleToggleSkillStatus} onDelete={handleDeleteSkill} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {userStatus && userStatus.vmStatus !== "ready" && userStatus.vmStatus !== "error" && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body items-center text-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
              <h3 className="text-xl font-bold mt-4">Setting up your Alfred instance</h3>
              <p className="text-base-content/70 max-w-md">Your AI automation environment is being provisioned.</p>
            </div>
          </div>
        )}
      </div>

      <AnthropicKeyModal isOpen={showAnthropicKeyModal} setIsOpen={setShowAnthropicKeyModal} existingKeyMasked={vmConfig?.masked_anthropic_key} onSaveSuccess={() => { fetchVmConfig(); toast.success("Anthropic API key saved successfully!"); }} />
      <CreateSkillModal isOpen={showCreateSkillModal} setIsOpen={setShowCreateSkillModal} onSuccess={() => { fetchSkills(); toast.success("Skill created successfully!"); }} />
      <AddConnectionModal isOpen={showAddConnectionModal} setIsOpen={setShowAddConnectionModal} onSuccess={() => { fetchConnections(); toast.success("Connection added successfully!"); }} />
    </main>
  );
}
