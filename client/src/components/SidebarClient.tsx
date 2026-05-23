"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  return (
    <div className="flex min-h-screen">
      {user ? <Sidebar user={user ?? undefined} onLogout={logout} /> : null}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      {user ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card/95 px-2 py-2 text-xs shadow-lg backdrop-blur md:hidden">
          {[
            ["Dashboard", "/dashboard"],
            ["Work", "/projects"],
            ["Projects", "/my-projects"],
            ["Profile", "/profile"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-2 py-2 text-center ${
                pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
