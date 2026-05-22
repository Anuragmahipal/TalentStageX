import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ContractsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Contracts</h1>
      <div className="text-sm text-muted-foreground mb-4">Active and past contracts.</div>
      <Card>
        <CardContent>No contracts yet.</CardContent>
      </Card>
    </div>
  );
}
