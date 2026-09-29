"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

export default function RootError({
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
    <div className="bg-page flex min-h-dvh items-center justify-center p-6">
      <ErrorState
        title="Notebook spilled ink"
        description="Có lỗi bất ngờ. Thử tải lại trang, hoặc quay về trang chủ."
        className="w-full max-w-md"
        onRetry={reset}
      />
    </div>
  );
}
