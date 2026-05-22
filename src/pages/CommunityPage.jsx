import React, { useState } from "react";
import { COMMUNITY_POSTS, CHALLENGES } from "../data/mockData.js";
import { getAvatarClass } from "../utils/helpers.js";
import { MessageCircle, Heart, Trophy, Megaphone, Target, Flame } from "lucide-react";

export function CommunityPage({ user, notify }) {
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const [newPost, setNewPost] = useState("");
  const [challenges] = useState(CHALLENGES);
  const [tab, setTab] = useState("feed");

  function submitPost() {
    if (!newPost.trim()) return;
    const post = { id: Date.now(), author_id: user.id, author: user.name, avatar: user.avatar, content: newPost, likes: 0, comments: 0, time: "Just now", tags: [] };
    setPosts([post, ...posts]);
    setNewPost("");
    notify("Post published!", "success");
  }

  function likePost(id) {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  }

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <h1 className="page-title">Community</h1>
      <p className="page-sub">Connect, share, and grow with fellow freelancers</p>

      <div className="tabs">
        {["feed", "challenges"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {t === "feed" ? <><Megaphone size={16}/> Feed</> : <><Trophy size={16}/> Challenges</>}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <div>
          <div className="card mb-lg">
            <div className="flex gap-md mb-md">
              <div className={`avatar avatar-sm ${getAvatarClass(user.name)}`}>{user.avatar}</div>
              <textarea className="form-textarea" placeholder="Share a tip, win, or question with the community…" value={newPost} onChange={e => setNewPost(e.target.value)} style={{ minHeight: 80, flex: 1 }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <button className="btn btn-primary btn-sm" onClick={submitPost} disabled={!newPost.trim()}>Publish Post</button>
            </div>
          </div>

          {posts.map(p => (
            <div key={p.id} className="card mb-md">
              <div className="flex gap-md mb-md">
                <div className={`avatar avatar-sm ${getAvatarClass(p.author)}`}>{p.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p.author}</div>
                  <div className="text-xs text-muted">{p.time}</div>
                </div>
              </div>
              <p style={{ lineHeight: 1.65, marginBottom: "0.75rem", fontSize: "0.9rem" }}>{p.content}</p>
              {p.tags.length > 0 && (
                <div className="flex gap-sm mb-md">
                  {p.tags.map(t => <span key={t} className="tag tag-sm">#{t}</span>)}
                </div>
              )}
              <div className="divider" />
              <div className="flex gap-md">
                <button className="btn btn-ghost btn-sm" onClick={() => likePost(p.id)} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Heart size={14} /> {p.likes}</button>
                <button className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><MessageCircle size={14} /> {p.comments}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "challenges" && (
        <div>
          <div className="badge badge-gold mb-lg" style={{ padding: "0.5rem 1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Trophy size={16} /> Weekly Challenges — Compete & Win
          </div>
          {challenges.map(c => (
            <div key={c.id} className="card mb-md">
              <div className="flex-between mb-md">
                <div>
                  <span className="badge badge-accent mb-sm" style={{ display: "block", width: "fit-content" }}>{c.category}</span>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{c.title}</h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--gold)" }}>{c.prize}</div>
                  <div className="text-xs text-muted">{c.entries} entries</div>
                </div>
              </div>
              <p className="text-sm text-muted mb-md">{c.description}</p>
              <div className="flex-between">
                <span className="text-xs text-muted">Deadline: {c.deadline}</span>
                <button className="btn btn-primary btn-sm" onClick={() => notify("Challenge entry submitted!", "success")}>Enter Challenge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
