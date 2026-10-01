import Link from "next/link";

import { Mascot } from "@/components/mascot/mascot";
import { WashiTape } from "@/components/notebook/washi-tape";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[color:var(--hole)] px-4 py-12 text-ink md:py-16">
      <div
        className={cn(
          "relative w-full max-w-[420px] rounded-[28px] border-[3px] border-line bg-paper px-6 pt-12 pb-8 text-ink shadow-[6px_6px_0_var(--line)] md:px-8 md:pt-14 md:pb-10",
          className,
        )}
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--line) 18%, transparent) 1.15px, transparent 1.15px)",
          backgroundSize: "18px 18px",
        }}
      >
        <WashiTape
          variant="cream"
          className="left-[18%] h-[22px] w-[72px] -rotate-[8deg] rounded-[2px] border-0 bg-[color:var(--sticky)]/55 shadow-[0_1px_2px_rgba(0,0,0,.12)]"
        />
        <WashiTape
          variant="cream"
          className="left-auto right-[16%] ml-0 h-[22px] w-[72px] rotate-[7deg] rounded-[2px] border-0 bg-[color:var(--sticky)]/55 shadow-[0_1px_2px_rgba(0,0,0,.12)]"
        />

        <Link
          href="/"
          className="absolute top-0 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-[3px] border-line bg-primary px-3.5 py-1.5 text-kick shadow-[3px_3px_0_var(--line)]"
        >
          <Mascot pose="face" size={28} className="shrink-0" />
          <span className="text-[15px] font-extrabold tracking-tight whitespace-nowrap">
            Easy English
          </span>
        </Link>

        <div className="mb-7 flex flex-col gap-2.5">
          <h1 className="m-0 text-[2rem] leading-tight font-black tracking-tight text-ink md:text-[2.15rem]">
            <mark
              className="rounded-[4px_12px_6px_10px/10px_4px_12px_6px] px-1.5 py-px text-inherit not-italic"
              style={{
                background:
                  "linear-gradient(100deg, transparent 0%, var(--primary) 6%, var(--primary) 94%, transparent 100%)",
              }}
            >
              {title}
            </mark>
          </h1>
          {subtitle ? (
            <p className="m-0 text-[15px] leading-relaxed text-muted">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}

        {footer ? (
          <div className="mt-7 text-center text-sm text-muted">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
