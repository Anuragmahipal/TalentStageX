"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch, MOCK_COMMUNITY, MOCK_FREELANCERS } from "@/lib/api";

type Post = { id: number; author: string; avatar?: string; content: string; cat: string; likes: number; comments: number; time: string };

const CAT_COLORS: Record<string, string> = {
  General: "bg-gray-100 text-gray-700", Tip: "bg-green-100 text-green-700",
  Showcase: "bg-blue-100 text-blue-700", Question: "bg-amber-100 text-amber-700",
};

export default function CommunityPage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [contributors] = useState(MOCK_FREELANCERS.slice(0, 3));
  const [offline, setOffline] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postCat, setPostCat] = useState("general");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/community/posts", undefined, token);
        if (res.ok) { setPosts(await res.json()); return; }
      } catch { /* fall through */ }
      setPosts([...MOCK_COMMUNITY]);
      setOffline(true);
    }
    load();
  }, [token]);

  function likePost(id: number) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  }

  async function submitPost() {
    if (!postContent.trim()) { showToast("Write something first!", "error"); return; }
    setPosting(true);
    const catLabel: Record<string, string> = { general: "General", tip: "Tip", showcase: "Showcase", question: "Question" };
    try {
      if (!offline && token !== "demo-token") {
        const res = await apiFetch("/community/posts", {
          method: "POST",
          body: JSON.stringify({ content: postContent, category: postCat }),
        }, token);
        if (res.ok) {
          const data = await res.json();
          setPosts(prev => [data, ...prev]);
          showToast("Post published!", "success");
          setShowModal(false); setPostContent("");
          return;
        } else { showToast("Could not publish post.", "error"); return; }
      }
    } catch { /* fall through to local */ }
    setPosts(prev => [{
      id: Date.now(), author: user?.name ?? "You",
      avatar: (user?.name ?? "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      content: postContent, cat: catLabel[postCat] ?? postCat, likes: 0, comments: 0, time: "Just now",
    }, ...prev]);
    showToast("Post added locally (demo mode).", "success");
    setShowModal(false); setPostContent("");
    setPosting(false);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Community Feed</h1>
          <p className="text-sm text-muted-foreground">Share updates, ask questions, celebrate wins</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + New Post
        </button>
      </div>

      {offline && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠ <strong>Demo data</strong> — backend offline
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-3">
          {posts.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {p.avatar ?? "?"}
                </div>
                <div>
                  <div className="text-sm font-semibold">{p.author}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.time} ·
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAT_COLORS[p.cat] ?? "bg-gray-100 text-gray-700"}`}>{p.cat}</span>
                  </div>
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed">{p.content}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <button onClick={() => likePost(p.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  ♥ {p.likes}
                </button>
                <span className="flex items-center gap-1">💬 {p.comments} comments</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 font-semibold text-sm">Weekly Challenge 🏆</div>
            <p className="mb-2 text-xs text-muted-foreground">Build a Figma dashboard UI in 48 hours</p>
            <span className="mb-3 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ends in 2 days</span>
            <button onClick={() => showToast("Challenges feature coming soon!", "info")}
              className="mt-2 w-full rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted">Submit entry</button>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 font-semibold text-sm">Top Contributors</div>
            <div className="space-y-2.5">
              {contributors.map(c => {
                const initials = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">{initials}</div>
                    <div>
                      <div className="text-xs font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.location}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New post modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">New Post</h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-muted-foreground">×</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">What&apos;s on your mind?</label>
              <textarea rows={4} value={postContent} onChange={e => setPostContent(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Share a tip, celebrate a win, ask a question…" />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select value={postCat} onChange={e => setPostCat(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none">
                <option value="general">General</option>
                <option value="tip">Tip / Tutorial</option>
                <option value="showcase">Showcase</option>
                <option value="question">Question</option>
              </select>
            </div>
            <button onClick={submitPost} disabled={posting}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {posting ? "Publishing…" : "Publish Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
