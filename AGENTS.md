# AGENTS.md: orientation for coding agents

Read this first. It is the map of the repo, so you can go straight to the files a task needs.
The other living docs:

| File | What it answers |
| --- | --- |
| **AGENTS.md** (this) | What is this, what must never happen, where is everything, what to run |
| [DESIGN.md](DESIGN.md) | How the pieces fit, the contracts between them, the visual design system, and why |
| [WORKFLOW.md](WORKFLOW.md) | How a change goes from idea to live, recipes for common tasks, and how to keep these docs current |
| [README.md](README.md) | The owner-facing guide: every `showcase/config.json` option, the sketchbook, the theme classes |
| [docs/keeping-it-fresh.md](docs/keeping-it-fresh.md) | Rebuild triggers and the cross-repo dispatch |

These files are part of the code. If your change makes a line in them wrong, fix the line in the same PR
([WORKFLOW.md](WORKFLOW.md#keeping-the-docs-alive) says which file owns what).

## What this project is

charleshageit.com is Charles's (GitHub `NXT549`) fun, minimalist developer showcase. It is an Astro 7
static site, deployed to GitHub Pages by `.github/workflows/deploy.yml`. Project cards,
`/projects/<repo>/`, `/about/` and `/log/` are built from NXT549's public repos **at build time**;
visitors never hit the GitHub API. The site rebuilds itself every 6 hours, so most "content updates"
need no commit at all.

## Hard rules

1. **Never reveal where Charles lives.** No city, suburb, region, country, timezone, coordinates or GitHub
   profile location in page copy, meta/OG tags, structured data, the social card, `data/*.json`, docs or
   commit messages. Art and sample data count too (exchange names, ticker suffixes, real symbols), so the
   sketchbook's charts use made-up tickers. Grep `dist/` before pushing if unsure.
2. **Blueprint look only**: navy grid paper, chalk lines, yellow highlighter, blue pencil, Caveat notes,
   rubber stamps, Pip the mascot. Fun, with personality. No generic "AI" styling (dark glass, neon
   gradients, glow orbs). Show screenshots before committing to a new visual direction.
3. **Use tokens.** Colours, fonts and spacing come from `src/styles/tokens.css`, shared pieces from
   `theme.css`. No hard-coded values. Exception: `src/lib/og.ts` (satori can't read CSS variables) keeps
   its own copy, so update it by hand when the theme changes.
4. **Lighthouse**: performance >= 95, 100 for accessibility, best practices and SEO on every page
   (`lighthouserc.json`, blocking on PRs). Minimal JS, lazy images, no render-blocking requests.
5. **Deploy setup stays put**: Pages source is "GitHub Actions", `main` holds source (never a built site),
   keep `public/CNAME`.
6. **Never hand-edit generated output** (`dist/`, `data/github.json`, `data/github-raw.json`). Change
   `showcase/config.json`, `showcase/*.mjs` or the Astro components instead.

## Commands

```sh
npm ci
npm run dev                              # http://localhost:4321, live reload
npm run check                            # astro check (types in .astro and .ts)
node --test "showcase/test/*.test.mjs"   # keep the quotes (Node 22 glob)
SHOWCASE_OFFLINE=1 npm run build         # offline build from the cached data/, writes dist/
npx lhci autorun                         # Lighthouse on dist/ (needs Chrome; CHROME_PATH if not found)
```

Run `check`, the tests and the offline build before every push. CI uses Node 22.
Cloud sandboxes usually can't reach api.github.com user endpoints or charleshageit.com, so build offline;
real GitHub data only shows up in CI. A build that can't reach GitHub falls back to the cache by itself
and prints a warning, so a "successful" local build may still be showing cached data.

## Repo map

```
.github/workflows/deploy.yml  check, test, build, Lighthouse, deploy (the only workflow)
astro.config.mjs              site URL, sitemap, CSS inlined into every page
lighthouserc.json             the Lighthouse budget (hard rule 4)
showcase/                     dependency-free Node: everything about the GitHub data
  config.json                 ★ the owner's knobs: featured, hide, per-repo card tweaks
  fetch.mjs                   GitHub fetch (GraphQL with a token, REST without) + normalize()
  detect.mjs                  pure helpers: languages, frameworks, README excerpt, release downloads
  render.mjs                  HTML strings for cards, tags, stamps, icons; esc() / safeUrl()
  ascii.mjs                   Pip's sprites to characters, FIGlet parser and renderer
  cyber.mjs                   ★ the sketchbook's seeded generators and its catalogue (PIECES)
  build.mjs                   legacy CLI from before Astro; only --summary still works
  test/                       node:test suites + fixtures/graphql.json
data/                         cached GitHub snapshot, used when the API is unreachable (generated)
src/
  pages/                      index, about, log, 404, ascii/ (sketchbook), projects/[name],
                              og.png.ts + og/[...slug].png.ts (social cards), ascii/fonts/[font].json.ts
  layouts/                    Base.astro (head, SEO, structured data), Page.astro (non-home pages)
  components/                 Hero, Projects, Sketchbook (Fig. 3), Workbench, FilterBar, About,
                              StatusBadge, Pip, AsciiFigure, Header, Footer, pip-sprites.js
  lib/                        site.ts (name, links), showcase.ts (the one build-time fetch),
                              readme.ts (README to HTML), og.ts (social card), ascii.ts (sketchbook pieces)
  ascii/                      art/*.txt (hand-drawn, frames split by ~~~), fonts/*.flf (FIGlet)
  scripts/                    the only client JS: fx.js, shell.ts, showcase.js, ascii.ts
  styles/                     tokens.css, theme.css, then page, prose, showcase, ascii
  fonts/                      Geist, Geist Mono, Caveat (self-hosted, SIL OFL)
public/                       served as-is: CNAME (keep), robots.txt, img/ (project screenshots)
docs/                         keeping-it-fresh.md, notify-site.yml (a workflow other repos copy)
```

Generated and gitignored: `node_modules/`, `dist/`, `.astro/`, `.lighthouseci/`.

## Where to make common changes

| Task | Touch |
| --- | --- |
| Feature, hide or reword a project | `showcase/config.json` only (options are listed in README.md) |
| Change how cards look | `showcase/render.mjs` (markup) + `src/styles/showcase.css`; `showcase/test/showcase.test.mjs` |
| Change what is fetched from GitHub | `showcase/fetch.mjs` (GraphQL **and** REST paths, then `normalize()`), the `Repo` type in `src/lib/showcase.ts`, the fixture and tests |
| Detect a new framework or language | `showcase/detect.mjs` + tests |
| Project page layout | `src/pages/projects/[name].astro` |
| Site name, description, links | `src/lib/site.ts` |
| `<head>`, meta, structured data | `src/layouts/Base.astro` |
| Colours, fonts, spacing | `src/styles/tokens.css`, then mirror into `src/lib/og.ts` |
| A reusable visual piece | `src/styles/theme.css` (and its header comment, and README "Theme") |
| Scroll-in entrance for a new element | add its selector to `SHEETS` in `src/scripts/fx.js` |
| A terminal command | `src/scripts/shell.ts` (and its `help` output) |
| A sketchbook picture | `PIECES` in `showcase/cyber.mjs` + frames in `src/lib/ascii.ts` + tests |
| A new page | see the recipe in [WORKFLOW.md](WORKFLOW.md#add-a-page) |
| Rebuild triggers, CI | `.github/workflows/deploy.yml` + `docs/keeping-it-fresh.md` |

## Gotchas

- `showcase/*.mjs` is imported by Astro components **and** by the browser (`src/scripts/ascii.ts`
  imports `figlet`), so it must stay dependency-free and must not touch Node APIs at module top level.
- `showcase/render.mjs` returns HTML strings that are injected with `set:html`. Anything from GitHub
  goes through `esc()` or `safeUrl()` first.
- `getShowcase()` in `src/lib/showcase.ts` memoises one fetch per build. Call it; never fetch elsewhere.
- `showcase/build.mjs` predates Astro and wants a root `index.html` that no longer exists. Only
  `--summary` works. Nothing in CI refreshes `data/`, so the committed snapshot is old on purpose:
  it is a fallback, and offline builds apply today's `config.json` on top of it.
- Offline builds show the cached repos, so a repo created after the snapshot won't appear locally.
- `src/lib/ascii.ts` fails the build if a sketchbook piece has no frames.
- CSS is inlined into every page (`inlineStylesheets: "always"`), so stylesheet weight is page weight.
- Lighthouse blocks pull requests but only reports on `main` (a deploy is never held back by it).
- `src/components/pip-sprites.js` is copied from the `NXT549/pip` repo; don't redraw Pip here.
- A few comments still say `index.html` or `js/fx.js` from the pre-Astro site; trust the code.
- Sheet numbers: home 01-04 (Fig. 3 is the sketchbook teaser), about 05, log 06, sketchbook 07,
  projects P-01 onward. A new page takes the next number.

## Working agreements

- Branch from `main`, one PR per batch of work. Reset a merged PR's branch onto `main` before reusing it.
- Keep changes small and in the existing style; think hard before adding a dependency or any client JS.
- Everything animated must do nothing under `prefers-reduced-motion`, and the page must still be
  complete with JavaScript off.
- Update the docs in the same PR as the change that outdates them.
