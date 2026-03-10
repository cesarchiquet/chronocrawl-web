type AlertDomain = "seo" | "pricing" | "cta";
type AlertSeverity = "medium" | "high";

type AlertInput = {
  domain: AlertDomain;
  severity: AlertSeverity;
  field_key?: string;
  confidence_score?: number | null;
  noise_flags?: string[] | null;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_reason?: string;
  } | null;
};

export function getAlertDomainLabel(domain: AlertDomain): string {
  if (domain === "seo") return "SEO";
  if (domain === "cta") return "CTA";
  return "Pricing";
}

export function getAlertFieldLabel(fieldKey?: string): string {
  switch (fieldKey) {
    case "title":
      return "Title";
    case "meta_description":
      return "Meta description";
    case "h1":
      return "H1";
    case "canonical_url":
      return "Canonical";
    case "robots_directive":
      return "Directive robots";
    case "pricing_json":
      return "Bloc pricing";
    case "cta_json":
      return "Bloc CTA";
    case "headlines_json":
      return "Titres visibles";
    default:
      if (fieldKey?.startsWith("rule:")) return "Bloc surveille";
      return "Element observe";
  }
}

export function getAlertChangeKind(alert: AlertInput): string {
  const beforeValue = (alert.metadata?.before_short || "").trim().toLowerCase();
  const afterValue = (alert.metadata?.after_short || "").trim().toLowerCase();
  const beforeMissing = !beforeValue || beforeValue === "vide" || beforeValue === "non disponible";
  const afterMissing = !afterValue || afterValue === "vide" || afterValue === "non disponible";

  if (beforeMissing && !afterMissing) return "Ajout";
  if (!beforeMissing && afterMissing) return "Suppression";
  return "Mise a jour";
}

function normalizeGeneratedSummary(summary: string) {
  return summary
    .replace(/^\[(seo|cta|pricing|rule)\]\s*/i, "")
    .replace(/\s+modifie$/i, " mis a jour")
    .replace(/\s+/g, " ")
    .trim();
}

function getFieldDrivenSummary(alert: AlertInput): string | null {
  switch (alert.field_key) {
    case "title":
      return "Title SEO mis a jour sur la page surveillee";
    case "meta_description":
      return "Meta description mise a jour sur la page surveillee";
    case "h1":
      return "H1 principal mis a jour sur la page surveillee";
    case "canonical_url":
      return "Canonical modifiee sur la page surveillee";
    case "robots_directive":
      return "Directive robots modifiee sur la page surveillee";
    case "pricing_json":
      return alert.severity === "high"
        ? "Mouvement pricing important detecte"
        : "Evolution pricing detectee";
    case "cta_json":
      return alert.severity === "high"
        ? "CTA principal modifie sur la page surveillee"
        : "Ajustement de CTA detecte";
    case "headlines_json":
      return alert.severity === "high"
        ? "Rotation marquee des titres detectee"
        : "Titres visibles mis a jour";
    default:
      if (alert.field_key?.startsWith("rule:")) {
        return "Bloc surveille mis a jour";
      }
      return null;
  }
}

export function getAlertChangeSummary(alert: AlertInput): string {
  const fieldDriven = getFieldDrivenSummary(alert);
  if (fieldDriven) return fieldDriven;
  if (alert.metadata?.summary) return normalizeGeneratedSummary(alert.metadata.summary);
  if (alert.field_key) return `${alert.domain.toUpperCase()} - ${alert.field_key}`;
  return "Changement detecte sur la page surveillee";
}

export function getAlertImpactLabel(alert: AlertInput): string {
  if (alert.domain === "pricing") {
    return alert.severity === "high"
      ? "Le concurrent ajuste probablement son ancrage prix ou son offre."
      : "Le pricing bouge sur cette page et merite une comparaison rapide.";
  }
  if (alert.domain === "cta") {
    return alert.severity === "high"
      ? "Le concurrent teste un levier de conversion plus visible."
      : "Le parcours de conversion evolue sur cette page.";
  }
  if (alert.domain === "seo") {
    return alert.severity === "high"
      ? "Signal structurel pouvant modifier la visibilite de cette page."
      : "Signal SEO utile pour suivre l'angle editorial de cette page.";
  }
  return alert.severity === "high"
    ? "Le message commercial semble avoir evolue."
    : "Evolution de contenu a suivre.";
}

export function getAlertRecommendedAction(alert: AlertInput): string {
  if (alert.domain === "pricing") {
    return "Comparer les montants, l'offre affichee et le message de valeur.";
  }
  if (alert.domain === "cta") {
    return "Verifier le nouveau CTA, sa promesse et sa place dans la page.";
  }
  if (alert.domain === "seo") {
    return "Relire title, H1 et meta pour comprendre le nouvel angle SEO.";
  }
  return "Verifier le changement observe et son objectif probable.";
}

export function getAlertConfidence(
  alert: AlertInput
): { label: "Elevee" | "Moyenne" | "Faible"; className: string } {
  const confidenceScore =
    typeof alert.confidence_score === "number" && Number.isFinite(alert.confidence_score)
      ? alert.confidence_score
      : null;
  if (confidenceScore !== null) {
    if (confidenceScore >= 75) {
      return { label: "Elevee", className: "bg-emerald-500/15 text-emerald-200" };
    }
    if (confidenceScore >= 50) {
      return { label: "Moyenne", className: "bg-amber-500/15 text-amber-200" };
    }
    return { label: "Faible", className: "bg-rose-500/15 text-rose-200" };
  }

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
