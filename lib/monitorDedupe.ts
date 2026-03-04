import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChangeRow } from "@/lib/monitorDiff";

type LastChange = {
  domain: "seo" | "pricing" | "cta";
  field_key: string;
  after_value: string | null;
};

export async function dedupeConsecutiveRows(params: {
  userId: string;
  monitoredUrlId: string;
  rows: ChangeRow[];
}) {
  const { userId, monitoredUrlId, rows } = params;
  if (rows.length === 0) return rows;

  const { data: lastChanges } = await supabaseAdmin
    .from("detected_changes")
    .select("domain,field_key,after_value")
    .eq("user_id", userId)
    .eq("monitored_url_id", monitoredUrlId)
    .order("detected_at", { ascending: false })
    .limit(100);

  const latestByField = new Map<string, LastChange>();
  for (const row of (lastChanges || []) as LastChange[]) {
    const key = `${row.domain}:${row.field_key}`;
    if (!latestByField.has(key)) {
      latestByField.set(key, row);
    }
  }

  return rows.filter((row) => {
    const key = `${row.domain}:${row.field_key}`;
    const latest = latestByField.get(key);
    if (!latest) return true;
    return (latest.after_value || "") !== (row.after_value || "");
  });
}
