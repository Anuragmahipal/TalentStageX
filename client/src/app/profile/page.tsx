"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";

type PortfolioItem = { id: number; title: string; category: string; description: string; tools: string; url?: string };

export default function ProfilePage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [avail, setAvail] = useState("available");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [pct, setPct] = useState(0);
  const [showPortModal, setShowPortModal] = useState(false);
  const [portTitle, setPortTitle] = useState(""); const [portCat, setPortCat] = useState("Web Development");
  const [portDesc, setPortDesc] = useState(""); const [portTools, setPortTools] = useState(""); const [portUrl, setPortUrl] = useState("");

  useEffect(() => {
    async function load() {
      if (token === "demo-token") { setPct(20); return; }
      try {
        const res = await apiFetch("/profile", undefined, token);
        if (res.ok) {
          const d = await res.json();
          setTitle(d.title ?? ""); setBio(d.bio ?? ""); setRate(d.hourly_rate ?? "");
          setSkills(d.skills ?? []); setPortfolio(d.portfolio ?? []); setPct(d.completeness_pct ?? 0);
        }
      } catch { /* offline */ }
    }
    load();
  }, [token]);

  function addSkill(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const s = skillInput.trim().replace(/,$/, "");
      if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
      setSkillInput("");
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ title, bio, hourly_rate: Number(rate), availability: avail, skills }),
      }, token);
      if (res.ok) { const d = await res.json(); setPct(d.completeness_pct ?? pct); showToast("Profile saved!", "success"); }
      else showToast("Failed to save profile.", "error");
    } catch { showToast("Server unreachable.", "error"); } finally { setSaving(false); }
  }

  function addPortfolio() {
    if (!portTitle) { showToast("Title is required", "error"); return; }
    setPortfolio(prev => [...prev, { id: Date.now(), title: portTitle, category: portCat, description: portDesc, tools: portTools, url: portUrl }]);
    setPortTitle(""); setPortDesc(""); setPortTools(""); setPortUrl("");
    setShowPortModal(false);
    showToast("Portfolio item added!", "success");
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your bio, skills, and portfolio</p>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Basic info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h2>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Full name</label>
                <input value={user?.name ?? ""} readOnly className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input value={user?.email ?? ""} readOnly className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Professional title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Senior React Developer" />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe your expertise and what makes you stand out…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Hourly rate (USD)</label>
                <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="50" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Availability</label>
                <select value={avail} onChange={e => setAvail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none">
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="not-available">Not available</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skills</h2>
            <div className="flex flex-wrap gap-1.5 rounded-md border border-input p-2 min-h-10" onClick={() => document.getElementById("skill-inp")?.focus()}>
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {s}
                  <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
              <input id="skill-inp" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill}
                className="flex-1 min-w-24 bg-transparent text-sm outline-none" placeholder="Type a skill and press Enter…" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Press Enter or comma to add. Click × to remove.</p>
          </div>

          {/* Portfolio */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Portfolio</h2>
              <button onClick={() => setShowPortModal(true)}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-muted">+ Add work</button>
            </div>
            {portfolio.length === 0
              ? <p className="text-sm text-muted-foreground">No portfolio items yet. Add your previous work!</p>
              : <div className="space-y-3">{portfolio.map(item => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.category} · {item.tools}</div>
                    {item.description && <p className="mt-1 text-xs">{item.description}</p>}
                  </div>
                ))}</div>
            }
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-sm font-semibold">Profile Completeness</div>
            <div className="mb-2 text-3xl font-bold text-primary">{pct}%</div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Add title, bio, skills & portfolio to reach 100%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">Verification</div>
            <p className="mb-3 text-xs text-muted-foreground">Verify your identity to build client trust.</p>
            <button onClick={() => showToast("Identity verification coming soon!", "info")}
              className="w-full rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Verify Identity</button>
          </div>
        </div>
      </div>

      {/* Portfolio modal */}
      {showPortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && setShowPortModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Add Portfolio Item</h2>
              <button onClick={() => setShowPortModal(false)} className="text-xl text-muted-foreground">×</button>
            </div>
            {[
              { label: "Project title", val: portTitle, set: setPortTitle, ph: "E-commerce Platform Redesign" },
              { label: "Description", val: portDesc, set: setPortDesc, ph: "What did you build? What was the outcome?" },
              { label: "Tools & technologies", val: portTools, set: setPortTools, ph: "e.g. React, Figma, Python" },
              { label: "Project URL (optional)", val: portUrl, set: setPortUrl, ph: "https://…" },
            ].map(f => (
              <div key={f.label} className="mb-3">
                <label className="mb-1 block text-sm font-medium">{f.label}</label>
                {f.label === "Description"
                  ? <textarea rows={3} value={f.val} onChange={e => f.set(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder={f.ph} />
                  : <input value={f.val} onChange={e => f.set(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder={f.ph} />
                }
              </div>
            ))}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={portCat} onChange={e => setPortCat(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none">
                {["Web Development","Mobile App","Design","Data Science","Marketing","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={addPortfolio}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Add to Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
