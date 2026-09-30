import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PutObjectInput, StorageDriver } from "@/lib/storage/types";

export function createLocalStorageDriver(rootDir: string): StorageDriver {
  const root = path.resolve(rootDir);

  async function resolveKey(key: string) {
    const safe = key.replace(/^\/+/, "").replace(/\.\./g, "");
    const full = path.join(root, safe);
    if (!full.startsWith(root)) {
      throw new Error("Invalid storage key");
    }
    await mkdir(path.dirname(full), { recursive: true });
    return full;
  }

  return {
    async put(input: PutObjectInput) {
      const full = await resolveKey(input.key);
      const body =
        typeof input.body === "string"
          ? Buffer.from(input.body)
          : Buffer.from(input.body);
      await writeFile(full, body);
      return { key: input.key };
    },

    async get(key: string) {
      try {
        const full = await resolveKey(key);
        return await readFile(full);
      } catch {
        return null;
      }
    },

    async delete(key: string) {
      try {
        const full = await resolveKey(key);
        await unlink(full);
      } catch {
        /* ignore missing */
      }
    },

    publicUrl(key: string) {
      return `/files/${key.replace(/^\/+/, "")}`;
    },
  };
}
