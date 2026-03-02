export const HERO_SLIDE_DURATION_MS = 6500;
export const OFFER_ROTATION_MS = 7500;

export const proofSlides = [
  {
    key: "urls",
    badge: "Photo 1",
    title: "Toutes vos URLs au meme endroit",
    detail: "Vous voyez en un coup d'oeil quelles pages sont bien surveillees.",
  },
  {
    key: "alerts",
    badge: "Photo 2",
    title: "Les alertes importantes ressortent",
    detail: "Le centre d'alertes vous montre quoi traiter maintenant en priorite.",
  },
  {
    key: "setup",
    badge: "Photo 3",
    title: "Configuration simple en 2 minutes",
    detail: "Vous reglez vos alertes et vous lancez la surveillance sans complexite.",
  },
] as const;

export const impactMetrics = [
  { label: "Temps economise / semaine", value: "6h" },
  { label: "Chang. critiques detectes", value: "94%" },
  { label: "Delai moyen de reaction", value: "< 60 min" },
] as const;

export const compactOffers = [
  {
    name: "Starter",
    price: "12 EUR/mois",
    desc: "7 jours d'essai gratuit, ideal pour demarrer.",
    fit: "Freelance ou petite equipe",
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
    desc: "Pour les equipes multi-clients.",
    fit: "Agence",
    why: "Concu pour les equipes qui pilotent plusieurs comptes et ont besoin d'un suivi intensif.",
    features: ["200 URLs", "Toutes les 15 min", "Webhook"],
  },
] as const;

export const URL_VOLUME_STOPS = [10, 25, 50, 100, 200] as const;
