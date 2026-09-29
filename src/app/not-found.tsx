import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-page flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        title="Page not found"
        description="Trang này không tồn tại — maybe a typo in the URL?"
        className="w-full max-w-md"
        action={
          <Button asChild variant="primary">
            <Link href="/">Back to home</Link>
          </Button>
        }
      />
    </div>
  );
}
