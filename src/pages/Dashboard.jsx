import React, { useState, useEffect } from "react";
import { CompletenessBar } from "../components/Shared.jsx";
import { callGemini, GEMINI_API_KEY_PLACEHOLDER } from "../api/gemini.js";
import { Hand, ArrowRight, TrendingUp, Check, Circle, Sparkles } from "lucide-react";

export function Dashboard({ user, projects, proposals, contracts, onNavigate, geminiKey }) {
  const userContracts = contracts.filter(c => c.freelancer_id === user.id || c.client_id === user.id);
  const userProposals = proposals.filter(p => p.freelancer_id === user.id);
  const earnings = userContracts.reduce((s, c) => s + c.milestones.filter(m => m.approved).reduce((ms, m) => ms + m.amount, 0), 0);
  const [aiTip, setAiTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);

  async function getAiTip() {
    setLoadingTip(true);
    const tip = await callGemini(`You are a freelance career coach. Give ${user.name} (a ${user.role} with skills: ${(user.skills || []).join(", ")}) one specific, actionable tip in 2 sentences to grow on TalentStage. Be direct and practical. No preamble.`, geminiKey);
    setAiTip(tip || "Complete your profile to 100% to get 3x more project invites. Add at least 3 portfolio items with measurable results.");
    setLoadingTip(false);
  }

  useEffect(() => { if (geminiKey && geminiKey !== GEMINI_API_KEY_PLACEHOLDER) getAiTip(); }, []);

  return (
    <div className="page">
      <div className="flex-between mb-lg">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Good morning, {user.name.split(" ")[0]} <Hand size={24} color="#f59e0b" />
          </h1>
          <p className="page-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {user.role !== "client" && (
          <button className="btn btn-primary" onClick={() => onNavigate("projects")} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            Browse Projects <ArrowRight size={16} />
          </button>
        )}
        {user.role === "client" && (
          <button className="btn btn-primary" onClick={() => onNavigate("post-project")}>+ Post Project</button>
        )}
      </div>

      <div className="stats-row">
        {user.role !== "client" ? (
          <>
            <div className="stat-card"><div className="stat-num">${earnings.toLocaleString()}</div><div className="stat-label">Total Earned</div><div className="stat-change" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><TrendingUp size={14} /> 12% this month</div></div>
            <div className="stat-card"><div className="stat-num">{userProposals.length}</div><div className="stat-label">Active Proposals</div></div>
            <div className="stat-card"><div className="stat-num">{userContracts.filter(c => c.status === "active").length}</div><div className="stat-label">Active Contracts</div></div>
            <div className="stat-card"><div className="stat-num">{user.completeness}%</div><div className="stat-label">Profile Complete</div></div>
          </>
        ) : (
          <>
            <div className="stat-card"><div className="stat-num">{projects.filter(p => p.client_id === user.id).length}</div><div className="stat-label">Projects Posted</div></div>
            <div className="stat-card"><div className="stat-num">{proposals.filter(p => projects.find(pr => pr.client_id === user.id && pr.id === p.project_id)).length}</div><div className="stat-label">Total Proposals</div></div>
            <div className="stat-card"><div className="stat-num">{userContracts.filter(c => c.status === "active").length}</div><div className="stat-label">Active Contracts</div></div>
            <div className="stat-card"><div className="stat-num">{userContracts.filter(c => c.status === "completed").length}</div><div className="stat-label">Completed</div></div>
          </>
        )}
      </div>

      <div className="two-col">
        <div>
          <div className="card mb-md">
            <CompletenessBar pct={user.completeness} />
            <div style={{ marginTop: "1rem" }}>
              {["bio", "skills", "portfolio", "hourly_rate"].map(f => {
                const ok = f === "skills" ? user.skills?.length > 0 : f === "portfolio" ? user.portfolio?.length > 0 : !!user[f];
                return (
                  <div key={f} className="onboard-step">
                    <div className={`step-num ${ok ? "done" : ""}`}>{ok ? <Check size={16} /> : <Circle size={10} />}</div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {{ bio: "Add your bio", skills: "Add your skills", portfolio: "Add portfolio items", hourly_rate: "Set your rate" }[f]}
                      </div>
                      {!ok && <div className="text-xs text-muted">Helps clients find you</div>}
                    </div>
                    {!ok && <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }} onClick={() => onNavigate("profile")}>Add</button>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ai-panel">
            <div className="ai-panel-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Sparkles size={16} color="var(--gold)" /> AI Career Tip</div>
            {loadingTip ? (
              <div className="ai-loading"><div className="spinner" /> Generating tip…</div>
            ) : aiTip ? (
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>{aiTip}</p>
            ) : (
              <div>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.75rem" }}>Get personalized AI advice for your freelance career.</p>
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={getAiTip}>Get AI Tip</button>
              </div>
            )}
          </div>
        </div>

        <div>
          {userContracts.length > 0 && (
            <div className="card mb-md">
              <div className="section-title">Active Contracts</div>
              {userContracts.filter(c => c.status === "active").map(c => (
                <div key={c.id} className="onboard-step card-hover" style={{ cursor: "pointer" }} onClick={() => onNavigate("contracts")}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.project_title}</div>
                    <div className="text-xs text-muted">{user.role === "client" ? `with ${c.freelancer_name}` : `for ${c.client_name}`}</div>
                  </div>
                  <span className="pill pill-active" style={{ marginLeft: "auto" }}>Active</span>
                </div>
              ))}
            </div>
          )}

          {user.role !== "client" && (
            <div className="card mb-md">
              <div className="section-title">Your Proposals</div>
              {userProposals.length === 0 ? (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <p>No proposals yet.</p>
                  <button className="btn btn-primary btn-sm mt-sm" onClick={() => onNavigate("projects")}>Find Projects</button>
                </div>
              ) : userProposals.slice(0, 3).map(p => {
                const proj = projects.find(pr => pr.id === p.project_id);
                return (
                  <div key={p.id} className="onboard-step">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{proj?.title}</div>
                      <div className="text-xs text-muted">Bid: ${p.amount} · {p.duration_days} days</div>
                    </div>
                    <span className="badge badge-blue">{p.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {user.role === "client" && (
            <div className="card">
              <div className="section-title">Your Projects</div>
              {projects.filter(p => p.client_id === user.id).slice(0, 3).map(p => (
                <div key={p.id} className="onboard-step card-hover" onClick={() => onNavigate("my-projects")}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.title}</div>
                    <div className="text-xs text-muted">{p.proposals_count} proposals · ${p.budget_min}–${p.budget_max}</div>
                  </div>
                  <span className="pill pill-open">Open</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
