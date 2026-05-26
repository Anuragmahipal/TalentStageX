"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_PROJECTS } from "@/lib/api";

type Project = { id: number; title: string; description?: string | null; budget_min?: number | null; budget_max?: number | null; status?: string; client_id?: number };

const MOCK_PROPOSALS = [
  { name: "Priya Sharma", title: "Senior React Developer", amount: 4200, days: 45, cover: "I have built 3 e-commerce platforms with React + Stripe. My latest project handled $2M+ in transactions. I can start immediately.", score: 94, rating: 4.9 },
  { name: "Carlos Mendez", title: "Full-Stack Engineer", amount: 3800, days: 50, cover: "React and Node.js are my core stack. I have PostgreSQL experience and can implement Stripe Connect for marketplace payments.", score: 81, rating: 4.7 },
  { name: "Tobias Klein", title: "Frontend Developer", amount: 3500, days: 60, cover: "5 years building React applications. I work well in agile teams and can deliver a clean, tested codebase.", score: 68, rating: 4.4 },
];

export default function MyProjectsPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [offline, setOffline] = useState(false);
  const [proposalsModal, setProposalsModal] = useState(false);

  useEffect(() => {
    if (user?.role !== "client") return;
    async function load() {
      try {
        const res = await apiFetch("/projects", undefined, token);
        if (res.ok) {
          const all = await res.json();
          setProjects(all.filter((p: Project) => p.client_id === user?.id));
          return;
        }
      } catch { /* fall through */ }
      setProjects(MOCK_PROJECTS.slice(0, 2) as Project[]);
      setOffline(true);
    }
    load();
  }, [user, token]);

  if (user?.role !== "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Only clients can manage projects.</div>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground">Projects you've posted</p>
        </div>
        <Link href="/post-project"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Post Project
        </Link>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline
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
                  <div className="text-xs text-muted-foreground">Fixed price</div>
                </div>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>
              <div className="flex gap-2">
                <button onClick={() => setProposalsModal(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                  View Proposals ({Math.floor(Math.random() * 5) + 1})
                </button>
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
              {MOCK_PROPOSALS.map(p => (
                <div key={p.name} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.title} · ★ {p.rating} · ${p.amount} · {p.days} days</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold
                      ${p.score >= 85 ? "bg-green-100 text-green-700" : p.score >= 70 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                      AI Score: {p.score}/100
                    </span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{p.cover}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { showToast(`${p.name} hired! Contract created.`, "success"); setProposalsModal(false); }}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                      Hire {p.name.split(" ")[0]}
                    </button>
                    <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Message</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
