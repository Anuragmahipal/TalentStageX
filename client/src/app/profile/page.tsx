import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompletenessBar from "@/components/CompletenessBar";

export default function ProfilePage() {
  const user = { name: "Alex Johnson", completeness: 64 };
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">My Profile</h1>
      <div className="text-sm text-muted-foreground mb-4">Manage your bio, skills, portfolio and rates.</div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{user.name}</div>
              <div className="text-sm text-muted-foreground">Front-end developer</div>
            </div>
            <div style={{ width: 220 }}>
              <CompletenessBar pct={user.completeness} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
