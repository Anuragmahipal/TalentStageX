"use client";

type TalentStageStaticAppProps = {
  authPage?: "landing" | "login" | "signup";
  appPage?: string;
};

export default function TalentStageStaticApp({ authPage = "landing", appPage = "dashboard" }: TalentStageStaticAppProps) {
  const params = new URLSearchParams({ page: authPage, appPage });

  return (
    <iframe
      title="TalentStageX"
      src={`/talentstagex/index.html?${params.toString()}`}
      className="h-screen w-full border-0"
    />
  );
}
