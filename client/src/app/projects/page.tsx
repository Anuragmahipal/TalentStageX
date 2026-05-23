"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8000/projects");
        if (res.ok) setProjects(await res.json());
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Find Work</h1>
      <p className="text-sm text-muted-foreground mb-4">Browse open projects and submit proposals.</p>

      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Open Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No projects yet — check back later or post one.</div>
            </CardContent>
          </Card>
        )}

        {projects.map((p) => (
          <Card key={p.id}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${p.budget_min} - ${p.budget_max}</div>
                  <div className="text-sm text-muted-foreground">{p.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
