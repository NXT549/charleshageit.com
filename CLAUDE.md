# CLAUDE.md

Guidance for Claude (or any contributor) working on charleshageit.com, Charles's workshop site.
Live at https://charleshageit.com/. Owner: Charles, GitHub `NXT549`. Read this first, then `README.md`
(commands, config options, file map) and `docs/` for the deeper notes.

## What this is

A fun, minimalist developer showcase. Astro 7 static site, deployed to GitHub Pages by
`.github/workflows/deploy.yml`. Project cards, `/projects/<repo>/` spec sheets, `/about/` and `/log/`
are generated at build time from NXT549's public GitHub repos. Nothing calls GitHub when a visitor loads a page.

## Hard rules

1. **Privacy: never mention where Charles lives.** No city, suburb, region, country, timezone, coordinates
   or GitHub-profile location anywhere: page copy, meta tags, Open Graph, structured data, the social card,
   `data/*.json`, README, docs, commit messages. Check `dist/` before pushing if unsure.
2. **Blueprint look only.** Navy grid paper, chalk linework, yellow highlighter, blue pencil, Caveat notes,
   rubber stamps, Pip the mascot. Never generic "AI" styling (dark glass, neon gradients, glow orbs).
   It should feel fun and have personality. For visual changes, show screenshots before committing to a new direction.
3. **Use tokens.** Colours, fonts and spacing come from `src/styles/tokens.css`; reusable pieces from
   `src/styles/theme.css`. Don't hard-code values.
4. **Keep Lighthouse high.** Every page must stay at Lighthouse performance >= 95 and 100 for accessibility,
   best practices and SEO (`lighthouserc.json`). Minimal JS, lazy images, no render-blocking requests.
5. **Pages Source stays on "GitHub Actions".** `main` holds Astro source, not a built site. Keep `public/CNAME`.
6. **Never hand-edit generated output** (`dist/`, `data/github.json`). Change `showcase/config.json`,
   `showcase/render.mjs` or the Astro components instead.

## Commands

```sh
npm ci
npm run dev      # http://localhost:4321
npm run check    # astro check (types)
node --test "showcase/test/*.test.mjs"   # the glob matters on Node 22
npm run build    # SHOWCASE_OFFLINE=1 skips GitHub and uses the cached data
npx lhci autorun # needs Chrome
```

Run `check`, the tests and `build` before every push. CI runs the same plus Lighthouse (blocking on PRs).

## Where things live

- `src/pages/`: `index`, `about`, `log`, `404`, `projects/[name]`, `og.png.ts` (social card).
- `src/layouts/`: `Base.astro` (head, SEO, structured data), `Page.astro` (non-home pages).
- `src/components/`: Hero, Projects, Workbench, FilterBar, About, Pip, header/footer.
- `src/lib/`: `site.ts` (name, links), `showcase.ts` (build-time fetch), `readme.ts`, `og.ts`.
  `og.ts` hard-codes a copy of the theme colours and fonts (satori can't read CSS variables), so redraw it by hand when the theme changes.
- `src/scripts/`: `fx.js` (stamps), `shell.ts` (typeable hero terminal), `showcase.js` (filters).
- `showcase/`: dependency-free fetch (`fetch.mjs`), card rendering (`render.mjs`), `config.json`, tests.
- `data/github-raw.json` and `github.json`: cached snapshot used when GitHub is unreachable.

## How content updates itself

- Pushing to `main` rebuilds and deploys. So does a 6-hourly cron, a manual run, and a `repository_dispatch`
  event of type `repo-updated` (so Charles's other repos can trigger an immediate rebuild).
- New public repos appear on the workbench automatically. Forks, archived repos and entries in `hide` are skipped.
- To change a card, edit `repos.<name>` in `showcase/config.json` (options are in README.md). To feature a
  repo, add it to `featured` or give it the `featured` topic on GitHub.
- Details and setup steps for other repos: `docs/keeping-it-fresh.md`.

## Docs upkeep

When you add a page, config option, workflow or rule, update `README.md` (user-facing how-to), this file
(rules and map) and `docs/` in the same PR. Keep this file short and accurate; delete stale lines.

## Working style

- Branch from `main`, one PR per batch of work, base `main`. Don't reuse a merged PR's branch without resetting it onto `main`.
- Sandboxes can't reach api.github.com user endpoints or charleshageit.com (proxy). Real GitHub data shows
  up in CI logs; locally the build uses the cache.
- Sheet numbering on the drawings: home 01-04, about 05, log 06, projects P-01 onward.
