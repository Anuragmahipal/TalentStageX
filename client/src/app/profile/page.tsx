"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import CompletenessBar from "@/components/CompletenessBar";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`http://localhost:8000/profile`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function save() {
    setSaving(true);
      try {
      if (!profile) return;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`http://localhost:8000/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ title: profile.title, bio: profile.bio, hourly_rate: profile.hourly_rate }),
      });
      // optimistic UI
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const completeness = profile ? (profile.completeness_pct ?? (60 + (profile.hourly_rate ? 10 : 0))) : 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">My Profile</h1>
      <div className="text-sm text-muted-foreground mb-4">Manage your bio, skills, portfolio and rates.</div>

      <Card>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <div className="text-lg font-semibold">{profile?.name || "—"}</div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    value={profile?.title || ""}
                    onChange={(e) => setProfile((prev) => ({ ...(prev ?? {}), title: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={profile?.bio || ""}
                    onChange={(e) => setProfile((prev) => ({ ...(prev ?? {}), bio: e.target.value }))}
                    className="w-full border rounded px-3 py-2 h-28"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Hourly rate (USD)</label>
                  <input
                    value={profile?.hourly_rate ?? ""}
                    onChange={(e) => setProfile((prev) => ({ ...(prev ?? {}), hourly_rate: Number(e.target.value) }))}
                    className="w-40 border rounded px-3 py-2"
                    type="number"
                  />
                </div>

                <div>
                  <button className="btn btn-primary px-4 py-2 rounded bg-primary text-white" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>

              <aside className="col-span-1">
                <div className="mb-4">
                  <CompletenessBar pct={completeness} />
                </div>

                <div className="text-sm text-muted-foreground">
                  Profile completeness helps you get matched with better projects. Add portfolio items and skills to increase visibility.
                </div>
              </aside>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
