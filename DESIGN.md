# DESIGN.md: architecture, contracts and the visual design system

The "why" behind the code. [AGENTS.md](AGENTS.md) says *where* things are; this file says *how they
fit and what must not change by accident*. [WORKFLOW.md](WORKFLOW.md) says how to change them.

---

## 1. Principles

| Principle | What it means in code |
| --- | --- |
| **The site maintains itself** | Content comes from GitHub at build time and a schedule rebuilds it. A new repo, release or commit appears without anyone editing this repo. Hand-written content is the exception, kept in `showcase/config.json`. |
| **Static and fast** | Astro renders plain HTML. No framework runtime, no client-side data fetching, CSS inlined, fonts self-hosted. The Lighthouse budget is a gate, not a goal. |
| **It always builds** | If GitHub is unreachable the build falls back to the committed snapshot in `data/`. A deploy never fails because an API hiccuped. |
| **Private by default** | Nothing about where Charles lives, anywhere (hard rule 1). Sample data is invented rather than borrowed from the real world. |
| **A workshop, not a portfolio template** | Everything is drawn as a blueprint sheet, with Pip and handwritten notes for personality. If it could be any developer's site, it's wrong. |
| **Works without the extras** | Every page is complete with JavaScript off. All motion is skipped for `prefers-reduced-motion`. Accessibility scores 100 or the PR doesn't merge. |

---

## 2. How a build flows

```
 showcase/config.json ──────────────┐
                                    ▼
 GitHub API ──► showcase/fetch.mjs  fetchRaw()  ──► normalize(raw, config) ──► Showcase data
   (GraphQL with a token,              │                   ▲                        │
    REST without)                      │ fails             │                        │
                                       ▼                   │                        │
                         data/github-raw.json ─────────────┘                        │
                         (committed fallback)                                       │
                                                                                    ▼
                         src/lib/showcase.ts  getShowcase()  (one memoised promise per build)
                                                                                    │
        ┌───────────────┬───────────────┬──────────────┬──────────────┬────────────┤
        ▼               ▼               ▼              ▼              ▼            ▼
   index.astro   projects/[name]   about.astro    log.astro     og/[...slug]   lib/ascii.ts
   (cards via    (spec sheet +     (what's on     (commits,     (a social      (boot log and
   render.mjs)   README via        the bench)     releases)     card each)     process table)
                 lib/readme.ts)
                                                                                    │
                                                                                    ▼
                                                             dist/  ──►  GitHub Pages
```

- **One fetch, shared.** `getShowcase()` is the only door to the data. Pages and components `await`
  it; they never call GitHub or read `data/` themselves.
- **`normalize()` is pure.** Raw API response plus config in, `Showcase` out. That is why an offline
  build can apply today's `config.json` to an old snapshot, and why it is easy to test.
- **Two fetch paths, one shape.** `fromGraphQLRepo` and `fromRestRepo` both produce the same raw repo
  shape. A field added to one must be added to the other.
- **What gets shown** (`isShown`): public, not a fork, not archived, not in `hide`, and not the
  profile README repo. Featured = listed under `featured` in the config, or carrying the `featured`
  topic.
- **`SHOWCASE_OFFLINE=1`** skips the network entirely. Token lookup order is `SHOWCASE_TOKEN`,
  `GITHUB_TOKEN`, `GH_TOKEN`.

### The data contract

`Showcase` and `Repo` in `src/lib/showcase.ts` are the typed view of what `normalize()` returns:
`generatedAt`, `user`, `featured` (ordered names), `facets` (languages, frameworks, topics with counts)
and `repos`. Each repo carries GitHub facts (stars, language, topics, release, recent commits, README)
merged with its `repos.<name>` overrides from the config (`blurb`, `status`, `image`, `does`, `how`,
`ascii`, ...). README.md documents every override; that list is the owner's contract, so a renamed or
removed option is a breaking change.

### The `showcase/` boundary

`showcase/` is plain, dependency-free ES modules with their own `node:test` suite. It knows nothing
about Astro. Astro imports it; it never imports from `src/`. Part of it also ships to the browser
(`figlet` for the banner maker), so it must run in both places. Keep logic that can be a pure
function there, where it can be tested without a build.

