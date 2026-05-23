"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CompletenessBar from "@/components/CompletenessBar";

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const setuser = async () => {
      try {
        const raw = localStorage.getItem("ts_user");
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        setUser(null);
      }
    };
    setuser();
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold">Welcome to TalentStage</h2>
            <p className="text-sm text-muted-foreground mt-2">Please log in or sign up to access your dashboard and submit proposals.</p>
            <div className="mt-4">
              <a href="/auth/login" className="px-4 py-2 bg-primary text-white rounded">Log in</a>
              <a href="/auth/signup" className="ml-3 px-4 py-2 border rounded">Sign up</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = user.name || "User";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Good morning, {name.split(" ")[0]}</h1>
          <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</div>
        </div>
        <div>
          <Button>
            <a href="/projects">Browse Projects</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">—</div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">—</div>
            <div className="text-sm text-muted-foreground">Active Proposals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">—</div>
            <div className="text-sm text-muted-foreground">Active Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-2xl font-heading font-bold">—</div>
            <div className="text-sm text-muted-foreground">Profile Complete</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent>
              <CompletenessBar pct={0} />
            </CardContent>
          </Card>

          <Card className="bg-primary text-white">
            <CardContent>
              <div className="font-semibold">AI Career Tip</div>
              <p className="text-sm mt-2 text-white/90">Complete your profile to increase visibility. Add portfolio items and skills.</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No active contracts yet.</div>
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
