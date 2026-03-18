import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogShell from "@/features/blog/BlogShell";
import {
  blogPosts,
  categoryClasses,
  categoryLabels,
  getBlogPost,
  getRelatedPosts,
} from "@/features/blog/data";

const articleCtaByCategory = {
  guide: {
    title: "Passe du guide à la vraie surveillance",
    text: "Ajoute une première URL concurrente, lance un scan et vois si les changements utiles remontent proprement.",
    primaryHref: "/signup?from=blog&intent=surveillance",
    primaryLabel: "Tester la surveillance",
    secondaryHref: "/dashboard/audit-seo",
    secondaryLabel: "Voir l’audit SEO",
  },
  stratégie: {
    title: "Observe la stratégie au lieu de la deviner",
    text: "Utilise ChronoCrawl pour suivre les changements SEO, CTA et pricing sur les pages qui comptent vraiment.",
    primaryHref: "/signup?from=blog&intent=surveillance",
    primaryLabel: "Créer un compte",
    secondaryHref: "/tarifs?from=blog",
    secondaryLabel: "Voir les plans",
  },
  fonctionnalité: {
    title: "Teste les signaux CTA sur une URL réelle",
    text: "Ajoute une page concurrente et vérifie comment les changements de message remontent dans le centre d’alertes.",
    primaryHref: "/signup?from=blog&intent=audit",
    primaryLabel: "Essayer ChronoCrawl",
    secondaryHref: "/dashboard",
    secondaryLabel: "Voir la surveillance",
  },
  comparatif: {
    title: "Passe de la lecture pricing à la veille continue",
    text: "Surveille une page tarifs concurrente et vois les mouvements d’offre, de plan et de pression commerciale dans le temps.",
    primaryHref: "/tarifs?from=blog",
    primaryLabel: "Voir les tarifs",
    secondaryHref: "/signup?from=blog&intent=pricing",
    secondaryLabel: "Commencer l’essai",
  },
  actualité: {
    title: "Voir le produit en action",
    text: "ChronoCrawl avance sur la qualité de signal. Le plus utile reste encore de le tester sur tes propres concurrents.",
    primaryHref: "/signup?from=blog&intent=surveillance",
    primaryLabel: "Créer un compte",
    secondaryHref: "/",
    secondaryLabel: "Revoir le produit",
  },
} as const;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://chronocrawl.com";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getArticleBody(post: (typeof blogPosts)[number]) {
  return post.content
    .map((block) => {
      if (block.type === "paragraph" || block.type === "quote") return block.text;
      if (block.type === "heading") return block.text;
      if (block.type === "callout") return `${block.title}. ${block.text}`;
      return block.items.join(" ");
    })
    .join("\n\n");
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Article introuvable",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: "ChronoCrawl",
    category: categoryLabels[post.category],
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.slug, post.category);
  const articleCta = articleCtaByCategory[post.category];
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/blog/${post.slug}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ChronoCrawl",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${siteUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: `${siteUrl}/blog/${post.slug}`,
          },
        ],
      },
      {
        "@type": "BlogPosting",
        "@id": `${siteUrl}/blog/${post.slug}#article`,
        headline: post.title,
        description: post.excerpt,
        articleSection: categoryLabels[post.category],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        timeRequired: post.readTime,
        author: {
          "@type": "Organization",
          name: post.author,
        },
        publisher: {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "ChronoCrawl",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/brand-mark.png`,
          },
        },
        mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
        url: `${siteUrl}/blog/${post.slug}`,
        image: `${siteUrl}/brand-mark.png`,
        articleBody: getArticleBody(post),
      },
    ],
  };

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <article className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden>←</span>
            Retour aux articles
          </Link>

          <div className="mt-6 cc-panel-strong rounded-[34px] p-5 sm:p-7 lg:p-10">
            <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07)_0%,_rgba(12,12,12,0.96)_34%,_rgba(0,0,0,1)_100%)] p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[post.category]}`}
                >
                  {categoryLabels[post.category]}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/48">
                  {post.readTime}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/48">
                  {formatDate(post.publishedAt)}
                </span>
              </div>

              <div className="mt-10 max-w-4xl">
                <p className="text-sm uppercase tracking-[0.18em] text-white/42">
                  {post.coverKicker}
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">
                  {post.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-white/62">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.025] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                    Angle de lecture
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">{post.spotlight}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.025] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                    Signaux dominants
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">{post.metric}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_340px]">
            <div className="cc-panel rounded-[32px] p-6 sm:p-8 lg:p-10">
              <div className="prose prose-invert max-w-none">
                {post.content.map((block, index) => {
                  if (block.type === "paragraph") {
                    return (
                      <p key={index} className="text-base leading-8 text-white/68 sm:text-lg">
                        {block.text}
                      </p>
                    );
                  }

                  if (block.type === "heading") {
                    return (
                      <h2
                        key={index}
                        className="mt-10 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl"
                      >
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "list") {
                    return (
                      <ul key={index} className="mt-6 space-y-3 text-base leading-7 text-white/68 sm:text-lg">
                        {block.items.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white/55" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  if (block.type === "quote") {
                    return (
                      <blockquote
                        key={index}
                        className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.025] px-6 py-5 text-xl font-medium tracking-[-0.04em] text-white/88"
                      >
                        {block.text}
                      </blockquote>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.025] p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                        {block.title}
                      </p>
                      <p className="mt-3 text-base leading-7 text-white/68 sm:text-lg">
                        {block.text}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-10 rounded-[28px] border border-white/8 bg-white/[0.025] p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                  Prochaine étape
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {articleCta.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">
                  {articleCta.text}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={articleCta.primaryHref}
                    className="cc-button-primary rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    {articleCta.primaryLabel}
                  </Link>
                  <Link
                    href={articleCta.secondaryHref}
                    className="cc-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    {articleCta.secondaryLabel}
                  </Link>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="cc-panel rounded-[30px] p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                  À retenir
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {articleCta.title}
                </h2>
                <p className="mt-4 text-sm leading-6 text-white/62">
                  {articleCta.text}
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href={articleCta.primaryHref} className="cc-button-primary rounded-full px-5 py-3 text-center text-sm font-semibold">
                    {articleCta.primaryLabel}
                  </Link>
                  <Link href={articleCta.secondaryHref} className="cc-button-secondary rounded-full px-5 py-3 text-center text-sm font-semibold">
                    {articleCta.secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="cc-panel rounded-[30px] p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                  Articles liés
                </p>
                <div className="mt-5 space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}`}
                      className="block rounded-[22px] border border-white/8 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
                    >
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[relatedPost.category]}`}
                      >
                        {categoryLabels[relatedPost.category]}
                      </span>
                      <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                        {relatedPost.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/56">
                        {relatedPost.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </BlogShell>
  );
}