`render.mjs` returns HTML strings, injected with `set:html`. It is the trust boundary for GitHub
content: repo names, descriptions, commit messages and URLs are untrusted and pass through `esc()` or
`safeUrl()`. READMEs go through `src/lib/readme.ts` (marked), which rewrites relative links to GitHub.

---

## 3. Pages

| Route | Source | Sheet |
| --- | --- | --- |
| `/` | `pages/index.astro`: Hero, Projects, Sketchbook (Fig. 3), Workbench + FilterBar, About | 01-04 |
| `/about/` | `pages/about.astro` | 05 |
| `/log/` | `pages/log.astro` | 06 |
| `/ascii/` | `pages/ascii/index.astro` | 07 |
| `/projects/<repo>/` | `pages/projects/[name].astro`, one per shown repo | P-01 onward |
| `/404.html` | `pages/404.astro` (no canonical URL) | 404 |
| `/og.png`, `/og/<slug>.png` | `pages/og.png.ts`, `pages/og/[...slug].png.ts` via `lib/og.ts` | |
| `/ascii/fonts/<id>.json` | `pages/ascii/fonts/[font].json.ts` | |

`Base.astro` owns the `<head>`: title, description, canonical, Open Graph tags, JSON-LD (`WebSite`
and `Person`) and font preloads. `Page.astro` wraps Base with the header and footer for every page but
the home page. Project pages are ordered featured first (in config order), then the rest by last
push; that order is the P-number and the previous/next links, and the social cards use the same one.

Every page has its own 1200×630 social card, drawn at build time with satori and resvg as the same
blueprint sheet. Because satori can't read CSS variables, `lib/og.ts` has its own copy of the palette.

---

## 4. Client-side JavaScript

There is very little, and each piece is optional decoration on HTML that already works.

| File | Does | Without it |
| --- | --- | --- |
| `scripts/fx.js` | Stamps thunk down; "sheets" are dealt onto the page as they scroll in (`SHEETS` selector list) | Everything is simply there |
| `scripts/shell.ts` | The hero terminal: types its intro, then takes commands (`help`, `ls`, `open`, `pip ...`, `banner ...`) | A static terminal drawing |
| `scripts/showcase.js` | Workbench filters; the choice lives in the URL query so views can be shared | All cards shown |
| `scripts/ascii.ts` | Steps sketchbook frames while on screen, copy buttons, the banner maker | First frame of each picture |
| `components/Pip.astro` | Pip walking the header; click changes his flavour (remembered in `localStorage`, and the tab icon matches) | A still Pip |

Rules: no framework, no third-party scripts, no network calls except the banner maker lazily
fetching a font JSON from this same site. Check `prefers-reduced-motion` before animating. The scroll
progress line, drifting grid, drawn rules and the "how it works" rail are pure CSS scroll timelines and
are skipped where unsupported.

---

## 5. Visual design system

The site is a blueprint for a workshop. Each section is a numbered drawing sheet with crop marks and
a title block; notes are handwritten in the margin; status is a rubber stamp.

### Pens (`src/styles/tokens.css`)

| Token | Role |
| --- | --- |
| `--navy` / `--bg` | The paper, with a two-scale grid (`--grid`, `--grid-major`) |
| `--chalk` / `--line` / `--text` | Linework and text |
| `--highlighter` / `--accent` | The one loud colour: main buttons, circled words, notes. Use it sparingly |
| `--blue-pencil` / `--accent-2` | Dimension lines, labels, paths |
| `--stamp-green`, `--stamp-red` | "Shipped" and "In progress" stamps only |
| `--surface`, `--surface-2`, `--surface-3` | Paper inside a drawing frame |
| `--text-muted`, `--text-faint` | Secondary text; contrast ratios are noted beside each token |

Type: Geist for headings and body, Geist Mono for labels and code (uppercase labels use
`--tracking-mono`), Caveat for handwriting. Spacing is the `--space-1..9` scale. Corners are nearly
square (`--radius` 2px), lines are `--stroke` 1.5px, and there are **no shadows or blurs**: depth is an
offset outline (`--glow-accent`), like a sheet lifted off the one beneath.

