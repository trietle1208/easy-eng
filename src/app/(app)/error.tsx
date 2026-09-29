"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <ErrorState
        title="Notebook spilled ink"
        description="Có lỗi bất ngờ. Thử tải lại trang, hoặc quay về trang chủ."
        className="w-full max-w-md"
        onRetry={reset}
      />
      <Link href="/" className="sr-only">
        Home
      </Link>
    </div>
  );
}
