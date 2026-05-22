import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>
      <div className="text-sm text-muted-foreground mb-4">Account and app settings.</div>
      <Card>
        <CardContent>Settings form placeholder.</CardContent>
      </Card>
    </div>
  );
}
