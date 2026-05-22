import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PostProjectPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Post Project</h1>
      <div className="text-sm text-muted-foreground mb-4">Create a new project and invite freelancers.</div>
      <Card>
        <CardContent>Project form placeholder (use shadcn form components here).</CardContent>
      </Card>
    </div>
  );
}
