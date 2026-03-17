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
    grouped_fields_summary?: string;
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
      if (fieldKey?.startsWith("rule:")) return "Bloc surveillé";
      return "Élément observé";
  }
}

export function getAlertChangeKind(alert: AlertInput): string {
  const beforeValue = (alert.metadata?.before_short || "").trim().toLowerCase();
  const afterValue = (alert.metadata?.after_short || "").trim().toLowerCase();
  const beforeMissing = !beforeValue || beforeValue === "vide" || beforeValue === "non disponible";
  const afterMissing = !afterValue || afterValue === "vide" || afterValue === "non disponible";

  if (beforeMissing && !afterMissing) return "Ajout";
  if (!beforeMissing && afterMissing) return "Suppression";
  return "Mise à jour";
}

function normalizeGeneratedSummary(summary: string) {
  return summary
    .replace(/^\[(seo|cta|pricing|rule)\]\s*/i, "")
    .replace(/\s+modifie$/i, " mis à jour")
    .replace(/\s+/g, " ")
    .trim();
}

function getFieldDrivenSummary(alert: AlertInput): string | null {
  switch (alert.field_key) {
    case "title":
      return "Title SEO mis à jour sur la page surveillée";
    case "meta_description":
      return "Meta description mise à jour sur la page surveillée";
    case "h1":
      return "H1 principal mis à jour sur la page surveillée";
    case "canonical_url":
      return "Canonical modifiée sur la page surveillée";
    case "robots_directive":
      return "Directive robots modifiée sur la page surveillée";
    case "pricing_json":
      return alert.severity === "high"
        ? "Mouvement pricing important détecté"
        : "Évolution pricing détectée";
    case "cta_json":
      return alert.severity === "high"
        ? "CTA principal modifié sur la page surveillée"
        : "Ajustement de CTA détecté";
    case "headlines_json":
      return alert.severity === "high"
        ? "Rotation marquée des titres détectée"
        : "Titres visibles mis à jour";
    default:
      if (alert.field_key?.startsWith("rule:")) {
        return "Bloc surveillé mis à jour";
      }
      return null;
  }
}

export function getAlertChangeSummary(alert: AlertInput): string {
  if (alert.metadata?.grouped_fields_summary && alert.metadata?.summary) {
    return normalizeGeneratedSummary(alert.metadata.summary);
  }
  const fieldDriven = getFieldDrivenSummary(alert);
  if (fieldDriven) return fieldDriven;
  if (alert.metadata?.summary) return normalizeGeneratedSummary(alert.metadata.summary);
  if (alert.field_key) return `${alert.domain.toUpperCase()} - ${alert.field_key}`;
  return "Changement détecté sur la page surveillée";
}

export function getAlertImpactLabel(alert: AlertInput): string {
  if (alert.metadata?.grouped_fields_summary) {
    if (alert.domain === "seo") {
      return "Le concurrent ajuste plusieurs signaux SEO sur la même page.";
    }
    if (alert.domain === "pricing") {
      return "Le concurrent fait évoluer plusieurs éléments de son offre ou de son pricing.";
    }
    return "Le concurrent modifie plusieurs leviers de conversion sur la même page.";
  }

  if (alert.domain === "pricing") {
    return alert.severity === "high"
      ? "Le concurrent ajuste clairement son positionnement prix ou son offre."
      : "Le positionnement prix évolue sur cette page.";
  }
  if (alert.domain === "cta") {
    return alert.severity === "high"
      ? "Le concurrent pousse un levier de conversion plus visible."
      : "Le parcours de conversion évolue sur cette page.";
  }
  if (alert.domain === "seo") {
    return alert.severity === "high"
      ? "La page concurrente change son angle SEO de façon structurelle."
      : "Le concurrent ajuste son angle SEO sur cette page.";
  }
  return alert.severity === "high"
    ? "Le message commercial semble avoir évolué."
    : "Évolution de contenu à suivre.";
}

export function getAlertRecommendedAction(alert: AlertInput): string {
  if (alert.metadata?.grouped_fields_summary) {
    return `Ouvrir le détail puis relire en priorité : ${alert.metadata.grouped_fields_summary}.`;
  }

  if (alert.domain === "pricing") {
    return "Comparer les montants, l'offre affichée et la promesse de valeur.";
  }
  if (alert.domain === "cta") {
    return "Vérifier le nouveau CTA, sa promesse et sa place dans la page.";
  }
  if (alert.domain === "seo") {
    return "Relire le signal SEO modifié pour comprendre le nouvel angle de la page.";
  }
  return "Vérifier le changement observé et son objectif probable.";
}

export function getAlertConfidence(
  alert: AlertInput
): { label: "Élevée" | "Moyenne" | "Faible"; className: string } {
  const confidenceScore =
    typeof alert.confidence_score === "number" && Number.isFinite(alert.confidence_score)
      ? alert.confidence_score
      : null;
  if (confidenceScore !== null) {
    if (confidenceScore >= 75) {
      return { label: "Élevée", className: "bg-emerald-500/15 text-emerald-200" };
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
    return { label: "Élevée", className: "bg-emerald-500/15 text-emerald-200" };
  }
  if (score === 1) {
    return { label: "Moyenne", className: "bg-amber-500/15 text-amber-200" };
  }
  return { label: "Faible", className: "bg-rose-500/15 text-rose-200" };
}
