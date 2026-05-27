"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Search, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/navigation";

type DesktopSidebarProps = {
  user: { name?: string; role?: string };
  pathname: string;
  onLogout: () => void;
};

export default function DesktopSidebar({ user, pathname, onLogout }: DesktopSidebarProps) {
  const router = useRouter();
  const role = user.role ?? "freelancer";
  const initials = (user.name ?? "?").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  function handleLogout() {
    onLogout();
    try {
      router.push("/");
    } catch {
      if (typeof window !== "undefined") window.location.href = "/";
    }
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border bg-card md:flex md:h-screen md:sticky md:top-0">
      <div className="border-b border-border p-5">
        <div className="text-base font-bold tracking-tight">TalentStageX</div>
        <div className="text-xs text-muted-foreground">Freelance Platform</div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name ?? "User"}</div>
            <div className="text-xs capitalize text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-1 px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Main</div>
        {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
          const href = `/${item.id}`;
          const active = pathname === href;
          return (
            <Link
              key={item.id}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
            ${pathname === "/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}