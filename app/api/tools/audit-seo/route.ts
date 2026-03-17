import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { fetchPageHtml } from "@/lib/monitorFetch";
import { extractSignalsFromHtml } from "@/lib/monitorSignals";
import { buildAuditInsights } from "@/lib/auditSeoInsights";

type CheckStatus = "pass" | "fail";

type AuditCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  details: string;
  weight: number;
};

function toAbsoluteHttpUrl(raw: string) {
  try {
    const parsed = new URL(raw.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function statusWeight(status: CheckStatus) {
  if (status === "pass") return 1;
  return 0;
}

function extractMetaContent(html: string, name: string, attr: "name" | "property" = "name") {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<meta[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return (match?.[1] || "").trim();
}

function countMatches(html: string, pattern: RegExp) {
  return (html.match(pattern) || []).length;
}

function extractTextContent(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as { url?: unknown };
  const rawUrl = typeof body.url === "string" ? body.url : "";
  const url = toAbsoluteHttpUrl(rawUrl);
  if (!url) {
    return NextResponse.json(
      { error: "URL invalide. Utilise un format http(s)://..." },
      { status: 400 }
    );
  }

  const fetched = await fetchPageHtml(url);
  if (!fetched.ok) {
    return NextResponse.json(
      {
        error: "Impossible de charger la page pour audit.",
        code: fetched.failureCode,
        details: fetched.failureDetail,
      },
      { status: 502 }
    );
  }

  const signals = extractSignalsFromHtml(fetched.html, url);
  const titleLength = signals.title.length;
  const metaLength = signals.metaDescription.length;
  const robots = signals.robotsDirective.toLowerCase();
  const prices = Array.isArray(signals.pricingJson?.values)
    ? signals.pricingJson.values.length
    : 0;
  const ctas = signals.ctaJson.length;
  const html = fetched.html;

  const h1Count = countMatches(html, /<h1\b[^>]*>/gi);
  const h2Count = countMatches(html, /<h2\b[^>]*>/gi);
  const imgCount = countMatches(html, /<img\b[^>]*>/gi);
  const imgWithoutAltCount = countMatches(html, /<img\b(?![^>]*\balt=)[^>]*>/gi);
  const internalLinkCount = countMatches(
    html,
    /<a\b[^>]*href=["'](?:\/(?!\/)|https?:\/\/[^/"']*\/)[^"']*["'][^>]*>/gi
  );
  const externalLinkCount = countMatches(html, /<a\b[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi);
  const viewport = extractMetaContent(html, "viewport");
  const ogTitle = extractMetaContent(html, "og:title", "property");
  const ogDescription = extractMetaContent(html, "og:description", "property");
  const ogImage = extractMetaContent(html, "og:image", "property");
  const twitterCard = extractMetaContent(html, "twitter:card");
  const langMatch = html.match(/<html[^>]*\blang=["']([^"']+)["'][^>]*>/i);
  const lang = (langMatch?.[1] || "").trim();
  const textContent = extractTextContent(html);
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
  const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
  const titleLooksBrandOnly = titleLength > 0 && signals.title.split(/[|\-–]/).length < 2;
  const hasOpenGraph = Boolean(ogTitle && ogDescription && ogImage);
  const insights = buildAuditInsights({
    title: signals.title || null,
    metaDescription: signals.metaDescription || null,
    h1: signals.h1 || null,
    canonicalUrl: signals.canonicalUrl || null,
    ctaSignals: ctas,
    pricingSignals: prices,
    wordCount,
    h2Count,
    hasOpenGraph,
    hasTwitterCard: Boolean(twitterCard),
    hasJsonLd,
  });

  const checks: AuditCheck[] = [
    {
      id: "title",
      label: "Title SEO",
      status: titleLength === 0 ? "fail" : "pass",
      details:
        titleLength === 0
          ? "Title manquant."
          : "Title détecté.",
      weight: 1.5,
    },
    {
      id: "meta_description",
      label: "Meta description",
      status: metaLength === 0 ? "fail" : "pass",
      details:
        metaLength === 0
          ? "Meta description manquante."
          : "Meta description détectée.",
      weight: 1.2,
    },
    {
      id: "h1",
      label: "H1 principal",
      status: h1Count === 0 ? "fail" : "pass",
      details:
        h1Count === 0
          ? "H1 manquant."
          : `H1 détecté (${h1Count} balise(s)).`,
      weight: 1.2,
    },
    {
      id: "canonical",
      label: "Canonical",
      status: signals.canonicalUrl ? "pass" : "fail",
      details: signals.canonicalUrl
        ? `Canonical détectée : ${signals.canonicalUrl}`
        : "Canonical non détectée.",
      weight: 1.1,
    },
    {
      id: "robots",
      label: "Robots",
      status: robots.includes("noindex") ? "fail" : "pass",
      details: signals.robotsDirective
        ? `Directive détectée : ${signals.robotsDirective}`
        : "Aucune directive robots explicite détectée (comportement par défaut).",
      weight: 1.4,
    },
    {
      id: "viewport",
      label: "Compatibilite mobile (viewport)",
      status: viewport ? "pass" : "fail",
      details: viewport
        ? `Viewport détecté : ${viewport}`
        : "Meta viewport absente (risque UX/mobile).",
      weight: 1,
    },
    {
      id: "language",
      label: "Langue de page",
      status: lang ? "pass" : "fail",
      details: lang ? `Lang détectée : ${lang}` : "Attribut lang absent sur <html>.",
      weight: 0.9,
    },
    {
      id: "heading_structure",
      label: "Structure H2",
      status: h2Count > 0 ? "pass" : "fail",
      details:
        h2Count > 0
          ? `${h2Count} H2 détecté(s).`
          : "Aucun H2 détecté sur cette page concurrente.",
      weight: 0.8,
    },
    {
      id: "content_depth",
      label: "Profondeur de contenu",
      status: wordCount < 200 ? "fail" : "pass",
      details: `Volume texte détecté : ${wordCount} mots.`,
      weight: 1.3,
    },
    {
      id: "image_alt",
      label: "Accessibilite images (alt)",
      status: imgCount === 0 || imgWithoutAltCount === 0 ? "pass" : "fail",
      details:
        imgCount === 0
          ? "Aucune image détectée."
          : `${imgWithoutAltCount}/${imgCount} image(s) sans attribut alt.`,
      weight: 1,
    },
    {
      id: "open_graph",
      label: "Partage social (Open Graph)",
      status: hasOpenGraph ? "pass" : "fail",
      details:
        hasOpenGraph
          ? "og:title, og:description et og:image détectés."
          : "Balises Open Graph incomplètes ou absentes.",
      weight: 0.9,
    },
    {
      id: "twitter_card",
      label: "Twitter card",
      status: twitterCard ? "pass" : "fail",
      details: twitterCard
        ? `twitter:card détectée (${twitterCard}).`
        : "Balise twitter:card absente.",
      weight: 0.5,
    },
    {
      id: "structured_data",
      label: "Donnees structurees (JSON-LD)",
      status: hasJsonLd ? "pass" : "fail",
      details: hasJsonLd ? "Script JSON-LD détecté." : "Aucune donnée structurée détectée.",
      weight: 0.8,
    },
    {
      id: "link_profile",
      label: "Maillage interne minimal",
      status: internalLinkCount >= 1 ? "pass" : "fail",
      details: `${internalLinkCount} lien(s) interne(s), ${externalLinkCount} lien(s) externe(s).`,
      weight: 1,
    },
    {
      id: "title_quality",
      label: "Qualite du title (intention)",
      status: titleLength === 0 ? "fail" : "pass",
      details:
        titleLength === 0
          ? "Impossible d'évaluer la qualité du title."
          : titleLooksBrandOnly
            ? "Title détecté."
            : "Title détecté.",
      weight: 0.7,
    },
  ];

  const totalWeight = checks.reduce((acc, item) => acc + item.weight, 0);
  const weightedPoints = checks.reduce(
    (acc, item) => acc + statusWeight(item.status) * item.weight,
    0
  );
  const score = Math.round((weightedPoints / Math.max(1, totalWeight)) * 100);
  const observationConfidence =
    score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const recommendations = checks
    .filter((item) => item.status !== "pass")
    .map((item) => {
      if (item.id === "title") return "Le concurrent n'utilise pas de title exploitable (ou hors standard).";
      if (item.id === "meta_description")
        return "Le concurrent n'affiche pas de meta description exploitable.";
      if (item.id === "h1") return "Le concurrent n'affiche pas de H1 unique clair.";
      if (item.id === "canonical") return "Le concurrent n'affiche pas de canonical claire.";
      if (item.id === "robots") return "Le concurrent utilise une directive robots restrictive (ex: noindex).";
      if (item.id === "viewport") return "Le concurrent n'affiche pas de meta viewport claire.";
      if (item.id === "language") return "Le concurrent n'affiche pas d'attribut lang sur la balise html.";
      if (item.id === "heading_structure") return "Le concurrent n'affiche pas de H2 structurant.";
      if (item.id === "content_depth")
        return "Le concurrent a un contenu relativement court sur cette page.";
      if (item.id === "image_alt") return "Le concurrent a des images sans attribut alt.";
      if (item.id === "open_graph") return "Le concurrent a des balises Open Graph incomplètes.";
      if (item.id === "twitter_card") return "Le concurrent n'utilise pas twitter:card.";
      if (item.id === "structured_data") return "Le concurrent n'expose pas de JSON-LD détectable.";
      if (item.id === "link_profile") return "Le concurrent a un maillage interne limité sur cette page.";
      if (item.id === "title_quality") return "Le title du concurrent est peu spécifique.";
      return "Point SEO faible détecté sur cette page concurrente.";
    });

  return NextResponse.json({
    code: "OK",
    audit: {
      url,
      score,
      observationConfidence,
      sourceScope: "single_page_html",
      title: signals.title || null,
      metaDescription: signals.metaDescription || null,
      h1: signals.h1 || null,
      canonicalUrl: signals.canonicalUrl || null,
      robotsDirective: signals.robotsDirective || null,
      pricingSignals: prices,
      ctaSignals: ctas,
      checks,
      recommendations,
      insights,
      metrics: {
        wordCount,
        h1Count,
        h2Count,
        imgCount,
        imgWithoutAltCount,
        internalLinkCount,
        externalLinkCount,
        hasViewport: Boolean(viewport),
        hasJsonLd,
      },
    },
  });
}
