import BlogIndex from "@/features/blog/BlogIndex";
import BlogShell from "@/features/blog/BlogShell";

export default function BlogPage() {
  return (
    <BlogShell>
      <BlogIndex />
    </BlogShell>
  );
}
