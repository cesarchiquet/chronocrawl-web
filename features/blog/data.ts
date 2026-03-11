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
  | { type: "callout"; title: string; text: string };

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
