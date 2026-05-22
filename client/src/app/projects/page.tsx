import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Find Work</h1>
      <p className="text-sm text-muted-foreground mb-4">Browse open projects and submit proposals.</p>

      <Card>
        <CardHeader>
          <CardTitle>Open Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No projects yet — this is a placeholder list.</div>
        </CardContent>
      </Card>
    </div>
  );
}
