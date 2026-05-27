"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { MOCK_FREELANCERS, fetchFreelancers, fetchSavedFreelancers, saveFreelancer, unsaveFreelancer } from "@/lib/api";
import type { Freelancer, SavedFreelancer } from "@/lib/types";

export default function FreelancersPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [savedFreelancers, setSavedFreelancers] = useState<SavedFreelancer[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    if (user?.role !== "client") { setLoading(false); return; }
    setLoading(true);
    try {
      const [flData, savedData] = await Promise.all([
        fetchFreelancers(token),
        fetchSavedFreelancers(token),
      ]);
      setFreelancers(flData as Freelancer[]);
      setSavedFreelancers(savedData as SavedFreelancer[]);
      setSavedIds(new Set((savedData as SavedFreelancer[]).map(s => s.freelancer_id)));
    } catch (err) {
      console.error("Error loading freelancer data", err);
      setFreelancers(MOCK_FREELANCERS as Freelancer[]);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => { 
    async function load() {
      await loadData();
    }
    load();
  }, [loadData]);

  async function toggleSave(freelancerId: number, name: string) {
    if (offline) { showToast("Cannot save — backend offline", "error"); return; }
    setSavingId(freelancerId);
    try {
      if (savedIds.has(freelancerId)) {
        const res = await unsaveFreelancer(freelancerId, token);
        if (res.ok) {
          setSavedIds(prev => { const s = new Set(prev); s.delete(freelancerId); return s; });
          setSavedFreelancers(prev => prev.filter(s => s.freelancer_id !== freelancerId));
          showToast(`${name} removed from saved`, "success");
        }
      } else {
        const res = await saveFreelancer(freelancerId, token);
        if (res.ok) {
          setSavedIds(prev => new Set([...prev, freelancerId]));
          await loadData(); // refresh saved list
          showToast(`${name} saved!`, "success");
        } else if (res.status === 409) {
          showToast("Already saved", "info");
        }
      }
    } catch {
      showToast("Save action failed", "error");
    } finally {
      setSavingId(null);
    }
  }

  if (user?.role !== "client") {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Only clients can browse freelancers.</div>;
  }

  const filteredFreelancers = freelancers.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.title ?? "").toLowerCase().includes(q) ||
      (f.skills ?? []).some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Browse Freelancers</h1>
        <p className="text-sm text-muted-foreground">Find and save the perfect talent for your projects</p>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline. Save/unsave requires a live backend.
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-border">
        {(["all", "saved"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "all" ? `All Freelancers (${freelancers.length})` : `Saved (${savedIds.size})`}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <div className="mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full max-w-sm rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search by name, title, or skill…" />
          </div>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading freelancers…</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredFreelancers.map(f => (
                <FreelancerCard
                  key={f.id} f={f}
                  isSaved={savedIds.has(f.id)}
                  isSaving={savingId === f.id}
                  onToggleSave={() => toggleSave(f.id, f.name)}
                  showToast={showToast}
                />
              ))}
              {filteredFreelancers.length === 0 && (
                <div className="col-span-3 py-10 text-center text-sm text-muted-foreground">No freelancers match your search.</div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "saved" && (
        <div className="grid grid-cols-3 gap-4">
          {savedFreelancers.length === 0 ? (
            <div className="col-span-3 py-10 text-center text-sm text-muted-foreground">
              No saved freelancers yet. Browse the <button onClick={() => setTab("all")} className="text-primary underline">All tab</button> and click ♡ to save.
            </div>
          ) : (
            savedFreelancers.map(s => {
              const fl: Freelancer = {
                id: s.freelancer_id,
                name: s.freelancer_name,
                title: s.freelancer_title,
                hourly_rate: s.freelancer_hourly_rate,
                skills: s.freelancer_skills,
                verified: s.freelancer_verified,
              };
              return (
                <FreelancerCard
                  key={s.id} f={fl}
                  isSaved={true}
                  isSaving={savingId === s.freelancer_id}
                  onToggleSave={() => toggleSave(s.freelancer_id, s.freelancer_name)}
                  showToast={showToast}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FreelancerCard({
  f, isSaved, isSaving, onToggleSave, showToast,
}: {
  f: Freelancer;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}) {
  const initials = (f.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hr = f.hourly_rate ?? f.rate;
  const rating = f.avg_rating ?? f.rating;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold truncate">{f.name}</span>
            {f.verified && (
              <span title="Verified" className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px]">✓</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{f.title ?? "Freelancer"}</div>
          {rating != null && (
            <div className="mt-0.5 flex items-center gap-1 text-xs">
              <span className="text-amber-500">★</span>
              <span className="font-medium">{rating}</span>
              {f.reviews != null && <span className="text-muted-foreground">({f.reviews} reviews)</span>}
            </div>
          )}
        </div>
        <div className="text-sm font-semibold text-primary flex-shrink-0">{hr ? `$${hr}/hr` : "—"}</div>
      </div>
      {f.location && <div className="mb-2 text-xs text-muted-foreground">{f.location}</div>}
      <div className="mb-3 flex flex-wrap gap-1">
        {(f.skills ?? []).slice(0, 5).map(s => (
          <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
        ))}
        {(f.skills ?? []).length > 5 && (
          <span className="text-xs text-muted-foreground">+{(f.skills ?? []).length - 5}</span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => showToast(`Message sent to ${f.name}!`, "success")}
          className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Message</button>
        <button
          onClick={onToggleSave}
          disabled={isSaving}
          title={isSaved ? "Remove from saved" : "Save freelancer"}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${isSaved ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : "border-border hover:bg-muted"}`}>
          {isSaving ? "…" : isSaved ? "♥" : "♡"}
        </button>
      </div>
    </div>
  );
}
