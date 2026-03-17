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
  raw_extract?: Record<string, unknown> | null;
};

export type MonitorRule = {
  id: string;
  rule_type: "css" | "text_pattern" | "attribute";
  selector: string;
  label: string | null;
};

export type RuleEvaluation = {
  rule: MonitorRule;
  beforeValue: string | null;
  afterValue: string | null;
  matchFound: boolean;
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
  confidence_score: number;
  noise_flags: string[];
  change_group_id?: string | null;
  is_group_root?: boolean;
};

function asText(input: unknown) {
  if (input === null || input === undefined) return "";
  return String(input);
}

const IMPORTANT_COMMERCIAL_KEYWORDS = [
  "prix",
  "tarif",
  "pricing",
  "essai",
  "demo",
  "démo",
  "devis",
  "contact",
  "gratuit",
  "trial",
  "signup",
  "acheter",
  "abonnement",
  "plateforme",
  "logiciel",
  "solution",
];

function normalizeTextCompare(input: unknown) {
  return asText(input).replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeJson(input: unknown) {
  return JSON.stringify(input ?? {});
}

function serializeFieldValue(input: unknown) {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) return JSON.stringify(input);
  if (input && typeof input === "object") return JSON.stringify(input);
  return asText(input);
}

function normalizeComparableJson(input: unknown): string {
  if (Array.isArray(input)) {
    return JSON.stringify(
      input
        .map((item) => asText(item).trim().toLowerCase())
        .filter(Boolean)
        .sort()
    );
  }

  if (input && typeof input === "object") {
    return JSON.stringify(sortObjectDeep(input as Record<string, unknown>));
  }

  return normalizeJson(input);
}

