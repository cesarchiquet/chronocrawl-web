export type MonitorDomain = "seo" | "pricing" | "cta";
export type MonitorSeverity = "medium" | "high";

export type DbSnapshot = {
  id: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical_url: string | null;
  robots_directive: string | null;
  pricing_json: Record<string, unknown> | null;
  cta_json: string[] | null;
  content_fingerprint: string | null;
};

export type ChangeRow = {
  user_id: string;
  monitored_url_id: string;
  snapshot_before_id: string | null;
  snapshot_after_id: string;
  domain: MonitorDomain;
  field_key: string;
  before_value: string | null;
  after_value: string | null;
  severity: MonitorSeverity;
  metadata: Record<string, unknown>;
};

function asText(input: unknown) {
  if (input === null || input === undefined) return "";
  return String(input);
}

function normalizeJson(input: unknown) {
  return JSON.stringify(input ?? {});
}

function shortValue(input: unknown, max = 140) {
  const value = asText(input);
  if (!value) return "vide";
  return value.length > max ? `${value.slice(0, max)}...` : value;
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
    if (Array.isArray(parsed)) {
      return parsed.map((item) => asText(item).toLowerCase()).filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
}

function parseNumericValues(value: string) {
  const matches = value.match(/-?\d+(?:[.,]\d+)?/g) || [];
  return matches
    .map((raw) => Number(raw.replace(",", ".")))
    .filter((num) => Number.isFinite(num));
}

function fieldLabel(fieldKey: string) {
  const labels: Record<string, string> = {
    title: "Title",
    meta_description: "Meta description",
    h1: "H1",
    canonical_url: "Canonical",
    robots_directive: "Robots",
    pricing_json: "Prix",
    cta_json: "CTA",
  };
  return labels[fieldKey] || fieldKey;
}

function domainLabel(domain: ChangeRow["domain"]) {
  const labels: Record<ChangeRow["domain"], string> = {
    seo: "SEO",
    pricing: "Pricing",
    cta: "CTA",
  };
  return labels[domain];
}

export function severityAtLeast(
  value: ChangeRow["severity"],
  threshold: ChangeRow["severity"]
) {
  const rank: Record<ChangeRow["severity"], number> = {
    medium: 0,
    high: 1,
  };
  return rank[value] >= rank[threshold];
}

function computeSeverity(params: {
  fieldKey: string;
  beforeValue: string;
  afterValue: string;
}) {
  const { fieldKey, beforeValue, afterValue } = params;

  const beforeEmpty = beforeValue.trim().length === 0;
  const afterEmpty = afterValue.trim().length === 0;
  const becameEmpty = !beforeEmpty && afterEmpty;
  const becameFilled = beforeEmpty && !afterEmpty;
  const ratio = tokenChangeRatio(beforeValue, afterValue);

  if (fieldKey === "robots_directive" || fieldKey === "canonical_url") {
    return {
      severity: "high" as const,
      score: 90,
      reason: "Signal SEO structurel critique.",
    };
  }

  if (fieldKey === "title" || fieldKey === "meta_description") {
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 90,
        reason: "Ajout/suppression d'un champ SEO principal.",
      };
    }
    if (ratio >= 0.55) {
      return {
        severity: "high" as const,
        score: 80,
        reason: "Forte variation de texte SEO principal.",
      };
    }
    return {
      severity: "medium" as const,
      score: 60,
      reason: "Variation moderee de texte SEO principal.",
    };
  }

  if (fieldKey === "h1") {
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 75,
        reason: "Ajout/suppression du H1.",
      };
    }
    if (ratio >= 0.6) {
      return {
        severity: "medium" as const,
        score: 55,
        reason: "Forte variation du H1.",
      };
    }
    return {
      severity: "medium" as const,
      score: 50,
      reason: "Variation mineure du H1.",
    };
  }

  if (fieldKey === "pricing_json") {
    const beforeNums = parseNumericValues(beforeValue);
    const afterNums = parseNumericValues(afterValue);
    const maxLen = Math.max(beforeNums.length, afterNums.length);

    if (maxLen === 0) {
      return {
        severity: "medium" as const,
        score: 65,
        reason: "Structure pricing modifiee.",
      };
    }

    let majorNumericShift = false;
    for (let i = 0; i < maxLen; i += 1) {
      const b = beforeNums[i] ?? 0;
      const a = afterNums[i] ?? 0;
      const base = Math.max(Math.abs(b), 1);
      if (Math.abs(a - b) / base >= 0.1) {
        majorNumericShift = true;
        break;
      }
    }

    if (majorNumericShift) {
      return {
        severity: "high" as const,
        score: 92,
        reason: "Variation de prix >= 10%.",
      };
    }

    return {
      severity: "medium" as const,
      score: 68,
      reason: "Variation pricing faible ou structurelle.",
    };
  }

  if (fieldKey === "cta_json") {
    const beforeCtas = parseStringArray(beforeValue);
    const afterCtas = parseStringArray(afterValue);
    const ctaKeywords = ["essai", "demo", "contact", "acheter", "devis", "signup"];

    const beforeImportant = beforeCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );
    const afterImportant = afterCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );

    if (beforeImportant && !afterImportant) {
      return {
        severity: "high" as const,
        score: 88,
        reason: "Disparition d'un CTA commercial important.",
      };
    }

    const countDelta = Math.abs(beforeCtas.length - afterCtas.length);
    if (countDelta >= 2) {
      return {
        severity: "medium" as const,
        score: 58,
        reason: "Variation notable du volume de CTA.",
      };
    }

    return {
      severity: "medium" as const,
      score: 50,
      reason: "Variation de CTA detectee.",
    };
  }

  return {
    severity: "medium" as const,
    score: 50,
    reason: "Changement detecte.",
  };
}

