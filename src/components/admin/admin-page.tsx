import { NotebookPage } from "@/components/notebook/notebook-page";
import { cn } from "@/lib/utils";

type AdminPageProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Plain notebook sheet for admin tables and forms (no ruled lines). */
export function AdminPage({
  title,
  description,
  actions,
  children,
  className,
}: AdminPageProps) {
  return (
    <NotebookPage
      withRules={false}
      className={cn("flex flex-col gap-5 rounded-xl p-5 md:p-7", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-hand m-0 text-3xl leading-tight">{title}</h1>
          {description ? (
            <p className="text-muted m-0 mt-1 text-sm">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </NotebookPage>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase",
        status === "published"
          ? "bg-primary-soft text-kick"
          : "bg-sticky text-ink",
      )}
    >
      {status}
    </span>
  );
}
