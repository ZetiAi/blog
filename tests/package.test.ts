/**
 * Package-owned proof that every export in the blog kit's public API behaves
 * correctly. These tests ship with the package and travel to every consumer
 * (gibble, AICSUITE, catchat). They cover the framework-agnostic TypeScript
 * helpers and the content schema; the .astro components are proven by each
 * consuming site's build-output integration test, since they only have meaning
 * once Astro compiles them.
 *
 * Imports go through ./src/index — the same surface the `exports` map exposes —
 * so a regression in the public entry point fails here.
 */
import { describe, expect, it } from 'vitest';
import {
	absoluteUrl,
	blogSchema,
	buildBlogPostingJsonLd,
	readingTime,
	toRssItems
} from '../src/index';
import type { BlogFrontmatter } from '../src/index';

describe('public API surface', () => {
	it('exports every documented helper from the package entry point', () => {
		expect(typeof readingTime).toBe('function');
		expect(typeof buildBlogPostingJsonLd).toBe('function');
		expect(typeof absoluteUrl).toBe('function');
		expect(typeof toRssItems).toBe('function');
		expect(typeof blogSchema?.parse).toBe('function');
	});
});

describe('readingTime', () => {
	it('returns a minimum of 1 minute for empty / tiny input', () => {
		expect(readingTime('')).toBe(1);
		expect(readingTime('   ')).toBe(1);
		expect(readingTime('one two three')).toBe(1);
	});

	it('computes minutes at 200 wpm, rounded', () => {
		expect(readingTime(Array(200).fill('word').join(' '))).toBe(1);
		expect(readingTime(Array(300).fill('word').join(' '))).toBe(2); // 1.5 -> 2
		expect(readingTime(Array(400).fill('word').join(' '))).toBe(2);
		expect(readingTime(Array(1000).fill('word').join(' '))).toBe(5);
	});

	it('ignores collapsed whitespace when counting words', () => {
		expect(readingTime('a\n\n  b\t c')).toBe(1);
	});
});

describe('blogSchema', () => {
	const valid = {
		title: 'A Post',
		description: 'About something',
		pubDate: '2026-05-20'
	};

	it('parses valid frontmatter and coerces pubDate to a Date', () => {
		const parsed = blogSchema.parse(valid);
		expect(parsed.title).toBe('A Post');
		expect(parsed.pubDate).toBeInstanceOf(Date);
		expect(parsed.pubDate.toISOString()).toBe('2026-05-20T00:00:00.000Z');
	});

	it('applies defaults: tags=[] and draft=false', () => {
		const parsed = blogSchema.parse(valid);
		expect(parsed.tags).toEqual([]);
		expect(parsed.draft).toBe(false);
	});

	it('keeps optional fields optional', () => {
		const parsed = blogSchema.parse(valid);
		expect(parsed.author).toBeUndefined();
		expect(parsed.updatedDate).toBeUndefined();
		expect(parsed.heroImage).toBeUndefined();
		expect(parsed.lang).toBeUndefined();
		expect(parsed.canonicalURL).toBeUndefined();
	});

	it('rejects frontmatter missing required fields', () => {
		expect(blogSchema.safeParse({ description: 'x', pubDate: '2026-01-01' }).success).toBe(false);
		expect(blogSchema.safeParse({ title: 'x', pubDate: '2026-01-01' }).success).toBe(false);
		expect(blogSchema.safeParse({ title: 'x', description: 'y' }).success).toBe(false);
	});

	it('rejects an invalid pubDate and a non-URL canonicalURL', () => {
		expect(blogSchema.safeParse({ ...valid, pubDate: 'not-a-date' }).success).toBe(false);
		expect(blogSchema.safeParse({ ...valid, canonicalURL: 'not-a-url' }).success).toBe(false);
		expect(blogSchema.safeParse({ ...valid, canonicalURL: 'https://x.com/p' }).success).toBe(true);
	});
});

