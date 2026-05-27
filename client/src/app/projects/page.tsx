"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_PROJECTS } from "@/lib/api";

type Project = { id: number; title: string; description?: string | null; budget_min?: number | null; budget_max?: number | null; status?: string; skills?: string[]; project_type?: string; deadline?: string | null };

export default function ProjectsPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState("all");
  const [offline, setOffline] = useState(false);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [bid, setBid] = useState("");
  const [days, setDays] = useState("");
  const [cover, setCover] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === "client") return;
    async function load() {
      try {
        const res = await apiFetch("/projects");
        if (res.ok) {
          const json = await res.json();
          setProjects(json.data ?? json);
          return;
        }
      } catch { /* fall through */ }
      setProjects(MOCK_PROJECTS);
      setOffline(true);
    }
    load();
  }, [user]);

  const filtered = projects.filter(p => {
    if (filter === "low") return (p.budget_max ?? 0) < 1000;
    if (filter === "mid") return (p.budget_min ?? 0) >= 1000 && (p.budget_max ?? 0) <= 5000;
    if (filter === "high") return (p.budget_min ?? 0) > 5000;
    return true;
  });

  async function submitProposal() {
    if (!bid || !cover) { showToast("Bid amount and cover letter are required", "error"); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch(`/projects/${modalProject?.id}/proposal`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(bid), duration_days: Number(days), cover_message: cover }),
      }, token);
      if (res.ok) {
        showToast("Proposal submitted!", "success");
        setModalProject(null); setBid(""); setDays(""); setCover("");
      } else {
        showToast("Could not submit proposal.", "error");
      }
    } catch {
      showToast("Server unreachable — proposal not submitted.", "error");
    } finally { setSubmitting(false); }
  }

  if (user?.role === "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">Only freelancers can browse projects and submit proposals.</div>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Find Work</h1>
          <p className="text-sm text-muted-foreground">Browse open projects and submit proposals</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none">
          <option value="all">All budgets</option>
          <option value="low">Under $1k</option>
          <option value="mid">$1k–$5k</option>
          <option value="high">Over $5k</option>
        </select>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold">{p.title}</h3>
              <div className="text-right">
                <div className="font-semibold text-primary">${p.budget_min}–${p.budget_max}</div>
                <div className="text-xs text-muted-foreground">Fixed price</div>
              </div>
            </div>
            <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(p.skills ?? []).map(s => (
                <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs">{s}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalProject(p)}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Submit Proposal
              </button>
              <span className="flex items-center rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">{p.status ?? "open"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && setModalProject(null)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Submit Proposal</h2>
              <button onClick={() => setModalProject(null)} className="text-xl text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Your bid amount (USD)</label>
              <input type="number" value={bid} onChange={e => setBid(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1500" />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Estimated duration (days)</label>
              <input type="number" value={days} onChange={e => setDays(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. 14" />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Cover letter</label>
              <textarea rows={5} value={cover} onChange={e => setCover(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Introduce yourself and explain why you're the best fit…" />
            </div>
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary/80">
              Your proposal will be AI-scored on relevance, clarity, and value. A strong cover letter boosts your score.
            </div>
            <button onClick={submitProposal} disabled={submitting}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
