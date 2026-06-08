// Authenticated desktop screenshotter — injects a fake NextAuth session cookie
// (via next-auth/jwt encode, resolved from the project's node_modules) and
// mocks the data-fetching API routes (context.route) with realistic Hebrew
// fixtures, so (app)/* pages render their populated, post-search states
// instead of an empty/loading shell or a 401 redirect to /login.
// Usage: node shoot-auth-desktop.mjs  (dev server must already be up on :3000)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp/visual-review-desktop";
const SECRET = "local-dev-secret-not-for-production-use-only"; // matches .env.local NEXTAUTH_SECRET

const { encode } = await import(
  pathToFileURL("/home/user/sisu_project/node_modules/next-auth/jwt/index.js")
);

await mkdir(OUT, { recursive: true });

const sessionToken = await encode({
  secret: SECRET,
  token: {
    name: "ויזואל QA",
    email: "qa-visual-review@example.com",
    sub: "qa-visual-review-user",
    userId: "qa-visual-review-user",
    profileComplete: true,
  },
});

// ---- mock fixtures -------------------------------------------------------
const PROFILE = {
  id: "qa-visual-review-user",
  name: "ויזואל QA",
  email: "qa-visual-review@example.com",
  birthdate: "1990-04-12",
  clubs: ["shufersal-club", "rami-levy-club"],
  profile_complete: true,
};

const PRICE_GROUPS = [
  {
    manufacturer: "תנובה",
    items: [
      { store: "rami-levy", store_logo_url: null, product_name: "חלב 3% תנובה 1 ליטר", barcode: "7290000001", price: 6.4, unit: "ל-1 ליטר", is_lowest: true, updated_at: "2026-06-07T08:00:00.000Z" },
      { store: "shufersal", store_logo_url: null, product_name: "חלב 3% תנובה 1 ליטר", barcode: "7290000001", price: 6.9, unit: "ל-1 ליטר", is_lowest: false, updated_at: "2026-06-07T08:00:00.000Z" },
      { store: "carrefour", store_logo_url: null, product_name: "חלב 3% תנובה 1 ליטר", barcode: "7290000001", price: 7.2, unit: "ל-1 ליטר", is_lowest: false, updated_at: "2026-06-06T08:00:00.000Z" },
    ],
  },
  {
    manufacturer: "טרה",
    items: [
      { store: "yochananof", store_logo_url: null, product_name: "חלב 3% טרה 1 ליטר", barcode: "7290000002", price: 6.5, unit: "ל-1 ליטר", is_lowest: true, updated_at: "2026-06-07T08:00:00.000Z" },
      { store: "shufersal", store_logo_url: null, product_name: "חלב 3% טרה 1 ליטר", barcode: "7290000002", price: 6.8, unit: "ל-1 ליטר", is_lowest: false, updated_at: "2026-06-07T08:00:00.000Z" },
    ],
  },
];

function benefit(over) {
  return {
    id: over.id,
    description: over.description,
    type: over.type,
    discount_pct: over.discount_pct ?? null,
    discount_amount: over.discount_amount ?? null,
    valid_from: over.valid_from ?? "2026-06-01",
    valid_to: over.valid_to ?? "2026-06-30",
    club_id: over.club_id ?? null,
    is_public: over.is_public ?? true,
    is_expired: false,
    club_app_url: over.club_app_url ?? null,
    source_url: "https://example.com/benefit",
    image_url: null,
    store_slug: over.store_slug ?? null,
  };
}

const STORE_BENEFITS = [
  benefit({ id: "b1", description: "5% הנחה על כל הקנייה לחברי המועדון", type: "discount", discount_pct: 5, club_id: "shufersal-club", store_slug: "shufersal" }),
  benefit({ id: "b2", description: "קאשבק 20 ₪ בקנייה מעל 300 ₪", type: "cashback", discount_amount: 20, club_id: "rami-levy-club", store_slug: "rami-levy" }),
  benefit({ id: "b3", description: "מארז מתנה בקנייה ראשונה באפליקציה", type: "gift", is_public: true, store_slug: "carrefour" }),
];