Tokens further down the file (`--glass-*`, `--emerald-*`, `--cyan-*`, `--gradient-*`) are aliases kept
so older class names still resolve to blueprint colours. Don't use them in new code.

### Pieces (`src/styles/theme.css`)

The comment at the top of `theme.css` is the catalogue: `.panel`/`.glass` (drawing frame), `.sheet` +
`.titleblock`, `.terminal`, `.btn`, `.tag`, `.badge` (stamps), `.hand` (note), `.circled`,
`.text-pop` (highlighter swipe), `.dim` (dimension line), `.eyebrow`, `.section-head`. Reach for one
of these before writing new CSS; add to the catalogue when you create a reusable one.

Stylesheet layering: `tokens.css` → `theme.css` → one of `page.css` (non-home pages), `prose.css`
(rendered READMEs), `showcase.css` (cards), `ascii.css` (sketchbook). Page-only styles live in that
page's `<style>` block and still read tokens.

### Voice

First person, plain and playful ("little things I've vibe-coded"). Short sentences. Captions like a
drawing ("Fig. 3", "Sheet 05 · About"). Pip gets the jokes. No marketing language.

### Not allowed

Dark glassmorphism, neon gradients, glow orbs, drop shadows, rounded pill cards, stock "AI" imagery,
or a second accent colour competing with the highlighter. A new visual direction needs screenshots
shown to Charles before it is committed.

---

## 6. The sketchbook

Pictures drawn in plain characters, each in a small terminal window. `PIECES` in `showcase/cyber.mjs`
is the catalogue (id, file name, title, group, tint, speed); `src/lib/ascii.ts` builds each piece's
frames at build time and throws if one is empty.

- Generators are **pure and seeded** (`rng(seed)`): same input, same frames. No `Math.random`, no
  clock. Tests pin this.
- Some pieces are drawn from the live project list (boot log, process table), so they change on
  rebuild without edits.
- Every frame is a `<pre>` stacked in one grid cell, so the box never resizes between frames.
- Tints map to pens: `cyan` blue pencil, `yellow` highlighter, `green` stamp, `chalk` linework.
- Charts and tables use made-up tickers and names (hard rule 1 covers art).
- FIGlet fonts in `src/ascii/fonts/` keep their permission notices.

---

## 7. Build, quality gates and deploy

One workflow, `.github/workflows/deploy.yml`:

```
push to main | pull_request | every 6h | manual | repository_dispatch (repo-updated)
   └─► npm ci ─► astro check ─► node --test ─► astro build ─► Lighthouse ─► (not PRs) deploy to Pages
```

- Lighthouse runs three times per page over every page in `dist/` and takes the median for
  performance. It **fails pull requests** and only reports on `main`, so a scheduled rebuild with new
  GitHub content can't be blocked by a score wobble.
- Pull requests build but never deploy. Deploys are serialised; PR runs cancel their predecessors.
- `main` holds source only. Pages source is "GitHub Actions". `public/CNAME` carries the domain.

---

## 8. Decisions worth remembering

| Decision | Why |
| --- | --- |
| Astro, static output | The earlier hand-written `index.html` + injection script couldn't grow to per-project pages. Astro gives pages and components while still shipping plain HTML. |
| Fetch at build time, never in the browser | No rate limits or tokens for visitors, nothing to wait for, works offline, and Lighthouse stays green. |
| Commit a data snapshot | Builds in sandboxes and during API outages still produce a real site. |
| `showcase/` stays framework-free | It survived the move to Astro untouched and is testable in milliseconds. |
| CSS inlined into every page | The pages are small; removing the render-blocking request is worth the repeated bytes. |
| Card HTML as strings in `render.mjs` | Inherited from the pre-Astro site and shared by several pages. Fine while `esc()` discipline holds; new one-off markup belongs in `.astro` files instead. |
| Location removed everywhere | A deliberate privacy choice by Charles, applied to copy, metadata, data and art. |

Add a row when you make a choice a future agent might otherwise undo.
