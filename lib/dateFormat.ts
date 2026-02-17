export function formatAlertDateShort(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const hour = parsed.getHours();
  const minute = String(parsed.getMinutes()).padStart(2, "0");

  return `${day}/${month} ${hour}H${minute}`;
}