const NEARBY = {
  matched_malls: [{ slug: "azrieli-tlv", name: "קניון עזריאלי תל אביב" }],
  benefits: [
    benefit({ id: "n1", description: "10% הנחה בקניון עזריאלי בסופ\"ש", type: "discount", discount_pct: 10, store_slug: null }),
    benefit({ id: "n2", description: "מתנה בקנייה מעל 200 ₪ בחנויות הקניון", type: "gift", store_slug: null }),
  ],
  upcoming_count: 1,
};

const BIRTHDAY_BENEFITS = [
  benefit({ id: "bd1", description: "עוגת יום הולדת חינם בהצגת תעודת זהות", type: "birthday", store_slug: "shufersal" }),
  benefit({ id: "bd2", description: "30% הנחה על מוצר אחד בחודש יום ההולדת", type: "birthday", discount_pct: 30, club_id: "rami-levy-club" }),
];

// ---- pages ---------------------------------------------------------------
const ROUTES = [
  ["login", "/login", null],
  [
    "prices",
    "/prices",
    async (page) => {
      await page.getByPlaceholder("שם מוצר (לדוגמה: חלב 3%)").fill("חלב 3%");
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/prices/search")),
        page.getByRole("button", { name: "חיפוש" }).click(),
      ]);
    },
  ],
  [
    "benefits",
    "/benefits",
    async (page) => {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/benefits/by-store")),
        page.getByRole("button", { name: "חיפוש הטבות" }).click(),
      ]);
    },
  ],
  [
    "nearby",
    "/nearby",
    async (page) => {
      await page.getByPlaceholder("או הזינו שם קניון (לדוגמה: קניון עזריאלי)").fill("קניון עזריאלי");
      await page.getByRole("button", { name: "חיפוש", exact: true }).click();
      await page.waitForResponse((r) => r.url().includes("/api/benefits/nearby"));
    },
  ],
  [
    "birthday",
    "/birthday",
    async (page) => {
      await page.getByRole("button", { name: "חיפוש הטבות" }).click();
      await page.waitForResponse((r) => r.url().includes("/api/benefits/birthday"));
    },
  ],
];
// Note: /profile is a server component that calls prisma.club.findMany()
// directly (not over fetch), so it can't be satisfied via context.route()
// mocks without a live database — skipped here.

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([
  {
    name: "next-auth.session-token",
    value: sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
]);

await context.route("**/api/profile", (route) => {
  if (route.request().method() === "GET") {
    return route.fulfill({ json: PROFILE });
  }
  return route.continue();
});
await context.route("**/api/prices/search", (route) =>
  route.fulfill({ json: { groups: PRICE_GROUPS } }),
);
await context.route("**/api/benefits/by-store", (route) =>
  route.fulfill({ json: { user_clubs: PROFILE.clubs, benefits: STORE_BENEFITS, cache_hit: true, sources_failed: [] } }),
);
await context.route("**/api/benefits/nearby", (route) =>
  route.fulfill({ json: { ...NEARBY, sources_failed: [] } }),
);
await context.route("**/api/benefits/birthday", (route) =>
  route.fulfill({ json: { birth_month: 6, benefits: BIRTHDAY_BENEFITS, sources_failed: [] } }),
);

const errors = [];
for (const [name, path, interact] of ROUTES) {
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${name}] ${m.text()}`);
  });
  try {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(500);
    if (interact) await interact(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}-desktop.png`, fullPage: true });
    console.log(`✓ ${name}-desktop (${page.url()})`);
  } catch (e) {
    console.log(`✗ ${name}-desktop: ${e.message}`);
    await page.screenshot({ path: `${OUT}/${name}-desktop-FAIL.png`, fullPage: true }).catch(() => {});
  }
  await page.close();
}

await context.close();
await browser.close();
console.log(`\nScreenshots in ${OUT}`);
if (errors.length) {
  console.log(`\n⚠ console errors (${errors.length}):`);
  for (const e of errors) console.log("  " + e);
} else {
  console.log("\n✓ no console errors");
}
