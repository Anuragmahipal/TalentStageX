import React, { useState } from "react";
import { INITIAL_USERS } from "../data/mockData.js";
import { getAvatarClass } from "../utils/helpers.js";
import { StarRating } from "../components/Shared.jsx";

export function FreelancersPage({ currentUser }) {
  const [search, setSearch] = useState("");
  const [bookmarked, setBookmarked] = useState([]);

  const freelancers = INITIAL_USERS.filter(u => u.role === "freelancer" || u.role === "both");
  const filtered = freelancers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.skills.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h1 className="page-title">Browse Freelancers</h1>
      <p className="page-sub">Discover top talent for your project</p>

      <div className="search-bar mb-lg" style={{ maxWidth: 480 }}>
        <span className="search-icon">⌕</span>
        <input placeholder="Search by name, skill, title…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="three-col">
        {filtered.map(f => (
          <div key={f.id} className="card card-hover">
            <div style={{ textAlign: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
              <div className={`avatar avatar-lg ${getAvatarClass(f.name)}`} style={{ margin: "0 auto 0.75rem" }}>{f.avatar}</div>
              <div style={{ fontWeight: 700 }}>{f.name}</div>
              <div className="text-xs text-muted mb-sm">{f.title}</div>
              <div className="flex-center gap-sm" style={{ justifyContent: "center" }}>
                {f.verified && <span className="badge badge-green">✓ Verified</span>}
                <span className={`status-dot status-${f.availability}`} />
              </div>
            </div>

            <div className="flex-between mb-md">
              <div><span className="text-xs text-muted">Rate</span><br /><strong>${f.hourly_rate}/hr</strong></div>
              <div style={{ textAlign: "right" }}><span className="text-xs text-muted">Rating</span><br /><StarRating rating={f.rating} /></div>
            </div>

            <div className="flex gap-sm mb-md" style={{ flexWrap: "wrap" }}>
              {f.skills.slice(0, 3).map(s => <span key={s} className="tag tag-sm">{s}</span>)}
              {f.skills.length > 3 && <span className="tag tag-sm">+{f.skills.length - 3}</span>}
            </div>

            {f.badges?.length > 0 && (
              <div className="flex gap-sm mb-md">
                {f.badges.slice(0, 2).map(b => <span key={b} className="badge badge-gold">🏅 {b}</span>)}
              </div>
            )}

            <div className="flex gap-sm">
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>View Profile</button>
              <button className="btn btn-outline btn-sm" onClick={() => setBookmarked(bk => bk.includes(f.id) ? bk.filter(x => x !== f.id) : [...bk, f.id])}>
                {bookmarked.includes(f.id) ? "★" : "☆"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
