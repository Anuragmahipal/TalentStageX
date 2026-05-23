"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function SidebarClient({ children }: { children: React.ReactNode }) {
  const { user, logout, initialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // allowlist of public paths that do not require auth
  const publicPaths = ["/", "/auth/login", "/auth/signup"];

  React.useEffect(() => {
    if (!initialized) return;
    const isPublic = publicPaths.some((p) => pathname === p || pathname?.startsWith(p + "/"));
    if (!user && !isPublic) {
      router.replace("/auth/login");
    }
  }, [initialized, user, pathname, router]);

  // If not initialized yet, render nothing to avoid flicker
  if (!initialized) return null;

  return (
    <div className="flex">
      {user ? <Sidebar user={user ?? undefined} onLogout={logout} /> : null}
      <main className="flex-1">{children}</main>
    </div>
  );
}
