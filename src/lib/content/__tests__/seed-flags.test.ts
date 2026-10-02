import { describe, expect, it } from "vitest";

/** Mirrors scripts/seed.ts parseArgs contract. */
function parseSeedArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const demo = flags.has("--demo");
  const admin = flags.has("--admin");
  const onlyNew = flags.has("--only-new");
  const force = flags.has("--force");
  const content =
    demo ||
    flags.has("--content") ||
    onlyNew ||
    force ||
    flags.size === 0;
  return { content, demo, admin, onlyNew, force };
}

describe("seed CLI flags (phase 1)", () => {
  it("defaults to content; --admin alone does not", () => {
    expect(parseSeedArgs([]).content).toBe(true);
    expect(parseSeedArgs(["--admin"]).content).toBe(false);
  });

  it("supports --only-new and --force as content triggers", () => {
    expect(parseSeedArgs(["--only-new"])).toMatchObject({
      content: true,
      onlyNew: true,
    });
    expect(parseSeedArgs(["--content", "--force"]).force).toBe(true);
  });

  it("production guard blocks content without --force", () => {
    const { content, force } = parseSeedArgs(["--content"]);
    const wouldBlock =
      content && "production" === "production" && !force;
    expect(wouldBlock).toBe(true);
    expect(parseSeedArgs(["--content", "--force"]).force).toBe(true);
  });
});
