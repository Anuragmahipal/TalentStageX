"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, Search, Briefcase, PlusCircle, FileText, MessageSquare, Users, Settings, LogOut } from "lucide-react";
import React from "react";

type ViewDef = { id: string; label: string; icon: React.ReactNode; role?: string };
export default function Sidebar({
  user,
  onViewChange,
  onLogout,
}: {
  user?: Record<string, unknown>;
  currentView?: string;
  onViewChange?: (v: string) => void;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

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

  function handleLogout() {
    onLogout?.();
    try {
      router.push("/");
    } catch {
      if (typeof window !== "undefined") window.location.href = "/";
    }
  }

  return (
    <aside className="hidden w-60 border-r border-border bg-card p-4 md:sticky md:top-0 md:block md:h-screen">
      <div className="mb-6 font-heading text-lg font-semibold">TalentStage</div>
      <nav className="flex flex-col space-y-1">
        {views
          .filter((v) => !v.role || v.role.includes(userRole))
          .map((v) => {
            const href = `/${v.id}`;
            const active = pathname === href;

            return (
              <Link
                key={v.id}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onViewChange?.(v.id)}
              >
                <span className="inline-flex size-6 items-center justify-center">{v.icon}</span>
                <span>{v.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="mt-6">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="ml-2">Log out</span>
        </Button>
      </div>
    </aside>
  );
}
