import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CompletenessBar from "@/components/CompletenessBar";

export default function DashboardPage() {
  const user = { name: "Alex Johnson", completeness: 64 };
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Good morning, {user.name.split(" ")[0]}</h1>
          <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</div>
        </div>
        <div>
          <Button>Browse Projects</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">$12,400</div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">3</div>
            <div className="text-sm text-muted-foreground">Active Proposals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">1</div>
            <div className="text-sm text-muted-foreground">Active Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">{user.completeness}%</div>
            <div className="text-sm text-muted-foreground">Profile Complete</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent>
              <CompletenessBar pct={user.completeness} />
            </CardContent>
          </Card>

          <Card className="bg-primary text-white">
            <CardContent>
              <div className="font-semibold">AI Career Tip</div>
              <p className="text-sm mt-2 text-white/90">Complete your profile to 100% to get more invites. Add 3 portfolio items with measurable results.</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-semibold">Project: Acme redesign</div>
                  <div className="text-sm text-muted-foreground">Due in 7 days</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No proposals yet.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
