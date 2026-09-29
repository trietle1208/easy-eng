import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  className?: string;
  onRetry?: () => void;
  retryHref?: string;
};

export function ErrorState({
  title = "Something went sideways",
  description = "Không tải được nội dung này. Thử lại nhé.",
  className,
  onRetry,
  retryHref = "/",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-[10px_16px_12px_8px] border-2 border-danger/40 bg-danger-bg px-6 py-10 text-center text-ink shadow-[var(--paper-shadow)]",
        className,
      )}
    >
      <AlertTriangle className="size-10 text-danger" aria-hidden />
      <h3 className="font-hand m-0 text-3xl leading-none text-danger">{title}</h3>
      <p className="m-0 max-w-sm text-sm text-muted">{description}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : (
        <Button asChild variant="outline">
          <a href={retryHref}>Back home</a>
        </Button>
      )}
    </div>
  );
}