function sortObjectDeep(input: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(input)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = input[key];
      if (Array.isArray(value)) {
        acc[key] = value.map((item) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? sortObjectDeep(item as Record<string, unknown>)
            : item
        );
        return acc;
      }
      if (value && typeof value === "object") {
        acc[key] = sortObjectDeep(value as Record<string, unknown>);
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
}

function shortValue(input: unknown, max = 140) {
  const value = asText(input);
  if (!value) return "vide";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countImportantKeywordShift(beforeValue: string, afterValue: string) {
  const beforeTokens = new Set(tokenize(beforeValue));
  const afterTokens = new Set(tokenize(afterValue));
  let shift = 0;
  for (const keyword of IMPORTANT_COMMERCIAL_KEYWORDS) {
    const normalizedKeyword = tokenize(keyword)[0];
    if (!normalizedKeyword) continue;
    const beforeHas = beforeTokens.has(normalizedKeyword);
    const afterHas = afterTokens.has(normalizedKeyword);
    if (beforeHas !== afterHas) shift += 1;
  }
  return shift;
}

function hasStrategicKeywordSignal(value: string) {
  const tokens = new Set(tokenize(value));
  return IMPORTANT_COMMERCIAL_KEYWORDS.some((keyword) => {
    const normalizedKeyword = tokenize(keyword)[0];
    return normalizedKeyword ? tokens.has(normalizedKeyword) : false;
  });
}

function rowHasStrategicSignal(row: Pick<ChangeRow, "before_value" | "after_value" | "field_key">) {
  if (!["cta_json", "pricing_json", "headlines_json"].includes(row.field_key)) {
    return false;
  }
  const combined = `${asText(row.before_value)} ${asText(row.after_value)}`;
  if (hasVolatileTokenPattern(combined)) return false;
  return hasStrategicKeywordSignal(combined);
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

function fieldLabel(fieldKey: string) {
  const labels: Record<string, string> = {
    title: "Title",
    meta_description: "Meta description",
    h1: "H1",
    canonical_url: "Canonical",
    robots_directive: "Robots",
    pricing_json: "Prix",
    cta_json: "CTA",
    headlines_json: "Headlines",
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

function changeSummary(params: {
  domain: ChangeRow["domain"];
  fieldKey: string;
  severity: MonitorSeverity;
}) {
  const { domain, fieldKey, severity } = params;

  switch (fieldKey) {
    case "title":
      return "Title SEO mis à jour";
    case "meta_description":
      return "Meta description mise à jour";
    case "h1":
      return "H1 principal mis à jour";
    case "canonical_url":
      return "Canonical modifiée";
    case "robots_directive":
      return "Directive robots modifiée";
    case "pricing_json":
      return severity === "high"
        ? "Mouvement pricing important détecté"
        : "Évolution pricing détectée";
    case "cta_json":
      return severity === "high"
        ? "CTA principal modifié"
        : "Ajustement de CTA détecté";
    case "headlines_json":
      return severity === "high"
        ? "Rotation marquée des titres détectée"
        : "Titres visibles mis à jour";
    default:
      return `[${domainLabel(domain)}] ${fieldLabel(fieldKey)} modifié`;
  }
}

function hasMeaningfulFieldChange(params: {
  fieldKey: string;
  beforeValue: unknown;
  afterValue: unknown;
}) {
  const { fieldKey, beforeValue, afterValue } = params;

  if (fieldKey === "pricing_json") {
    return normalizeComparableJson(beforeValue) !== normalizeComparableJson(afterValue);
  }

  if (fieldKey === "cta_json" || fieldKey === "headlines_json") {
    return normalizeComparableJson(beforeValue) !== normalizeComparableJson(afterValue);
  }

  return normalizeTextCompare(beforeValue) !== normalizeTextCompare(afterValue);
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
      score: 92,
      reason: "Signal SEO structurel critique.",
    };
  }

  if (fieldKey === "title" || fieldKey === "meta_description") {
    const keywordShift = countImportantKeywordShift(beforeValue, afterValue);
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 88,
        reason: "Ajout/suppression d'un champ SEO principal.",
      };
    }
    if (keywordShift >= 2) {
      return {
        severity: "high" as const,
        score: 84,
        reason: "Changement d'angle SEO ou commercial visible.",
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
      score: 64,
      reason: "Variation modérée de texte SEO principal.",
    };
  }

  if (fieldKey === "h1") {
    const keywordShift = countImportantKeywordShift(beforeValue, afterValue);
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 78,
        reason: "Ajout/suppression du H1.",
      };
    }
    if (keywordShift >= 2) {
      return {
        severity: "high" as const,
        score: 76,
        reason: "Le message principal de la page évolue.",
      };
    }
    if (ratio >= 0.6) {
      return {
        severity: "medium" as const,
        score: 58,
        reason: "Forte variation du H1.",
      };
    }
    return {
      severity: "medium" as const,
      score: 52,
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
        score: 66,
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
        score: 94,
        reason: "Variation de prix >= 10 %.",
      };
    }

    return {
      severity: "medium" as const,
      score: 70,
      reason: "Variation pricing faible ou structurelle.",
    };
  }

  if (fieldKey === "cta_json") {
    const beforeCtas = parseStringArray(beforeValue);
    const afterCtas = parseStringArray(afterValue);
    const ctaKeywords = ["essai", "demo", "contact", "acheter", "devis", "signup"];
    const delta = symmetricDifferenceCount(beforeCtas, afterCtas);
    const keywordShift = countImportantKeywordShift(
      beforeCtas.join(" "),
      afterCtas.join(" ")
    );

    const beforeImportant = beforeCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );
    const afterImportant = afterCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );

    if (beforeImportant && !afterImportant) {
      return {
        severity: "high" as const,
        score: 86,
        reason: "Disparition d'un CTA commercial important.",
      };
    }

    if (keywordShift >= 2) {
      return {
        severity: "high" as const,
        score: 80,
        reason: "Le levier de conversion principal change nettement.",
      };
    }

    if (delta >= 4) {
      return {
        severity: "high" as const,
        score: 78,
        reason: "Refonte marquée des CTA visibles.",
      };
    }

    const countDelta = Math.abs(beforeCtas.length - afterCtas.length);
    if (countDelta >= 2) {
      return {
        severity: "medium" as const,
        score: 60,
        reason: "Variation notable du volume de CTA.",
      };
    }

    if (delta <= 1) {
      return {
        severity: "medium" as const,
        score: 48,
        reason: "Ajustement léger d'un CTA visible.",
      };
    }

    return {
      severity: "medium" as const,
      score: 52,
      reason: "Variation de CTA détectée.",
    };
  }

  if (fieldKey === "headlines_json") {
    const beforeHeadlines = parseStringArray(beforeValue);
    const afterHeadlines = parseStringArray(afterValue);
    const delta = symmetricDifferenceCount(beforeHeadlines, afterHeadlines);

    if (
      (beforeHeadlines.length === 0 && afterHeadlines.length > 0) ||
      (beforeHeadlines.length > 0 && afterHeadlines.length === 0)
    ) {
      return {
        severity: "high" as const,
        score: 84,
        reason: "Apparition/disparition du bloc de headlines.",
      };
    }
    if (delta >= 4) {
      return {
        severity: "high" as const,
        score: 78,
        reason: "Rotation forte des headlines détectée.",
      };
    }
    if (delta <= 1) {
      return {
        severity: "medium" as const,
        score: 54,
        reason: "Ajustement léger des titres visibles.",
      };
    }
    return {
      severity: "medium" as const,
      score: 64,
      reason: "Variation des headlines détectée.",
    };
  }

  return {
    severity: "medium" as const,
    score: 50,
    reason: "Changement détecté.",
  };
}

