import React, { useState } from "react";
import { callGemini } from "../api/gemini.js";

export function PostProjectPage({ user, onPost, geminiKey, notify }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", skills: [], budget_min: "", budget_max: "", deadline: "", type: "fixed" });
  const [skillInput, setSkillInput] = useState("");
  const [aiScope, setAiScope] = useState("");
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeInput, setScopeInput] = useState("");

  async function generateScope() {
    if (!scopeInput) return;
    setScopeLoading(true);
    const prompt = `You are a project scoping assistant for a freelance platform. A client described their need as: "${scopeInput}".
Generate a structured project brief as JSON with: title, description (2-3 sentences), suggested_skills (array of 4-5), budget_min (number), budget_max (number), deadline_days (number), deliverables (array of 3-4 strings).
Respond ONLY with valid JSON, no markdown.`;
    const result = await callGemini(prompt, geminiKey);
    if (result) {
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        const data = JSON.parse(clean);
        setForm(f => ({
          ...f,
          title: data.title || f.title,
          description: data.description || f.description,
          skills: data.suggested_skills || f.skills,
          budget_min: String(data.budget_min || ""),
          budget_max: String(data.budget_max || ""),
        }));
        setAiScope(`✦ AI suggests: ${(data.deliverables || []).join(" · ")}`);
      } catch { setAiScope("AI scope generated — fill in the details above."); }
    } else {
      setAiScope("Enter your Gemini API key above to use AI scoping.");
    }
    setScopeLoading(false);
  }

  function addSkill() {
    if (skillInput && !form.skills.includes(skillInput)) {
      setForm({ ...form, skills: [...form.skills, skillInput] });
      setSkillInput("");
    }
  }

  function handleSubmit() {
    if (!form.title || !form.description || !form.budget_min || !form.budget_max) { notify("Please fill all required fields.", "error"); return; }
    onPost({ ...form, client_id: user.id, client_name: user.name, status: "open", posted_date: new Date().toISOString().slice(0, 10), proposals_count: 0 });
    notify("Project posted successfully!", "success");
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <h1 className="page-title">Post a Project</h1>
      <p className="page-sub">Describe your project and let freelancers find you</p>

      <div className="card mb-lg">
        <div className="section-title">✦ AI Project Scoping Assistant</div>
        <p className="text-sm text-muted mb-md">Describe your need in plain language — AI will generate a complete project brief.</p>
        <div className="flex gap-sm mb-sm">
          <input className="form-input" placeholder='e.g. "I need a website for my restaurant with online ordering"' value={scopeInput} onChange={e => setScopeInput(e.target.value)} />
          <button className="btn btn-secondary" onClick={generateScope} disabled={scopeLoading} style={{ whiteSpace: "nowrap" }}>
            {scopeLoading ? "⏳ Generating…" : "Generate Brief"}
          </button>
        </div>
        {aiScope && <div className="badge badge-green" style={{ padding: "0.4rem 0.75rem" }}>{aiScope}</div>}
      </div>

      <div className="card">
        <div className="tabs mb-lg">
          {["Details", "Skills & Budget", "Preview"].map((s, i) => (
            <button key={s} className={`tab-btn ${step === i + 1 ? "active" : ""}`} onClick={() => setStep(i + 1)}>{i + 1}. {s}</button>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input className="form-input" placeholder="e.g. Build a landing page for my SaaS" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" placeholder="Describe the project in detail — goals, requirements, and what success looks like…" style={{ minHeight: 160 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <div className="flex gap-sm">
                {["fixed", "hourly"].map(t => (
                  <button key={t} className={`btn ${form.type === t ? "btn-secondary" : "btn-ghost"}`} onClick={() => setForm({ ...form, type: t })}>
                    {t === "fixed" ? "Fixed Price" : "Hourly Rate"}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Next →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">Required Skills</label>
              <div className="flex gap-sm mb-sm">
                <input className="form-input" placeholder="Add a skill (e.g. React)" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} />
                <button className="btn btn-outline" onClick={addSkill}>Add</button>
              </div>
              <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                {form.skills.map(s => (
                  <span key={s} className="tag" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {s} <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem" }} onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Budget Min ($) *</label>
                <input className="form-input" type="number" placeholder="500" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Budget Max ($) *</label>
                <input className="form-input" type="number" placeholder="2000" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Preview →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ padding: "1.25rem", background: "var(--bg)", borderRadius: 10, marginBottom: "1.25rem" }}>
              <div className="flex-between mb-sm">
                <span className="pill pill-open">{form.type}</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.1rem" }}>${form.budget_min}–${form.budget_max}</span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{form.title || "(No title)"}</h3>
              <p className="text-sm" style={{ color: "var(--text2)", lineHeight: 1.6, marginBottom: "0.75rem" }}>{form.description || "(No description)"}</p>
              <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                {form.skills.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={handleSubmit}>Post Project →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
