"use client";

import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const json = await res.json();

        if (json.authenticated && json.user) {
          setUser(json.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue with client-side logout even if API fails
    }
    setUser(null);
    window.location.href = "/login";
  }, []);

  return { user, loading, signOut };
}
