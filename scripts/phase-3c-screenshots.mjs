import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../ui-plan/screenshots");
fs.mkdirSync(OUT, { recursive: true });

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

await page.goto("http://localhost:3011/vocabulary", {
  waitUntil: "networkidle",
});
await setTheme(page, "default");
await shot(page, "phase-3c-vocabulary-default-1440.png", 1440, 1100);
await setTheme(page, "blossom");
await shot(page, "phase-3c-vocabulary-blossom-1440.png", 1440, 1100);

await page.goto("http://localhost:3011/vocabulary/new", {
  waitUntil: "networkidle",
});
await setTheme(page, "default");
await shot(page, "phase-3c-add-word-default-1440.png", 1440, 1200);
await setTheme(page, "blossom");
await shot(page, "phase-3c-add-word-blossom-1440.png", 1440, 1200);

// Trigger validation errors
await page.getByRole("button", { name: "Save word" }).click();
await page.waitForTimeout(400);
await shot(page, "phase-3c-add-word-errors-blossom-1440.png", 1440, 1200);

await browser.close();
console.log("done");
