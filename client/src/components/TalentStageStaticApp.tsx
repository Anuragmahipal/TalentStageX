"use client";

type TalentStageStaticAppProps = {
  authPage?: "landing" | "login" | "signup";
  appPage?: string;
};

export default function TalentStageStaticApp({ authPage = "landing", appPage = "dashboard" }: TalentStageStaticAppProps) {
  // Pass the API base URL into the iframe via query param so app.js can
  // resolve the correct backend URL without being hardcoded to localhost.
  // Set NEXT_PUBLIC_API_URL in your .env / deployment environment variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const params = new URLSearchParams({ page: authPage, appPage });
  if (apiUrl) params.set("apiUrl", apiUrl);

  return (
    <iframe
      title="TalentStageX"
      src={`/talentstagex/index.html?${params.toString()}`}
      className="h-screen w-full border-0"
    />
  );
}
