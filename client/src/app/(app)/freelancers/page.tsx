"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_FREELANCERS } from "@/lib/api";

type Freelancer = { id: number; name: string; title?: string; rate?: number; hourly_rate?: number; rating?: number; reviews?: number; skills?: string[]; location?: string };

export default function FreelancersPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (user?.role !== "client") return;
    async function load() {
      try {
        const res = await apiFetch("/freelancers", undefined, token);
        if (res.ok) { setFreelancers(await res.json()); return; }
      } catch { /* fall through */ }
      setFreelancers(MOCK_FREELANCERS);
      setOffline(true);
    }
    load();
  }, [user, token]);

  if (user?.role !== "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Only clients can browse freelancers.</div>;
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Browse Freelancers</h1>
        <p className="text-sm text-muted-foreground">Find the perfect talent for your project</p>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {freelancers.map(f => {
          const initials = (f.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          const hr = f.rate ?? f.hourly_rate;
          return (
            <div key={f.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.title ?? "Freelancer"}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs">
                    <span className="text-amber-500">★</span>
                    <span className="font-medium">{f.rating ?? "—"}</span>
                    <span className="text-muted-foreground">({f.reviews ?? 0} reviews)</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary">{hr ? `$${hr}/hr` : "—"}</div>
              </div>
              {f.location && <div className="mb-2 text-xs text-muted-foreground">{f.location}</div>}
              <div className="mb-3 flex flex-wrap gap-1">
                {(f.skills ?? []).map(s => (
                  <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => showToast(`Message sent to ${f.name}!`, "success")}
                  className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Message</button>
                <button onClick={() => showToast(`${f.name} bookmarked!`, "success")}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">♡</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
