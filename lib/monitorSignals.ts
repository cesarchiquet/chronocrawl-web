import crypto from "node:crypto";

type ExtractedSignals = {
  title: string;
  metaDescription: string;
  h1: string;
  canonicalUrl: string;
  robotsDirective: string;
  pricingJson: Record<string, string[]>;
  ctaJson: string[];
  contentFingerprint: string;
  pageHash: string;
  rawExtract: Record<string, unknown>;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function cleanText(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTagContent(html: string, tagName: string) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(regex);
  return decodeHtmlEntities(cleanText(match?.[1] || ""));
}

function extractMetaByName(html: string, name: string) {
  const metaTags = html.match(/<meta[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const hasName = new RegExp(`name=["']${name}["']`, "i").test(tag);
    if (!hasName) continue;
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    return decodeHtmlEntities((contentMatch?.[1] || "").trim());
  }
  return "";
}

function extractCanonical(html: string) {
  const linkTags = html.match(/<link[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const hasCanonical = /rel=["']canonical["']/i.test(tag);
    if (!hasCanonical) continue;
    const hrefMatch = tag.match(/href=["']([^"']*)["']/i);
    return (hrefMatch?.[1] || "").trim();
  }
  return "";
}

function extractPrices(html: string) {
  const results = new Set<string>();
  const patterns = [
    /(?:€|\$|£)\s?\d[\d\s.,]*/g,
    /\d[\d\s.,]*\s?(?:€|\$|£)/g,
  ];

  for (const pattern of patterns) {
    for (const match of html.match(pattern) || []) {
      const normalized = match.replace(/\s+/g, " ").trim();
      if (normalized.length > 1 && normalized.length < 32) {
        results.add(normalized);
      }
    }
  }

  return Array.from(results).slice(0, 20);
}

function extractCtas(html: string) {
  const ctas: string[] = [];
  const patterns = [
    /<a[^>]*>([\s\S]*?)<\/a>/gi,
    /<button[^>]*>([\s\S]*?)<\/button>/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const text = decodeHtmlEntities(cleanText(match[1] || ""));
      if (text.length >= 2 && text.length <= 80) {
        ctas.push(text);
      }
      if (ctas.length >= 30) break;
    }
    if (ctas.length >= 30) break;
  }

  return Array.from(new Set(ctas)).slice(0, 20);
}

function normalizeDynamicNoise(input: string) {
  let text = input;
  let score = 0;

  const patterns: Array<[RegExp, string]> = [
    [
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "__UUID__",
    ],
    [/\b\d{10,13}\b/g, "__TIMESTAMP__"],
    [/\b\d{4}-\d{2}-\d{2}[t\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:z|[+-]\d{2}:?\d{2})?\b/gi, "__ISO_DATE__"],
    [/\b[a-f0-9]{16,}\b/gi, "__HEX_TOKEN__"],
    [/\b[a-z0-9_-]{24,}\b/gi, "__LONG_TOKEN__"],
  ];

  for (const [regex, replacement] of patterns) {
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      score += matches.length;
      text = text.replace(regex, replacement);
    }
  }

  return {
    normalized: text,
    dynamicNoiseScore: score,
  };
}

function buildContentFingerprint(html: string) {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = decodeHtmlEntities(cleanText(noScripts)).toLowerCase();
  const normalized = normalizeDynamicNoise(text);
  return {
    fingerprint: sha256(normalized.normalized),
    dynamicNoiseScore: normalized.dynamicNoiseScore,
  };
}

export function extractSignalsFromHtml(html: string, sourceUrl: string): ExtractedSignals {
  const title = extractTagContent(html, "title");
  const h1 = extractTagContent(html, "h1");
  const metaDescription = extractMetaByName(html, "description");
  const robotsDirective = extractMetaByName(html, "robots");
  const canonicalUrl = extractCanonical(html);
  const prices = extractPrices(html);
  const ctas = extractCtas(html);
  const content = buildContentFingerprint(html);
  const pageHash = sha256(html);

  return {
    title,
    metaDescription,
    h1,
    canonicalUrl,
    robotsDirective,
    pricingJson: { values: prices },
    ctaJson: ctas,
    contentFingerprint: content.fingerprint,
    pageHash,
    rawExtract: {
      sourceUrl,
      title,
      metaDescription,
      h1,
      canonicalUrl,
      robotsDirective,
      prices,
      ctas,
      dynamic_noise_score: content.dynamicNoiseScore,
    },
  };
}
