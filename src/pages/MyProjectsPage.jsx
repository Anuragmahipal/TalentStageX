import React, { useState } from "react";
import { INITIAL_USERS } from "../data/mockData.js";
import { getAvatarClass } from "../utils/helpers.js";
import { StarRating } from "../components/Shared.jsx";
import { Sparkles, Target } from "lucide-react";
import { callGemini } from "../api/gemini.js";

export function MyProjectsPage({ user, projects, proposals, onHire, geminiKey, notify }) {
  const myProjects = projects.filter(p => p.client_id === user.id);
  const [selectedProject, setSelectedProject] = useState(myProjects[0] || null);
  const [aiScores, setAiScores] = useState({});
  const [scoringId, setScoringId] = useState(null);
  const [matchedFreelancers, setMatchedFreelancers] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const projectProposals = proposals.filter(p => p.project_id === selectedProject?.id);

  async function scoreProposals() {
    if (!selectedProject) return;
    setScoringId(selectedProject.id);
    const projectProps = projectProposals;
    for (const prop of projectProps) {
      const prompt = `Rate this freelance proposal 0-100 for relevance to the project.
Project: "${selectedProject.title}" requiring ${selectedProject.skills.join(", ")}.
Proposal: "${prop.cover_message}" from ${prop.freelancer_name} (${prop.freelancer_title}, rating ${prop.freelancer_rating}).
Respond with ONLY a JSON: {"score": NUMBER, "reason": "one sentence"}`;
      const result = await callGemini(prompt, geminiKey);
      if (result) {
        try {
          const clean = result.replace(/```json|```/g, "").trim();
          const data = JSON.parse(clean);
          setAiScores(prev => ({ ...prev, [prop.id]: data }));
        } catch {
          setAiScores(prev => ({ ...prev, [prop.id]: { score: prop.score, reason: "Score based on profile match" } }));
        }
      }
    }
    setScoringId(null);
    notify("AI scoring complete!", "success");
  }

  async function findMatches() {
    if (!selectedProject) return;
    setMatchLoading(true);
    const prompt = `Given a project requiring ${selectedProject.skills.join(", ")}, rank these freelancers by fit.
Freelancers: ${INITIAL_USERS.filter(u => u.role === "freelancer").map(u => `${u.name}: skills=${u.skills.join(",")}, rating=${u.rating}`).join("; ")}
Respond ONLY with JSON array: [{"name":"...","match_pct":NUMBER,"reason":"short reason"}] sorted by match_pct desc.`;
    const result = await callGemini(prompt, geminiKey);
    if (result) {
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        setMatchedFreelancers(JSON.parse(clean));
      } catch { setMatchedFreelancers([]); }
    }
    setMatchLoading(false);
  }

  return (
    <div className="page">
      <div className="flex-between mb-lg">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-sub">Manage your postings and review proposals</p>
        </div>
      </div>

      {myProjects.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">📋</div><p>No projects posted yet.</p></div>
      ) : (
        <div className="two-col" style={{ alignItems: "start" }}>
          <div>
            {myProjects.map(p => (
              <div key={p.id} className={`card card-sm card-hover mb-md ${selectedProject?.id === p.id ? "border-accent" : ""}`}
                style={{ borderColor: selectedProject?.id === p.id ? "var(--accent)" : undefined }}
                onClick={() => { setSelectedProject(p); setMatchedFreelancers([]); }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{p.title}</div>
                <div className="flex-between">
                  <span className="text-xs text-muted">{proposals.filter(pr => pr.project_id === p.id).length} proposals</span>
                  <span className="pill pill-open">{p.status}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div>
              <div className="card mb-md">
                <div className="flex-between mb-md">
                  <h3 style={{ fontWeight: 700 }}>{selectedProject.title}</h3>
                  <span className="badge badge-blue">${selectedProject.budget_min}–${selectedProject.budget_max}</span>
                </div>
                <p className="text-sm" style={{ color: "var(--text2)", marginBottom: "1rem", lineHeight: 1.6 }}>{selectedProject.description}</p>
                <div className="flex gap-sm" style={{ flexWrap: "wrap", marginBottom: "1rem" }}>
                  {selectedProject.skills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-outline btn-sm" onClick={scoreProposals} disabled={scoringId === selectedProject.id || projectProposals.length === 0}>
                    {scoringId === selectedProject.id ? "⏳ Scoring…" : <><Sparkles size={14} /> AI Score Proposals</>}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={findMatches} disabled={matchLoading}>
                    {matchLoading ? "Finding…" : <><Target size={14} /> Find Matches</>}
                  </button>
                </div>
              </div>

              {matchedFreelancers.length > 0 && (
                <div className="card mb-md">
                  <div className="section-title">✦ AI-Matched Freelancers</div>
                  {matchedFreelancers.map((f, i) => {
                    const usr = INITIAL_USERS.find(u => u.name === f.name);
                    return (
                      <div key={i} className="freelancer-card onboard-step">
                        <div className={`avatar avatar-sm ${usr ? getAvatarClass(f.name) : "avatar-accent"}`}>{f.name.split(" ").map(w => w[0]).join("")}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{f.name}</div>
                          <div className="text-xs text-muted">{f.reason}</div>
                        </div>
                        <div className="match-pct">{f.match_pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="card">
                <div className="section-title">Proposals ({projectProposals.length})</div>
                {projectProposals.length === 0 ? (
                  <div className="empty-state" style={{ padding: "1.5rem" }}><p>No proposals yet.</p></div>
                ) : projectProposals.map(p => {
                  const score = aiScores[p.id];
                  const displayScore = score?.score ?? p.score;
                  const scoreClass = displayScore >= 85 ? "score-high" : displayScore >= 65 ? "score-mid" : "score-low";
                  return (
                    <div key={p.id} className="card card-sm mb-md" style={{ background: "var(--bg)" }}>
                      <div className="flex gap-md mb-sm">
                        <div className={`avatar avatar-md ${getAvatarClass(p.freelancer_name)}`}>{p.freelancer_avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{p.freelancer_name}</div>
                          <div className="text-xs text-muted">{p.freelancer_title}</div>
                          <StarRating rating={p.freelancer_rating} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>${p.amount}</div>
                          <div className="text-xs text-muted">{p.duration_days} days</div>
                        </div>
                        <div className={`score-ring ${scoreClass}`}>{displayScore}</div>
                      </div>
                      {score?.reason && <div className="ai-badge mb-sm">✦ AI: {score.reason}</div>}
                      <p className="text-sm" style={{ color: "var(--text2)", lineHeight: 1.5, marginBottom: "0.75rem" }}>{p.cover_message}</p>
                      <div className="flex gap-sm">
                        <button className="btn btn-primary btn-sm" onClick={() => { onHire(p, selectedProject); notify(`${p.freelancer_name} hired! Contract created.`, "success"); }}>Hire</button>
                        <button className="btn btn-outline btn-sm">Message</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
