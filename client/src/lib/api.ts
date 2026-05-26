// Central API client — all pages use this, never fetch directly
const getApiBase = () => {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") {
      return window.location.origin + "/api";
    }
  }
  return "http://localhost:8000";
};

export const API = getApiBase();

export async function apiFetch(path: string, options?: RequestInit, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(API + path, { ...options, headers });
  return res;
}

// ─── Mock data (same as legacy app.js) ───────────────────────────────────────

export const MOCK_PROJECTS = [
  { id: 1, title: "Full-Stack E-Commerce Platform", description: "Need a React + Node.js developer for a complete e-commerce site with Stripe payments, admin dashboard, and mobile-responsive design.", budget_min: 3000, budget_max: 5000, status: "open", skills: ["React", "Node.js", "PostgreSQL", "Stripe"] },
  { id: 2, title: "Mobile App UI/UX Design", description: "Looking for a Figma designer to create wireframes and high-fidelity mockups for an iOS/Android fitness app. 15 screens total.", budget_min: 800, budget_max: 1500, status: "open", skills: ["Figma", "UI/UX", "Mobile Design"] },
  { id: 3, title: "Python Data Pipeline", description: "Build an ETL pipeline in Python connecting to S3, transforming data with Pandas, and loading into BigQuery. Weekly scheduling required.", budget_min: 1500, budget_max: 2500, status: "open", skills: ["Python", "ETL", "BigQuery", "AWS"] },
  { id: 4, title: "WordPress to Next.js Migration", description: "Migrate an existing WordPress blog (200+ posts) to a Next.js application with headless CMS and improved performance.", budget_min: 2000, budget_max: 3500, status: "open", skills: ["Next.js", "React", "WordPress", "Tailwind"] },
  { id: 5, title: "AI Chatbot Integration", description: "Integrate OpenAI GPT-4 into our customer support portal. Need backend API, frontend chat widget, and conversation history.", budget_min: 4000, budget_max: 7000, status: "open", skills: ["Python", "OpenAI", "FastAPI", "React"] },
];

export const MOCK_FREELANCERS = [
  { id: 10, name: "Priya Sharma", title: "Senior React Developer", rate: 65, rating: 4.9, skills: ["React", "TypeScript", "Next.js", "Node.js"], location: "Mumbai, IN", reviews: 42 },
  { id: 11, name: "Carlos Mendez", title: "Full-Stack Engineer", rate: 55, rating: 4.7, skills: ["Python", "Django", "React", "PostgreSQL"], location: "Mexico City, MX", reviews: 28 },
  { id: 12, name: "Aisha Williams", title: "UI/UX Designer", rate: 45, rating: 4.8, skills: ["Figma", "UI/UX", "Framer", "Webflow"], location: "Lagos, NG", reviews: 35 },
  { id: 13, name: "Tobias Klein", title: "Data Engineer", rate: 70, rating: 4.6, skills: ["Python", "dbt", "BigQuery", "Airflow"], location: "Berlin, DE", reviews: 19 },
  { id: 14, name: "Min-Ji Lee", title: "Mobile Developer", rate: 58, rating: 4.9, skills: ["Flutter", "React Native", "Swift", "Firebase"], location: "Seoul, KR", reviews: 51 },
  { id: 15, name: "Omar Hassan", title: "DevOps Engineer", rate: 72, rating: 4.7, skills: ["Docker", "Kubernetes", "AWS", "Terraform"], location: "Cairo, EG", reviews: 23 },
];

export const MOCK_COMMUNITY = [
  { id: 1, author: "Priya Sharma", avatar: "PS", content: "Just shipped my 50th project on TalentStageX! Huge thanks to the community for the support. Key lesson: always clarify scope BEFORE accepting.", cat: "Showcase", likes: 38, comments: 12, time: "2h ago" },
  { id: 2, author: "Carlos Mendez", avatar: "CM", content: "Pro tip: When writing proposals, start with a 1-line summary of THEIR problem, not your experience. Conversion rate went from 15% to 40% for me.", cat: "Tip", likes: 94, comments: 27, time: "5h ago" },
  { id: 3, author: "Aisha Williams", avatar: "AW", content: "Working on a design system for a fintech client — anyone have experience charging for design system work? Is it better to bill per component or as a package?", cat: "Question", likes: 12, comments: 18, time: "1d ago" },
];

export const MOCK_CONTRACTS = [
  { id: 1, project: "Mobile App UI/UX Design", client: "TechStartup Ltd.", freelancer: "Aisha Williams", amount: 1200, status: "active", milestone: "Wireframes", milestone_pct: 60, deadline: "Jun 15, 2026" },
];
