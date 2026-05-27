// Central API client — all pages use this, never fetch directly
const getApiBase = () => {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
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
  const res = await fetch(API + path, { ...options, headers, credentials: "include" });
  console.log(`fetched ${API+path} with options`, options, "got response", res);
  return res;
}

async function readApiData<T>(res: Response): Promise<T> {
  const json = await res.json();
  return (json?.data ?? json) as T;
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

// Demo users for offline/demo flows
export const MOCK_USERS = [
  { id: 998, name: "Demo Client", email: "demo.client@talentstage.io", role: "client" },
  { id: 999, name: "Demo Freelancer", email: "demo.freelancer@talentstage.io", role: "freelancer" },
];

export const MOCK_CONTRACTS = [
  { id: 1, project: "Mobile App UI/UX Design", client: "Demo Client", freelancer: "Demo Freelancer", amount: 1200, status: "active", milestone: "Wireframes", milestone_pct: 60, deadline: "Jun 15, 2026", payments: [{ id: 1, amount: 1200, commission_amount: 120, freelancer_amount: 1080, status: "pending", paid_date: null }], milestones: [{ id: 1, description: "Wireframes", amount: 1200, completed_bool: false }] },
];

// ─── Freelancers ──────────────────────────────────────────────────────────────

export async function fetchFreelancers(token: string | null) {
  const res = await apiFetch("/freelancers", undefined, token);
  if (!res.ok) throw new Error("Failed to load freelancers");
  return readApiData(res);
}

// ─── Saved freelancers ────────────────────────────────────────────────────────

export async function fetchSavedFreelancers(token: string | null) {
  const res = await apiFetch("/saved-freelancers", undefined, token);
  if (!res.ok) throw new Error("Failed to load saved freelancers");
  return readApiData(res);
}

export async function saveFreelancer(freelancerId: number, token: string | null) {
  const res = await apiFetch(`/saved-freelancers/${freelancerId}`, { method: "POST" }, token);
  return res;
}

export async function unsaveFreelancer(freelancerId: number, token: string | null) {
  const res = await apiFetch(`/saved-freelancers/${freelancerId}`, { method: "DELETE" }, token);
  return res;
}

export async function checkSaved(freelancerId: number, token: string | null) {
  const res = await apiFetch(`/saved-freelancers/check/${freelancerId}`, undefined, token);
  if (!res.ok) return false;
  const json = await res.json();
  return json.data?.saved ?? false;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export async function generateBrief(prompt: string, token: string | null) {
  const res = await apiFetch("/ai/brief", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  }, token);
  if (!res.ok) {
    let msg = "Brief generation failed";
    try { const e = await res.json(); msg = e.error?.message ?? msg; } catch (err) { console.error("Error parsing AI brief response", err); }
    throw new Error(msg);
  }
  return readApiData(res);
}

export async function matchFreelancers(projectId: number, token: string | null) {
  const res = await apiFetch(`/ai/match/${projectId}`, { method: "POST" }, token);
  if (!res.ok) {
    let msg = "Matching failed";
    try { const e = await res.json(); msg = e.error?.message ?? msg; } catch (err) { console.error("Error parsing AI match response", err); }
    throw new Error(msg);
  }
  return readApiData(res);
}

// ─── Verification ─────────────────────────────────────────────────────────────

export async function fetchVerificationStatus(token: string | null) {
  const res = await apiFetch("/verification/status", undefined, token);
  if (!res.ok) return null;
  return readApiData(res);
}

export async function submitVerification(
  payload: { proof_url?: string; verification_method?: string },
  token: string | null,
) {
  const res = await apiFetch("/verification/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
  return res;
}

export async function fetchContracts(token: string | null) {
  const res = await apiFetch("/contracts", undefined, token);
  if (!res.ok) throw new Error("Failed to load contracts");
  return readApiData(res);
}

export async function fetchEarnings(token: string | null) {
  const res = await apiFetch("/earnings", undefined, token);
  if (!res.ok) throw new Error("Failed to load earnings");
  return readApiData(res);
}

export async function createStripePaymentSession(payload: {
  contract_id?: number;
  milestone_id?: number;
  amount?: number;
  currency?: string;
}, token: string | null) {
  const res = await apiFetch("/payments/stripe/session", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
  if (!res.ok) {
    let msg = "Failed to create payment session";
    try { const e = await res.json(); msg = e.error?.message ?? e.detail ?? msg; } catch (err) { console.error("Error parsing payment session response", err); }
    throw new Error(msg);
  }
  return readApiData(res);
}

export async function confirmStripePaymentSession(sessionId: string, token: string | null) {
  const res = await apiFetch("/payments/stripe/confirm", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  }, token);
  if (!res.ok) {
    let msg = "Failed to confirm payment session";
    try { const e = await res.json(); msg = e.error?.message ?? e.detail ?? msg; } catch (err) { console.error("Error parsing payment confirmation response", err); }
    throw new Error(msg);
  }
  return readApiData(res);
}