function hasVolatileTokenPattern(value: string) {
  if (!value) return false;
  return (
    /\b[0-9a-f]{16,}\b/i.test(value) ||
    /\b\d{10,13}\b/.test(value) ||
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(value)
  );
}

function isMicroCopyChange(beforeValue: string | null, afterValue: string | null) {
  const beforeText = asText(beforeValue);
  const afterText = asText(afterValue);
  if (!beforeText || !afterText) return false;
  const ratio = tokenChangeRatio(beforeText, afterText);
  const delta = Math.abs(beforeText.length - afterText.length);
  return ratio < 0.25 && delta <= 12;
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
  const extractHeadlines = (snapshot: DbSnapshot | null) => {
    const raw = snapshot?.raw_extract as Record<string, unknown> | undefined;
    if (!raw) return [] as string[];
    const values = raw.headlines;
    if (!Array.isArray(values)) return [] as string[];
    return values
      .map((item) => asText(item))
      .filter((item) => item.length >= 8)
      .slice(0, 20);
  };
  const push = (
    domain: ChangeRow["domain"],
    fieldKey: string,
    beforeValue: unknown,
    afterValue: unknown
  ) => {
    if (!hasMeaningfulFieldChange({ fieldKey, beforeValue, afterValue })) return;
    const beforeText = serializeFieldValue(beforeValue);
    const afterText = serializeFieldValue(afterValue);
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
      confidence_score: computed.score,
      noise_flags: [],
      metadata: {
        url: monitoredUrl,
        summary: changeSummary({
          domain,
          fieldKey,
          severity: computed.severity,
        }),
        before_short: shortValue(beforeText),
        after_short: shortValue(afterText),
        priority_score: computed.score,
        priority_reason: computed.reason,
      },
    });
  };

  push("seo", "title", before.title, after.title);
  push("seo", "meta_description", before.meta_description, after.meta_description);
  push("seo", "h1", before.h1, after.h1);
  push("seo", "canonical_url", before.canonical_url, after.canonical_url);
  push("seo", "robots_directive", before.robots_directive, after.robots_directive);
  push(
    "seo",
    "headlines_json",
    extractHeadlines(before),
    extractHeadlines(after)
  );
  push("pricing", "pricing_json", before.pricing_json, after.pricing_json);
  push("cta", "cta_json", before.cta_json, after.cta_json);
  return rows;
}

export function buildRuleRows(params: {
  userId: string;
  monitoredUrlId: string;
  monitoredUrl: string;
  snapshotBeforeId: string | null;
  snapshotAfterId: string;
  evaluations: RuleEvaluation[];
}): ChangeRow[] {
  const { userId, monitoredUrlId, monitoredUrl, snapshotBeforeId, snapshotAfterId, evaluations } = params;
  const rows: ChangeRow[] = [];

  for (const evaluation of evaluations) {
    const beforeText = asText(evaluation.beforeValue);
    const afterText = asText(evaluation.afterValue);
    if (beforeText === afterText) continue;

    const fieldKey = `rule:${evaluation.rule.id}`;
    const baseConfidence = evaluation.matchFound ? 82 : 40;
    rows.push({
      user_id: userId,
      monitored_url_id: monitoredUrlId,
      snapshot_before_id: snapshotBeforeId,
      snapshot_after_id: snapshotAfterId,
      domain: "seo",
      field_key: fieldKey,
      before_value: beforeText || null,
      after_value: afterText || null,
      severity: evaluation.matchFound ? "high" : "medium",
      confidence_score: baseConfidence,
      noise_flags: evaluation.matchFound ? [] : ["rule_selector_missing"],
      metadata: {
        url: monitoredUrl,
        summary: `[RULE] ${evaluation.rule.label || evaluation.rule.selector} modifié`,
        before_short: shortValue(beforeText),
        after_short: shortValue(afterText),
        priority_score: baseConfidence,
        priority_reason: evaluation.matchFound
          ? "Variation détectée sur une zone ciblée de surveillance."
          : "Règle configurée mais zone cible non détectée sur cette page.",
        rule_id: evaluation.rule.id,
        rule_type: evaluation.rule.rule_type,
        rule_selector: evaluation.rule.selector,
      },
    });
  }

  return rows;
}

