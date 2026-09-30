import { NextRequest, NextResponse } from "next/server";

import { exportContentFile } from "@/lib/admin/service";
import { isContentKind } from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ kind: string }> };

/** Download `content/<kind>.json`-compatible JSON. Admin only (404 otherwise). */
export async function GET(request: NextRequest, context: RouteContext) {
  await requireAdmin();
  const { kind } = await context.params;
  if (!isContentKind(kind)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam === "draft" || statusParam === "published"
      ? statusParam
      : undefined;

  const data = await exportContentFile(kind, status);
  return new NextResponse(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
