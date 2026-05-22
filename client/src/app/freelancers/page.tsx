import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function FreelancersPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Freelancers</h1>
      <div className="text-sm text-muted-foreground mb-4">Browse and invite freelancers.</div>
      <Card>
        <CardContent>Freelancer list placeholder.</CardContent>
      </Card>
    </div>
  );
}
