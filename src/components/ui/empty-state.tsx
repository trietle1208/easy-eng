import { Mascot } from "@/components/mascot/mascot";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-4 rounded-[10px_16px_12px_8px] bg-paper px-6 py-10 text-center text-ink shadow-[var(--paper-shadow)]",
        className,
      )}
    >
      <Mascot pose="sleep" size={120} alt="" />
      <h3 className="font-hand m-0 text-3xl leading-none">{title}</h3>
      {description ? (
        <p className="m-0 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
