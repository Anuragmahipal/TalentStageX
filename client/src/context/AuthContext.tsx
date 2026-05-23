"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: number; name: string; email: string; role: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  setUser: (u: User) => void;
  setToken: (t: string | null) => void;
  logout: () => void;
  initialized: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const setauth = async () => {
      try {
        const raw = localStorage.getItem("ts_user");
        const t = localStorage.getItem("ts_token");
        if (raw) setUserState(JSON.parse(raw));
        if (t) setTokenState(t);
      } catch {
        setUserState(null);
        setTokenState(null);
      }
      setInitialized(true);
    };
    setauth();
  }, []);

  function setUser(u: User) {
    setUserState(u);
    if (u) localStorage.setItem("ts_user", JSON.stringify(u));
    else localStorage.removeItem("ts_user");
  }

  function setToken(t: string | null) {
    setTokenState(t);
    if (t) localStorage.setItem("ts_token", t);
    else localStorage.removeItem("ts_token");
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
