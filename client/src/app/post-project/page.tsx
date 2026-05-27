"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, generateBrief } from "@/lib/api";
import type { GeneratedBrief } from "@/lib/types";

export default function PostProjectPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [budgetMin, setBudgetMin] = useState("500");
  const [budgetMax, setBudgetMax] = useState("2000");
  const [type, setType] = useState("fixed");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [posting, setPosting] = useState(false);

  // AI brief
  const [briefPrompt, setBriefPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [postedProjectId, setPostedProjectId] = useState<number | null>(null);

  function addSkill(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const s = skillInput.trim().replace(/,$/, "");
      if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
      setSkillInput("");
    }
  }

  async function handleGenerateBrief() {
    if (!briefPrompt.trim() || briefPrompt.length < 10) {
      showToast("Describe your project in at least 10 characters", "error");
      return;
    }
    setGenerating(true);
    try {
      const brief = await generateBrief(briefPrompt, token) as GeneratedBrief;
      // Fill form with generated brief (editable)
      setTitle(brief.title);
      setDesc(brief.description);
      setSkills(brief.skills);
      setBudgetMin(String(brief.budget_min));
      setBudgetMax(String(brief.budget_max));
      // Set deadline based on timeline_days
      const d = new Date(Date.now() + brief.timeline_days * 86400000);
      setDeadline(d.toISOString().split("T")[0]);
      setShowBriefPanel(false);
      showToast("Brief generated — review and edit before posting!", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      showToast(msg, "error");
    } finally {
      setGenerating(false);
    }
  }

  async function postProject() {
    if (!title || !desc) { showToast("Title and description are required", "error"); return; }
    if (user?.role !== "client") { showToast("Only clients can post projects.", "error"); return; }
    setPosting(true);
    try {
      const res = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          client_id: user?.id,
          title,
          description: desc,
          budget_min: Number(budgetMin),
          budget_max: Number(budgetMax),
          skills,
          project_type: type,
          deadline,
        }),
      }, token);
      if (res.ok) {
        const data = await res.json();
        const projectId = data?.data?.id ?? null;
        setPostedProjectId(projectId);
        showToast("Project posted! Freelancers will start submitting proposals.", "success");
        if (projectId) {
          router.push(`/my-projects?new=${projectId}`);
        } else {
          router.push("/my-projects");
        }
      } else {
        let msg = "Failed to post project.";
        try { const err = await res.json(); msg = err.detail || err.error?.message || msg; } catch (err) { console.error("Error parsing post project response", err); }
        showToast(msg, "error");
      }
    } catch {
      showToast("Could not reach the server. Project was not posted.", "error");
    } finally { setPosting(false); }
  }

  if (user?.role !== "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Only clients can post projects.</div>;
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Post a Project</h1>
        <p className="text-sm text-muted-foreground">Describe your needs and receive proposals from top freelancers</p>
      </div>

      {/* AI Brief Generator Panel */}
      <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
              <span>✦</span> AI Brief Generator
            </div>
            <p className="text-xs text-muted-foreground">Describe your project in plain English and let AI generate a complete structured brief that you can edit before posting.</p>
          </div>
          <button onClick={() => setShowBriefPanel(v => !v)}
            className="flex-shrink-0 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
            {showBriefPanel ? "Hide" : "Use AI Brief"}
          </button>
        </div>

        {showBriefPanel && (
          <div className="mt-3 space-y-2">
            <textarea
              rows={3}
              value={briefPrompt}
              onChange={e => setBriefPrompt(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
              placeholder="e.g. I need a React dashboard that connects to a REST API, shows charts, and allows CSV export. The app should be mobile-responsive and use TypeScript." />
            <button onClick={handleGenerateBrief} disabled={generating}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {generating ? "Generating…" : "Generate Brief →"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Details</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Project title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Build a React dashboard with REST API integration" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea rows={5} value={desc} onChange={e => setDesc(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe your project in detail — what you need built, technologies preferred, deliverables expected…" />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skills Required</h2>
            <div className="flex flex-wrap gap-1.5 rounded-md border border-input p-2 min-h-10" onClick={() => document.getElementById("pp-skill-inp")?.focus()}>
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {s}<button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
              <input id="pp-skill-inp" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill}
                className="flex-1 min-w-24 bg-transparent text-sm outline-none" placeholder="e.g. React, Node.js…" />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Budget & Timeline</h2>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Budget min (USD)</label>
                <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Budget max (USD)</label>
                <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Project type</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none">
                  <option value="fixed">Fixed price</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          <button onClick={postProject} disabled={posting}
            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {posting ? "Posting…" : "Post Project →"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary/80 leading-relaxed">
            After posting, use the <strong>AI Match</strong> button on your project to get ranked freelancer recommendations with explanations.
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 font-semibold text-sm">Tips</div>
            <ul className="space-y-2.5 text-sm">
              {["Be specific about deliverables", "List required technologies", "Set a realistic budget range", "Add a clear deadline"].map((t, i) => (
                <li key={i} className="flex gap-2"><span className="font-bold text-primary">0{i+1} /</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
