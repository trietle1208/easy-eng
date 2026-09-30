import { NextResponse } from "next/server";

import { pingDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    dbOk = await pingDb();
  } catch {
    dbOk = false;
  }

  const body = {
    ok: dbOk,
    app: "ok" as const,
    db: dbOk ? ("up" as const) : ("down" as const),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
