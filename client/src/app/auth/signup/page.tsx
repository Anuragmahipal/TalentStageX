"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleSignup() {
    if (!name || !email || !pw) { showToast("Please fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password: pw, role }),
      });
      if (res.ok) {
        showToast("Account created! Please sign in.", "success");
        router.push("/auth/login");
      } else {
        let msg = "Signup failed.";
        try { const err = await res.json(); msg = err.detail || err.message || msg; } catch (_) {}
        showToast(msg, "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-1 text-xl font-bold">TalentStageX</div>
          <div className="text-sm text-muted-foreground">Create your account. Join as a freelancer or client.</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Alex Johnson" />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com" />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Min. 8 characters" />
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">I want to…</label>
            <div className="grid grid-cols-2 gap-3">
              {(["freelancer", "client"] as const).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`rounded-lg border-2 p-3 text-center text-xs font-medium transition-all
                    ${role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                  <div className="mb-1 text-xl">{r === "freelancer" ? "💼" : "🏢"}</div>
                  {r === "freelancer" ? "Find work" : "Hire talent"}<br/>
                  <span className="font-normal opacity-70">as a {r}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSignup} disabled={loading}
            className="mb-3 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Creating…" : "Create account"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary underline-offset-2 hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
