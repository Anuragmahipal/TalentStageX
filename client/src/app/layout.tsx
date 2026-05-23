import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentStageX",
  description: "Freelance marketplace for creative and technical talent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
