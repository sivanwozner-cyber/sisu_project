import type { BenefitType } from "@prisma/client";
import { extractWithLLM } from "@/lib/anthropic";

// Normalized benefit, as produced by extraction (deterministic OR LLM fallback).
// Matches the hard schema in skill `benefit-extraction` (pre-serialization).
export type ParsedBenefit = {
  description: string;
  type: BenefitType;
  discount_pct: number | null;
  discount_amount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  club_id: string | null;
  is_public: boolean;
  source_url: string;
  image_url: string | null;
};

// Shape of the `scrape_targets` jsonb stored on clubs/stores/malls. Discovered
// and maintained by the `scrape-target-builder` agent. Regexes run over the
// MARKDOWN returned by BrightData (not a live DOM).
export type BenefitScrapeConfig = {
  urls: string[];
  tool?: string;
  blockSplit?: string;
  fields?: {
    description?: string;
    discount_pct?: string;
    discount_amount?: string;
    valid_from?: string;
    valid_to?: string;
  };
  defaults?: Partial<Pick<ParsedBenefit, "type" | "is_public" | "club_id">>;
};

export type BenefitScrapeTargets = {
  benefits?: BenefitScrapeConfig;
};

class ParseError extends Error {}

const VALID_TYPES: BenefitType[] = ["discount", "cashback", "gift", "birthday"];

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${mo}-${d}`;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

function strFrom(re: string | undefined, block: string): string | null {
  if (!re) return null;
  const m = block.match(new RegExp(re, "m"));
  if (!m) return null;
  const v = (m[1] ?? m[0]).trim();
  return v || null;
}

function numFrom(re: string | undefined, block: string): number | null {
  const raw = strFrom(re, block);
  if (raw == null) return null;
  const n = parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function dateFrom(re: string | undefined, block: string): string | null {
  const raw = strFrom(re, block);
  return raw == null ? null : normalizeDate(raw);
}

/**
 * Deterministic markdown parse driven by `scrape_targets`. Throws ParseError
 * (caller falls back to the LLM) when the config is insufficient or yields
 * nothing — never returns a partial/garbage list silently.
 */
function deterministicParse(
  markdown: string,
  cfg: BenefitScrapeConfig,
  sourceUrl: string,
): ParsedBenefit[] {
  const fields = cfg.fields;
  if (!cfg.blockSplit || !fields?.description) {
    throw new ParseError("no deterministic config (blockSplit/description)");
  }

  let blocks: string[];
  try {
    blocks = markdown
      .split(new RegExp(cfg.blockSplit, "m"))
      .map((b) => b.trim())
      .filter(Boolean);
  } catch (e) {
    throw new ParseError(`invalid blockSplit regex: ${(e as Error).message}`);
  }

  const type = (cfg.defaults?.type ?? "discount") as BenefitType;
  const isPublic = cfg.defaults?.is_public ?? true;
  const clubId = cfg.defaults?.club_id ?? null;

  const out: ParsedBenefit[] = [];
  for (const block of blocks) {
    let description: string | null;
    try {
      description = strFrom(fields.description, block);
    } catch (e) {
      throw new ParseError(`invalid field regex: ${(e as Error).message}`);
    }
    if (!description) continue;
    out.push({
      description,
      type,
      discount_pct: numFrom(fields.discount_pct, block),
      discount_amount: numFrom(fields.discount_amount, block),
      valid_from: dateFrom(fields.valid_from, block),
      valid_to: dateFrom(fields.valid_to, block),
      club_id: clubId,
      is_public: isPublic,
      source_url: sourceUrl,
      image_url: null,
    });
  }

  if (out.length === 0) {
    throw new ParseError("deterministic parse produced 0 benefits");
  }
  return out;
}

const LLM_SCHEMA = `מערך JSON. כל איבר: {
  "description": string (עברית),
  "type": "discount" | "cashback" | "gift" | "birthday",
  "discount_pct": number | null,
  "discount_amount": number | null,
  "valid_from": "YYYY-MM-DD" | null,
  "valid_to": "YYYY-MM-DD" | null,
  "is_public": boolean,
  "image_url": string | null
}
החזר [] אם אין הטבות בדף.`;

type LlmBenefit = Partial<Omit<ParsedBenefit, "source_url" | "club_id">>;

function normalizeLlm(
  raw: LlmBenefit,
  cfg: BenefitScrapeConfig,
  sourceUrl: string,
): ParsedBenefit | null {
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description) return null;
  const type = VALID_TYPES.includes(raw.type as BenefitType)
    ? (raw.type as BenefitType)
    : (cfg.defaults?.type ?? "discount");
  return {
    description,
    type,
    discount_pct: typeof raw.discount_pct === "number" ? raw.discount_pct : null,
    discount_amount:
      typeof raw.discount_amount === "number" ? raw.discount_amount : null,
    valid_from: raw.valid_from ? normalizeDate(String(raw.valid_from)) : null,
    valid_to: raw.valid_to ? normalizeDate(String(raw.valid_to)) : null,
    club_id: cfg.defaults?.club_id ?? null,
    is_public:
      typeof raw.is_public === "boolean"
        ? raw.is_public
        : (cfg.defaults?.is_public ?? true),
    source_url: sourceUrl,
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
  };
}

async function llmParse(
  markdown: string,
  cfg: BenefitScrapeConfig,
  sourceUrl: string,
): Promise<ParsedBenefit[]> {
  const raw = await extractWithLLM<LlmBenefit[]>(markdown, LLM_SCHEMA);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => normalizeLlm(r, cfg, sourceUrl))
    .filter((b): b is ParsedBenefit => b !== null);
}

/**
 * Extract benefits from a fetched markdown page: deterministic parse first,
 * Claude LLM fallback only when deterministic parsing is unavailable or fails.
 */
export async function extractBenefits(
  markdown: string,
  cfg: BenefitScrapeConfig,
  sourceUrl: string,
): Promise<ParsedBenefit[]> {
  try {
    return deterministicParse(markdown, cfg, sourceUrl);
  } catch (e) {
    console.warn(
      `deterministic benefit parse failed for ${sourceUrl} (${(e as Error).message}); falling back to LLM`,
    );
  }
  return llmParse(markdown, cfg, sourceUrl);
}
