import { describe, expect, it } from "vitest";
import {
  buildDiffRows,
  buildRuleRows,
  filterDynamicNoiseRows,
  severityAtLeast,
  type DbSnapshot,
  type MonitorRule,
} from "../lib/monitorDiff";

function makeSnapshot(overrides: Partial<DbSnapshot>): DbSnapshot {
  return {
    id: "snap-id",
    title: "Title",
    meta_description: "Meta",
    h1: "H1",
    canonical_url: "https://example.com",
    robots_directive: "index,follow",
    pricing_json: { price: 10 },
    cta_json: ["Essai gratuit"],
    content_fingerprint: "abc",
    ...overrides,
  };
}

describe("monitorDiff", () => {
  it("applies severity ordering", () => {
    expect(severityAtLeast("high", "medium")).toBe(true);
    expect(severityAtLeast("medium", "high")).toBe(false);
  });

  it("builds diff rows with metadata summary", () => {
    const before = makeSnapshot({ title: "Old title" });
    const after = makeSnapshot({ id: "snap-new", title: "New title" });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com/pricing",
      before,
      after,
    });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.field_key === "title")).toBe(true);
    const titleRow = rows.find((row) => row.field_key === "title");
    expect(titleRow?.metadata.summary).toBe("Title SEO mis à jour");
    expect(typeof titleRow?.confidence_score).toBe("number");
  });

  it("ignores title changes that are only whitespace or casing", () => {
    const before = makeSnapshot({ title: "ChronoCrawl  Pricing" });
    const after = makeSnapshot({ id: "snap-new", title: "  chronocrawl pricing " });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com/pricing",
      before,
      after,
    });

    expect(rows.some((row) => row.field_key === "title")).toBe(false);
  });

  it("does not generate content domain rows", () => {
    const before = makeSnapshot({ content_fingerprint: "abc" });
    const after = makeSnapshot({ id: "snap-new", content_fingerprint: "def" });
    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com/pricing",
      before,
      after,
    });

    expect(rows.some((row) => row.field_key === "content_fingerprint")).toBe(
      false
    );
  });

  it("detects headlines rotation as SEO change", () => {
    const before = makeSnapshot({
      raw_extract: {
        headlines: [
          "Titre A de demonstration tres detaille",
          "Titre B de demonstration tres detaille",
        ],
      },
    });
    const after = makeSnapshot({
      id: "snap-new",
      raw_extract: {
        headlines: [
          "Titre C de demonstration tres detaille",
          "Titre D de demonstration tres detaille",
        ],
      },
    });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com/news",
      before,
      after,
    });

    const headlineRow = rows.find((row) => row.field_key === "headlines_json");
    expect(headlineRow).toBeTruthy();
    expect(headlineRow?.domain).toBe("seo");
  });

  it("ignores CTA reordering without real content change", () => {
    const before = makeSnapshot({
      cta_json: ["Essai gratuit", "Demander une demo"],
    });
    const after = makeSnapshot({
      id: "snap-new",
      cta_json: ["Demander une demo", "Essai gratuit"],
    });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com",
      before,
      after,
    });

    expect(rows.some((row) => row.field_key === "cta_json")).toBe(false);
  });

  it("raises CTA severity when the conversion angle changes strongly", () => {
    const before = makeSnapshot({
      cta_json: ["Essai gratuit", "Demander une demo"],
    });
    const after = makeSnapshot({
      id: "snap-new",
      cta_json: ["Voir les tarifs", "Contacter les ventes"],
    });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com",
      before,
      after,
    });

    const ctaRow = rows.find((row) => row.field_key === "cta_json");
    expect(ctaRow?.severity).toBe("high");
    expect(String(ctaRow?.metadata.priority_reason)).toContain("conversion");
  });

  it("ignores headlines reordering without rotation", () => {
    const before = makeSnapshot({
      raw_extract: {
        headlines: [
          "Titre A de demonstration tres detaille",
          "Titre B de demonstration tres detaille",
        ],
      },
    });
    const after = makeSnapshot({
      id: "snap-new",
      raw_extract: {
        headlines: [
          "Titre B de demonstration tres detaille",
          "Titre A de demonstration tres detaille",
        ],
      },
    });

    const rows = buildDiffRows({
      userId: "user-1",
      monitoredUrlId: "url-1",
      monitoredUrl: "https://concurrent.com/news",
      before,
      after,
    });

    expect(rows.some((row) => row.field_key === "headlines_json")).toBe(false);
  });

  it("keeps rows unchanged in dynamic noise filter", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 3,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "seo",
          field_key: "title",
          before_value: "a",
          after_value: "b",
          severity: "medium",
          confidence_score: 60,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.kept).toHaveLength(1);
    expect(filtered.filtered).toBe(0);
    expect(filtered.kept[0].confidence_score).toBeGreaterThan(0);
  });

  it("builds rule-based rows", () => {
    const rule: MonitorRule = {
      id: "rule-1",
      rule_type: "css",
      selector: ".cta",
      label: "CTA hero",
    };
    const rows = buildRuleRows({
      userId: "u",
      monitoredUrlId: "m",
      monitoredUrl: "https://example.com",
      snapshotBeforeId: "snap-1",
      snapshotAfterId: "snap-2",
      evaluations: [
        {
          rule,
          beforeValue: "Essai gratuit",
          afterValue: "Demander une demo",
          matchFound: true,
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].field_key).toBe("rule:rule-1");
    expect(rows[0].severity).toBe("high");
  });

  it("keeps noisy medium changes on protected SEO fields", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 12,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "seo",
          field_key: "title",
          before_value: "title 1699999999999",
          after_value: "title 1700000000000",
          severity: "medium",
          confidence_score: 52,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.filtered).toBe(0);
    expect(filtered.kept).toHaveLength(1);
  });

  it("filters noisy medium changes on non-protected fields", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 12,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "cta",
          field_key: "cta_json",
          before_value: '["essai 1699999999999"]',
          after_value: '["essai 1700000000000"]',
          severity: "medium",
          confidence_score: 52,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.filtered).toBeGreaterThanOrEqual(1);
  });

  it("filters a single dynamic headline rotation in noisy contexts", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 12,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "seo",
          field_key: "headlines_json",
          before_value: '["titre a", "titre b"]',
          after_value: '["titre a", "titre c"]',
          severity: "medium",
          confidence_score: 54,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.filtered).toBe(1);
    expect(filtered.kept).toHaveLength(0);
  });

  it("keeps strong headline rotations in noisy contexts", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 12,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "seo",
          field_key: "headlines_json",
          before_value: '["titre a", "titre b", "titre c"]',
          after_value: '["titre d", "titre e", "titre f"]',
          severity: "high",
          confidence_score: 78,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.filtered).toBe(0);
    expect(filtered.kept).toHaveLength(1);
  });

  it("keeps a small CTA change in noisy context when a strategic keyword appears", () => {
    const filtered = filterDynamicNoiseRows({
      dynamicNoiseScore: 12,
      rows: [
        {
          user_id: "u",
          monitored_url_id: "m",
          snapshot_before_id: "a",
          snapshot_after_id: "b",
          domain: "cta",
          field_key: "cta_json",
          before_value: '["nous contacter"]',
          after_value: '["demander un devis"]',
          severity: "medium",
          confidence_score: 58,
          noise_flags: [],
          metadata: {},
        },
      ],
    });

    expect(filtered.filtered).toBe(0);
    expect(filtered.kept).toHaveLength(1);
  });
});
