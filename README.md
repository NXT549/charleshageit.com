# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/**.

The site is built with [Astro](https://astro.build) into plain static HTML, and a GitHub Actions workflow
(`.github/workflows/deploy.yml`) deploys it to GitHub Pages on every push to `main` and every 6 hours.

## Working on it

```sh
npm install
npm run dev      # local preview at http://localhost:4321 with live reload
npm run build    # writes the finished site to dist/ (SHOWCASE_OFFLINE=1 skips GitHub and uses data/github.json)
npm run check    # type-checks the .astro and .ts files
node --test "showcase/test/*.test.mjs"
npx lhci autorun # Lighthouse on the built site (needs Chrome; set CHROME_PATH if it can't find it)
```

Pull requests run all of these. Lighthouse has to score at least 95 for performance and 100 for
accessibility, best practices and SEO (`lighthouserc.json`); the reports are attached to each run.

## The projects (from GitHub)

The project cards are built from the GitHub API, not written by hand. Every build pulls every public
repo (stars, language, topics, latest commit, latest release, README) and renders the cards into the page,
and the site rebuilds every 6 hours and on every push to `main`. Nothing calls GitHub when someone visits
the page. If GitHub can't be reached, the build uses the last saved copy in `data/github.json`.

- **New repos show up by themselves** under **On the workbench**. Give a repo a description and some
  topics on GitHub and they appear on its card. Forks, archived repos and your profile repo are skipped.
- **The projects** (the big spotlight cards) are the repos listed under `featured` in `showcase/config.json`,
  plus any repo with the `featured` topic on GitHub.
- **Hide a repo** by adding it to `hide` in `showcase/config.json`.
- **Customise a card** under `repos` in `showcase/config.json`: `blurb`, `highlights`, `status` (`done` or
  `wip`), `image` and `imageAlt` (put screenshots in `public/img/`, around 1200×630), `live` (the "Play it live"
  link, otherwise the repo's website from GitHub), `embed: true` (adds a "Try it right here" button that
  plays the live site inside the card), `pop` (the card's hover colour, a theme colour name like `lemon`
  or `cherry`), `scene: "desk"` (Pip's night-time desk behind a pixel-art image), `platforms` (download
  buttons to always show, linking to the release page when there's no installer for one) and `frameworks`
  (extra framework tags if they aren't detected).
- **Download buttons** come from the latest GitHub release: an `.exe`/`.msi` becomes Windows, a `.dmg`
  becomes macOS, an `.AppImage`/`.deb` becomes Linux.
- **Frameworks** (Vite, Electron, React, Flask, ...) are detected from each repo's `package.json`,
  `requirements.txt` or `pyproject.toml`, and from its topics.

To refresh straight away, run the **Build and deploy** workflow from the Actions tab.

The filter chips above the workbench grid come from `facets` in the data, so a new language, framework or
GitHub topic gets its own chip automatically. Filtered views keep their choice in the URL
(`?language=typescript&framework=vite`), so they can be shared.

Each card carries `data-language`, `data-frameworks`, `data-topics` and `data-tags` attributes, and
`data/github.json` lists every language, framework and topic with counts under `facets`, for filters.

## Theme

The site is a dark toy box: an inky purple night with cream text, candy colours from Pip's flavours
(plus emerald `#10B981` and cyan `#06B6D4` as the main accents), chunky outlines and hard shadows.
Headings use Pixelify Sans, body text Geist, and code and labels Geist Mono.

- Colours, fonts, spacing and effects are CSS variables in `src/styles/tokens.css`. Use those instead of hard-coding values.
- Reusable pieces live in `src/styles/theme.css`: `.panel` / `.glass` (chunky card), `.glow` (hops up on hover with a
  candy shadow; set `--pop` to pick the colour), `.terminal` (retro window with prompt lines, typed commands and a
  cursor), `.btn--primary` / `--secondary` / `--ghost`, `.tag`, `.badge--live` / `--wip` / `--info` (stickers),
  `.eyebrow` (tilted sticker label; set `--sticker`), `.text-pop` and `.wiggle`. The comment at the top of the file lists them all.
- Clicking Pip changes `--flavour`, so hover shadows and the hero's "for fun." turn his colour.
- `src/scripts/fx.js` adds pixel sparkles when you press a button (or anything with `data-sparkle`).

## Files

- `src/pages/index.astro`: the page, put together from the sections in `src/components/`.
- `src/components/Hero.astro`: the intro, with the GitHub status badge (`StatusBadge.astro`), jump-links to the
  featured projects and Pip (`Pip.astro`).
- `src/components/FilterBar.astro`: the language / framework / topic filter for the workbench grid.
- `src/layouts/Base.astro`: the `<head>`: title, description, social preview tags, structured data, styles and font preloads.
- `src/lib/site.ts`: the site's name, description and links, used everywhere above.
- `src/lib/showcase.ts`: fetches the GitHub data once per build (falls back to `data/github.json`).
- `src/pages/og.png.ts` and `src/lib/og.ts`: draw the 1200×630 social preview card at build time.
- `showcase/`: the GitHub fetch and card rendering (`config.json` to tweak, tests in `test/`). No dependencies.
- `data/github.json`: the last saved copy of the repo data.
- `src/styles/`, `src/scripts/`, `src/fonts/`: the theme, the showcase card styles, and the fonts (Pixelify Sans, Geist, Geist Mono; SIL OFL).
- `src/components/pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip).
- `public/`: files served as they are: `img/`, `robots.txt` and `CNAME` (the custom domain; don't delete it).
