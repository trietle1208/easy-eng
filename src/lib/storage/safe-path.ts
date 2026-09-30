import path from "node:path";

/**
 * Resolve a storage key under `root`. Rejects `..`, absolute escapes, and null bytes.
 */
export function safeResolveKey(
  rootDir: string,
  keySegments: string[],
): string | null {
  const root = path.resolve(rootDir);
  if (!keySegments.length) return null;
  for (const segment of keySegments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("\0") ||
      segment.includes("/") ||
      segment.includes("\\")
    ) {
      return null;
    }
  }
  const safe = keySegments.join("/");
  const full = path.resolve(root, safe);
  if (!full.startsWith(root + path.sep) && full !== root) return null;
  return full;
}
