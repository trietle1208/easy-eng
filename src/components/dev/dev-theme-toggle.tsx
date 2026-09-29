"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Compact theme toggle for the /dev/components showcase. */
export function DevThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button variant="ghost" size="sm" disabled>
          Theme…
        </Button>
      </div>
    );
  }

  const isBlossom = theme === "blossom";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant={!isBlossom ? "primary" : "ghost"}
        onClick={() => setTheme("default")}
        aria-pressed={!isBlossom}
      >
        Default · green
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isBlossom ? "primary" : "ghost"}
        onClick={() => setTheme("blossom")}
        aria-pressed={isBlossom}
      >
        Blossom · pink
      </Button>
    </div>
  );
}
