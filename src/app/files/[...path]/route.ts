import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { safeResolveKey } from "@/lib/storage/safe-path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * User-uploaded vocabulary images live under `vocabulary/{userId}/…`.
 * Require the session owner to match. Lesson audio under `listening/` stays public.
 */
async function authorizeKey(segments: string[]): Promise<boolean> {
  if (segments[0] !== "vocabulary") return true;
  const ownerId = segments[1];
  if (!ownerId) return false;
  const user = await getCurrentUser();
  return Boolean(user && user.id === ownerId);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  const full = safeResolveKey(env.STORAGE_DIR, segments);
  if (!full) {
    logger.warn("files_path_rejected", { segments: segments.slice(0, 4) });
    return new NextResponse("Not found", { status: 404 });
  }

  if (!(await authorizeKey(segments))) {
    return new NextResponse("Not found", { status: 404 });
  }

  let fileStat;
  try {
    fileStat = await stat(full);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fileStat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const size = fileStat.size;
  const contentType = contentTypeFor(full);
  const range = request.headers.get("range");
  const cacheControl =
    segments[0] === "vocabulary"
      ? "private, max-age=3600"
      : "public, max-age=86400";

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      return new NextResponse("Invalid Range", { status: 416 });
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : size - 1;
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 0 ||
      end >= size ||
      start > end
    ) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = createReadStream(full, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  }

  const nodeStream = createReadStream(full);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}
