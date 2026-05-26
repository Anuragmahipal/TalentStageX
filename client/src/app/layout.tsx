"use client";
import { AuthProvider } from "@/context/AuthContext";
// import AppShell from "@/components/AppShell";
import "./globals.css";
import AppShell from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>
          {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