export function buildDiffRows(params: {
  userId: string;
  monitoredUrlId: string;
  monitoredUrl: string;
  before: DbSnapshot | null;
  after: DbSnapshot;
}): ChangeRow[] {
  const { userId, monitoredUrlId, monitoredUrl, before, after } = params;
  if (!before) return [];

  const rows: ChangeRow[] = [];
  const push = (
    domain: ChangeRow["domain"],
    fieldKey: string,
    beforeValue: unknown,
    afterValue: unknown
  ) => {
    const beforeText = asText(beforeValue);
    const afterText = asText(afterValue);
    if (beforeText === afterText) return;
    const computed = computeSeverity({
      fieldKey,
      beforeValue: beforeText,
      afterValue: afterText,
    });
    rows.push({
      user_id: userId,
      monitored_url_id: monitoredUrlId,
      snapshot_before_id: before.id,
      snapshot_after_id: after.id,
      domain,
      field_key: fieldKey,
      before_value: beforeText || null,
      after_value: afterText || null,
      severity: computed.severity,
      metadata: {
        url: monitoredUrl,
        summary: `[${domainLabel(domain)}] ${fieldLabel(fieldKey)} modifie`,
        before_short: shortValue(beforeText),
        after_short: shortValue(afterText),
        priority_score: computed.score,
        priority_reason: computed.reason,
      },
    });
  };

  push("seo", "title", before.title, after.title);
  push(
    "seo",
    "meta_description",
    before.meta_description,
    after.meta_description
  );
  push("seo", "h1", before.h1, after.h1);
  push(
    "seo",
    "canonical_url",
    before.canonical_url,
    after.canonical_url
  );
  push(
    "seo",
    "robots_directive",
    before.robots_directive,
    after.robots_directive
  );
  push(
    "pricing",
    "pricing_json",
    normalizeJson(before.pricing_json),
    normalizeJson(after.pricing_json)
  );
  push(
    "cta",
    "cta_json",
    normalizeJson(before.cta_json),
    normalizeJson(after.cta_json)
  );
  return rows;
}

export function filterDynamicNoiseRows(params: {
  rows: ChangeRow[];
  dynamicNoiseScore: number;
}) {
  const { rows } = params;
  if (rows.length === 0) return { kept: rows, filtered: 0 };
  return { kept: rows, filtered: 0 };
}
