import "server-only";

import { env } from "@/env";
import { createLocalStorageDriver } from "@/lib/storage/local";
import type { StorageDriver } from "@/lib/storage/types";

export type { StorageDriver, PutObjectInput } from "@/lib/storage/types";

let storage: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (!storage) {
    storage = createLocalStorageDriver(env.STORAGE_DIR);
  }
  return storage;
}
