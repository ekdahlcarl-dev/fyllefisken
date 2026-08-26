"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    const error = params.get("error");

    if (error) {
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace("/login?error=expired-invite");
      return;
    }

    if (!accessToken || !refreshToken || type !== "invite") return;

    const supabase = createClient();

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        window.history.replaceState(null, "", window.location.pathname);
        if (sessionError) {
          window.location.replace("/login?error=expired-invite");
          return;
        }
        window.location.replace("/auth/set-password");
      });
  }, []);

  return null;
}
