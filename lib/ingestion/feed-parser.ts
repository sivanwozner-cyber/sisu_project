import { gunzipSync } from "zlib";

const FIELD_CACHE = new Map<string, RegExp>();
function fieldRegex(field: string): RegExp {
  let re = FIELD_CACHE.get(field);
  if (!re) {
    re = new RegExp(`<${field}>([\\s\\S]*?)</${field}>`, "i");
    FIELD_CACHE.set(field, re);
  }
  return re;
}

export function readField(block: string, field: string): string | null {
  const m = fieldRegex(field).exec(block);
  if (!m) return null;
  const decoded = decodeXmlEntities(m[1]);
  return decoded.length ? decoded : null;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&").trim();
}

export function* iterateRecords(xml: string, recordTag: string): Generator<string> {
  const re = new RegExp(`<${recordTag}\\b[^>]*>([\\s\\S]*?)</${recordTag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) yield m[1];
}

export function decompressFeed(buf: Buffer): string {
  const xmlBuf = looksGzipped(buf) ? gunzipSync(buf) : buf;
  return xmlBuf.toString("utf-8").replace(/^﻿/, "");
}
function looksGzipped(buf: Buffer): boolean {
  return buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

export function toNumber(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function isValidBarcode(code: string | null): code is string {
  if (!code) return false;
  return /^\d{4,14}$/.test(code);
}
