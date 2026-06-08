// Visual review screenshotter — mobile (iPhone 13) + desktop for every route.
// Usage: node shoot.mjs  (dev server must already be up on :3000)
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp/visual-review";

// Public routes render without auth; (app)/* will redirect to /login unless a
// session cookie is injected — add cookies here if you need the inner screens.
const ROUTES = [
  ["login", "/login"],
  ["onboarding", "/onboarding"],
  ["prices", "/prices"],
  ["benefits", "/benefits"],
  ["nearby", "/nearby"],
  ["birthday", "/birthday"],
  ["profile", "/profile"],
];

const VIEWPORTS = [
  ["mobile", { ...devices["iPhone 13"] }],
  ["desktop", { viewport: { width: 1280, height: 900 } }],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];

for (const [vpName, vpOpts] of VIEWPORTS) {
  const context = await browser.newContext(vpOpts);
  for (const [name, path] of ROUTES) {
    const page = await context.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`[${name}/${vpName}] ${m.text()}`);
    });
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${name}-${vpName}.png`, fullPage: true });
      console.log(`✓ ${name}-${vpName} (${page.url()})`);
    } catch (e) {
      console.log(`✗ ${name}-${vpName}: ${e.message}`);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`\nScreenshots in ${OUT}`);
if (errors.length) {
  console.log(`\n⚠ console errors (${errors.length}):`);
  for (const e of errors) console.log("  " + e);
} else {
  console.log("\n✓ no console errors");
}
