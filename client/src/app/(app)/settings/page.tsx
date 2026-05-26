"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");

  function confirmDelete() {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      logout();
      showToast("Account deleted.", "success");
      router.push("/");
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Account */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Display name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input value={user?.email ?? ""} readOnly
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={() => showToast("Account updated!", "success")}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Save</button>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: "New proposals on my projects", defaultChecked: true },
              { label: "Contract updates and milestone approvals", defaultChecked: true },
              { label: "Community mentions", defaultChecked: false },
              { label: "Marketing emails", defaultChecked: true },
            ].map(n => (
              <label key={n.label} className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" defaultChecked={n.defaultChecked} className="rounded" />
                {n.label}
              </label>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subscription</h2>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">Free Plan</div>
              <p className="mt-1 text-sm text-muted-foreground">Upgrade to Pro for priority AI matching, unlimited bids, and featured profile.</p>
            </div>
            <button onClick={() => showToast("Pro subscription coming soon!", "info")}
              className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Upgrade to Pro ✦
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-red-600 uppercase tracking-wide">Danger Zone</h2>
          <button onClick={confirmDelete}
            className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
