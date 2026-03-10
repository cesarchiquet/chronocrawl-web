export const HERO_SLIDE_DURATION_MS = 6500;
export const OFFER_ROTATION_MS = 7500;

export const proofSlides = [
  {
    key: "urls",
    badge: "Vue 1",
    title: "Toutes les URLs surveillées au même endroit",
    detail: "Le dashboard regroupe les pages concurrentes actives, leur statut et leur dernier passage.",
  },
  {
    key: "alerts",
    badge: "Vue 2",
    title: "Le centre d'alertes montre uniquement l'essentiel",
    detail: "Tu lis vite les changements SEO, CTA et pricing sans te noyer dans une interface lourde.",
  },
  {
    key: "audit",
    badge: "Vue 3",
    title: "L'audit SEO concurrent se lit comme un rapport",
    detail: "Fiche concurrente, cadre de confiance et lecture executive pour comprendre une page sans jargon inutile.",
  },
] as const;

export const impactMetrics = [
  { label: "Temps economise / semaine", value: "6h" },
  { label: "Chang. critiques détectés", value: "94%" },
  { label: "Delai moyen de reaction", value: "< 60 min" },
] as const;

export const compactOffers = [
  {
    name: "Starter",
    price: "12 EUR/mois",
    desc: "7 jours d'essai gratuit, idéal pour démarrer.",
    fit: "Fréelance ou petite équipe",
    why: "Parfait pour lancer une veille concurrentielle propre sans complexite technique.",
    features: ["10 URLs", "Toutes les 6h", "Alertes email"],
  },
  {
    name: "Pro",
    price: "29 EUR/mois",
    desc: "Le meilleur equilibre.",
    fit: "SaaS et e-commerce",
    why: "Le niveau recommande pour suivre vos concurrents en continu avec un vrai rythme business.",
    features: ["50 URLs", "Toutes les 60 min", "Email + Slack"],
    highlight: true,
  },
  {
    name: "Agency",
    price: "79 EUR/mois",
    desc: "Pour les équipes multi-clients.",
    fit: "Agence",
    why: "Conçu pour les équipes qui pilotent plusieurs comptes et ont besoin d'un suivi intensif.",
    features: ["200 URLs", "Toutes les 15 min", "Webhook"],
  },
] as const;

export const URL_VOLUME_STOPS = [10, 25, 50, 100, 200] as const;
