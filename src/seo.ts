export interface JsonLdInput {
  title: string;
  description: string;
  /** Absolute canonical URL of the post. */
  url: string;
  author?: string;
  publishedTime: Date;
  modifiedTime?: Date;
  /** Absolute image URL. */
  image?: string;
  publisher?: string;
  /** Absolute logo URL for the publisher. */
  logo?: string;
}

/** Build a schema.org `BlogPosting` object for JSON-LD structured data. */
export function buildBlogPostingJsonLd(input: JsonLdInput): Record<string, unknown> {
  const { title, description, url, author, publishedTime, modifiedTime, image, publisher, logo } =
    input;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: publishedTime.toISOString(),
    dateModified: (modifiedTime ?? publishedTime).toISOString(),
    ...(image ? { image } : {}),
    ...(author ? { author: { "@type": "Person", name: author } } : {}),
    ...(publisher
      ? {
          publisher: {
            "@type": "Organization",
            name: publisher,
            ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
          },
        }
      : {}),
  };
}

/** Resolve an absolute URL from a site origin + path. */
export function absoluteUrl(site: string | URL, path: string): string {
  return new URL(path, site).toString();
}
