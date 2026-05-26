"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && user) router.replace("/dashboard");
  }, [initialized, user, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="text-lg font-bold">TalentStageX</div>
        <div className="flex gap-3">
          <Link href="/auth/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href="/auth/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-8 py-20 flex gap-16 items-center">
        <div className="flex-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <span>★</span> Freelance Marketplace · MVP
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight leading-tight">
            Hire top <span className="text-primary">creative</span>{" & technical talent"}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
            Post projects, review AI-scored proposals, and manage milestones with secure escrow.
            Built for the next generation of freelance work.
          </p>
          <div className="flex gap-3">
            <Link href="/auth/signup"
              className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Start for free →
            </Link>
            <Link href="/auth/login"
              className="rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero card */}
        <div className="w-80 rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="mb-3 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Open Project</span>
          <h3 className="mb-2 font-bold">Full-Stack E-Commerce Platform</h3>
          <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
            Looking for a React + Node.js developer for a 3-month engagement. Must have experience with payment integrations.
          </p>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">$3,000 – $5,000</span>
            <span className="text-xs text-muted-foreground">Fixed price</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {["React", "Node.js", "PostgreSQL", "Stripe"].map(s => (
              <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs">{s}</span>
            ))}
          </div>
          <Link href="/auth/signup"
            className="block w-full rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Submit Proposal →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-6xl px-8 pb-20 grid grid-cols-3 gap-6">
        {[
          { icon: "🗂", title: "Rich Portfolios", desc: "Showcase your work with media, links, and tools used. Build a profile that gets noticed." },
          { icon: "🤖", title: "AI Matching", desc: "Our engine scores proposals for relevance and value — helping clients hire the right person faster." },
          { icon: "🔒", title: "Secure Escrow", desc: "Milestone-based payments held in escrow, released when you approve. 10% platform commission." },
        ].map(f => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 text-2xl">{f.icon}</div>
            <div className="mb-2 font-bold">{f.title}</div>
            <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
