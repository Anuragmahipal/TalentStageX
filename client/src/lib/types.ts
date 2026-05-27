export type Profile = {
  id?: number;
  user_id?: number;
  name?: string;
  title?: string | null;
  bio?: string | null;
  hourly_rate?: number | null;
  rating?: number | null;
  total_earnings?: number;
  completeness_pct?: number | null;
  completeness_breakdown?: Record<string, number> | null;
};

export type Project = {
  id: number;
  client_id?: number;
  title: string;
  description?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  deadline?: string | null;
  project_type?: "fixed" | "hourly" | string;
  status?: string;
  skills?: string[];
};

export type Freelancer = {
  id: number;
  name: string;
  title?: string | null;
  hourly_rate?: number | null;
  rate?: number | null; // legacy mock field
  skills?: string[];
  bio?: string | null;
  photo_url?: string | null;
  verified?: boolean;
  portfolio_count?: number;
  avg_rating?: number | null;
  rating?: number | null; // legacy mock field
  reviews?: number | null; // legacy mock field
  location?: string | null;
};

export type SavedFreelancer = {
  id: number;
  client_id: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer_title?: string | null;
  freelancer_hourly_rate?: number | null;
  freelancer_skills: string[];
  freelancer_verified: boolean;
  created_at?: string | null;
};

export type FreelancerMatch = {
  freelancer_id: number;
  name: string;
  title?: string | null;
  hourly_rate?: number | null;
  skills: string[];
  verified: boolean;
  match_score: number;
  match_reason: string;
  portfolio_count: number;
  avg_rating?: number | null;
};

export type GeneratedBrief = {
  title: string;
  description: string;
  skills: string[];
  budget_min: number;
  budget_max: number;
  timeline_days: number;
  next_step: string;
};

export type VerificationStatus = {
  user_id: number;
  verified: boolean;
  pending_request: boolean;
  latest_status?: string | null;
  submitted_at?: string | null;
};

export type Contract = {
  id: number;
  project_id: number;
  proposal_id: number;
  client_id: number;
  freelancer_id: number;
  total_amount: number;
  status: string;
  created_at?: string | null;
  completed_at?: string | null;
  milestones?: Array<{
    id: number;
    description: string;
    amount: number;
    due_date?: string | null;
    completed_bool?: boolean;
    approved_bool?: boolean;
  }>;
  payments?: Array<{
    id: number;
    amount: number;
    commission_amount: number;
    freelancer_amount: number;
    status: string;
    paid_date?: string | null;
  }>;
  review?: {
    rating: number;
    comment?: string | null;
  } | null;
};

export type PaymentSession = {
  id: number;
  session_id: string;
  user_id: number;
  contract_id?: number | null;
  milestone_id?: number | null;
  amount: number;
  currency: string;
  status: string;
  checkout_url: string;
  created_at?: string | null;
  completed_at?: string | null;
};
