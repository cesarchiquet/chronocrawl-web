import crypto from "node:crypto";
import type { ChangeRow } from "./monitorDiff";

function fieldLabel(fieldKey: string) {
  const labels: Record<string, string> = {
    title: "Title",
    meta_description: "Meta description",
    h1: "H1",
    canonical_url: "Canonical",
    robots_directive: "Robots",
    pricing_json: "Pricing",
    cta_json: "CTA",
    headlines_json: "Titres visibles",
  };
  if (fieldKey.startsWith("rule:")) return "Bloc surveillé";
  return labels[fieldKey] || fieldKey;
}

function domainSummary(domain: ChangeRow["domain"], count: number) {
  if (domain === "seo") {
    return count > 1
      ? `${count} changements SEO détectés sur la page`
      : "Changement SEO détecté sur la page";
  }
  if (domain === "pricing") {
    return count > 1
      ? `${count} changements pricing détectés sur la page`
      : "Changement pricing détecté sur la page";
  }
  return count > 1
    ? `${count} changements CTA détectés sur la page`
    : "Changement CTA détecté sur la page";
}

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
    const groupedFieldLabels = sorted.map((row) => fieldLabel(row.field_key));
    const groupedFieldSummary = groupedFieldLabels.slice(0, 3).join(", ");
    const groupedReason =
      groupedFieldLabels.length > 3
        ? `${groupedFieldSummary} et ${groupedFieldLabels.length - 3} autre(s) signal(aux).`
        : groupedFieldSummary;

    sorted.forEach((row, index) => {
      grouped.push({
        ...row,
        change_group_id: groupId,
        is_group_root: index === 0,
        metadata: {
          ...row.metadata,
          grouped_changes_count: sorted.length,
          grouped_fields_summary: groupedReason,
          summary: index === 0 ? domainSummary(row.domain, sorted.length) : row.metadata.summary,
          priority_reason:
            index === 0
              ? `Changements regroupés sur: ${groupedReason}`
              : row.metadata.priority_reason,
        },
      });
    });
  }

  return grouped;
}
