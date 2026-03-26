export type BlogCategory =
  | "guide"
  | "fonctionnalité"
  | "stratégie"
  | "comparatif"
  | "actualité";

export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; title: string; text: string }
  | {
      type: "internal-links";
      title: string;
      links: { href: string; label: string; description: string }[];
    };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  publishedAt: string;
  readTime: string;
  author: string;
  featured?: boolean;
  spotlight: string;
  metric: string;
  coverKicker: string;
  content: BlogContentBlock[];
};

export const blogCategories: { key: "all" | BlogCategory; label: string }[] = [
  { key: "all", label: "Tous les articles" },
  { key: "guide", label: "Guides" },
  { key: "fonctionnalité", label: "Fonctionnalités" },
  { key: "stratégie", label: "Stratégie" },
  { key: "comparatif", label: "Comparatifs" },
  { key: "actualité", label: "Actualité" },
];

export const categoryLabels: Record<BlogCategory, string> = {
  guide: "Guide",
  fonctionnalité: "Fonctionnalité",
  stratégie: "Stratégie",
  comparatif: "Comparatif",
  actualité: "Actualité",
};

export const categoryClasses: Record<BlogCategory, string> = {
  guide:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  fonctionnalité:
    "border-sky-500/20 bg-sky-500/10 text-sky-300",
  stratégie:
    "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300",
  comparatif:
    "border-amber-500/20 bg-amber-500/10 text-amber-300",
  actualité:
    "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

export const blogPosts: BlogPost[] = [
  {
    slug: "alerte-changement-site-web-comment-eviter-les-faux-positifs",
    title: "Alerte changement site web : comment éviter les faux positifs",
    excerpt:
      "Une alerte changement site web n'a de valeur que si elle remonte un vrai signal. Sinon, elle fatigue l'équipe et tue la veille concurrentielle.",
    category: "guide",
    publishedAt: "2026-03-19",
    readTime: "5 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Faire remonter moins d’alertes, mais de bien meilleure qualité.",
    metric: "Alertes, anti-bruit, priorisation",
    coverKicker: "Qualité du signal",
    content: [
      {
        type: "paragraph",
        text: "Le problème d'une alerte changement site web n'est pas seulement technique. Ce n'est pas grave si un outil détecte beaucoup de micro-variations. Ce qui coûte cher, c'est quand ces micro-variations arrivent dans les emails, le centre d'alertes et la tête de l'équipe comme si elles méritaient une réaction.",
      },
      {
        type: "paragraph",
        text: "Un faux positif n'est pas juste un changement inutile. C'est un changement qui consomme de l'attention sans apporter de lecture exploitable. Au bout de quelques jours, l'utilisateur se dit que le produit remonte trop de bruit. Et à partir de là, même les vrais signaux perdent de la valeur.",
      },
      {
        type: "heading",
        text: "D'où viennent la plupart des faux positifs",
      },
      {
        type: "list",
        items: [
          "Rotations de blocs ou changements d'ordre dans une liste.",
          "Timestamps, compteurs et micro-variations techniques.",
          "CTA très proches qui changent seulement de casse ou d'espacement.",
          "Headlines ou éléments dynamiques qui bougent sans impact business clair.",
        ],
      },
      {
        type: "paragraph",
        text: "Beaucoup d'outils confondent activité visuelle et changement utile. Pourtant, ce n'est pas parce qu'une page bouge qu'elle devient stratégique. Le vrai travail d'un moteur d'alertes consiste à séparer les mouvements mécaniques des signaux qui disent quelque chose de l'offre, du SEO ou de la conversion.",
      },
      {
        type: "heading",
        text: "Ce qu'une bonne alerte doit filtrer avant de notifier",
      },
      {
        type: "list",
        items: [
          "Les simples changements d'ordre quand le contenu reste identique.",
          "Les répétitions quasi identiques entre deux scans rapprochés.",
          "Les modifications trop faibles pour justifier une décision humaine.",
          "Les signaux techniques instables qui ne changent rien à la lecture concurrente.",
        ],
      },
      {
        type: "quote",
        text: "Une bonne alerte n'est pas celle qui détecte tout. C'est celle qui mérite encore d'être ouverte au bout de la cinquantième notification.",
      },
      {
        type: "heading",
        text: "Comment reconnaître un vrai signal utile",
      },
      {
        type: "paragraph",
        text: "Un vrai signal modifie la manière dont le concurrent se présente ou pousse son offre. Un title plus précis, un CTA plus agressif, un plan davantage mis en avant ou une nouvelle promesse visible dès le hero sont des changements qui peuvent justifier une lecture. Ils racontent une intention.",
      },
      {
        type: "list",
        items: [
          "Le message principal change vraiment.",
          "Le niveau de friction conversion baisse ou monte clairement.",
          "La hiérarchie pricing devient plus agressive ou plus rassurante.",
          "La page cible un nouveau besoin ou un nouveau segment.",
        ],
      },
      {
        type: "paragraph",
        text: "Autrement dit, une alerte utile reformule une évolution, pas un simple diff. C'est pour ça que la restitution compte autant que la détection. Si l'outil affiche juste 'bloc modifié', il n'aide pas. S'il dit que le concurrent pousse désormais un essai gratuit ou un angle SEO plus précis, il donne déjà une lecture.",
      },
      {
        type: "heading",
        text: "La bonne méthode pour réduire les faux positifs dans le temps",
      },
      {
        type: "list",
        items: [
          "Limiter d'abord la surveillance aux pages qui portent de vrais enjeux.",
          "Observer quels types d'alertes sont ouverts, ignorés ou relus.",
          "Regrouper les signaux proches en une seule alerte lisible.",
          "Durcir progressivement le filtre sur les changements faibles et répétitifs.",
        ],
      },
      {
        type: "callout",
        title: "Point de méthode",
        text: "Une veille concurrentielle fiable ne se juge pas au nombre d'alertes envoyées, mais au nombre d'alertes que l'équipe considère encore comme utiles après plusieurs semaines.",
      },
      {
        type: "internal-links",
        title: "À lire aussi",
        links: [
          {
            href: "/blog/surveiller-un-site-concurrent-sans-bruit",
            label: "Surveiller un site concurrent sans se noyer dans le bruit",
            description: "Le guide de base pour cadrer une veille concurrentielle utile.",
          },
          {
            href: "/blog/comment-lire-un-changement-seo-chez-un-concurrent",
            label: "Comment lire un changement SEO chez un concurrent",
            description: "Pour relier les alertes aux vrais mouvements de positionnement.",
          },
          {
            href: "/tarifs",
            label: "Voir les plans ChronoCrawl",
            description: "Comparer Starter, Pro et Agency selon ton rythme de veille.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "ChronoCrawl doit gagner là-dessus. Pas en promettant de détecter tout, mais en aidant à voir ce qui mérite réellement une lecture. C'est exactement ce qui transforme une alerte changement site web en outil de veille concurrentielle crédible, au lieu d'un simple flux de notifications techniques.",
      },
    ],
  },
  {
    slug: "comment-surveiller-la-page-tarifs-d-un-concurrent",
    title: "Comment surveiller la page tarifs d’un concurrent",
    excerpt:
      "Surveiller une page tarifs concurrente ne consiste pas à relever un prix. Il faut suivre la mise en avant des plans, les preuves de valeur et la pression commerciale.",
    category: "guide",
    publishedAt: "2026-03-17",
    readTime: "5 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Méthode simple pour suivre une page tarifs sans se perdre dans les détails.",
    metric: "Pricing, plans, preuves de valeur",
    coverKicker: "Surveillance pricing",
    content: [
      {
        type: "paragraph",
        text: "Quand une équipe dit qu'elle veut surveiller la page tarifs d'un concurrent, elle pense souvent au prix affiché. En pratique, ce n'est presque jamais le seul élément important. Une page tarifs peut devenir beaucoup plus agressive sans changer le chiffre principal. Elle peut pousser un plan différemment, ajouter des preuves de valeur ou réduire la friction autour de l'essai.",
      },
      {
        type: "paragraph",
        text: "C'est pour ça qu'une bonne surveillance pricing commence par une question plus utile : qu'est-ce que cette page essaie désormais de faire faire au visiteur ? Si la réponse change, la page a bougé de manière intéressante, même si les tarifs eux-mêmes n'ont presque pas changé.",
      },
      {
        type: "heading",
        text: "Commencer par les bons éléments à suivre",
      },
      {
        type: "list",
        items: [
          "Le plan mis en avant ou marqué comme recommandé.",
          "L'ordre des plans dans la grille tarifs.",
          "La présence d'un essai, d'une remise ou d'une garantie.",
          "Les preuves de valeur affichées autour du pricing.",
        ],
      },
      {
        type: "paragraph",
        text: "Cette base suffit déjà à éviter une erreur fréquente : surveiller toute la page comme un bloc unique. Une page tarifs est un espace commercial dense. Si l'on ne distingue pas les signaux utiles, on finit avec des alertes trop vagues pour être réellement exploitables.",
      },
      {
        type: "heading",
        text: "Ce qui mérite vraiment une alerte",
      },
      {
        type: "list",
        items: [
          "Un plan devient soudainement central dans la page.",
          "Une montée en gamme est rendue plus désirable.",
          "Le concurrent réduit la friction avec un essai ou une promesse rassurante.",
          "Une nouvelle logique d'offre apparaît dans les libellés, bénéfices ou CTA.",
        ],
      },
      {
        type: "quote",
        text: "Sur une page tarifs, un changement de hiérarchie vaut souvent autant qu'un changement de prix.",
      },
      {
        type: "paragraph",
        text: "Ce point est clé. Beaucoup de mouvements intéressants passent par la mise en scène commerciale. Un concurrent peut décider de pousser sa version Pro, de rendre son offre de départ plus rassurante ou de déplacer son CTA pour faire monter le taux de conversion sans toucher au tarif facial.",
      },
      {
        type: "heading",
        text: "Comment lire les changements dans le temps",
      },
      {
        type: "paragraph",
        text: "Une page tarifs ne s'analyse pas une seule fois. Elle s'observe dans la continuité. Si le même plan est mis en avant plusieurs semaines de suite, si les preuves de valeur se renforcent ou si le discours autour du prix devient plus net, tu commences à voir un mouvement d'offre, pas juste un test isolé.",
      },
      {
        type: "list",
        items: [
          "Regarder si le même plan remonte régulièrement.",
          "Vérifier si la pression commerciale s'intensifie au fil des semaines.",
          "Comparer les changements de pricing avec les changements de CTA.",
          "Lire ensemble l'offre, la preuve et le niveau de friction.",
        ],
      },
      {
        type: "callout",
        title: "Méthode simple",
        text: "Le bon objectif n'est pas de suivre tous les pixels d'une page tarifs. C'est d'identifier les changements qui peuvent révéler une nouvelle stratégie de packaging, de conversion ou de montée en gamme.",
      },
      {
        type: "internal-links",
        title: "Articles complémentaires",
        links: [
          {
            href: "/blog/pricing-que-surveiller-sur-une-page-tarifs",
            label: "Pricing : quoi surveiller vraiment sur une page tarifs concurrente",
            description: "Lire les signaux pricing les plus importants au-delà du simple prix.",
          },
          {
            href: "/blog/alternative-a-changetower-en-francais",
            label: "Alternative à ChangeTower en français",
            description: "Comparer les outils sur la qualité du signal et la lisibilité.",
          },
          {
            href: "/tarifs",
            label: "Voir les plans ChronoCrawl",
            description: "Choisir le bon plan selon le volume d’URLs et la fréquence de scan.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "ChronoCrawl doit servir exactement à ça : t'aider à voir quand une page tarifs concurrente devient plus agressive, plus rassurante ou plus claire. C'est ce niveau de lecture qui rend la surveillance pricing utile pour un fondateur, une équipe growth ou une équipe marketing, au lieu d'en faire un simple archivage de captures.",
      },
    ],
  },
  {
    slug: "surveiller-un-site-concurrent-sans-bruit",
    title: "Surveiller un site concurrent sans se noyer dans le bruit",
    excerpt:
      "La veille concurrentielle devient utile seulement quand les alertes remontent les vrais changements : offre, SEO, CTA et signaux business.",
    category: "guide",
    publishedAt: "2026-03-04",
    readTime: "5 min",
    author: "Équipe ChronoCrawl",
    featured: true,
    spotlight: "Méthode concrète pour capter les vrais changements.",
    metric: "SEO, CTA, pricing",
    coverKicker: "Surveillance utile",
    content: [
      {
        type: "paragraph",
        text: "La plupart des outils de veille remontent trop de micro-variations. En pratique, une équipe ne veut pas recevoir dix alertes sur des rotations de blocs ou des changements d'ordre. Elle veut savoir quand un concurrent modifie son title SEO, pousse un nouveau CTA ou ajuste son pricing.",
      },
      {
        type: "paragraph",
        text: "Le problème n'est pas la collecte. Le problème est la restitution. Un outil peut crawler une page toutes les heures, mais s'il remonte surtout des détails inutiles, la veille devient vite ignorée. C'est pour ça qu'une bonne surveillance commence par une question simple : qu'est-ce qui mérite réellement une réaction chez nous ?",
      },
      {
        type: "heading",
        text: "Commencer par les pages qui comptent vraiment",
      },
      {
        type: "list",
        items: [
          "Page d'accueil pour détecter un repositionnement global.",
          "Page pricing pour voir les ajustements d'offre.",
          "Landing pages SEO qui portent le trafic acquisition.",
          "Pages produit où les CTA et l'argumentaire peuvent bouger vite.",
        ],
      },
      {
        type: "paragraph",
        text: "Réduire le périmètre au début améliore directement la qualité perçue. Une veille concurrentielle utile commence par peu d'URLs, mais bien choisies.",
      },
      {
        type: "paragraph",
        text: "Dans la pratique, les meilleures premières URLs sont presque toujours les mêmes : la page d'accueil, la page tarifs, une ou deux landing pages d'acquisition et une page produit importante. Ce sont les endroits où l'on voit le plus vite un changement de positionnement, de message ou d'offre.",
      },
      {
        type: "heading",
        text: "Ce qu'une bonne alerte doit vraiment dire",
      },
      {
        type: "quote",
        text: "Un bon signal concurrent doit t'aider à décider, pas seulement à constater qu'une page a bougé.",
      },
      {
        type: "paragraph",
        text: "Une alerte faible ressemble à : 'un bloc a été mis à jour'. Une alerte utile ressemble à : 'le concurrent met davantage en avant sa version Pro' ou 'le title SEO cible maintenant un autre besoin'. La différence est énorme. La première crée du bruit. La seconde crée de la lecture stratégique.",
      },
      {
        type: "heading",
        text: "Filtrer le bruit avant qu'il n'arrive dans le centre d'alertes",
      },
      {
        type: "list",
        items: [
          "Ignorer les changements d'ordre simples dans des listes ou carrousels.",
          "Ne pas remonter les compteurs, timestamps et variations techniques mineures.",
          "Regrouper plusieurs signaux proches en une seule alerte lisible.",
          "Réduire les répétitions quasi identiques entre deux scans rapprochés.",
        ],
      },
      {
        type: "paragraph",
        text: "Si l'on ne fait pas ce travail d'anti-bruit, l'utilisateur se fatigue très vite. Un centre d'alertes propre n'est pas un luxe visuel. C'est une condition de confiance. L'équipe doit sentir que si une alerte remonte, c'est qu'elle mérite au moins trente secondes de lecture.",
      },
      {
        type: "heading",
        text: "Ce qu'il faut observer ensuite dans le temps",
      },
      {
        type: "paragraph",
        text: "Une veille utile ne se juge pas seulement à la première alerte. Elle se juge à la répétition des bons signaux. Si un concurrent modifie plusieurs fois ses CTA sur une même page ou fait évoluer progressivement sa page tarifs, la valeur vient de la continuité. On doit voir un mouvement, pas seulement un instantané.",
      },
      {
        type: "callout",
        title: "Lecture simple",
        text: "ChronoCrawl doit rester focalisé sur les changements qui peuvent influencer ton acquisition, ta conversion ou ta perception marché.",
      },
      {
        type: "internal-links",
        title: "Continuer la lecture",
        links: [
          {
            href: "/blog/alerte-changement-site-web-comment-eviter-les-faux-positifs",
            label: "Alerte changement site web : comment éviter les faux positifs",
            description: "Comprendre pourquoi le bruit tue la valeur d’une veille concurrentielle.",
          },
          {
            href: "/blog/audit-seo-concurrent-ce-qu-il-faut-vraiment-lire",
            label: "Audit SEO concurrent : ce qu'il faut vraiment lire dans une page",
            description: "Compléter la surveillance par une lecture plus structurée des pages clés.",
          },
          {
            href: "/fonctionnement",
            label: "Voir comment fonctionne ChronoCrawl",
            description: "Comprendre la logique du produit entre surveillance, alertes et audit SEO.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "En clair : surveiller un site concurrent sans se noyer dans le bruit consiste à réduire le périmètre, filtrer les faux positifs, reformuler les changements en langage utile et montrer un historique assez propre pour qu'une équipe revienne dessus régulièrement. C'est exactement ce qui transforme une simple surveillance technique en veille concurrentielle actionnable.",
      },
    ],
  },
  {
    slug: "comment-lire-un-changement-seo-chez-un-concurrent",
    title: "Comment lire un changement SEO chez un concurrent",
    excerpt:
      "Un changement de title, de meta description ou de H1 n'a pas la même signification. Il faut savoir lire ce que le concurrent essaie de pousser.",
    category: "stratégie",
    publishedAt: "2026-02-27",
    readTime: "4 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Lire l'intention derrière le signal SEO.",
    metric: "Title, meta, H1",
    coverKicker: "Lecture SEO",
    content: [
      {
        type: "paragraph",
        text: "Quand un concurrent modifie son title SEO, il ne cherche pas seulement à changer une balise. Il peut essayer de se repositionner sur un mot-clé, de clarifier une offre ou d'améliorer son taux de clic dans les résultats Google.",
      },
      {
        type: "paragraph",
        text: "La même logique vaut pour la meta description et le H1. Ces éléments sont visibles à des endroits différents, mais ils participent à une seule chose : le cadrage du message. Quand plusieurs de ces signaux bougent sur une courte période, il faut lire l'ensemble comme une tentative de réorientation, pas comme trois changements isolés.",
      },
      { type: "heading", text: "Trois niveaux de lecture" },
      {
        type: "list",
        items: [
          "Positionnement : le concurrent cible-t-il un nouveau terme ?",
          "Conversion : le message devient-il plus commercial ?",
          "Priorité business : la nouvelle promesse met-elle l'accent sur un usage précis ?",
        ],
      },
      {
        type: "paragraph",
        text: "Une bonne veille SEO ne s'arrête pas à 'balise modifiée'. Elle reformule le mouvement pour comprendre ce que le concurrent veut gagner.",
      },
      {
        type: "heading",
        text: "Title, meta et H1 ne racontent pas la même chose",
      },
      {
        type: "list",
        items: [
          "Le title révèle souvent la cible la plus directe dans Google.",
          "La meta description sert davantage à améliorer le clic et la perception du résultat.",
          "Le H1 montre ce que la page veut affirmer une fois l'utilisateur arrivé dessus.",
        ],
      },
      {
        type: "paragraph",
        text: "Si le title devient plus orienté mot-clé mais que le H1 reste très produit, le concurrent cherche peut-être à capter plus de trafic sans changer son angle de conversion. Si title, meta et H1 se réalignent tous ensemble, c'est souvent un repositionnement plus net.",
      },
      {
        type: "heading",
        text: "Les signaux qui montrent un changement vraiment important",
      },
      {
        type: "list",
        items: [
          "Ajout d'un mot-clé métier ou d'un cas d'usage qui n'était pas présent avant.",
          "Passage d'un message générique à une promesse beaucoup plus précise.",
          "Alignement entre title, meta et H1 autour d'une nouvelle priorité.",
          "Disparition d'un bénéfice ancien au profit d'une nouvelle mise en avant.",
        ],
      },
      {
        type: "quote",
        text: "La vraie question n'est pas 'qu'est-ce qui a changé ?' mais 'qu'est-ce que le concurrent essaie de faire croire ou d'obtenir avec ce nouveau cadrage ?'",
      },
      {
        type: "paragraph",
        text: "Cette lecture devient particulièrement utile quand elle est répétée sur plusieurs pages. Si le même vocabulaire remonte partout, tu n'es plus face à une micro-optimisation SEO. Tu es face à une direction produit ou acquisition qui se met en place.",
      },
      {
        type: "internal-links",
        title: "Pour approfondir",
        links: [
          {
            href: "/blog/audit-seo-concurrent-ce-qu-il-faut-vraiment-lire",
            label: "Audit SEO concurrent : ce qu'il faut vraiment lire dans une page",
            description: "Passer du signal SEO isolé à une lecture plus globale de la page.",
          },
          {
            href: "/blog/surveiller-un-site-concurrent-sans-bruit",
            label: "Surveiller un site concurrent sans se noyer dans le bruit",
            description: "Voir comment replacer un changement SEO dans une veille plus large.",
          },
          {
            href: "/blog/alerte-changement-site-web-comment-eviter-les-faux-positifs",
            label: "Alerte changement site web : comment éviter les faux positifs",
            description: "Filtrer les signaux faibles avant qu’ils ne fatiguent l’équipe.",
          },
        ],
      },
    ],
  },
  {
    slug: "cta-principal-ce-que-cache-un-changement-de-message",
    title: "CTA principal : ce que cache souvent un changement de message",
    excerpt:
      "Quand un concurrent remplace 'Demander une démo' par 'Commencer maintenant', il ne change pas seulement un bouton. Il change la friction de conversion.",
    category: "fonctionnalité",
    publishedAt: "2026-02-18",
    readTime: "4 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Lire la pression conversion derrière un CTA.",
    metric: "CTA, friction, intention",
    coverKicker: "Signal conversion",
    content: [
      {
        type: "paragraph",
        text: "Les CTA sont l'un des signaux les plus sous-estimés en veille concurrentielle. Un bouton plus agressif, plus direct ou plus rassurant révèle souvent une évolution dans la stratégie d'acquisition ou dans la maturité de l'offre.",
      },
      {
        type: "paragraph",
        text: "Beaucoup d'équipes regardent surtout les prix et le SEO. Pourtant, un changement de CTA dit souvent quelque chose de très concret sur la manière dont un concurrent veut faire avancer ses visiteurs. C'est un signal de friction, de confiance et parfois de pipeline commercial.",
      },
      { type: "heading", text: "Ce qu'il faut regarder" },
      {
        type: "list",
        items: [
          "Le verbe utilisé : voir, tester, réserver, commencer.",
          "Le niveau d'engagement demandé.",
          "Le contexte du bouton : hero, pricing, section produit.",
        ],
      },
      {
        type: "callout",
        title: "Point utile",
        text: "Une bonne alerte CTA doit t'aider à comprendre si le concurrent essaie de vendre plus vite, de rassurer davantage ou de réduire l'effort demandé à l'utilisateur.",
      },
      {
        type: "heading",
        text: "Les bascules de message les plus révélatrices",
      },
      {
        type: "list",
        items: [
          "De 'Demander une démo' à 'Commencer gratuitement' : baisse nette de friction.",
          "De 'Essayer' à 'Réserver un appel' : remontée de qualification commerciale.",
          "De 'Voir les tarifs' à 'Parler à l'équipe' : reprise en main du parcours par le sales.",
          "Ajout d'un CTA secondaire rassurant pour les visiteurs non prêts à convertir.",
        ],
      },
      {
        type: "paragraph",
        text: "Le contexte compte autant que le texte. Un bouton inchangé mais déplacé plus haut dans la page ou répété davantage peut déjà montrer une volonté de pousser plus fort la conversion. Inversement, un CTA plus discret peut traduire une stratégie plus éducative ou un funnel plus long.",
      },
      {
        type: "heading",
        text: "Pourquoi ce signal est si utile en veille",
      },
      {
        type: "paragraph",
        text: "Parce qu'il se situe à l'endroit exact où l'on transforme une promesse en action. Les CTA ne sont pas décoratifs. Ils sont l'une des expressions les plus visibles du niveau d'agressivité commerciale d'une page. C'est pour ça que ChronoCrawl doit les remonter proprement, sans noyer l'utilisateur dans des micro-variations inutiles.",
      },
      {
        type: "quote",
        text: "Un CTA change rarement pour faire joli. Il change pour faire bouger un taux de conversion, une qualification ou une perception de risque.",
      },
      {
        type: "internal-links",
        title: "Liens utiles",
        links: [
          {
            href: "/blog/surveiller-un-site-concurrent-sans-bruit",
            label: "Surveiller un site concurrent sans se noyer dans le bruit",
            description: "Replacer le signal CTA dans une veille concurrentielle plus large.",
          },
          {
            href: "/blog/comment-surveiller-la-page-tarifs-d-un-concurrent",
            label: "Comment surveiller la page tarifs d’un concurrent",
            description: "Comprendre comment le CTA et le pricing se répondent sur une même page.",
          },
          {
            href: "/fonctionnement",
            label: "Voir le fonctionnement de ChronoCrawl",
            description: "Comprendre comment les changements CTA remontent dans le produit.",
          },
        ],
      },
    ],
  },
  {
    slug: "pricing-que-surveiller-sur-une-page-tarifs",
    title: "Pricing : quoi surveiller vraiment sur une page tarifs concurrente",
    excerpt:
      "Le plus important n'est pas seulement le prix affiché. Il faut suivre l'ordre des plans, les preuves de valeur et la pression commerciale autour du pricing.",
    category: "comparatif",
    publishedAt: "2026-02-09",
    readTime: "5 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Lire l'offre, pas seulement le chiffre.",
    metric: "Offre, plans, pression commerciale",
    coverKicker: "Veille pricing",
    content: [
      {
        type: "paragraph",
        text: "Un concurrent peut garder exactement le même prix tout en rendant son offre beaucoup plus agressive. La hiérarchie des plans, la mise en avant du plan recommandé ou l'ajout d'une garantie peuvent avoir autant d'impact qu'une baisse tarifaire brute.",
      },
      {
        type: "paragraph",
        text: "C'est pour ça qu'une bonne veille pricing ne consiste pas à recopier un tableau. Elle doit lire la mise en scène commerciale : quel plan est poussé, quel bénéfice est répété, quelle objection est traitée et à quel endroit la page essaie d'accélérer la décision.",
      },
      { type: "heading", text: "Ce qui mérite une alerte" },
      {
        type: "list",
        items: [
          "Changement de plan mis en avant.",
          "Ajout ou retrait de preuves de valeur.",
          "Réorganisation des plans pour pousser une montée en gamme.",
          "Ajout d'une remise, période d'essai ou CTA plus agressif.",
        ],
      },
      {
        type: "paragraph",
        text: "C'est cette lecture qui permet de réagir intelligemment, pas un simple tableau de prix screenshoté chaque jour.",
      },
      {
        type: "heading",
        text: "Ce que l'ordre des plans raconte",
      },
      {
        type: "paragraph",
        text: "Quand un plan devient 'recommandé', qu'il change de place ou qu'il reçoit plus d'arguments que les autres, ce n'est presque jamais neutre. Le concurrent peut vouloir augmenter son panier moyen, simplifier la décision ou réorienter son acquisition vers un segment plus rentable.",
      },
      {
        type: "list",
        items: [
          "Le plan du milieu est souvent poussé pour maximiser la conversion.",
          "Un plan d'entrée mis davantage en avant peut indiquer une stratégie volume.",
          "Une nouvelle colonne 'Enterprise' plus visible peut trahir une montée en gamme.",
          "Un bloc 'sur mesure' plus présent peut signaler un recentrage sales.",
        ],
      },
      {
        type: "heading",
        text: "Les preuves de valeur à surveiller autour du prix",
      },
      {
        type: "list",
        items: [
          "Ajout de badges de confiance ou de logos clients.",
          "Mise en avant plus forte de l'essai gratuit ou de l'absence de CB.",
          "Ajout de comparatifs de fonctionnalités entre plans.",
          "Garanties, remboursements, onboarding inclus ou support prioritaire.",
        ],
      },
      {
        type: "paragraph",
        text: "Ce sont souvent ces éléments qui expliquent pourquoi une page tarifs devient plus performante sans changer ses prix. Le pricing est autant un dispositif de lecture qu'un chiffre affiché.",
      },
      {
        type: "quote",
        text: "Une page tarifs forte ne vend pas seulement un prix. Elle rend la décision plus facile que chez les autres.",
      },
      {
        type: "paragraph",
        text: "Dans ChronoCrawl, l'objectif n'est donc pas d'empiler des snapshots. Il est d'aider à voir quand la page tarifs d'un concurrent devient plus claire, plus agressive ou plus rassurante. C'est ce type de lecture qui peut justifier une réaction sur ton propre pricing ou ton propre packaging.",
      },
      {
        type: "internal-links",
        title: "À consulter ensuite",
        links: [
          {
            href: "/blog/comment-surveiller-la-page-tarifs-d-un-concurrent",
            label: "Comment surveiller la page tarifs d’un concurrent",
            description: "Voir la méthode de surveillance continue d’une page pricing.",
          },
          {
            href: "/blog/alternative-a-changetower-en-francais",
            label: "Alternative à ChangeTower en français",
            description: "Comparer les approches de monitoring et de lecture du signal.",
          },
          {
            href: "/tarifs",
            label: "Voir les plans ChronoCrawl",
            description: "Choisir le bon plan pour suivre des pages pricing dans le temps.",
          },
        ],
      },
    ],
  },
  {
    slug: "alternative-a-changetower-en-francais",
    title: "Alternative à ChangeTower en français",
    excerpt:
      "Si tu cherches une alternative à ChangeTower en français, la vraie question n'est pas seulement le monitoring. C'est la qualité de lecture des changements et la clarté du produit.",
    category: "comparatif",
    publishedAt: "2026-03-15",
    readTime: "5 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Comparer les outils sur la qualité du signal, pas seulement sur la détection.",
    metric: "Monitoring, alertes, lisibilité",
    coverKicker: "Comparatif outil",
    content: [
      {
        type: "paragraph",
        text: "ChangeTower reste une référence logique quand on parle de surveillance de changements sur des pages web. L'outil a un positionnement clair et une vraie légitimité sur le monitoring. Mais pour une équipe française ou francophone, la question pratique devient vite plus précise : existe-t-il une alternative plus simple, plus lisible et plus orientée veille concurrentielle ?",
      },
      {
        type: "paragraph",
        text: "Comparer des outils de monitoring uniquement sur leur capacité à détecter un diff n'a pas beaucoup d'intérêt. Aujourd'hui, beaucoup de produits savent détecter des changements. La vraie différence se fait sur ce que l'utilisateur comprend ensuite : est-ce un changement important, un ajustement mineur ou du bruit ?",
      },
      {
        type: "heading",
        text: "Ce qu'il faut vraiment comparer",
      },
      {
        type: "list",
        items: [
          "La capacité à filtrer les faux positifs.",
          "La lisibilité du centre d'alertes au quotidien.",
          "La qualité de formulation des changements remontés.",
          "La cohérence entre surveillance, historique et audit SEO.",
        ],
      },
      {
        type: "paragraph",
        text: "C'est là que ChronoCrawl veut se différencier. Pas en promettant une suite infinie. Mais en restant très focalisé sur la veille concurrentielle actionnable : SEO, CTA, pricing, changements utiles et lecture simple dans un environnement francophone.",
      },
      {
        type: "heading",
        text: "Quand ChangeTower reste fort",
      },
      {
        type: "list",
        items: [
          "Pour une logique pure de change monitoring.",
          "Pour une culture produit déjà habituée à ce type d'outil.",
          "Pour des usages où la granularité technique prime sur la lecture métier.",
        ],
      },
      {
        type: "paragraph",
        text: "Il ne faut pas caricaturer. ChangeTower n'est pas un mauvais point de comparaison. Au contraire, c'est une bonne référence pour juger ce qu'un produit de surveillance doit réussir. Mais cela permet aussi de clarifier ce que ChronoCrawl doit faire mieux pour exister : moins de bruit, plus de restitution, et une expérience plus directe pour une équipe qui veut vite comprendre ce qui bouge.",
      },
      {
        type: "heading",
        text: "Là où une alternative française peut être plus crédible",
      },
      {
        type: "list",
        items: [
          "Une interface pensée directement pour un usage francophone.",
          "Des alertes reformulées en langage utile, pas seulement technique.",
          "Un pont naturel entre surveillance et audit SEO concurrent.",
          "Une lecture orientée business pour les pages tarifs, CTA et landings.",
        ],
      },
      {
        type: "quote",
        text: "Une alternative utile à ChangeTower ne gagne pas en ajoutant des couches. Elle gagne en réduisant le bruit et en améliorant la lecture du signal.",
      },
      {
        type: "paragraph",
        text: "Pour beaucoup d'équipes, le vrai besoin n'est pas de surveiller tout le web. Il est de suivre un petit nombre de pages concurrentes importantes et de savoir si les changements détectés justifient une réaction. Si l'outil répond bien à cette question, il devient crédible. Sinon, il devient un flux de notifications de plus.",
      },
      {
        type: "callout",
        title: "Lecture d'équipe",
        text: "ChronoCrawl n'a pas besoin d'être une copie de ChangeTower. Il doit être plus lisible, plus ciblé et plus actionnable pour la veille concurrentielle d'équipes francophones.",
      },
      {
        type: "internal-links",
        title: "Continuer la comparaison",
        links: [
          {
            href: "/blog/alerte-changement-site-web-comment-eviter-les-faux-positifs",
            label: "Alerte changement site web : comment éviter les faux positifs",
            description: "Le bon angle pour comparer les outils sur la qualité réelle des alertes.",
          },
          {
            href: "/blog/surveiller-un-site-concurrent-sans-bruit",
            label: "Surveiller un site concurrent sans se noyer dans le bruit",
            description: "Voir la promesse produit la plus centrale de ChronoCrawl.",
          },
          {
            href: "/tarifs",
            label: "Voir les tarifs ChronoCrawl",
            description: "Comparer les plans si tu cherches une alternative française.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Si tu cherches une alternative à ChangeTower en français, le bon critère de choix n'est donc pas seulement le nombre de détections possibles. C'est la capacité du produit à t'aider à comprendre, relire et exploiter les changements qui comptent. C'est exactement la zone où ChronoCrawl a le plus de légitimité à se construire.",
      },
    ],
  },
  {
    slug: "audit-seo-concurrent-ce-qu-il-faut-vraiment-lire",
    title: "Audit SEO concurrent : ce qu'il faut vraiment lire dans une page",
    excerpt:
      "Un audit concurrent utile ne doit pas parler comme si la page auditée était la tienne. Il doit observer, cadrer et reformuler les signaux visibles.",
    category: "guide",
    publishedAt: "2026-01-29",
    readTime: "4 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Transformer une checklist en lecture concurrente.",
    metric: "Observation structurée",
    coverKicker: "Audit concurrent",
    content: [
      {
        type: "paragraph",
        text: "Un audit SEO concurrent n'est pas là pour corriger le site observé. Il sert à comprendre comment ce concurrent présente son offre, emballe sa page pour la recherche et structure son message.",
      },
      {
        type: "paragraph",
        text: "La différence est importante. Si l'outil adopte un ton de consultant qui donne des ordres au concurrent, la lecture devient artificielle. Un audit concurrent crédible doit rester en posture d'observation : qu'est-ce que la page met en avant, comment elle cadre son sujet et quels signaux visibles peuvent être utiles pour notre veille.",
      },
      { type: "heading", text: "Les quatre lectures utiles" },
      {
        type: "list",
        items: [
          "Angle SEO visible : que met la page en avant ?",
          "Pression conversion : la page pousse-t-elle une action directe ?",
          "Lisibilité de l'offre : le pricing ou la promesse sont-ils visibles ?",
          "Habillage recherche : title, meta, H1 et données sociales sont-ils cohérents ?",
        ],
      },
      {
        type: "quote",
        text: "Un audit concurrent crédible reformule ce que la page essaie de faire, au lieu de réciter une checklist technique.",
      },
      {
        type: "heading",
        text: "Ce que l'utilisateur doit pouvoir comprendre en moins d'une minute",
      },
      {
        type: "list",
        items: [
          "Quel angle la page cherche à imposer dans Google et dans la lecture humaine.",
          "Si la page pousse surtout l'information, la preuve de valeur ou la conversion.",
          "Si le pricing ou l'offre sont visibles assez tôt dans l'expérience.",
          "Si les signaux techniques visibles soutiennent bien le message principal.",
        ],
      },
      {
        type: "paragraph",
        text: "C'est exactement pour cette raison que la restitution de l'audit doit rester simple, hiérarchisée et centrée sur des formulations compréhensibles. Un client paie pour comprendre plus vite, pas pour lire vingt lignes de jargon SEO.",
      },
      {
        type: "heading",
        text: "Les limites qu'il faut assumer proprement",
      },
      {
        type: "paragraph",
        text: "Un audit page par page reste une observation du HTML et des signaux visibles. Il ne donne pas la vérité absolue sur les performances SEO d'un concurrent. En revanche, il peut très bien montrer comment la page est emballée, ce qu'elle essaie de raconter et à quel niveau de sérieux elle se situe sur les fondamentaux visibles.",
      },
      {
        type: "callout",
        title: "Position juste",
        text: "L'audit concurrent n'est pas là pour promettre l'impossible. Il doit être suffisamment solide pour être utile, tout en restant clair sur ce qu'il mesure réellement.",
      },
      {
        type: "internal-links",
        title: "Compléter cette lecture",
        links: [
          {
            href: "/blog/comment-lire-un-changement-seo-chez-un-concurrent",
            label: "Comment lire un changement SEO chez un concurrent",
            description: "Voir comment interpréter les balises et le message SEO dans le temps.",
          },
          {
            href: "/blog/surveiller-un-site-concurrent-sans-bruit",
            label: "Surveiller un site concurrent sans se noyer dans le bruit",
            description: "Replacer l’audit dans une veille concurrentielle continue.",
          },
          {
            href: "/fonctionnement",
            label: "Voir le fonctionnement de ChronoCrawl",
            description: "Comprendre comment l’audit SEO s’intègre au produit.",
          },
        ],
      },
    ],
  },
  {
    slug: "chronocrawl-vers-une-veille-concurrentielle-plus-actionnable",
    title: "ChronoCrawl : vers une veille concurrentielle plus actionnable",
    excerpt:
      "Le produit avance vers une surveillance plus utile : moins de bruit, meilleurs regroupements et alertes plus lisibles pour les équipes françaises.",
    category: "actualité",
    publishedAt: "2026-01-22",
    readTime: "3 min",
    author: "Équipe ChronoCrawl",
    spotlight: "Point produit sur la trajectoire ChronoCrawl.",
    metric: "Produit, alertes, clarté",
    coverKicker: "ChronoCrawl",
    content: [
      {
        type: "paragraph",
        text: "ChronoCrawl se concentre sur un cœur produit clair : surveiller des pages concurrentes, remonter les changements SEO, CTA et pricing, puis rendre ces signaux lisibles dans un centre d'alertes simple.",
      },
      {
        type: "paragraph",
        text: "Cette trajectoire est volontaire. Il est plus utile d'avoir un produit étroit mais crédible qu'une suite trop large qui promet tout sans être fiable sur le cœur. Le parti pris ChronoCrawl reste la veille concurrentielle actionnable pour les équipes francophones.",
      },
      { type: "heading", text: "La direction retenue" },
      {
        type: "list",
        items: [
          "Moins de bruit sur les pages dynamiques.",
          "Alertes groupées plus utiles.",
          "Audit SEO concurrent plus sérieux dans sa restitution.",
          "Expérience produit francophone plus lisible.",
        ],
      },
      {
        type: "callout",
        title: "Trajectoire",
        text: "L'objectif n'est pas d'empiler des gadgets. Il est de rendre la veille concurrentielle plus exploitable pour une équipe qui veut agir vite.",
      },
      {
        type: "heading",
        text: "Pourquoi cette direction compte",
      },
      {
        type: "paragraph",
        text: "Beaucoup d'outils arrivent vite à produire des alertes. Très peu arrivent à produire des alertes qu'une équipe prend encore au sérieux après plusieurs semaines. C'est là que se joue la valeur du produit : sur la qualité du signal, la lisibilité de la restitution et la cohérence entre surveillance, historique et audit.",
      },
      {
        type: "list",
        items: [
          "Un dashboard qui ne déborde pas l'utilisateur.",
          "Des alertes qui restent compréhensibles au premier coup d'œil.",
          "Un historique qui permet de relire les mouvements dans le temps.",
          "Un audit SEO concurrent qui complète la surveillance au lieu de la brouiller.",
        ],
      },
      {
        type: "paragraph",
        text: "La suite logique du produit n'est donc pas d'ajouter dix modules. C'est de continuer à renforcer le moteur, la qualité des résumés et la pertinence de ce qui est montré à l'utilisateur. C'est ce qui rendra ChronoCrawl plus bankable et plus défendable face aux acteurs déjà en place.",
      },
      {
        type: "internal-links",
        title: "Voir aussi",
        links: [
          {
            href: "/blog/alerte-changement-site-web-comment-eviter-les-faux-positifs",
            label: "Alerte changement site web : comment éviter les faux positifs",
            description: "Le chantier le plus important pour renforcer la valeur du produit.",
          },
          {
            href: "/blog/alternative-a-changetower-en-francais",
            label: "Alternative à ChangeTower en français",
            description: "La manière dont ChronoCrawl cherche à se positionner face aux acteurs en place.",
          },
          {
            href: "/blog/audit-seo-concurrent-ce-qu-il-faut-vraiment-lire",
            label: "Audit SEO concurrent : ce qu'il faut vraiment lire dans une page",
            description: "L’autre pilier produit à côté de la surveillance.",
          },
        ],
      },
    ],
  },
];

export const featuredPost =
  blogPosts.find((post) => post.featured) ?? blogPosts[0];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(slug: string, category: BlogCategory) {
  return blogPosts
    .filter((post) => post.slug !== slug)
    .sort((left, right) => {
      if (left.category === category && right.category !== category) return -1;
      if (right.category === category && left.category !== category) return 1;
      return (
        new Date(right.publishedAt).getTime() -
        new Date(left.publishedAt).getTime()
      );
    })
    .slice(0, 3);
}
