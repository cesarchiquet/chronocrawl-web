import { describe, expect, it } from "vitest";
import {
  getAlertChangeSummary,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "../lib/alertPresentation";

describe("alertPresentation", () => {
  it("keeps grouped summary for grouped alerts", () => {
    const alert = {
      domain: "seo" as const,
      severity: "high" as const,
      field_key: "title",
      metadata: {
        summary: "3 changements SEO detectes sur la page",
        grouped_fields_summary: "Title, Meta description",
      },
    };

    expect(getAlertChangeSummary(alert)).toBe("3 changements SEO detectes sur la page");
    expect(getAlertImpactLabel(alert)).toContain("plusieurs signaux SEO");
    expect(getAlertRecommendedAction(alert)).toContain("Title, Meta description");
  });
});
