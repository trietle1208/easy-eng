import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../ui-plan/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PORT = process.env.PORT || "3015";
const BASE = `http://localhost:${PORT}`;

const ROUTES = [
  { name: "home", path: "/" },
  { name: "grammar", path: "/grammar/use-subject-verb-clauses" },
  { name: "vocabulary", path: "/vocabulary" },
  { name: "reading", path: "/reading/the-night-bus-to-da-lat" },
  { name: "listening", path: "/listening/checking-in-at-the-airport" },
  { name: "quiz", path: "/quiz/present-perfect-vs-past-simple" },
  { name: "profile", path: "/profile" },
];

async function shot(page, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT, name),
    fullPage: true,
  });
  console.log("wrote", name);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.remove(
      "default",
      "blossom",
      "light",
      "dark",
    );
    document.documentElement.classList.add(t);
  }, theme);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(250);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Phase 3g profile focus
await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
await setTheme(page, "default");
await shot(page, "phase-3g-profile-default-1440.png", 1440, 1200);
await shot(page, "phase-3g-profile-default-390.png", 390, 844);
await setTheme(page, "blossom");
await shot(page, "phase-3g-profile-blossom-1440.png", 1440, 1200);
await shot(page, "phase-3g-profile-blossom-390.png", 390, 844);

// Phase 4 — every route × themes × viewports
for (const route of ROUTES) {
  await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
  for (const theme of ["default", "blossom"]) {
    await setTheme(page, theme);
    await shot(
      page,
      `phase-4-${route.name}-${theme}-1440.png`,
      1440,
      1100,
    );
    await shot(
      page,
      `phase-4-${route.name}-${theme}-390.png`,
      390,
      844,
    );
  }
}

await browser.close();
console.log("done");
