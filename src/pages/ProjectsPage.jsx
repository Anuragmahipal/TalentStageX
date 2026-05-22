import React, { useState } from "react";
import { Search, CheckCircle2, ArrowRight } from "lucide-react";

export function ProjectsPage({ user, projects, proposals, onSubmitProposal, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState({ amount: "", duration_days: "", cover_message: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || (filter === "fixed" && p.type === "fixed") || (filter === "hourly" && p.type === "hourly");
    return matchSearch && matchFilter && p.status === "open";
  });

  function handleProposal(e) {
    e.preventDefault();
    const alreadyBid = proposals.find(p => p.project_id === selectedProject.id && p.freelancer_id === user.id);
    if (alreadyBid) { notify("You already submitted a proposal for this project.", "error"); return; }
    setSubmitting(true);
    setTimeout(() => {
      onSubmitProposal({ ...proposalForm, project_id: selectedProject.id });
      setShowProposal(false);
      setProposalForm({ amount: "", duration_days: "", cover_message: "" });
      setSubmitting(false);
      notify("Proposal submitted successfully!", "success");
    }, 800);
  }

  return (
    <div className="page">
      <h1 className="page-title">Browse Projects</h1>
      <p className="page-sub">Find your next opportunity — {filtered.length} projects available</p>

      <div className="flex gap-md mb-lg" style={{ flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon" style={{ display: "flex", alignItems: "center" }}><Search size={16} /></span>
          <input placeholder="Search projects, skills, keywords…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "fixed", "hourly"].map(f => (
          <button key={f} className={`btn ${filter === f ? "btn-secondary" : "btn-ghost"}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All Types" : f === "fixed" ? "Fixed Price" : "Hourly"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map(project => {
          const alreadyBid = proposals.find(p => p.project_id === project.id && p.freelancer_id === user.id);
          return (
            <div key={project.id} className="card card-hover" onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}>
              <div className="flex-between mb-sm">
                <div style={{ flex: 1 }}>
                  <div className="flex-center gap-sm mb-sm">
                    <span className="pill pill-open">{project.type}</span>
                    {alreadyBid && <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><CheckCircle2 size={12}/> Bid Submitted</span>}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.4rem" }}>{project.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text2)", lineHeight: 1.5 }}>
                    {selectedProject?.id === project.id ? project.description : project.description.slice(0, 140) + "…"}
                  </p>
                </div>
                <div style={{ textAlign: "right", paddingLeft: "1.5rem", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem", fontWeight: 700 }}>${project.budget_min}–${project.budget_max}</div>
                  <div className="text-xs text-muted">{project.proposals_count} proposals</div>
                </div>
              </div>

              <div className="flex-between">
                <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                  {project.skills.map(s => <span key={s} className="tag tag-sm">{s}</span>)}
                </div>
                <span className="text-xs text-muted">Posted {project.posted_date}</span>
              </div>

              {selectedProject?.id === project.id && user.role !== "client" && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }} disabled={!!alreadyBid} onClick={() => setShowProposal(true)}>
                    {alreadyBid ? "Proposal Submitted" : <>Submit Proposal <ArrowRight size={16}/></>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-icon" style={{ display: "flex", justifyContent: "center" }}><Search size={32} color="var(--muted)" /></div><p>No projects match your search.</p></div>
        )}
      </div>

      {showProposal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProposal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Submit Proposal</div>
            <div className="modal-sub">{selectedProject.title}</div>
            <form onSubmit={handleProposal}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Bid ($)</label>
                  <input className="form-input" type="number" placeholder="e.g. 2500" required value={proposalForm.amount} onChange={e => setProposalForm({ ...proposalForm, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Timeline (days)</label>
                  <input className="form-input" type="number" placeholder="e.g. 14" required value={proposalForm.duration_days} onChange={e => setProposalForm({ ...proposalForm, duration_days: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cover Letter</label>
                <textarea className="form-textarea" placeholder="Describe your approach, relevant experience, and why you're the best fit…" required value={proposalForm.cover_message} onChange={e => setProposalForm({ ...proposalForm, cover_message: e.target.value })} style={{ minHeight: 140 }} />
              </div>
              <div className="flex gap-sm">
                <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Proposal"}</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowProposal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
