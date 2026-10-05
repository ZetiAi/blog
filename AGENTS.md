# blog

SEO-first, theme-agnostic blog kit for Astro sites: shared schema, structured data, RSS helpers and slot-based layouts.

## Deployment map

**Status:** not deployed, by design. This is a library; it ships inside each consuming site's build.

```text
Astro site → "blog": "github:ZetiAi/blog" (git dependency, pinned in bun.lock) → built into that site's own deploy
```

| Layer | Platform | Notes |
|---|---|---|
| Distribution | GitHub (git dependency) | `private: true`, not published to npm |
| Runtime | Astro 6+ (peer dependency) | Exports Seo, JsonLd, PostLayout, PostCard and TS helpers |
| CI/CD | none | No workflows, no release-please; the vitest suite runs locally |

_Mapped 2026-10-04 from the default branch's config. Update this section when a platform changes._
