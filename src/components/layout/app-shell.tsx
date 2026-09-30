import Image from "next/image";

import { FloatingActions } from "@/components/layout/floating-actions";
import { Header } from "@/components/layout/header";
import type { HeaderUser } from "@/components/layout/user-menu";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { GlassPanel } from "@/components/notebook/glass-panel";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  /** Wider glass for denser lesson pages later; home uses default. */
  wide?: boolean;
  className?: string;
  contentClassName?: string;
  /** Optional full-bleed background image over the theme gradient. */
  backgroundSrc?: string;
  showFloatingActions?: boolean;
  user?: HeaderUser | null;
};

export function AppShell({
  children,
  wide = false,
  className,
  contentClassName,
  backgroundSrc,
  showFloatingActions = true,
  user = null,
}: AppShellProps) {
  return (
    <div
      className={cn("bg-page relative min-h-dvh text-ink", className)}
    >
      {/* Clip decorative overflow here — not on the shell — so page scroll stays on the document only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {backgroundSrc ? (
          <Image
            src={backgroundSrc}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
        ) : null}

        {/* Soft glow orbs — decorative, theme colors via tokens */}
        <div className="absolute -top-[140px] -left-[120px] size-[520px] rounded-full bg-[color:var(--headline)] opacity-45 blur-[70px] max-md:blur-[40px] motion-reduce:blur-none" />
        <div className="absolute top-[140px] -right-[160px] size-[640px] rounded-full bg-primary opacity-40 blur-[70px] max-md:blur-[40px] motion-reduce:blur-none" />
        <div className="absolute -bottom-[220px] left-[380px] h-[420px] w-[760px] rounded-full bg-hole opacity-70 blur-[70px] max-md:blur-[40px] motion-reduce:blur-none" />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-dvh w-full flex-col px-4 pt-4 pb-24 md:px-[clamp(1.5rem,7vw,110px)] md:pt-5 md:pb-10",
          wide ? "max-w-[1440px]" : "max-w-[1440px]",
        )}
      >
        <Header user={user} />

        <GlassPanel
          as="main"
          className={cn(
            "mt-5 flex flex-1 flex-col rounded-[var(--radius-glass)] p-5 md:mt-6 md:p-10 lg:p-12",
            contentClassName,
          )}
        >
          {children}
        </GlassPanel>
      </div>

      {showFloatingActions ? <FloatingActions /> : null}
      <MobileBottomNav />
    </div>
  );
}