export function filterDynamicNoiseRows(params: {
  rows: ChangeRow[];
  dynamicNoiseScore: number;
}) {
  const { rows, dynamicNoiseScore } = params;
  if (rows.length === 0) return { kept: rows, filtered: 0 };
  const protectedSeoFields = new Set([
    "title",
    "meta_description",
    "h1",
    "canonical_url",
    "robots_directive",
    "headlines_json",
  ]);

  const kept: ChangeRow[] = [];
  let filtered = 0;

  for (const row of rows) {
    const noiseFlags = new Set<string>(Array.isArray(row.noise_flags) ? row.noise_flags : []);

    if (dynamicNoiseScore >= 10) noiseFlags.add("dynamic_noise_high");
    if (hasVolatileTokenPattern(asText(row.before_value)) || hasVolatileTokenPattern(asText(row.after_value))) {
      noiseFlags.add("volatile_token");
    }
    if (isMicroCopyChange(row.before_value, row.after_value)) {
      noiseFlags.add("micro_copy_change");
    }

    const nextRow: ChangeRow = {
      ...row,
      noise_flags: Array.from(noiseFlags),
    };

    let adjustedConfidence = Number.isFinite(nextRow.confidence_score)
      ? nextRow.confidence_score
      : 50;
    if (noiseFlags.has("dynamic_noise_high")) adjustedConfidence -= 12;
    if (noiseFlags.has("volatile_token")) adjustedConfidence -= 10;
    if (noiseFlags.has("micro_copy_change")) adjustedConfidence -= 6;
    nextRow.confidence_score = Math.max(10, Math.min(99, adjustedConfidence));
    nextRow.metadata = {
      ...nextRow.metadata,
      priority_score: nextRow.confidence_score,
    };

    const shouldFilter =
      (nextRow.severity === "medium" &&
        !protectedSeoFields.has(nextRow.field_key) &&
        !rowHasStrategicSignal(nextRow) &&
        (noiseFlags.has("dynamic_noise_high") || noiseFlags.has("volatile_token")) &&
        nextRow.confidence_score < 55) ||
      shouldFilterLowSignalDynamicChange({
        row: nextRow,
        dynamicNoiseScore,
      });

    if (shouldFilter) {
      filtered += 1;
      continue;
    }

    kept.push(nextRow);
  }

  return { kept, filtered };
}

function shouldFilterLowSignalDynamicChange(params: {
  row: ChangeRow;
  dynamicNoiseScore: number;
}) {
  const { row, dynamicNoiseScore } = params;
  if (row.severity !== "medium") return false;
  if (dynamicNoiseScore < 10) return false;

    if (row.field_key === "headlines_json") {
    const beforeText = asText(row.before_value);
    const afterText = asText(row.after_value);
    const delta = symmetricDifferenceCount(
      parseStringArray(beforeText),
      parseStringArray(afterText)
    );
    return delta <= 2 && !hasStrategicKeywordSignal(beforeText + " " + afterText);
  }

  if (row.field_key === "cta_json") {
    const beforeText = asText(row.before_value);
    const afterText = asText(row.after_value);
    const delta = symmetricDifferenceCount(
      parseStringArray(beforeText),
      parseStringArray(afterText)
    );
    return delta <= 1 && !hasStrategicKeywordSignal(beforeText + " " + afterText);
  }

  if (row.field_key === "pricing_json") {
    const beforeText = asText(row.before_value);
    const afterText = asText(row.after_value);
    const beforeNums = parseNumericValues(beforeText);
    const afterNums = parseNumericValues(afterText);
    return (
      beforeNums.length === 0 &&
      afterNums.length === 0 &&
      !hasStrategicKeywordSignal(beforeText + " " + afterText) &&
      row.confidence_score < 72
    );
  }

  return false;
}
