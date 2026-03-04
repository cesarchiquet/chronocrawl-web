import { describe, expect, it } from "vitest";
import {
  buildDiffRows,
  filterDynamicNoiseRows,
  severityAtLeast,
  type DbSnapshot,
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
    expect(titleRow?.metadata.summary).toMatch("SEO");
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
          metadata: {},
        },
      ],
    });

    expect(filtered.kept).toHaveLength(1);
    expect(filtered.filtered).toBe(0);
  });
});
