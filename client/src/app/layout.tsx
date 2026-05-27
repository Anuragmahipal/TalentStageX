"use client";
import { AuthProvider } from "@/context/AuthContext";
import SidebarClient from "@/components/SidebarClient";
import "./globals.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SidebarClient>{children}</SidebarClient>
        </AuthProvider>
      </body>
    </html>
  );
}
