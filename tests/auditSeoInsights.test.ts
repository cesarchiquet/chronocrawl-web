import { describe, expect, it } from "vitest";
import { buildAuditInsights } from "../lib/auditSeoInsights";

describe("auditSeoInsights", () => {
  it("detects a clear commercial positioning when title, h1 and meta align", () => {
    const insights = buildAuditInsights({
      title: "Logiciel de veille concurrentielle | ChronoCrawl",
      metaDescription: "Essai gratuit pour surveiller vos concurrents.",
      h1: "Surveillez vos concurrents automatiquement",
      canonicalUrl: "https://example.com",
      ctaSignals: 6,
      pricingSignals: 2,
      wordCount: 1400,
      h2Count: 5,
      hasOpenGraph: true,
      hasTwitterCard: true,
      hasJsonLd: true,
    });

    expect(insights.positioningClarity.value).toContain("explicite");
    expect(insights.opportunityWindow.value).toContain("étroite");
  });

  it("detects a wide opportunity window on weak pages", () => {
    const insights = buildAuditInsights({
      title: null,
      metaDescription: null,
      h1: null,
      canonicalUrl: null,
      ctaSignals: 0,
      pricingSignals: 0,
      wordCount: 120,
      h2Count: 0,
      hasOpenGraph: false,
      hasTwitterCard: false,
      hasJsonLd: false,
    });

    expect(insights.positioningClarity.value).toContain("peu lisible");
    expect(insights.opportunityWindow.value).toContain("large");
  });
});
