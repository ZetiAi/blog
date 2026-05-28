# blog

SEO-first, theme-agnostic blog kit for Astro sites. Each site owns its posts
(`src/content/blog/*.md`) and its styling; this package provides the shared
schema, structured data, RSS helpers, and slot-based layouts.

> Lives in the gibble monorepo for now but is intentionally repo-agnostic — the
> same package is meant to power catchat and AICSUITE. Nothing here is
> gibble-specific.

## What it provides

| Export | Purpose |
| --- | --- |
| `blogSchema` | Content-collection schema (zod). |
| `readingTime(text)` | Reading-time estimate (minutes). |
| `buildBlogPostingJsonLd(...)` | schema.org `BlogPosting` JSON-LD object. |
| `absoluteUrl(site, path)` | Resolve absolute URLs. |
| `toRssItems(entries)` | Map entries → `@astrojs/rss` items. |
| `blog/JsonLd.astro` | Renders a JSON-LD `<script>`. |
| `blog/Seo.astro` | `<head>` SEO partial (for sites without their own). |
| `blog/PostLayout.astro` | Slot-based article body (`prose`). |
| `blog/PostCard.astro` | Listing card. |

## Usage

**1. Define the collection** — `src/content.config.ts`:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema } from "blog";

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
    schema: blogSchema,
  }),
};
```

**2. Render a post** — bring your own layout for site chrome, drop the body in:

```astro
---
import PostLayout from "blog/PostLayout.astro";
import { readingTime } from "blog";
import { render } from "astro:content";
const { Content } = await render(post);
---
<PostLayout title={post.data.title} pubDate={post.data.pubDate}
  readingTime={readingTime(post.body ?? "")}>
  <Content />
</PostLayout>
```

**3. Feed** — `src/pages/rss.xml.ts`:

```ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { toRssItems } from "blog";

export async function GET(context) {
  const posts = await getCollection("blog");
  return rss({
    title: "…",
    description: "…",
    site: context.site,
    items: toRssItems(posts.map((p) => ({ slug: p.id, data: p.data }))),
  });
}
```

Theming: layouts use `prose` + `currentColor`/opacity, so they inherit the host
site's typography and palette. Add `@tailwindcss/typography` to the consuming app.
