import { extractBenefits, type BenefitScrapeConfig } from "@/lib/benefits-parse";

const cfg: BenefitScrapeConfig = {
  urls: ["https://www.azrielimalls.co.il/malls/tel-aviv/coupons"],
  tool: "scrape_as_markdown",
  blockSplit: "(?=^###\\s+.+ב-[\\d.,]+\\s*₪\\s*במקום\\s*[\\d.,]+\\s*₪)",
  fields: {
    description: "^###\\s+(.+?)\\s+ב-[\\d.,]+\\s*₪\\s*במקום\\s*[\\d.,]+\\s*₪",
    discount_amount: "ב-([\\d.,]+)\\s*₪\\s*במקום\\s*([\\d.,]+)\\s*₪",
    valid_to: "בתוקף עד:\\s*(\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})",
  },
  defaults: { type: "discount", is_public: true, club_id: null },
};

const sample = `TOYS\`R\`US

![logo](/_next/image?url=x)

### ערכת קסמים "רוצה להיות מכשף?" ב-39.90 ₪ במקום 59.90 ₪

קניונים משתתפים:אילון, ירושלים, חיפה

בתוקף עד: 30.06.26

Food Appeal

### ווק 28 ס"מ WOKO מבית Food appeal ב-39.90 ₪ במקום 89 ₪

קניונים משתתפים:ירושלים, חיפה

בתוקף עד: 30.06.26
`;

async function main() {
  const out = await extractBenefits(
    sample,
    cfg,
    "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
  );
  console.log(JSON.stringify(out, null, 2));

  const ok =
    out.length === 2 &&
    out[0].discount_amount === 20 &&
    out[1].discount_amount === 49.1 &&
    out[0].valid_to === "2026-06-30" &&
    out[0].description.startsWith("ערכת קסמים");
  console.log(ok ? "PASS ✅" : "FAIL ❌");
  process.exit(ok ? 0 : 1);
}

main();
