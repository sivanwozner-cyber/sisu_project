// Maintenance harness for lib/benefits/scrape-targets.sample.json ("azrieli" source).
// Re-run this whenever azrielimalls.co.il markup changes, to confirm blockSplit/field
// regexes still match real scrape_as_markdown output before updating scrape_targets.
//
// Usage: node lib/benefits/_regex_test.mjs
// (Paste a fresh markdown sample from BrightData scrape_as_markdown into `sampleMarkdown`.)

const sampleMarkdown = `TOYS\`R\`US

![TOYS\`R\`US](/_next/image?url=https%3A%2F%2Fexample.com%2Flogo.png)

![ערכת קסמים](/_next/image?url=https%3A%2F%2Fexample.com%2Fproduct1.png)

### ערכת קסמים "רוצה להיות מכשף?" ב-39.90 ₪ במקום 59.90 ₪

קניונים משתתפים:אילון, ירושלים, חולון, עכו, חיפה

בתוקף עד: 30.06.26

![share](/_next/image?url=share-icon.png)

Food Appeal

![Food Appeal](/_next/image?url=https%3A%2F%2Fexample.com%2Flogo2.png)

![ווק](/_next/image?url=https%3A%2F%2Fexample.com%2Fproduct2.png)

### ווק 28 ס"מ WOKO מבית Food appeal ב-39.90 ₪ במקום 89 ₪

קניונים משתתפים:ירושלים, מודיעין, חיפה, ראשונים

בתוקף עד: 30.06.26

![share](/_next/image?url=share-icon2.png)
`;

const blockSplit = /(?=^###\s+.+ב-[\d.,]+\s*₪\s*במקום\s*[\d.,]+\s*₪)/m;
const descRe = /^###\s+(.+?)\s+ב-[\d.,]+\s*₪\s*במקום\s*[\d.,]+\s*₪/m;
const amountRe = /ב-([\d.,]+)\s*₪\s*במקום\s*([\d.,]+)\s*₪/;
const validToRe = /בתוקף עד:\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/;
const imgRe = /!\[[^\]]*\]\((\/_next\/image\?url=[^)]+)\)/g;

function toIsoDate(d) {
  const [dd, mm, yy] = d.split('.');
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

const parts = sampleMarkdown
  .split(blockSplit)
  .filter((b) => /###\s+.+ב-[\d.,]+\s*₪\s*במקום\s*[\d.,]+\s*₪/.test(b));

console.log(`Blocks found: ${parts.length}`);

parts.forEach((block, i) => {
  const desc = block.match(descRe);
  const amt = block.match(amountRe);
  const valTo = block.match(validToRe);
  let lastImg = null;
  let m;
  while ((m = imgRe.exec(block)) !== null) lastImg = m[1];
  imgRe.lastIndex = 0;

  const salePrice = amt ? parseFloat(amt[1]) : null;
  const origPrice = amt ? parseFloat(amt[2]) : null;
  const discountAmount =
    salePrice != null && origPrice != null ? +(origPrice - salePrice).toFixed(2) : null;

  const benefit = {
    description: desc ? desc[1].trim() : null,
    type: 'discount',
    discount_pct: null,
    discount_amount: discountAmount,
    valid_from: null,
    valid_to: valTo ? toIsoDate(valTo[1]) : null,
    club_id: null,
    is_public: true,
    source_url: 'https://www.azrielimalls.co.il/malls/tel-aviv/coupons',
    image_url: lastImg,
  };
  console.log(`\n--- Sample ${i + 1} ---`);
  console.log(JSON.stringify(benefit, null, 2));
});
