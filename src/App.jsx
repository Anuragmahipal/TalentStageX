import React, { useState } from "react";
import { Toast, Sidebar } from "./components/Shared.jsx";
import { INITIAL_PROJECTS, INITIAL_PROPOSALS, INITIAL_CONTRACTS } from "./data/mockData.js";
import { GEMINI_API_KEY_PLACEHOLDER } from "./api/gemini.js";

// Pages
import { AuthScreen } from "./pages/AuthScreen.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { ProjectsPage } from "./pages/ProjectsPage.jsx";
import { MyProjectsPage } from "./pages/MyProjectsPage.jsx";
import { PostProjectPage } from "./pages/PostProjectPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { ContractsPage } from "./pages/ContractsPage.jsx";
import { CommunityPage } from "./pages/CommunityPage.jsx";
import { FreelancersPage } from "./pages/FreelancersPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [view, setView] = useState("dashboard"); // dashboard, projects, my-projects, post-project, profile, contracts, community, freelancers, settings
  const [toast, setToast] = useState(null);
  
  // App state
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [geminiKey, setGeminiKey] = useState(GEMINI_API_KEY_PLACEHOLDER);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleHire(proposal, project) {
    const newContract = {
      id: Date.now(),
      project_id: project.id,
      project_title: project.title,
      client_id: user.id,
      client_name: user.name,
      freelancer_id: proposal.freelancer_id,
      freelancer_name: proposal.freelancer_name,
      total_amount: proposal.amount,
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
      milestones: [
        { id: Date.now() + 1, description: "Initial setup", amount: Math.round(proposal.amount * 0.3), due_date: "In 7 days", approved: false },
        { id: Date.now() + 2, description: "Final delivery", amount: Math.round(proposal.amount * 0.7), due_date: "In " + proposal.duration_days + " days", approved: false }
      ],
      messages: []
    };
    setContracts([...contracts, newContract]);
    setProjects(projects.map(p => p.id === project.id ? { ...p, status: "in-progress" } : p));
  }

  if (!user) {
    return <AuthScreen onLogin={u => { setUser(u); notify("Welcome back! 👋", "success"); setView("dashboard"); }} />;
  }

  return (
    <div className="app-container">
      <Sidebar user={user} currentView={view} onViewChange={setView} onLogout={() => setUser(null)} />
      
      <main className="main-content">
        {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
        
        {view === "dashboard" && <Dashboard user={user} projects={projects} proposals={proposals} contracts={contracts} onNavigate={setView} geminiKey={geminiKey} />}
        {view === "projects" && <ProjectsPage user={user} projects={projects} proposals={proposals} onSubmitProposal={p => setProposals([...proposals, { id: Date.now(), freelancer_id: user.id, freelancer_name: user.name, freelancer_avatar: user.avatar, freelancer_title: user.title, freelancer_rating: user.rating, status: "pending", score: 0, ...p }])} notify={notify} />}
        {view === "my-projects" && <MyProjectsPage user={user} projects={projects} proposals={proposals} onHire={handleHire} geminiKey={geminiKey} notify={notify} />}
        {view === "post-project" && <PostProjectPage user={user} onPost={p => { setProjects([{ id: Date.now(), ...p }, ...projects]); setView("my-projects"); }} geminiKey={geminiKey} notify={notify} />}
        {view === "profile" && <ProfilePage user={user} setUser={setUser} geminiKey={geminiKey} notify={notify} />}
        {view === "contracts" && <ContractsPage user={user} contracts={contracts} setContracts={setContracts} notify={notify} />}
        {view === "community" && <CommunityPage user={user} notify={notify} />}
        {view === "freelancers" && <FreelancersPage currentUser={user} />}
        {view === "settings" && <SettingsPage user={user} geminiKey={geminiKey} setGeminiKey={setGeminiKey} notify={notify} />}
      </main>
    </div>
  );
}
