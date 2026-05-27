"use client";

import Link from "next/link";

type MobileBottomNavProps = {
  pathname: string;
};

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Work", href: "/projects" },
  { label: "Projects", href: "/my-projects" },
  { label: "Profile", href: "/profile" },
];

export default function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card/95 px-2 py-2 text-xs shadow-lg backdrop-blur md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-md px-2 py-2 text-center ${pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}