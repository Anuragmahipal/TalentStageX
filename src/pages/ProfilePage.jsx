import React, { useState } from "react";
import { getAvatarClass } from "../utils/helpers.js";
import { StarRating, CompletenessBar } from "../components/Shared.jsx";
import { callGemini } from "../api/gemini.js";
import { CheckCircle2, Sparkles, Award, Palette, X, ArrowRight, BookX } from "lucide-react";

export function ProfilePage({ user, setUser, geminiKey, notify }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [skillInput, setSkillInput] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [testSkill, setTestSkill] = useState("");
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [addPortfolio, setAddPortfolio] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", category: "Web Dev", description: "", tools: "", image: "Palette" });

  function saveProfile() {
    const fields = [form.bio, form.title, form.hourly_rate, form.skills?.length, form.portfolio?.length];
    const filled = fields.filter(Boolean).length;
    const pct = Math.min(100, 20 + filled * 16);
    setUser({ ...user, ...form, completeness: pct });
    setEditing(false);
    notify("Profile updated!", "success");
  }

  async function getPortfolioReview() {
    setReviewLoading(true);
    const items = user.portfolio.map(p => `"${p.title}": ${p.description}`).join("; ");
    const prompt = `Review this freelancer's portfolio on TalentStage and give 3 specific improvement tips.
Portfolio items: ${items || "None yet"}. Skills: ${user.skills?.join(", ")}.
Respond as a JSON array of 3 strings, each a concrete actionable tip. No preamble, no markdown.`;
    const result = await callGemini(prompt, geminiKey);
    if (result) {
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        const tips = JSON.parse(clean);
        setAiReview(Array.isArray(tips) ? tips : [result]);
      } catch { setAiReview([result]); }
    } else {
      setAiReview(["Add quantifiable outcomes to each project (e.g. '40% conversion increase')", "Include a brief case study for your best project", "Showcase variety — client says specialists + generalists both win here"]);
    }
    setReviewLoading(false);
  }

  async function generateTest() {
    if (!testSkill) return;
    setTestLoading(true);
    setTestResult(null);
    const prompt = `Generate a 5-question multiple-choice quiz to verify "${testSkill}" skills.
Respond ONLY with JSON: {"questions": [{"q": "...", "options": ["A", "B", "C", "D"], "correct": 0}]}
Make questions practical and moderately difficult. No preamble.`;
    const result = await callGemini(prompt, geminiKey);
    if (result) {
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        const data = JSON.parse(clean);
        setTestQuestions(data.questions || []);
        setTestAnswers({});
      } catch { setTestQuestions([]); }
    } else {
      setTestQuestions([
        { q: `What is the primary use of ${testSkill}?`, options: ["Option A", "Option B", "Option C", "Option D"], correct: 0 },
        { q: `Which is a best practice in ${testSkill}?`, options: ["Option A", "Option B", "Option C", "Option D"], correct: 1 },
      ]);
    }
    setTestLoading(false);
  }

  function submitTest() {
    const correct = testQuestions.filter((q, i) => testAnswers[i] === q.correct).length;
    const pct = Math.round((correct / testQuestions.length) * 100);
    const passed = pct >= 60;
    setTestResult({ score: pct, passed });
    if (passed && !user.badges?.includes(testSkill)) {
      setUser({ ...user, badges: [...(user.badges || []), testSkill] });
      notify(`Verified ${testSkill} badge earned!`, "success");
    }
  }

  function addPortfolioItem() {
    const item = { id: Date.now(), ...newItem, tools: newItem.tools.split(",").map(t => t.trim()).filter(Boolean) };
    setUser({ ...user, portfolio: [...(user.portfolio || []), item] });
    setAddPortfolio(false);
    setNewItem({ title: "", category: "Web Dev", description: "", tools: "", image: "Palette" });
    notify("Portfolio item added!", "success");
  }

  return (
    <div className="page">
      <div className="tabs">
        {["profile", "portfolio", "skill-test", "earnings"].map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {{ profile: "Profile", portfolio: "Portfolio", "skill-test": "Skill Tests", earnings: "Earnings" }[t]}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="two-col">
          <div>
            <div className="card mb-md" style={{ textAlign: "center" }}>
              <div className={`avatar avatar-lg ${getAvatarClass(user.name)}`} style={{ margin: "0 auto 1rem" }}>{user.avatar}</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user.name}</div>
              <div className="text-sm text-muted">{user.title || "No title set"}</div>
              <div className="flex-center gap-sm" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                <span className={`status-dot status-${user.availability}`} />
                <span className="text-xs text-muted">{user.availability}</span>
                {user.verified && <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}><CheckCircle2 size={12} /> Verified</span>}
              </div>
              {user.rating > 0 && <div className="mt-sm"><StarRating rating={user.rating} /></div>}
              <div className="divider" />
              <CompletenessBar pct={user.completeness} />
            </div>

            <div className="card">
              <div className="section-title">Skills & Badges</div>
              <div className="flex gap-sm" style={{ flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {(user.skills || []).map(s => (
                  <span key={s} className="tag">{s}
                    {user.badges?.includes(s) && <span className="badge-gold" style={{ marginLeft: "0.3rem", fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: "2px" }}><CheckCircle2 size={10} /> Verified</span>}
                  </span>
                ))}
              </div>
              {(user.badges || []).length > 0 && (
                <div>
                  <div className="text-xs text-muted mb-sm">Verified Badges</div>
                  {user.badges.map(b => (
                    <span key={b} className="badge badge-gold" style={{ marginRight: "0.4rem", marginBottom: "0.4rem", display: "inline-flex", alignItems: "center", gap: "2px" }}><Award size={12} /> {b}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <div className="flex-between mb-lg">
                <div className="section-title" style={{ margin: 0 }}>Profile Information</div>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditing(!editing); setForm({ ...user }); }}>
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {editing ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">Professional Title</label>
                    <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Developer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea className="form-textarea" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about yourself…" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Hourly Rate ($)</label>
                      <input className="form-input" type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: +e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Availability</label>
                      <select className="form-select" value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Not Available</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Add Skills</label>
                    <div className="flex gap-sm">
                      <input className="form-input" placeholder="Skill name" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && skillInput) { setForm({ ...form, skills: [...(form.skills || []), skillInput] }); setSkillInput(""); }}} />
                      <button className="btn btn-outline" onClick={() => { if (skillInput) { setForm({ ...form, skills: [...(form.skills || []), skillInput] }); setSkillInput(""); }}}>Add</button>
                    </div>
                    <div className="flex gap-sm mt-sm" style={{ flexWrap: "wrap" }}>
                      {(form.skills || []).map(s => (
                        <span key={s} className="tag">{s} <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }} onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })}><X size={14} /></button></span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
                </div>
              ) : (
                <div>
                  <div className="mb-md">
                    <div className="text-xs text-muted mb-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>Bio</div>
                    <p style={{ lineHeight: 1.7, color: "var(--text2)" }}>{user.bio || "No bio added yet."}</p>
                  </div>
                  <div className="grid-2">
                    <div>
                      <div className="text-xs text-muted mb-sm">Hourly Rate</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>${user.hourly_rate}/hr</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-sm">Reviews</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user.reviews_count || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "portfolio" && (
        <div>
          <div className="flex-between mb-lg">
            <div>
              <h2 className="section-title" style={{ fontSize: "1.1rem" }}>Portfolio</h2>
              <p className="text-sm text-muted">{(user.portfolio || []).length} projects</p>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-outline btn-sm" onClick={getPortfolioReview} disabled={reviewLoading} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {reviewLoading ? "Reviewing…" : <><Sparkles size={14} /> AI Review</>}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setAddPortfolio(true)}>+ Add Project</button>
            </div>
          </div>

          {Array.isArray(aiReview) && aiReview.length > 0 && (
            <div className="ai-panel mb-lg">
              <div className="ai-panel-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Sparkles size={16} color="var(--gold)" /> AI Portfolio Review</div>
              {aiReview.map((tip, i) => (
                <div key={i} className="flex gap-sm mb-sm" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ color: "var(--gold)", flexShrink: 0 }}><ArrowRight size={14} /></span> {tip}
                </div>
              ))}
            </div>
          )}

          <div className="three-col">
            {(user.portfolio || []).map(item => (
              <div key={item.id} className="card card-hover">
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", textAlign: "center", padding: "1rem", background: "var(--bg)", borderRadius: 8 }}>{item.image === "Palette" ? <Palette size={40} color="var(--gold)" /> : item.image}</div>
                <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{item.title}</div>
                <span className="badge badge-blue" style={{ marginBottom: "0.5rem", display: "inline-block" }}>{item.category}</span>
                <p className="text-sm text-muted" style={{ lineHeight: 1.5, marginBottom: "0.75rem" }}>{item.description}</p>
                <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                  {(Array.isArray(item.tools) ? item.tools : []).map(t => <span key={t} className="tag tag-sm">{t}</span>)}
                </div>
              </div>
            ))}
            {(user.portfolio || []).length === 0 && (
              <div className="empty-state card" style={{ gridColumn: "1/-1" }}>
                <div className="empty-icon"><Palette size={40} color="var(--gold)" /></div>
                <p>No portfolio items yet. Add your work to attract clients!</p>
              </div>
            )}
          </div>

          {addPortfolio && (
            <div className="modal-overlay" onClick={() => setAddPortfolio(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Add Portfolio Item</div>
                <div className="modal-sub">Showcase your best work</div>
                <div className="form-group">
                  <label className="form-label">Project Title</label>
                  <input className="form-input" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="e.g. E-Commerce Platform" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                      {["Web Dev", "Mobile", "UI/UX", "ML/AI", "Design", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emoji Icon</label>
                    <input className="form-input" value={newItem.image} onChange={e => setNewItem({ ...newItem, image: e.target.value })} placeholder="🎨" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Describe the project, your role, and outcomes…" style={{ minHeight: 90 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tools (comma-separated)</label>
                  <input className="form-input" value={newItem.tools} onChange={e => setNewItem({ ...newItem, tools: e.target.value })} placeholder="React, Node.js, PostgreSQL" />
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-primary" onClick={addPortfolioItem}>Add to Portfolio</button>
                  <button className="btn btn-outline" onClick={() => setAddPortfolio(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "skill-test" && (
        <div style={{ maxWidth: 680 }}>
          <div className="card mb-lg">
            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Sparkles size={16} color="var(--gold)" /> AI Skill Verification Tests</div>
            <p className="text-sm text-muted mb-md">Take an AI-generated test to earn a Verified badge for your skills.</p>
            <div className="flex gap-sm mb-md">
              <select className="form-select" value={testSkill} onChange={e => setTestSkill(e.target.value)}>
                <option value="">Select a skill to test…</option>
                {(user.skills || []).map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-primary" onClick={generateTest} disabled={!testSkill || testLoading}>
                {testLoading ? "Generating…" : "Start Test"}
              </button>
            </div>

            {testQuestions.length > 0 && !testResult && (
              <div>
                <div className="divider" />
                <div className="flex-between mb-md">
                  <span style={{ fontWeight: 700 }}>{testSkill} Verification Test</span>
                  <span className="badge badge-blue">{testQuestions.length} questions</span>
                </div>
                {testQuestions.map((q, qi) => (
                  <div key={qi} className="test-question">
                    <p style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Q{qi + 1}. {q.q}</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`test-option ${testAnswers[qi] === oi ? "selected" : ""}`} onClick={() => setTestAnswers({ ...testAnswers, [qi]: oi })}>
                        <input type="radio" checked={testAnswers[qi] === oi} readOnly />
                        <span style={{ fontSize: "0.875rem" }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <button className="btn btn-primary mt-md" onClick={submitTest} disabled={Object.keys(testAnswers).length < testQuestions.length}>
                  Submit Test
                </button>
              </div>
            )}

            {testResult && (
              <div className="card mt-md" style={{ background: testResult.passed ? "rgba(39,174,96,0.06)" : "rgba(233,69,96,0.06)", border: `1px solid ${testResult.passed ? "rgba(39,174,96,0.3)" : "rgba(233,69,96,0.3)"}` }}>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <div style={{ marginBottom: "0.5rem" }}>{testResult.passed ? <Award size={48} color="var(--success)" /> : <BookX size={48} color="var(--error)" />}</div>
                  <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.3rem" }}>
                    {testResult.passed ? `Verified ${testSkill} Developer!` : "Keep Practicing"}
                  </div>
                  <div className="text-sm text-muted">Score: {testResult.score}% — {testResult.passed ? "Badge awarded!" : "Need 60% to pass"}</div>
                  {!testResult.passed && <button className="btn btn-outline btn-sm mt-md" onClick={() => { setTestResult(null); setTestAnswers({}); }}>Try Again</button>}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">Earned Badges</div>
            {(user.badges || []).length === 0 ? (
              <p className="text-sm text-muted">No badges yet. Take a skill test to earn your first one!</p>
            ) : (
              <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
                {user.badges.map(b => (
                  <div key={b} className="card card-sm" style={{ textAlign: "center", minWidth: 100 }}>
                    <div style={{ marginBottom: "0.5rem" }}><Award size={32} color="var(--gold)" /></div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{b}</div>
                    <div className="badge badge-gold mt-sm">Verified</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "earnings" && (
        <div>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-num">${(user.total_earnings || 0).toLocaleString()}</div><div className="stat-label">Total Earned</div></div>
            <div className="stat-card"><div className="stat-num">${Math.round((user.total_earnings || 0) * 0.1).toLocaleString()}</div><div className="stat-label">Platform Fees (10%)</div></div>
            <div className="stat-card"><div className="stat-num">${Math.round((user.total_earnings || 0) * 0.9).toLocaleString()}</div><div className="stat-label">Net Earnings</div></div>
            <div className="stat-card"><div className="stat-num">$0</div><div className="stat-label">Pending</div></div>
          </div>
          <div className="card">
            <div className="section-title">Withdraw Funds</div>
            <p className="text-sm text-muted mb-md">Minimum withdrawal: $50. Funds arrive in 2-3 business days.</p>
            <div className="flex gap-sm">
              <input className="form-input" type="number" placeholder="Enter amount ($50 min)" style={{ maxWidth: 200 }} />
              <button className="btn btn-primary">Withdraw</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
