"use client";

import { Search } from "lucide-react";

type TopBarProps = {
  title: string;
};

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="hidden h-14 items-center justify-between border-b border-border bg-card px-6 md:flex">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search size={14} className="text-muted-foreground" />
          <input
            className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search projects, freelancers…"
          />
        </div>
      </div>
    </header>
  );
}