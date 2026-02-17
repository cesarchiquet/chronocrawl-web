type AlertDomain = "seo" | "pricing" | "cta" | "content";
type AlertSeverity = "low" | "medium" | "high";

type AlertInput = {
  domain: AlertDomain;
  severity: AlertSeverity;
  field_key?: string;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_reason?: string;
  } | null;
};

export function getAlertChangeSummary(alert: AlertInput): string {
  if (alert.metadata?.summary) return alert.metadata.summary;
  if (alert.field_key) return `${alert.domain.toUpperCase()} - ${alert.field_key}`;
  return "Changement detecte";
}

export function getAlertImpactLabel(alert: AlertInput): string {
  if (alert.domain === "pricing") {
    return alert.severity === "high"
      ? "Risque direct sur la competitivite prix."
      : "Signal prix a suivre rapidement.";
  }
  if (alert.domain === "cta") {
    return alert.severity === "high"
      ? "Impact potentiel sur la conversion."
      : "Evolution du parcours de conversion.";
  }
  if (alert.domain === "seo") {
    return alert.severity === "high"
      ? "Impact potentiel sur la visibilite SEO."
      : "Signal SEO a surveiller.";
  }
  return alert.severity === "high"
    ? "Impact probable sur le message commercial."
    : "Evolution contenu a monitorer.";
}

export function getAlertRecommendedAction(alert: AlertInput): string {
  if (alert.domain === "pricing") {
    return "Verifier le positionnement prix et ajuster l'offre si necessaire.";
  }
  if (alert.domain === "cta") {
    return "Comparer l'appel a l'action et valider la reponse commerciale.";
  }
  if (alert.domain === "seo") {
    return "Controler title/H1/meta et prioriser les pages a fort trafic.";
  }
  return "Valider le changement et planifier une mise a jour de contenu.";
}

export function getAlertConfidence(
  alert: AlertInput
): { label: "Elevee" | "Moyenne" | "Faible"; className: string } {
  const hasBefore = !!alert.metadata?.before_short;
  const hasAfter = !!alert.metadata?.after_short;
  const hasReason = !!alert.metadata?.priority_reason;
  const score = Number(hasBefore) + Number(hasAfter) + Number(hasReason);

  if (score >= 2) {
    return { label: "Elevee", className: "bg-emerald-500/15 text-emerald-200" };
  }
  if (score === 1) {
    return { label: "Moyenne", className: "bg-amber-500/15 text-amber-200" };
  }
  return { label: "Faible", className: "bg-rose-500/15 text-rose-200" };
}
