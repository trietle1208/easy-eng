"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import type { AppThemeId } from "@/types/profile";

/** Apply the signed-in user's saved theme once after mount (cross-device). */
export function ThemeSync({ theme }: { theme: AppThemeId | null }) {
  const { setTheme, theme: active } = useTheme();

  useEffect(() => {
    if (!theme) return;
    if (active === theme) return;
    setTheme(theme);
  }, [theme, active, setTheme]);

  return null;
}
