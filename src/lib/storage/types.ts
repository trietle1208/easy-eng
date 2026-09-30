import "server-only";

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
};

export type StorageDriver = {
  put(input: PutObjectInput): Promise<{ key: string }>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  /** Absolute or app-relative path / URL for serving locally */
  publicUrl(key: string): string;
};
