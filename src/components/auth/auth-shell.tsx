import Link from "next/link";

import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
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
    <div className="bg-page relative flex min-h-dvh flex-col items-center px-4 py-10 text-ink md:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-[120px] -left-[100px] size-[420px] rounded-full bg-[color:var(--headline)] opacity-40 blur-[60px]" />
        <div className="absolute top-[180px] -right-[140px] size-[520px] rounded-full bg-primary opacity-35 blur-[60px]" />
      </div>

      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2.5 text-on-glass"
      >
        <Mascot pose="face" size={40} className="shrink-0" />
        <span className="font-hand text-[28px] leading-none tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,.3)]">
          Easy English
        </span>
      </Link>

      <NotebookPage
        withRings
        withMargin
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl px-6 py-8 md:px-8 md:py-10",
          className,
        )}
      >
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="font-hand m-0 text-4xl leading-none font-black text-headline">
            {title}
          </h1>
          {subtitle ? (
            <p className="m-0 text-sm leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
        {children}
        {footer ? (
          <div className="mt-6 border-t border-dashed border-line pt-4 text-sm text-muted">
            {footer}
          </div>
        ) : null}
      </NotebookPage>
    </div>
  );
}
