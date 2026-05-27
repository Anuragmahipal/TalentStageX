"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, MOCK_PROJECTS, fetchContracts, fetchEarnings } from "@/lib/api";

type ProfileData = { completeness_pct?: number; title?: string; rating?: number | null; total_earnings?: number };

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentProjects, setRecentProjects] = useState(MOCK_PROJECTS.slice(0, 3));
  const [offline, setOffline] = useState(false);
  const [stats, setStats] = useState({ totalEarned: 0, activeContracts: 0, activeProposals: 0 });

  useEffect(() => {
    async function load() {
      if (token === "demo-token") {
        setProfile({ completeness_pct: 20 });
        setOffline(true);
        return;
      }
      try {
        const res = await apiFetch("/profile", undefined, token);
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data ?? json);
        }
        else setProfile({ completeness_pct: 0 });
      } catch { setOffline(true); setProfile({ completeness_pct: 0 }); }

      try {
        const res = await apiFetch("/projects");
        if (res.ok) {
          const json = await res.json();
          setRecentProjects((json.data ?? json).slice(0, 3));
        }
      } catch { /* use mock */ }

      try {
        const [contracts, earnings] = await Promise.all([
          fetchContracts(token),
          fetchEarnings(token),
        ]);
        setStats({
          totalEarned: earnings?.total_earned ?? 0,
          activeContracts: contracts.filter((c: { status?: string }) => c.status === "active").length,
          activeProposals: 0,
        });
      } catch { /* keep zeroes */ }
    }
    load();
  }, [token]);

  const greeting = `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋`;
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const pct = profile?.completeness_pct ?? 0;
  const isClient = user?.role === "client";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{date}</p>
        </div>
        <Link href={isClient ? "/my-projects" : "/projects"}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {isClient ? "My Projects" : "Browse Projects"}
        </Link>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline or demo session
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
            { label: "Total Earned", value: `$${Math.round(stats.totalEarned)}`, sub: "from contracts" },
            { label: "Active Proposals", value: `${stats.activeProposals}`, sub: "awaiting review" },
            { label: "Active Contracts", value: `${stats.activeContracts}`, sub: "" },
          { label: "Profile Score", value: `${pct}%`, sub: "" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
            {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Recent projects */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-semibold text-sm">Recent Projects</span>
              <Link href="/projects" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium">{p.title}</div>
                    <div className="mt-0.5 flex gap-1.5">
                      {p.skills?.slice(0, 3).map((s: string) => (
                        <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">${p.budget_min}–${p.budget_max}</div>
                    <span className="text-xs text-green-600 font-medium">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completeness */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-sm font-semibold">Profile Completeness</div>
            <div className="mb-2 text-3xl font-bold text-primary">{pct}%</div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Complete your profile to get matched with projects</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary/80 leading-relaxed">
            Add portfolio items and skills to unlock AI matching and get top-ranked in client searches. Profiles above 80% get 3× more proposal views.
          </div>
        </div>
      </div>
    </div>
  );
}
