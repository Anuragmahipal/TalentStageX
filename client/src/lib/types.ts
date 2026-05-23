export type Profile = {
  id?: number;
  user_id?: number;
  name?: string;
  title?: string | null;
  bio?: string | null;
  hourly_rate?: number | null;
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
  status?: string;
};
