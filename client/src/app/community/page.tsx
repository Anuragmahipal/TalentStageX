import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Community</h1>
      <div className="text-sm text-muted-foreground mb-4">Discussions, posts, and help from other members.</div>
      <Card>
        <CardContent>Community feed placeholder.</CardContent>
      </Card>
    </div>
  );
}
