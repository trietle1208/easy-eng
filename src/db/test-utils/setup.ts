import { afterAll, vi } from "vitest";

// Point the app `db` client at the test database for all data-layer tests.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// `server-only` throws outside the React Server Components bundler.
vi.mock("server-only", () => ({}));

import { closeTestPool } from "@/db/test-utils";

afterAll(async () => {
  await closeTestPool();
});
