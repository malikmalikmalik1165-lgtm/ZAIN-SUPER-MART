"use client";

import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  username: string;
  role: string;
}

function readOfflineUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("zsm_offline_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser & { expiresAt?: number };
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      localStorage.removeItem("zsm_offline_user");
      return null;
    }
    return { username: parsed.username, role: parsed.role };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const json = await res.json();
        if (json.authenticated && json.user) {
          setUser(json.user);
          localStorage.setItem(
            "zsm_offline_user",
            JSON.stringify({ ...json.user, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
          );
        } else {
          setUser(navigator.onLine ? null : readOfflineUser());
        }
      } catch {
        setUser(readOfflineUser());
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = useCallback(async () => {
    if (!navigator.onLine) {
      window.alert("Reconnect to securely sign out and clear the server session.");
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // The local display session is still cleared below.
    }
    localStorage.removeItem("zsm_offline_user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return { user, loading, signOut };
}
