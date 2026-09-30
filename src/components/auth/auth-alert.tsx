import { HandCircle } from "@/components/marks/hand-circle";
import { cn } from "@/lib/utils";

type AuthAlertProps = {
  tone?: "danger" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

export function AuthAlert({
  tone = "danger",
  children,
  className,
}: AuthAlertProps) {
  const markColor =
    tone === "danger" ? "danger" : tone === "success" ? "success" : "primary";
  return (
    <div
      role="alert"
      className={cn("mb-4 flex items-start gap-2", className)}
    >
      <HandCircle color={markColor}>
        <span className="sr-only">{tone}</span>
        <span aria-hidden className="inline-block size-2" />
      </HandCircle>
      <p
        className={cn(
          "font-hand m-0 text-lg leading-tight",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
          tone === "info" && "text-ink",
        )}
      >
        {children}
      </p>
    </div>
  );
}
