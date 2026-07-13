"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { SafeUser } from "@/lib/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  status: SessionStatus;
  user: SafeUser | null;
  setUser: (user: SafeUser) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SafeUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: SafeUser | null }) => {
        setUserState(data.user);
        setStatus(data.user ? "authenticated" : "unauthenticated");
      })
      .catch(() => setStatus("unauthenticated"));
  }, []);

  const setUser = useCallback((next: SafeUser) => {
    setUserState(next);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserState(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <SessionContext.Provider value={{ status, user, setUser, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession은 SessionProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
}
