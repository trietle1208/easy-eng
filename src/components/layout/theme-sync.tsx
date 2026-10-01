"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import type { AppThemeId } from "@/types/profile";

/**
 * Apply the signed-in user's saved theme when the server value changes
 * (login / RSC refresh after Save). Do not watch the live `theme` from
 * next-themes — that would undo header / settings preview switches.
 */
export function ThemeSync({ theme }: { theme: AppThemeId | null }) {
  const { setTheme } = useTheme();
  const lastApplied = useRef<AppThemeId | null>(null);

  useEffect(() => {
    if (!theme) return;
    if (lastApplied.current === theme) return;
    lastApplied.current = theme;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
