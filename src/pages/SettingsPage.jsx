import React, { useState } from "react";
import { setGlobalGeminiKey, GEMINI_API_KEY_PLACEHOLDER } from "../api/gemini.js";
import { Sparkles, CheckCircle2, PartyPopper } from "lucide-react";

export function SettingsPage({ user, geminiKey, setGeminiKey, notify }) {
  const [key, setKey] = useState(geminiKey === GEMINI_API_KEY_PLACEHOLDER ? "" : geminiKey);
  const [sub, setSub] = useState(false);

  function saveKey() {
    const finalKey = key || GEMINI_API_KEY_PLACEHOLDER;
    setGeminiKey(finalKey);
    setGlobalGeminiKey(finalKey);
    notify("Gemini API key saved!", "success");
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Manage your account and preferences</p>

      <div className="card mb-md">
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Sparkles size={16} color="var(--gold)" /> Gemini AI Integration</div>
        <p className="text-sm text-muted mb-md">Add your Gemini API key to unlock AI features: proposal scoring, skill tests, freelancer matching, portfolio review, and project scoping.</p>
        <div className="flex gap-sm mb-sm">
          <input className="form-input" type="password" placeholder="AIza…" value={key} onChange={e => setKey(e.target.value)} />
          <button className="btn btn-primary" onClick={saveKey}>Save Key</button>
        </div>
        {geminiKey && geminiKey !== GEMINI_API_KEY_PLACEHOLDER && <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> AI Enabled</span>}
        <p className="text-xs text-muted mt-sm">Get your free API key at <strong>aistudio.google.com</strong></p>
      </div>

      <div className="card mb-md">
        <div className="section-title">Pro Subscription</div>
        <div className="flex-between mb-md">
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>TalentStage Pro</div>
            <div className="text-sm text-muted">Unlimited bids · Featured profile · Priority AI matching</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem", fontWeight: 700 }}>$29<span style={{ fontSize: "0.8rem", fontFamily: "inherit" }}>/mo</span></div>
          </div>
        </div>
        {sub ? (
          <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Pro Active</span>
        ) : (
          <button className="btn btn-secondary" onClick={() => { setSub(true); notify("Welcome to Pro! 🎉", "success"); }}>Upgrade to Pro</button>
        )}
      </div>

      <div className="card mb-md">
        <div className="section-title">Identity Verification</div>
        <p className="text-sm text-muted mb-md">Verify your identity to get a Verified badge and build trust with clients.</p>
        {user.verified ? (
          <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Identity Verified</span>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL</label>
              <input className="form-input" placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <button className="btn btn-outline" onClick={() => notify("Verification request submitted!", "success")}>Submit for Verification</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Account Info</div>
        <div className="grid-2">
          <div><div className="text-xs text-muted mb-sm">Name</div><div style={{ fontWeight: 600 }}>{user.name}</div></div>
          <div><div className="text-xs text-muted mb-sm">Email</div><div style={{ fontWeight: 600 }}>{user.email}</div></div>
          <div><div className="text-xs text-muted mb-sm">Role</div><div style={{ fontWeight: 600, textTransform: "capitalize" }}>{user.role}</div></div>
          <div><div className="text-xs text-muted mb-sm">Member Since</div><div style={{ fontWeight: 600 }}>2025</div></div>
        </div>
      </div>
    </div>
  );
}
