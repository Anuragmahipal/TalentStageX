"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, Search, Briefcase, PlusCircle, FileText, MessageSquare, Users, Settings, LogOut } from "lucide-react";
import React from "react";

type ViewDef = { id: string; label: string; icon: React.ReactNode; role?: string };
export default function Sidebar({ user, currentView, onViewChange, onLogout }: { user?: Record<string, unknown>; currentView?: string; onViewChange?: (v: string) => void; onLogout?: () => void }) {
  const views: ViewDef[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "profile", label: "My Profile", icon: <User size={18} />, role: "freelancer,both" },
    { id: "projects", label: "Find Work", icon: <Search size={18} />, role: "freelancer,both" },
    { id: "my-projects", label: "My Projects", icon: <Briefcase size={18} />, role: "client,both" },
    { id: "post-project", label: "Post Project", icon: <PlusCircle size={18} />, role: "client,both" },
    { id: "contracts", label: "Contracts", icon: <FileText size={18} /> },
    { id: "community", label: "Community", icon: <MessageSquare size={18} /> },
    { id: "freelancers", label: "Freelancers", icon: <Users size={18} />, role: "client,both" },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const userRole = typeof user?.role === "string" ? (user.role as string) : "";

  return (
    <aside className="w-56 border-r border-border h-screen sticky top-0 bg-card p-4">
      <div className="mb-6 font-heading text-lg">TalentStage</div>
      <nav className="flex flex-col space-y-1">
        {views.filter((v) => !v.role || v.role.includes(userRole)).map((v) => (
          <Link
            key={v.id}
            href={`/${v.id === "dashboard" ? "" : v.id}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted`}
            onClick={() => onViewChange?.(v.id)}
          >
            <span className="w-6 h-6 inline-flex items-center justify-center">{v.icon}</span>
            <span>{v.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <Button variant="ghost" className="w-full justify-start" onClick={() => onLogout?.()}>
          <LogOut size={16} />
          <span className="ml-2">Log out</span>
        </Button>
      </div>
    </aside>
  );
}
