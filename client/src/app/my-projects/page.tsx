import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">My Projects</h1>
      <div className="text-sm text-muted-foreground mb-4">Projects you posted or manage.</div>
      <Card>
        <CardContent>No projects yet.</CardContent>
      </Card>
    </div>
  );
}
