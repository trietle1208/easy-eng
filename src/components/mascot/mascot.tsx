"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { MascotPose } from "@/types/mascot";
import { cn } from "@/lib/utils";

type MascotSize = "sm" | "md" | "lg" | number;

const sizeMap: Record<"sm" | "md" | "lg", number> = {
  sm: 48,
  md: 120,
  lg: 180,
};

type MascotProps = {
  pose?: MascotPose;
  size?: MascotSize;
  className?: string;
  alt?: string;
};

export function Mascot({
  pose = "wave",
  size = "md",
  className,
  alt,
}: MascotProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? (resolvedTheme ?? theme ?? "default") : "default";
  const kind = active === "blossom" ? "foal" : "frog";
  const px = typeof size === "number" ? size : sizeMap[size];
  const src = `/mascot/${kind}/${pose}.svg`;
  const label =
    alt ??
    (kind === "foal" ? `Bông the foal, ${pose}` : `Frog mascot, ${pose}`);

  return (
    <Image
      src={src}
      alt={label}
      width={px}
      height={px}
      className={cn("object-contain", className)}
      unoptimized
      priority={pose === "face" || pose === "wave"}
    />
  );
}
