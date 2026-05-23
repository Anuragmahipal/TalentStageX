"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PostProjectPage() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [min, setMin] = useState(500);
  const [max, setMax] = useState(1500);
  const [saving, setSaving] = useState(false);

  const CLIENT_ID = 2; // demo client id

  async function submit() {
    setSaving(true);
    try {
      await fetch("http://localhost:8000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, title, description: desc, budget_min: min, budget_max: max }),
      });
      setTitle("");
      setDesc("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Post Project</h1>
      <div className="text-sm text-muted-foreground mb-4">Create a new project and invite freelancers.</div>
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />

              <label className="block text-sm font-medium my-2">Description</label>
              <textarea className="w-full border rounded px-3 py-2" rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Budget Min</label>
              <input type="number" className="w-40 border rounded px-3 py-2" value={min} onChange={(e) => setMin(Number(e.target.value))} />

              <label className="block text-sm font-medium my-2">Budget Max</label>
              <input type="number" className="w-40 border rounded px-3 py-2" value={max} onChange={(e) => setMax(Number(e.target.value))} />

              <div className="mt-6">
                <button className="btn btn-primary px-4 py-2 rounded bg-primary text-white" onClick={submit} disabled={saving}>
                  {saving ? "Posting..." : "Post Project"}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
