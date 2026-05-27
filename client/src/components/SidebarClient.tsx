"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import TopBar from "@/components/layout/TopBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { PAGE_TITLES } from "@/components/layout/navigation";

const publicPaths = ["/", "/auth/login", "/auth/signup"];

export default function SidebarClient({ children }: { children: React.ReactNode }) {
  const { user, logout, initialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!initialized) return;
    const isPublic = publicPaths.some((p) => pathname === p || pathname?.startsWith(p + "/"));
    if (!user && !isPublic) {
      router.replace("/auth/login");
    }
  }, [initialized, user, pathname, router]);

  // If not initialized yet, render nothing to avoid flicker
  if (!initialized) return null;

  if (!user) {
    return <>{children}</>;
  }

  const currentPage = pathname.slice(1) || "dashboard";
  const title = PAGE_TITLES[currentPage] ?? currentPage;

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar user={user} pathname={pathname} onLogout={logout} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}
