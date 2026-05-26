"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, User, Search, Briefcase, PlusCircle,
  FileText, MessageSquare, Users, Settings, LogOut,
} from "lucide-react";

type NavItem = { id: string; label: string; icon: React.ReactNode; roles?: string[] };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",    label: "Dashboard",   icon: <LayoutDashboard size={18} /> },
  { id: "profile",      label: "My Profile",  icon: <User size={18} />,        roles: ["freelancer"] },
  { id: "projects",     label: "Find Work",   icon: <Search size={18} />,       roles: ["freelancer"] },
  { id: "my-projects",  label: "My Projects", icon: <Briefcase size={18} />,    roles: ["client"] },
  { id: "post-project", label: "Post Project",icon: <PlusCircle size={18} />,   roles: ["client"] },
  { id: "freelancers",  label: "Freelancers", icon: <Users size={18} />,        roles: ["client"] },
  { id: "contracts",    label: "Contracts",   icon: <FileText size={18} /> },
  { id: "community",    label: "Community",   icon: <MessageSquare size={18} /> },
  { id: "settings",     label: "Settings",    icon: <Settings size={18} /> },
];

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard", profile: "My Profile", projects: "Find Work",
  "my-projects": "My Projects", "post-project": "Post Project",
  freelancers: "Freelancers", contracts: "Contracts",
  community: "Community", settings: "Settings",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = user?.role ?? "freelancer";

  function handleLogout() {
    logout();
    router.push("/");
  }

  const currentPage = pathname.slice(1) || "dashboard";
  const title = PAGE_TITLES[currentPage] ?? currentPage;
  const initials = (user?.name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="text-base font-bold tracking-tight">TalentStageX</div>
          <div className="text-xs text-muted-foreground">Freelance Platform</div>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name ?? "User"}</div>
            <div className="text-xs text-muted-foreground capitalize">{role}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="mb-1 px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Main</div>
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role)).map(item => {
            const href = `/${item.id}`;
            const active = pathname === href;
            return (
              <Link key={item.id} href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                  ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Link href="/settings"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
              ${pathname === "/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3">
              <Search size={14} className="text-muted-foreground" />
              <input className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-48"
                placeholder="Search projects, freelancers…" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
