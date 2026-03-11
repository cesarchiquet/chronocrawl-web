import type { ChangeRow } from "./monitorDiff";
export { groupRowsByDomain } from "./monitorGrouping";

type LastChange = {
  domain: "seo" | "pricing" | "cta";
  field_key: string;
  after_value: string | null;
  severity: "medium" | "high";
  detected_at: string | null;
};

const SIMILAR_CHANGE_WINDOWS_MS: Record<string, number> = {
  title: 6 * 60 * 60 * 1000,
  meta_description: 6 * 60 * 60 * 1000,
  h1: 6 * 60 * 60 * 1000,
  cta_json: 4 * 60 * 60 * 1000,
  headlines_json: 4 * 60 * 60 * 1000,
  pricing_json: 8 * 60 * 60 * 1000,
};

function asText(value: string | null | undefined) {
  return value || "";
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function tokenChangeRatio(beforeValue: string, afterValue: string) {
  const beforeTokens = new Set(tokenize(beforeValue));
  const afterTokens = new Set(tokenize(afterValue));

  if (beforeTokens.size === 0 && afterTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of beforeTokens) {
    if (afterTokens.has(token)) intersection += 1;
  }

  const union = new Set([...beforeTokens, ...afterTokens]).size || 1;
  return 1 - intersection / union;
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseNumericValues(value: string) {
  const matches = value.match(/-?\d+(?:[.,]\d+)?/g) || [];
  return matches
    .map((raw) => Number(raw.replace(",", ".")))
    .filter((num) => Number.isFinite(num));
}

function symmetricDifferenceCount(valuesA: string[], valuesB: string[]) {
  const setA = new Set(valuesA);
  const setB = new Set(valuesB);
  let delta = 0;
  for (const item of setA) {
    if (!setB.has(item)) delta += 1;
  }
  for (const item of setB) {
    if (!setA.has(item)) delta += 1;
  }
  return delta;
}

export function isRecentSimilarChange(params: {
  previous: LastChange;
  next: ChangeRow;
  now?: number;
}) {
  const { previous, next } = params;
  if (next.severity !== "medium") return false;
  if (previous.severity !== "medium") return false;
  if (previous.field_key !== next.field_key) return false;

  const windowMs = SIMILAR_CHANGE_WINDOWS_MS[next.field_key];
  if (!windowMs || !previous.detected_at) return false;

  const previousMs = Date.parse(previous.detected_at);
  if (!Number.isFinite(previousMs)) return false;
  const now = params.now ?? Date.now();
  if (now - previousMs > windowMs) return false;

  const previousAfter = asText(previous.after_value);
  const nextAfter = asText(next.after_value);

  if (next.field_key === "title" || next.field_key === "meta_description" || next.field_key === "h1") {
    return tokenChangeRatio(previousAfter, nextAfter) < 0.28;
  }

  if (next.field_key === "cta_json" || next.field_key === "headlines_json") {
    const delta = symmetricDifferenceCount(
      parseStringArray(previousAfter),
      parseStringArray(nextAfter)
    );
    return delta <= 2;
  }

  if (next.field_key === "pricing_json") {
    const beforeNums = parseNumericValues(previousAfter);
    const afterNums = parseNumericValues(nextAfter);
    const maxLen = Math.max(beforeNums.length, afterNums.length);
    if (maxLen === 0) return false;
    for (let i = 0; i < maxLen; i += 1) {
      const before = beforeNums[i] ?? 0;
      const after = afterNums[i] ?? 0;
      const base = Math.max(Math.abs(before), 1);
      if (Math.abs(after - before) / base >= 0.05) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export async function dedupeConsecutiveRows(params: {
  userId: string;
  monitoredUrlId: string;
  rows: ChangeRow[];
}) {
  const { userId, monitoredUrlId, rows } = params;
  if (rows.length === 0) return rows;
  const { supabaseAdmin } = await import("./supabaseAdmin");

  const { data: lastChanges } = await supabaseAdmin
    .from("detected_changes")
    .select("domain,field_key,after_value,severity,detected_at")
    .eq("user_id", userId)
    .eq("monitored_url_id", monitoredUrlId)
    .order("detected_at", { ascending: false })
    .limit(100);

  const latestByField = new Map<string, LastChange>();
  for (const row of (lastChanges || []) as LastChange[]) {
    const key = `${row.domain}:${row.field_key}`;
    if (!latestByField.has(key)) {
      latestByField.set(key, row);
    }
  }

  return rows.filter((row) => {
    const key = `${row.domain}:${row.field_key}`;
    const latest = latestByField.get(key);
    if (!latest) return true;
    if ((latest.after_value || "") === (row.after_value || "")) return false;
    return !isRecentSimilarChange({
      previous: latest,
      next: row,
    });
  });
}
