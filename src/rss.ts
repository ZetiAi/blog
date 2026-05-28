import type { BlogFrontmatter } from "./schema";

export interface RssItemInput {
  slug: string;
  data: BlogFrontmatter;
}

/**
 * Map blog entries to the `@astrojs/rss` item shape.
 * Drops drafts and sorts newest-first. `blogBase` is the path prefix for links.
 */
export function toRssItems(entries: RssItemInput[], blogBase = "/blog") {
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `${blogBase}/${entry.slug}/`,
      categories: entry.data.tags,
    }));
}
