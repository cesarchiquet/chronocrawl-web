import { describe, expect, it } from "vitest";
import { groupRowsByDomain } from "../lib/monitorGrouping";
import type { ChangeRow } from "../lib/monitorDiff";

function makeRow(overrides: Partial<ChangeRow>): ChangeRow {
  return {
    user_id: "u",
    monitored_url_id: "m",
    snapshot_before_id: "s1",
    snapshot_after_id: "s2",
    domain: "seo",
    field_key: "title",
    before_value: "before",
    after_value: "after",
    severity: "medium",
    confidence_score: 60,
    noise_flags: [],
    metadata: {},
    ...overrides,
  };
}

describe("monitorDedupe grouping", () => {
  it("groups rows per domain and marks one root", () => {
    const rows = groupRowsByDomain([
      makeRow({ field_key: "title", confidence_score: 80 }),
      makeRow({ field_key: "meta_description", confidence_score: 70 }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].change_group_id).toBeTruthy();
    expect(rows[1].change_group_id).toBe(rows[0].change_group_id);
    expect(rows.filter((row) => row.is_group_root)).toHaveLength(1);
  });

  it("keeps single row as root without group id", () => {
    const rows = groupRowsByDomain([makeRow({ domain: "pricing" })]);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_group_root).toBe(true);
  });
});
