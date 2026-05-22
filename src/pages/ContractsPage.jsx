import React, { useState, useEffect } from "react";

export function ContractsPage({ user, contracts, setContracts, notify }) {
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("messages");

  const myContracts = contracts.filter(c => c.freelancer_id === user.id || c.client_id === user.id);
  const contract = selected ? contracts.find(c => c.id === selected) : null;

  useEffect(() => { if (myContracts.length && !selected) setSelected(myContracts[0]?.id); }, []);

  function sendMessage() {
    if (!msg.trim() || !contract) return;
    const updated = { ...contract, messages: [...contract.messages, { id: Date.now(), sender_id: user.id, sender: user.name, text: msg, time: new Date().toISOString().slice(0, 16).replace("T", " ") }] };
    setContracts(contracts.map(c => c.id === contract.id ? updated : c));
    setMsg("");
  }

  function approveMilestone(milestoneId) {
    if (!contract) return;
    const updated = { ...contract, milestones: contract.milestones.map(m => m.id === milestoneId ? { ...m, approved: true, status: "completed" } : m) };
    setContracts(contracts.map(c => c.id === contract.id ? updated : c));
    notify("Milestone approved! Payment released. ✓", "success");
  }

  return (
    <div className="page">
      <h1 className="page-title">Active Contracts</h1>
      <p className="page-sub">Manage your ongoing projects</p>

      {myContracts.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">📄</div><p>No active contracts yet.</p></div>
      ) : (
        <div className="two-col" style={{ alignItems: "start" }}>
          <div>
            {myContracts.map(c => (
              <div key={c.id} className={`card card-sm card-hover mb-md ${selected === c.id ? "" : ""}`}
                style={{ borderColor: selected === c.id ? "var(--accent)" : undefined, borderWidth: selected === c.id ? 2 : 1 }}
                onClick={() => setSelected(c.id)}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{c.project_title}</div>
                <div className="text-xs text-muted mb-sm">
                  {user.id === c.client_id ? `Freelancer: ${c.freelancer_name}` : `Client: ${c.client_name}`}
                </div>
                <div className="flex-between">
                  <span style={{ fontWeight: 700, color: "var(--success)" }}>${c.total_amount}</span>
                  <span className={`pill pill-${c.status}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>

          {contract && (
            <div className="card">
              <div className="flex-between mb-md">
                <div>
                  <h3 style={{ fontWeight: 700 }}>{contract.project_title}</h3>
                  <div className="text-xs text-muted">Started {contract.start_date}</div>
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem", fontWeight: 700 }}>${contract.total_amount}</span>
              </div>

              <div className="tabs">
                {["messages", "milestones"].map(t => (
                  <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === "messages" && (
                <div>
                  <div className="chat-area">
                    {contract.messages.map(m => (
                      <div key={m.id} className={`msg-bubble ${m.sender_id === user.id ? "msg-own" : "msg-other"}`}>
                        {m.sender_id !== user.id && <div className="text-xs text-muted mb-sm">{m.sender}</div>}
                        <div className="msg-text">{m.text}</div>
                        <div className="text-xs text-muted" style={{ marginTop: "0.25rem", textAlign: m.sender_id === user.id ? "right" : "left" }}>{m.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chat-input-row">
                    <input className="chat-input" placeholder="Type a message…" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
                    <button className="btn btn-primary btn-sm" onClick={sendMessage}>Send</button>
                  </div>
                </div>
              )}

              {tab === "milestones" && (
                <div>
                  {contract.milestones.map(m => (
                    <div key={m.id} className={`milestone-row ${m.approved ? "milestone-done" : "milestone-active"}`}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.approved ? "var(--success)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: m.approved ? "white" : "var(--muted)", fontSize: "0.9rem", flexShrink: 0 }}>
                        {m.approved ? "✓" : "○"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{m.description}</div>
                        <div className="text-xs text-muted">Due {m.due_date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700 }}>${m.amount}</div>
                        <div className="text-xs" style={{ color: m.approved ? "var(--success)" : "var(--gold)" }}>{m.approved ? "Paid" : "Pending"}</div>
                      </div>
                      {!m.approved && user.id === contract.client_id && (
                        <button className="btn btn-success btn-sm" onClick={() => approveMilestone(m.id)}>Release</button>
                      )}
                    </div>
                  ))}
                  <div className="divider" />
                  <div className="flex-between">
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.1rem" }}>${contract.total_amount}</span>
                  </div>
                  <div className="flex-between mt-sm">
                    <span className="text-sm text-muted">Platform fee (10%)</span>
                    <span className="text-sm text-muted">-${Math.round(contract.total_amount * 0.1)}</span>
                  </div>
                  <div className="flex-between mt-sm">
                    <span style={{ fontWeight: 600, color: "var(--success)" }}>Freelancer receives</span>
                    <span style={{ fontWeight: 700, color: "var(--success)" }}>${Math.round(contract.total_amount * 0.9)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
