import React, { useEffect } from "react";
import { Star, StarHalf, CheckCircle, XCircle, Info, LayoutDashboard, User, Search, Briefcase, PlusCircle, FileText, MessageSquare, Users, Settings, LogOut } from "lucide-react";

export function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className="stars" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {[...Array(full)].map((_, i) => <Star key={`f-${i}`} size={14} fill="currentColor" color="var(--gold)" />)}
      {[...Array(half)].map((_, i) => <StarHalf key={`h-${i}`} size={14} fill="currentColor" color="var(--gold)" />)}
      {[...Array(empty)].map((_, i) => <Star key={`e-${i}`} size={14} color="var(--muted)" />)}
      <span style={{ color: "var(--text2)", marginLeft: "0.3rem", fontSize: "0.82rem" }}>({rating})</span>
    </span>
  );
}

export function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  
  return (
    <div className={`notif ${type === "success" ? "notif-success" : type === "error" ? "notif-error" : ""}`}>
      <span style={{ display: "inline-flex", alignItems: "center", marginRight: "0.5rem" }}>
        {type === "success" ? <CheckCircle size={18} /> : type === "error" ? <XCircle size={18} /> : <Info size={18} />}
      </span>
      {message}
    </div>
  );
}

export function Sidebar({ user, currentView, onViewChange, onLogout }) {
  const views = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "profile", label: "My Profile", icon: <User size={20} />, role: "freelancer,both" },
    { id: "projects", label: "Find Work", icon: <Search size={20} />, role: "freelancer,both" },
    { id: "my-projects", label: "My Projects", icon: <Briefcase size={20} />, role: "client,both" },
    { id: "post-project", label: "Post Project", icon: <PlusCircle size={20} />, role: "client,both" },
    { id: "contracts", label: "Contracts", icon: <FileText size={20} /> },
    { id: "community", label: "Community", icon: <MessageSquare size={20} /> },
    { id: "freelancers", label: "Freelancers", icon: <Users size={20} />, role: "client,both" },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">TalentStage</div>
      <nav className="sidebar-nav">
        {views.filter(v => !v.role || v.role.includes(user.role)).map(v => (
          <button 
            key={v.id} 
            className={`nav-btn ${currentView === v.id ? "active" : ""}`}
            onClick={() => onViewChange(v.id)}
          >
            <span style={{width: 28, display: "inline-flex", alignItems: "center"}}>{v.icon}</span> {v.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-btn" onClick={onLogout}>
          <span style={{width: 28, display: "inline-flex", alignItems: "center"}}><LogOut size={20} /></span> Log Out
        </button>
      </div>
    </aside>
  );
}

export function CompletenessBar({ pct }) {
  const color = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--gold)" : "var(--accent)";
  return (
    <div>
      <div className="flex-between mb-sm">
        <span className="text-sm" style={{ fontWeight: 600 }}>Profile Completeness</span>
        <span className="text-sm" style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
