"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_PROJECTS, matchFreelancers } from "@/lib/api";
import type { FreelancerMatch, Freelancer } from "@/lib/types";

type Project = { id: number; title: string; description?: string | null; budget_min?: number | null; budget_max?: number | null; status?: string; client_id?: number; skills?: string[]; project_type?: string; deadline?: string | null };
type Proposal = {
  proposal_id: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer?: Freelancer | null;
  amount?: number | null;
  duration_days?: number | null;
  cover_message?: string | null;
  score?: number;
  status?: string;
};

// (removed unused MOCK_PROPOSALS to satisfy TS/lint rules)

export default function MyProjectsPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [offline, setOffline] = useState(false);
  const [proposalsModal, setProposalsModal] = useState(false);
  const [matchesProject, setMatchesProject] = useState<Project | null>(null);
  const [matches, setMatches] = useState<FreelancerMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    if (user?.role !== "client") return;
    try {
      const res = await apiFetch("/projects", undefined, token);
      if (res.ok) {
        const data = await res.json();
        const all = data.data ?? data;
        setProjects(all.filter((p: Project) => p.client_id === user?.id));
        return;
      }
    } catch { /* fall through */ }
    setProjects(MOCK_PROJECTS.slice(0, 2) as Project[]);
    setOffline(true);
  }, [user, token]);

  useEffect(() => {
    async function load() {
      await loadProjects();
    }
    load();
  }, [loadProjects]);

  // If navigated here with ?new=<id>, auto-open matches for that project
  useEffect(() => {
    const newId = searchParams.get("new");
    if (newId && projects.length > 0) {
      const p = projects.find(p => String(p.id) === newId);
      if (p && !offline) openMatches(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projects]);

  async function openMatches(project: Project) {
    setMatchesProject(project);
    setMatches([]);
    setMatchLoading(true);
    try {
      const data = await matchFreelancers(project.id, token);
      setMatches(data as FreelancerMatch[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Matching failed";
      showToast(msg, "error");
    } finally {
      setMatchLoading(false);
    }
  }

  async function openProposals(project: Project) {
    setSelectedProject(project);
    setProposals([]);
    setProposalsLoading(true);
    setProposalsModal(true);
    try {
      const res = await apiFetch(`/projects/${project.id}/proposals`, undefined, token);
      if (!res.ok) throw new Error("Failed to load proposals");
      const json = await res.json();
      setProposals(json.data ?? json);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load proposals";
      showToast(msg, "error");
    } finally {
      setProposalsLoading(false);
    }
  }

  async function hireProposal(project: Project, proposalId: number) {
    try {
      const res = await apiFetch(`/projects/${project.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ proposal_id: proposalId }),
      }, token);
      if (!res.ok) throw new Error("Failed to hire freelancer");
      showToast("Freelancer hired! Contract created.", "success");
      setProposalsModal(false);
      await loadProjects();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Hiring failed";
      showToast(msg, "error");
    }
  }

  if (user?.role !== "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Only clients can manage projects.</div>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground">Projects you&apos;ve posted</p>
        </div>
        <Link href="/post-project"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Post Project
        </Link>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline. AI Match requires a live backend.
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <h3 className="mb-2 font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Post your first project and start receiving proposals.</p>
          <Link href="/post-project" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Post a Project →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{p.status ?? "open"}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">${p.budget_min}–${p.budget_max}</div>
                  <div className="text-xs text-muted-foreground">{p.project_type ?? "fixed"}</div>
                </div>
              </div>
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setProposalsModal(true)}></button>
                <button onClick={() => openProposals(p)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                  View Proposals
                </button>
                {!offline && (
                  <button onClick={() => openMatches(p)}
                    className="rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
                    ✦ AI Match
                  </button>
                )}
                <button onClick={() => showToast("Project closed", "success")}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50">Close</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposals modal */}
      {proposalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && setProposalsModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Proposals</h2>
              <button onClick={() => setProposalsModal(false)} className="text-xl text-muted-foreground">×</button>
            </div>
            <div className="space-y-3">
              {proposalsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading proposals…</div>
              ) : proposals.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No proposals yet for {selectedProject?.title ?? "this project"}.
                </div>
              ) : (
                proposals.map(p => (
                  <div key={p.proposal_id} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{p.freelancer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.freelancer?.title ?? "Freelancer"} · ★ {p.freelancer?.verified ? "Verified" : "Unverified"} · ${p.amount} · {p.duration_days} days
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold
                        ${(p.score ?? 0) >= 85 ? "bg-green-100 text-green-700" : (p.score ?? 0) >= 70 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                        AI Score: {p.score ?? 0}/100
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{p.cover_message}</p>
                    <div className="flex gap-2">
                      <button onClick={() => hireProposal(selectedProject ?? { id: 0, title: "Project" }, p.proposal_id)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                        Hire {p.freelancer_name.split(" ")[0]}
                      </button>
                      <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Message</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Matches modal */}
      {matchesProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && setMatchesProject(null)}>
          <div className="w-full max-w-xl rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-primary">✦</span>
                <h2 className="font-bold">AI Freelancer Matches</h2>
              </div>
              <button onClick={() => setMatchesProject(null)} className="text-xl text-muted-foreground">×</button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Top freelancers ranked for <strong>{matchesProject.title}</strong></p>

            {matchLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <div className="mb-2 text-2xl">✦</div>
                Analyzing freelancer profiles…
              </div>
            ) : matches.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No freelancers found. Add freelancer accounts to see matches.
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m, i) => (
                  <div key={m.freelancer_id} className="rounded-xl border border-border p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-sm">
                            {m.name}
                            {m.verified && <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[9px]">✓</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.title ?? "Freelancer"}{m.hourly_rate ? ` · $${m.hourly_rate}/hr` : ""}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`rounded-full px-2 py-0.5 text-xs font-bold
                          ${m.match_score >= 70 ? "bg-green-100 text-green-700" : m.match_score >= 50 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                          {m.match_score}% match
                        </div>
                        {m.avg_rating != null && <div className="mt-0.5 text-xs text-muted-foreground">★ {m.avg_rating}</div>}
                      </div>
                    </div>

                    {/* Why this match */}
                    <div className="mb-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary/80 leading-relaxed">
                      <span className="font-medium">Why this match: </span>{m.match_reason}
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1">
                      {m.skills.slice(0, 5).map(s => (
                        <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
                      ))}
                    </div>

                    <button onClick={() => showToast(`Message sent to ${m.name}!`, "success")}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-muted">
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