describe('buildBlogPostingJsonLd', () => {
	const published = new Date('2026-05-20T00:00:00.000Z');
	const modified = new Date('2026-05-26T00:00:00.000Z');

	it('builds a minimal schema.org BlogPosting', () => {
		const ld = buildBlogPostingJsonLd({
			title: 'T',
			description: 'D',
			url: 'https://x.com/blog/t/',
			publishedTime: published
		});
		expect(ld['@context']).toBe('https://schema.org');
		expect(ld['@type']).toBe('BlogPosting');
		expect(ld.headline).toBe('T');
		expect(ld.description).toBe('D');
		expect(ld.url).toBe('https://x.com/blog/t/');
		expect(ld.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': 'https://x.com/blog/t/' });
		expect(ld.datePublished).toBe(published.toISOString());
		// dateModified falls back to publishedTime when no modifiedTime given
		expect(ld.dateModified).toBe(published.toISOString());
		// optional fields omitted entirely, not set to undefined
		expect('author' in ld).toBe(false);
		expect('publisher' in ld).toBe(false);
		expect('image' in ld).toBe(false);
	});

	it('includes author, publisher+logo, image and dateModified when provided', () => {
		const ld = buildBlogPostingJsonLd({
			title: 'T',
			description: 'D',
			url: 'https://x.com/blog/t/',
			author: 'Jane',
			publishedTime: published,
			modifiedTime: modified,
			image: 'https://x.com/og.png',
			publisher: 'AICSUITE',
			logo: 'https://x.com/logo.png'
		});
		expect(ld.dateModified).toBe(modified.toISOString());
		expect(ld.author).toEqual({ '@type': 'Person', name: 'Jane' });
		expect(ld.image).toBe('https://x.com/og.png');
		expect(ld.publisher).toEqual({
			'@type': 'Organization',
			name: 'AICSUITE',
			logo: { '@type': 'ImageObject', url: 'https://x.com/logo.png' }
		});
	});

	it('produces JSON-serialisable output', () => {
		const ld = buildBlogPostingJsonLd({
			title: 'T',
			description: 'D',
			url: 'https://x.com/blog/t/',
			publishedTime: published
		});
		expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow();
	});
});

describe('absoluteUrl', () => {
	it('resolves a path against a string origin', () => {
		expect(absoluteUrl('https://x.com', '/blog/p/')).toBe('https://x.com/blog/p/');
	});

	it('resolves a path against a URL origin', () => {
		expect(absoluteUrl(new URL('https://x.com/'), '/rss.xml')).toBe('https://x.com/rss.xml');
	});
});

describe('toRssItems', () => {
	const mk = (over: Partial<BlogFrontmatter> & { title: string; pubDate: string }) =>
		blogSchema.parse({ description: 'd', ...over });

	const entries = [
		{ slug: 'older', data: mk({ title: 'Older', pubDate: '2026-05-20', tags: ['a'] }) },
		{ slug: 'newer', data: mk({ title: 'Newer', pubDate: '2026-05-25', tags: ['b', 'c'] }) },
		{ slug: 'draft', data: mk({ title: 'Draft', pubDate: '2026-05-30', draft: true }) }
	];

	it('drops drafts', () => {
		const items = toRssItems(entries);
		expect(items.map((i) => i.title)).not.toContain('Draft');
		expect(items).toHaveLength(2);
	});

	it('sorts newest-first', () => {
		const items = toRssItems(entries);
		expect(items.map((i) => i.title)).toEqual(['Newer', 'Older']);
	});

	it('builds /blog/<slug>/ links by default and maps tags to categories', () => {
		const items = toRssItems(entries);
		const newer = items[0];
		expect(newer.link).toBe('/blog/newer/');
		expect(newer.categories).toEqual(['b', 'c']);
		expect(newer.pubDate).toBeInstanceOf(Date);
	});

	it('honours a custom blogBase', () => {
		const items = toRssItems(entries, '/news');
		expect(items[0].link).toBe('/news/newer/');
	});
});
