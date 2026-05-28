import { z } from "astro/zod";

/**
 * Shared content-collection schema for blog posts.
 *
 * Pass to `defineCollection({ loader, schema: blogSchema })` in each site's
 * `src/content.config.ts`. Site- and theme-agnostic — locales, tags, and
 * canonical handling are left to the consuming site.
 */
export const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  /** Path or URL to the hero/OG image. */
  heroImage: z.string().optional(),
  draft: z.boolean().default(false),
  /** BCP-47 / locale code. Sites decide their own locale set; defaults to "en" downstream. */
  lang: z.string().optional(),
  /** Override the canonical URL — e.g. for syndicated / cross-posted articles. */
  canonicalURL: z.string().url().optional(),
});

export type BlogFrontmatter = z.infer<typeof blogSchema>;
