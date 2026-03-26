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

type WelcomeEmailParams = {
  dashboardUrl: string;
  pricingUrl: string;
};

type SubscriptionEmailParams = {
  planLabel: string;
  dashboardUrl: string;
  billingUrl: string;
  trialEndLabel?: string | null;
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

export function renderWelcomeEmail(params: WelcomeEmailParams) {
  const html = `
  <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#050505,#171717);color:#ffffff;">
        <div style="font-size:12px;opacity:0.85;letter-spacing:.06em;text-transform:uppercase;">ChronoCrawl</div>
        <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.25;">Bienvenue sur ChronoCrawl</h1>
      </div>
      <div style="padding:22px 24px;">
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#1f2937;">
          Ton compte est prêt. L’objectif maintenant est simple : ajouter une première URL concurrente et laisser ChronoCrawl surveiller les vrais changements.
        </p>
        <div style="margin:0 0 16px 0;padding:14px 16px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;">
          <p style="margin:0 0 6px 0;font-size:12px;line-height:1.4;color:#111827;text-transform:uppercase;letter-spacing:.04em;">Parcours recommandé</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">1. Ouvre ton dashboard<br />2. Ajoute ta première URL<br />3. Lance ou laisse tourner la surveillance automatique</p>
        </div>
        <div style="margin-top:18px;">
          <a href="${escapeHtml(params.dashboardUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111111;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;margin-right:10px;">
            Ouvrir le dashboard
          </a>
          <a href="${escapeHtml(params.pricingUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#ffffff;color:#111111;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #d1d5db;">
            Voir les offres
          </a>
        </div>
        <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">
          ChronoCrawl surveille les sites concurrents, détecte les changements utiles et les remonte dans un dashboard clair.
        </p>
      </div>
    </div>
  </div>`;

  const text = [
    "ChronoCrawl - Bienvenue",
    "",
    "Ton compte est prêt. Ajoute une première URL concurrente et laisse ChronoCrawl surveiller les vrais changements.",
    "",
    "Parcours recommandé :",
    "1. Ouvrir le dashboard",
    "2. Ajouter une première URL",
    "3. Lancer ou laisser tourner la surveillance automatique",
    "",
    `Dashboard: ${params.dashboardUrl}`,
    `Offres: ${params.pricingUrl}`,
  ].join("\n");

  return { html, text };
}

export function renderSubscriptionEmail(params: SubscriptionEmailParams) {
  const safePlanLabel = escapeHtml(params.planLabel);
  const html = `
  <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#050505,#171717);color:#ffffff;">
        <div style="font-size:12px;opacity:0.85;letter-spacing:.06em;text-transform:uppercase;">ChronoCrawl</div>
        <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.25;">Abonnement ${safePlanLabel} activé</h1>
      </div>
      <div style="padding:22px 24px;">
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#1f2937;">
          Ton abonnement ${safePlanLabel} est maintenant actif sur ChronoCrawl.
        </p>
        <div style="margin:0 0 16px 0;padding:14px 16px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;">
          <p style="margin:0 0 6px 0;font-size:12px;line-height:1.4;color:#111827;text-transform:uppercase;letter-spacing:.04em;">Ce que tu peux faire maintenant</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">Ajouter plus d’URLs, laisser le monitoring tourner automatiquement et gérer ton abonnement depuis le portail client.</p>
        </div>
        ${
          params.trialEndLabel
            ? `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.6;color:#4b5563;">Fin d’essai prévue : ${escapeHtml(params.trialEndLabel)}</p>`
            : ""
        }
        <div style="margin-top:18px;">
          <a href="${escapeHtml(params.dashboardUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111111;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;margin-right:10px;">
            Ouvrir le dashboard
          </a>
          <a href="${escapeHtml(params.billingUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#ffffff;color:#111111;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #d1d5db;">
            Gérer l’abonnement
          </a>
        </div>
      </div>
    </div>
  </div>`;

  const text = [
    `ChronoCrawl - Abonnement ${params.planLabel} activé`,
    "",
    `Ton abonnement ${params.planLabel} est maintenant actif sur ChronoCrawl.`,
    ...(params.trialEndLabel ? [`Fin d’essai prévue : ${params.trialEndLabel}`, ""] : []),
    `Dashboard: ${params.dashboardUrl}`,
    `Portail abonnement: ${params.billingUrl}`,
  ].join("\n");

  return { html, text };
}
