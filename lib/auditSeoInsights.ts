export type AuditInsight = {
  value: string;
  detail: string;
};

type BuildAuditInsightsParams = {
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ctaSignals: number;
  pricingSignals: number;
  wordCount: number;
  h2Count: number;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
};

function normalizeText(input: string | null) {
  return (input || "").trim().toLowerCase();
}

function hasCommercialKeyword(input: string | null) {
  const text = normalizeText(input);
  return /(prix|tarif|demo|démo|essai|gratuit|plateforme|logiciel|solution|comparatif|agence|devis)/i.test(
    text
  );
}

function titleSegments(input: string | null) {
  return (input || "")
    .split(/[|\-–]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildAuditInsights(params: BuildAuditInsightsParams) {
  const {
    title,
    metaDescription,
    canonicalUrl,
    ctaSignals,
    pricingSignals,
    wordCount,
    h2Count,
    hasOpenGraph,
    hasTwitterCard,
  } = params;

  const titleParts = titleSegments(title);
  const seoAngle: AuditInsight =
    !title
      ? {
          value: "Angle peu lisible",
          detail: "La page n'affiche pas de title exploitable pour comprendre son angle SEO.",
        }
      : hasCommercialKeyword(title) || hasCommercialKeyword(metaDescription)
        ? {
            value: "Angle requete / acquisition",
            detail:
              "Le title ou la meta description portent une intention visible de capture SEO/commerciale.",
          }
        : titleParts.length >= 2
          ? {
              value: "Angle editorial structure",
              detail:
                "Le title combine un sujet et un contexte de marque, ce qui donne une lecture SEO plus cadrée.",
            }
          : {
              value: "Angle marque ou information",
              detail:
                "La page est lisible, mais l'intention SEO reste plus descriptive que franchement orientee acquisition.",
            };

  const searchPackaging: AuditInsight =
    title && metaDescription && canonicalUrl
      ? {
          value: hasOpenGraph ? "SERP + partage solides" : "SERP solide",
          detail:
            "Le trio title / meta / canonical est en place. La page est correctement emballee pour la recherche.",
        }
      : title && metaDescription
        ? {
            value: "SERP exploitable",
            detail:
              "Le snippet de recherche est partiellement structure. La page reste lisible, mais pas totalement verrouillee.",
          }
        : {
            value: "SERP fragile",
            detail:
              "Les signaux qui structurent vraiment l'affichage recherche sont incomplets sur cette page.",
          };

  const conversionPressure: AuditInsight =
    ctaSignals >= 6
      ? {
          value: "Pression conversion forte",
          detail: `${ctaSignals} CTA detectes: la page pousse clairement une action commerciale.`,
        }
      : ctaSignals >= 3
        ? {
            value: "Pression conversion visible",
            detail: `${ctaSignals} CTA detectes: la page travaille la conversion sans surcharger le parcours.`,
          }
        : ctaSignals > 0
          ? {
              value: "Pression conversion legere",
              detail: `${ctaSignals} CTA detectes: le levier commercial existe, mais il reste discret.`,
            }
          : {
              value: "Pression conversion faible",
              detail: "Aucun CTA vraiment visible n'a ete ressorti dans le HTML observe.",
            };

  const offerVisibility: AuditInsight =
    pricingSignals >= 2
      ? {
          value: "Offre clairement exposee",
          detail: `${pricingSignals} signaux pricing detectes: la page laisse apparaitre son cadrage offre/prix.`,
        }
      : pricingSignals === 1
        ? {
            value: "Offre partiellement visible",
            detail:
              "Un signal pricing ressort, mais la lecture de l'offre reste encore partielle sur cette page.",
          }
        : {
            value: "Offre peu visible",
            detail:
              "La page ne laisse pas apparaitre de bloc pricing clair dans les signaux publics observes.",
          };

  const contentPattern: AuditInsight =
    wordCount >= 1200 && h2Count >= 4
      ? {
          value: "Contenu profond et structure",
          detail:
            "Le volume texte et le maillage de H2 indiquent une page concurrente construite pour tenir une requete sur la duree.",
        }
      : wordCount >= 400 && h2Count >= 1
        ? {
            value: "Contenu exploitable",
            detail:
              "La page a assez de matiere pour soutenir son angle, sans etre un contenu tres dense.",
          }
        : {
            value: "Contenu court ou peu charpente",
            detail:
              "Le volume ou la structure restent limites pour une page qui chercherait a tenir un angle SEO fort.",
          };

  const socialPackaging: AuditInsight =
    hasOpenGraph && hasTwitterCard
      ? {
          value: "Partage social propre",
          detail: "La page est correctement emballee pour les apercus sociaux detectables.",
        }
      : hasOpenGraph || hasTwitterCard
        ? {
            value: "Partage social partiel",
            detail: "Une partie des balises de partage est presente, mais l'emballage n'est pas complet.",
          }
        : {
            value: "Partage social faible",
            detail: "Les balises de partage social restent peu structurees ou absentes.",
          };

  return {
    seoAngle,
    searchPackaging,
    conversionPressure,
    offerVisibility,
    contentPattern,
    socialPackaging,
  };
}
