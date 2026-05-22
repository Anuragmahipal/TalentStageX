import React, { useState } from "react";
import { INITIAL_USERS } from "../data/mockData.js";

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "freelancer" });
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "login") {
      const user = INITIAL_USERS.find(u => u.email === form.email && u.password === form.password);
      if (user) onLogin(user);
      else setError("Invalid email or password.");
    } else {
      if (!form.name || !form.email || !form.password) { setError("All fields required."); return; }
      const newUser = {
        id: Date.now(), name: form.name, email: form.email, password: form.password,
        role: form.role, verified: false, avatar: form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        title: "", bio: "", hourly_rate: 0, availability: "available", rating: 0,
        total_earnings: 0, skills: [], portfolio: [], completeness: 20, badges: [], reviews_count: 0,
      };
      onLogin(newUser);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--brand) 0%, var(--accent2) 60%, #1a1a3e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "2.2rem", fontWeight: 700, color: "white" }}>
            Talent<span style={{ color: "var(--accent)" }}>Stage</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>Where talent meets opportunity</p>
        </div>
        <div className="card" style={{ padding: "2rem" }}>
          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            <button className={`tab-btn ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
            <button className={`tab-btn ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>Create Account</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            {mode === "signup" && (
              <div className="form-group">
                <label className="form-label">I want to…</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="freelancer">Work as a Freelancer</option>
                  <option value="client">Hire Freelancers</option>
                  <option value="both">Both — Freelancer & Client</option>
                </select>
              </div>
            )}
            {error && <p style={{ color: "var(--accent)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
            <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }}>
              {mode === "login" ? "Sign In" : "Join TalentStage"}
            </button>
          </form>
          {mode === "login" && (
            <div style={{ marginTop: "1.25rem", padding: "0.85rem", background: "var(--bg)", borderRadius: "8px", fontSize: "0.8rem", color: "var(--muted)" }}>
              <strong>Demo accounts:</strong> alice@example.com (freelancer) · priya@example.com (client) · password: pass123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
