import crypto from "node:crypto";
import type { ChangeRow } from "./monitorDiff";

export function groupRowsByDomain(rows: ChangeRow[]): ChangeRow[] {
  if (rows.length <= 1) {
    return rows.map((row) => ({
      ...row,
      change_group_id: row.change_group_id || null,
      is_group_root: row.is_group_root ?? true,
    }));
  }

  const rowsByDomain = new Map<string, ChangeRow[]>();
  for (const row of rows) {
    const key = row.domain;
    const current = rowsByDomain.get(key) || [];
    current.push(row);
    rowsByDomain.set(key, current);
  }

  const grouped: ChangeRow[] = [];
  for (const [, domainRows] of rowsByDomain) {
    if (domainRows.length === 1) {
      grouped.push({
        ...domainRows[0],
        change_group_id: domainRows[0].change_group_id || null,
        is_group_root: true,
      });
      continue;
    }

    const groupId = crypto.randomUUID();
    const sorted = [...domainRows].sort((a, b) => {
      const aScore = typeof a.metadata?.priority_score === "number" ? (a.metadata.priority_score as number) : a.confidence_score;
      const bScore = typeof b.metadata?.priority_score === "number" ? (b.metadata.priority_score as number) : b.confidence_score;
      return bScore - aScore;
    });

    sorted.forEach((row, index) => {
      grouped.push({
        ...row,
        change_group_id: groupId,
        is_group_root: index === 0,
        metadata: {
          ...row.metadata,
          grouped_changes_count: sorted.length,
        },
      });
    });
  }

  return grouped;
}
