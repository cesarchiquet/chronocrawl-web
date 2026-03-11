"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  blogCategories,
  blogPosts,
  categoryClasses,
  categoryLabels,
  type BlogCategory,
} from "@/features/blog/data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  publishedAt,
  readTime,
  coverKicker,
  metric,
}: {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  publishedAt: string;
  readTime: string;
  coverKicker: string;
  metric: string;
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="cc-panel-strong cc-hover-lift group flex h-full flex-col rounded-[28px] p-5"
    >
      <div className="rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06)_0%,_rgba(10,10,10,0.98)_32%,_rgba(0,0,0,1)_100%)] p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[category]}`}
          >
            {categoryLabels[category]}
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-white/42">
            {coverKicker}
          </span>
        </div>
        <div className="mt-12 space-y-3">
          <p className="text-sm text-white/48">{metric}</p>
          <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white transition group-hover:text-white/88">
            {title}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-white/62">{excerpt}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm text-white/44">
        <span>{formatDate(publishedAt)}</span>
        <span>{readTime}</span>
      </div>
    </Link>
  );
}

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | BlogCategory>("all");

  const visiblePosts = useMemo(() => {
    return blogPosts.filter((post) => {
      if (selectedCategory === "all") return true;
      return post.category === selectedCategory;
    });
  }, [selectedCategory]);

  const heroPosts = visiblePosts.slice(0, 2);
  const primaryHeroPost = heroPosts[0];
  const secondaryHeroPost = heroPosts[1];
  const heroPostSlugs = new Set(heroPosts.map((post) => post.slug));
  const gridPosts = visiblePosts.filter((post) => !heroPostSlugs.has(post.slug));

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="px-4 py-10 sm:px-6 lg:px-8"
    >
      <section className="cc-panel-strong rounded-[34px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/56">
            Blog ChronoCrawl
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">
            Veille concurrentielle, signaux SEO et lectures produit sans bruit inutile.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
            On reprend les vrais sujets du produit : surveillance d&apos;URLs concurrentes, lecture des changements SEO, pression CTA, pricing et qualité de signal.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {blogCategories.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setSelectedCategory(category.key)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-white/20 bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/72 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {primaryHeroPost ? (
            <Link
              href={`/blog/${primaryHeroPost.slug}`}
              className="cc-panel-strong cc-hover-lift group block overflow-hidden rounded-[32px] p-5 sm:p-6"
            >
              <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07)_0%,_rgba(12,12,12,0.96)_32%,_rgba(0,0,0,1)_100%)] p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[primaryHeroPost.category]}`}
                  >
                    {categoryLabels[primaryHeroPost.category]}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/42">
                    Article mis en avant
                  </span>
                </div>
                <div className="mt-10 max-w-3xl">
                  <p className="text-sm text-white/48">{primaryHeroPost.metric}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-white transition group-hover:text-white/88 sm:text-4xl lg:text-5xl">
                    {primaryHeroPost.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                    {primaryHeroPost.excerpt}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-white/44">
                <span>{formatDate(primaryHeroPost.publishedAt)}</span>
                <span>{primaryHeroPost.readTime}</span>
              </div>
            </Link>
          ) : null}

          {secondaryHeroPost ? (
            <Link
              href={`/blog/${secondaryHeroPost.slug}`}
              className="cc-panel cc-hover-lift group block rounded-[30px] p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[secondaryHeroPost.category]}`}
                >
                  {categoryLabels[secondaryHeroPost.category]}
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/42">
                  Deuxième lecture
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/44">
                <span>{secondaryHeroPost.metric}</span>
                <span>{secondaryHeroPost.readTime}</span>
              </div>
              <h3 className="mt-5 max-w-3xl text-2xl font-semibold tracking-[-0.06em] text-white transition group-hover:text-white/88 sm:text-3xl">
                {secondaryHeroPost.title}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
                {secondaryHeroPost.spotlight}
              </p>
              <div className="mt-5 text-sm text-white/44">
                {formatDate(secondaryHeroPost.publishedAt)}
              </div>
            </Link>
          ) : null}
        </div>

        <div className="cc-panel rounded-[32px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-[-0.05em] text-white">
              Lecture rapide
            </h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/48">
              {visiblePosts.length} article{visiblePosts.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {visiblePosts.slice(0, 4).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-[24px] border border-white/8 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${categoryClasses[post.category]}`}
                  >
                    {categoryLabels[post.category]}
                  </span>
                  <span className="text-xs uppercase tracking-[0.14em] text-white/42">
                    {post.readTime}
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.05em] text-white">
                  {post.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-white/56">{post.spotlight}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {gridPosts.map((post) => (
            <ArticleCard key={post.slug} {...post} />
          ))}
        </div>
      </section>

      <section className="mt-8 cc-panel-strong rounded-[32px] px-6 py-10 text-center sm:px-8">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/56">
          Prêt à surveiller tes concurrents ?
        </span>
        <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">
          Ajoute ta première URL et vois les vrais changements remonter dans ChronoCrawl.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/62">
          Le blog te donne la méthode. Le produit te donne la surveillance, les alertes et l&apos;audit concurrent dans la même interface.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup?from=blog&intent=surveillance" className="cc-button-primary rounded-full px-6 py-3 text-sm font-semibold">
            Commencer l&apos;essai gratuit
          </Link>
          <Link href="/tarifs?from=blog" className="cc-button-secondary rounded-full px-6 py-3 text-sm font-semibold">
            Voir les tarifs
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
