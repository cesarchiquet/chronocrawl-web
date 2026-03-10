type AlertEmailParams = {
  title: string;
  intro: string;
  items: string[];
  ctaUrl: string;
  ctaLabel: string;
  footerNote?: string;
  metaChips?: string[];
  highlightTitle?: string;
  highlightBody?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderAlertEmail(params: AlertEmailParams) {
  const safeItems = params.items.map((entry) => escapeHtml(entry));
  const safeMetaChips = (params.metaChips || []).map((entry) => escapeHtml(entry));
  const listHtml = safeItems
    .map(
      (entry) =>
        `<li style="margin:0 0 8px 0;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">${entry}</li>`
    )
    .join("");
  const metaHtml = safeMetaChips
    .map(
      (entry) =>
        `<span style="display:inline-block;margin:0 8px 8px 0;padding:6px 10px;border:1px solid #c7d2fe;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;">${entry}</span>`
    )
    .join("");

  const html = `
  <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#0b1025,#1d2a63);color:#ffffff;">
        <div style="font-size:12px;opacity:0.85;letter-spacing:.06em;text-transform:uppercase;">ChronoCrawl</div>
        <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.25;">${escapeHtml(params.title)}</h1>
      </div>
      <div style="padding:22px 24px;">
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#1f2937;">${escapeHtml(params.intro)}</p>
        ${
          metaHtml
            ? `<div style="margin:0 0 14px 0;">${metaHtml}</div>`
            : ""
        }
        ${
          params.highlightTitle || params.highlightBody
            ? `<div style="margin:0 0 16px 0;padding:14px 16px;border:1px solid #c7d2fe;border-radius:10px;background:#eef2ff;">
                ${
                  params.highlightTitle
                    ? `<p style="margin:0 0 6px 0;font-size:12px;line-height:1.4;color:#4338ca;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(
                        params.highlightTitle
                      )}</p>`
                    : ""
                }
                ${
                  params.highlightBody
                    ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#1e1b4b;">${escapeHtml(
                        params.highlightBody
                      )}</p>`
                    : ""
                }
              </div>`
            : ""
        }
        <ul style="margin:0;padding:0;list-style:none;">${listHtml}</ul>
        <div style="margin-top:18px;">
          <a href="${escapeHtml(
            params.ctaUrl
          )}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#6366f1;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            ${escapeHtml(params.ctaLabel)}
          </a>
        </div>
        ${
          params.footerNote
            ? `<p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">${escapeHtml(
                params.footerNote
              )}</p>`
            : ""
        }
      </div>
    </div>
  </div>`;

  const text = [
    `ChronoCrawl - ${params.title}`,
    "",
    params.intro,
    "",
    ...(safeMetaChips.length > 0 ? [safeMetaChips.join(" | "), ""] : []),
    ...(params.highlightTitle || params.highlightBody
      ? [
          params.highlightTitle ? params.highlightTitle : "",
          params.highlightBody ? params.highlightBody : "",
          "",
        ].filter(Boolean)
      : []),
    ...safeItems.map((entry, index) => `${index + 1}. ${entry}`),
    "",
    `${params.ctaLabel}: ${params.ctaUrl}`,
    params.footerNote ? `\n${params.footerNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}
