import type { ReactNode } from "react";
import { Briefcase, FileText, LayoutDashboard, PlusCircle, Search, Settings, User, Users } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "profile", label: "My Profile", icon: <User size={18} />, roles: ["freelancer"] },
  { id: "projects", label: "Find Work", icon: <Search size={18} />, roles: ["freelancer"] },
  { id: "my-projects", label: "My Projects", icon: <Briefcase size={18} />, roles: ["client"] },
  { id: "post-project", label: "Post Project", icon: <PlusCircle size={18} />, roles: ["client"] },
  { id: "freelancers", label: "Freelancers", icon: <Users size={18} />, roles: ["client"] },
  { id: "contracts", label: "Contracts", icon: <FileText size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  projects: "Find Work",
  "my-projects": "My Projects",
  "post-project": "Post Project",
  freelancers: "Freelancers",
  contracts: "Contracts",
  settings: "Settings",
};

export const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Work", href: "/projects" },
  { label: "Projects", href: "/my-projects" },
  { label: "Profile", href: "/profile" },
];