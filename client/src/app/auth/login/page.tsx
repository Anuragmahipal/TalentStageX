"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("test.freelancer@example.com");
  const [pw, setPw] = useState("password");
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !pw) { showToast("Please fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pw }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.access_token);
        router.push("/dashboard");
      } else {
        let msg = "Invalid email or password.";
        try { const err = await res.json(); msg = err.detail || err.message || msg; } catch (_) {}
        showToast(msg, "error");
      }
    } catch {
      showToast("Could not reach the server. Check your connection or try the demo.", "error");
    } finally {
      setLoading(false);
    }
  }

  function guestDemo() {
    const demoUser = { id: 999, name: "Demo Freelancer", email: "demo@talentstage.io", role: "freelancer" };
    setUser(demoUser);
    setToken("demo-token");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-1 text-xl font-bold">TalentStageX</div>
          <div className="text-sm text-muted-foreground">Welcome back. Sign in to continue.</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com" />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="password" />
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="mb-3 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary underline-offset-2 hover:underline">Create one →</Link>
          </p>
          <p className="mt-2 text-center text-xs">
            <button onClick={guestDemo} className="text-muted-foreground hover:text-foreground">
              Continue as guest (demo)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
