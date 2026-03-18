import BlogIndex from "@/features/blog/BlogIndex";
import BlogShell from "@/features/blog/BlogShell";
import { blogPosts, categoryLabels } from "@/features/blog/data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://chronocrawl.com";

export default function BlogPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/blog/#collection`,
        url: `${siteUrl}/blog`,
        name: "Blog ChronoCrawl",
        description:
          "Guides et analyses pour surveiller des concurrents, lire les changements SEO, CTA et pricing, et structurer une veille concurrentielle utile.",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/blog/#items`,
        itemListElement: blogPosts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}/blog/${post.slug}`,
          name: post.title,
        })),
      },
      ...blogPosts.map((post) => ({
        "@type": "Article",
        "@id": `${siteUrl}/blog/${post.slug}#article`,
        headline: post.title,
        url: `${siteUrl}/blog/${post.slug}`,
        description: post.excerpt,
        articleSection: categoryLabels[post.category],
      })),
    ],
  };

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <BlogIndex />
    </BlogShell>
  );
}
