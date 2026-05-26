"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_CONTRACTS } from "@/lib/api";

type Contract = { id: number; project?: string; title?: string; client?: string; freelancer?: string; amount?: number; budget?: number; status?: string; milestone?: string; milestone_pct?: number; deadline?: string };

export default function ContractsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [offline, setOffline] = useState(false);
  const [msgs, setMsgs] = useState<Record<number, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/contracts", undefined, token);
        if (res.ok) { setContracts(await res.json()); return; }
      } catch { /* fall through */ }
      setContracts(MOCK_CONTRACTS);
      setOffline(true);
    }
    load();
  }, [token]);

  function sendMsg(id: number) {
    if (!msgs[id]?.trim()) return;
    showToast("Message sent!", "success");
    setMsgs(prev => ({ ...prev, [id]: "" }));
  }

  if (contracts.length === 0 && !offline) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <h3 className="mb-2 font-semibold">No contracts yet</h3>
        <p className="text-sm text-muted-foreground">Hire a freelancer or get hired to create your first contract.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Contracts</h1>
        <p className="text-sm text-muted-foreground">Active and completed contracts</p>
      </div>
      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline
        </div>
      )}
      <div className="space-y-4">
        {contracts.map(c => {
          const amount = c.amount ?? c.budget ?? 0;
          const pct = c.milestone_pct ?? 0;
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.project ?? c.title ?? "Contract"}</h3>
                  <div className="text-xs text-muted-foreground">{c.client} · {c.freelancer}</div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{c.status ?? "active"}</span>
                  <div className="mt-1 font-semibold text-primary">${amount}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">Milestone: {c.milestone ?? "In progress"}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Messages */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</div>
                  <div className="mb-2 space-y-2 rounded-lg bg-muted/40 p-3">
                    {[
                      { from: c.client ?? "Client", text: "Hey, how are the wireframes coming along?", sent: false },
                      { from: "You", text: "Going great! Should have the first draft ready by tomorrow.", sent: true },
                      { from: c.client ?? "Client", text: "Perfect. Looking forward to the review!", sent: false },
                    ].map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sent ? "items-end" : ""}`}>
                        <div className="text-xs font-medium text-muted-foreground">{m.from}</div>
                        <div className={`mt-0.5 max-w-xs rounded-lg px-3 py-1.5 text-xs
                          ${m.sent ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={msgs[c.id] ?? ""} onChange={e => setMsgs(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && sendMsg(c.id)}
                      className="flex-1 rounded-md border border-input px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Type a message…" />
                    <button onClick={() => sendMsg(c.id)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Send</button>
                  </div>
                </div>

                {/* Milestones + info */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Milestones</div>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span>{c.milestone ?? "In progress"}</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">In progress</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => showToast("Work submitted!", "success")}
                        className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Submit Work</button>
                      <button onClick={() => showToast(`Payment of $${Math.round(amount * 0.9)} released (10% fee deducted)!`, "success")}
                        className="flex-1 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                        Release ${Math.round(amount * 0.9)}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">Deadline: {c.deadline ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">Platform fee: 10% = ${Math.round(amount * 0.1)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
