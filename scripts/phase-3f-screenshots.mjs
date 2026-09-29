import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../ui-plan/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PORT = process.env.PORT || "3014";
const BASE = `http://localhost:${PORT}`;
const QUIZ = `${BASE}/quiz/present-perfect-vs-past-simple`;

async function shot(page, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(400);
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
  await page.waitForTimeout(300);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(QUIZ, { waitUntil: "networkidle" });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: "networkidle" });

await setTheme(page, "default");
await shot(page, "phase-3f-quiz-start-default-1440.png", 1440, 1100);

await setTheme(page, "blossom");
await shot(page, "phase-3f-quiz-start-blossom-1440.png", 1440, 1100);

await setTheme(page, "default");
await page.getByRole("button", { name: /Start quiz/i }).click();
await page.waitForTimeout(500);
await shot(page, "phase-3f-quiz-q-default-1440.png", 1440, 1100);

// Answer a few and jump toward results quickly by filling all via session then submit
// Walk through: answer each and check
for (let i = 0; i < 10; i++) {
  const fill = page.locator('input[id^="quiz-fill-"]');
  if (await fill.count()) {
    await fill.first().fill("has lived");
  } else {
    // pick option B when available
    const radios = page.getByRole("radio");
    const count = await radios.count();
    if (count > 1) await radios.nth(1).click();
    else if (count > 0) await radios.nth(0).click();
  }
  await page.getByRole("button", { name: /Check answer|Submit quiz/i }).click();
  await page.waitForTimeout(250);
}

await page.waitForTimeout(600);
await shot(page, "phase-3f-quiz-results-default-1440.png", 1440, 1600);

await setTheme(page, "blossom");
// After theme reload we may be back at start — restore by not clearing; theme reload loses session? sessionStorage survives reload
const phase = await page.evaluate(() => {
  const raw = sessionStorage.getItem(
    "easy-english:quiz:present-perfect-vs-past-simple",
  );
  return raw ? JSON.parse(raw).phase : null;
});
if (phase !== "results") {
  // re-run a quick submit path
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Start quiz/i }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 10; i++) {
    const fill = page.locator('input[id^="quiz-fill-"]');
    if (await fill.count()) {
      await fill.first().fill("has lived");
    } else {
      const radios = page.getByRole("radio");
      const count = await radios.count();
      if (count > 1) await radios.nth(1).click();
      else if (count > 0) await radios.nth(0).click();
    }
    await page.getByRole("button", { name: /Check answer|Submit quiz/i }).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(400);
}
await shot(page, "phase-3f-quiz-results-blossom-1440.png", 1440, 1600);

await browser.close();
console.log("done");
