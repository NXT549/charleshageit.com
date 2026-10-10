# CLAUDE.md

charleshageit.com: Charles's (GitHub `NXT549`) fun, minimalist developer showcase. Astro 7 static site,
deployed to GitHub Pages by `.github/workflows/deploy.yml`. Project cards, `/projects/<repo>/`, `/about/`
and `/log/` are built from NXT549's public repos at build time; visitors never hit the GitHub API.
`README.md` has commands, config options and the file map; `docs/` has the deeper notes.

## Hard rules

1. **Never reveal where Charles lives.** No city, suburb, region, country, timezone, coordinates or GitHub
   profile location in page copy, meta/OG tags, structured data, the social card, `data/*.json`, docs or
   commit messages. Grep `dist/` before pushing if unsure.
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

## Before every push

```sh
npm ci
npm run check                            # astro check
node --test "showcase/test/*.test.mjs"   # keep the quotes (Node 22 glob)
SHOWCASE_OFFLINE=1 npm run build         # offline: uses the cached data/
```

`npm run dev` serves on :4321. `npx lhci autorun` runs Lighthouse locally (needs Chrome).
This sandbox can't reach api.github.com user endpoints or charleshageit.com, so build offline; real
GitHub data only shows up in CI.

## Map

- `src/pages/`: `index`, `about`, `log`, `404`, `projects/[name]`, `og.png.ts` (social card).
- `src/layouts/`: `Base.astro` (head, SEO, structured data), `Page.astro` (non-home pages).
- `src/components/`: Hero, Workbench, Projects, FilterBar, About, StatusBadge, Pip, Header, Footer.
- `src/lib/`: `site.ts` (name, links), `showcase.ts` (build-time fetch), `readme.ts`, `og.ts`.
- `src/scripts/`: `fx.js` (stamps), `shell.ts` (hero terminal), `showcase.js` (filters).
- `src/styles/`: `tokens.css`, `theme.css`, plus `page`, `prose`, `showcase` CSS.
- `showcase/`: dependency-free `fetch.mjs`, `detect.mjs` (pure helpers), `render.mjs` (cards),
  `build.mjs`, `config.json`, `test/`.
- `data/`: cached GitHub snapshot used when the API is unreachable.

## Content

- Rebuilds on push to `main`, every 6 hours, manual runs, and `repository_dispatch` type `repo-updated`.
- New public repos appear automatically; forks, archived repos and `hide` entries are skipped.
- Per-card tweaks go in `repos.<name>` in `showcase/config.json`. Feature a repo via `featured` there or
  the `featured` GitHub topic. More in `docs/keeping-it-fresh.md`.
- Sheet numbers on the drawings: home 01-04, about 05, log 06, projects P-01 onward.

## Working style

- Branch from `main`, one PR per batch of work. Reset a merged PR's branch onto `main` before reusing it.
- Adding a page, config option, workflow or rule? Update `README.md`, this file and `docs/` in the same PR.
  Keep this file short; delete stale lines.
