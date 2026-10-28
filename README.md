# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/**.

The site is built with [Astro](https://astro.build) into plain static HTML, and a GitHub Actions workflow
(`.github/workflows/deploy.yml`) deploys it to GitHub Pages on every push to `main` and every 6 hours.

## Working on it

```sh
npm install
npm run dev      # local preview at http://localhost:4321 with live reload
npm run build    # writes the finished site to dist/ (SHOWCASE_OFFLINE=1 skips GitHub and uses the cached data)
npm run check    # type-checks the .astro and .ts files
node --test "showcase/test/*.test.mjs"
npx lhci autorun # Lighthouse on the built site (needs Chrome; set CHROME_PATH if it can't find it)
```

Pull requests run all of these. Lighthouse has to score at least 95 for performance and 100 for
accessibility, best practices and SEO (`lighthouserc.json`); the reports are attached to each run.

## The projects (from GitHub)

The project cards are built from the GitHub API, not written by hand. Every build pulls every public
repo (stars, language, topics, recent commits, releases, README) and renders the cards into the page,
and the site rebuilds every 6 hours and on every push to `main`. Nothing calls GitHub when someone visits
the page. If GitHub can't be reached, the build falls back to the copy saved in `data/github-raw.json`,
with the current `showcase/config.json` applied.

- **New repos show up by themselves** under **On the workbench**. Give a repo a description and some
  topics on GitHub and they appear on its card. Forks, archived repos and your profile repo are skipped.
- **The projects** (the big spotlight cards) are the repos listed under `featured` in `showcase/config.json`,
  plus any repo with the `featured` topic on GitHub.
- **Hide a repo** by adding it to `hide` in `showcase/config.json`.
- **Customise a card** under `repos` in `showcase/config.json`: `blurb` (its first sentence becomes the bold
  tagline), `highlights`, `status` (`done` stamps it "Shipped", `wip` "In progress"), `image` and `imageAlt`
  (put screenshots in `public/img/`, around 1200×630), `live` (the "Play in your browser" link, otherwise the repo's
  website from GitHub), `embed: true` (adds a "Try it right here" button that plays the live site inside the
  card), `pop` (the colour the card leaves behind on hover, a theme colour name like `highlighter` or
  `blue-pencil`), `scene: "desk"` (Pip's spec drawing behind a pixel-art image), `note` (a handwritten note on
  the picture, `\n` for a new line), `platforms` (download buttons to always show, linking to the release page
  when there's no installer for one), `frameworks` (extra framework tags if they aren't detected),
  `does` (up to 8 `{title, text}` cards under "What it does" on the project's page) and `how` (up to 8
  `{title, text, note?}` steps under "How it works", with an optional handwritten `note`). Projects with
  neither show an "On the drafting board" stamp instead.
- **A picture from the sketchbook** on the project's sheet: `ascii` names a piece (`slots`, `market`, `pip-boot`, ...),
  shown under "In characters". The ids are the catalogue in `showcase/cyber.mjs`.
- **Download buttons** come from the latest GitHub release: an `.exe`/`.msi` becomes Windows, a `.dmg`
  becomes Mac, an `.AppImage`/`.deb` becomes Linux.
- **Frameworks** (Vite, Electron, React, Flask, ...) are detected from each repo's `package.json`,
  `requirements.txt` or `pyproject.toml`, and from its topics.

To refresh straight away, run the **Build and deploy** workflow from the Actions tab, or have a repo ping the
site when it changes (see [docs/keeping-it-fresh.md](docs/keeping-it-fresh.md)). Contributor and Claude guidance is in [CLAUDE.md](CLAUDE.md).

The filter chips above the workbench grid come from `facets` in the data, so a new language, framework or
GitHub topic gets its own chip automatically. Filtered views keep their choice in the URL
(`?language=typescript&framework=vite`), so they can be shared.

Each card carries `data-language`, `data-frameworks`, `data-topics` and `data-tags` attributes, and
`data/github.json` lists every language, framework and topic with counts under `facets`, for filters.

## The sketchbook

The sketchbook (`/ascii/`) is pictures drawn in plain text, using only letters, numbers, punctuation and spaces,
each in a little terminal window with its file name on the title bar. Fig. 3 on the home page shows a taste of
it, and a project's sheet shows its own picture when `ascii` is set. There are nine pictures, listed in
`showcase/cyber.mjs` (`PIECES`: id, file name, title, group, tint, speed):

- **Pip, in the machine** (`pip-boot`, `pip-binary`, `pip-glitch`): his frames from `src/components/pip-sprites.js`,
  one character per pixel (`showcase/ascii.mjs` maps each sprite key to a character and crops every frame to one
  box so nothing jumps), then booted behind a scan line, turned into ones and zeros, and glitched.
- **The projects** (`slots`, `market`, `boot`, `procs`): a spinning slot machine for Hamster Slots, a scrolling
  candlestick chart with silly made-up tickers for Stock Review, and a boot log and a process table that are drawn
  from the live project list, so they update themselves on every rebuild.
- **Hardware** (`robot`, `chip`): the hand-drawn robot lives in `src/ascii/art/robot.txt` (frames separated by a line
  holding only `~~~`), and the chip's data pulses are generated.
- **The banner maker** sets words in six FIGlet fonts (`src/ascii/fonts/`, each with its permission notice: the Cyber
  fonts by Lennert Stock converted by Kent Nassen, Speed by Claude Martins, Slant and Standard by Glenn Chappell and
  Ian Chai). The first font is inline; the others are static JSON at `/ascii/fonts/<id>.json`, fetched when picked. The
  words and font go in the address bar, so a banner can be shared, and `banner <words>` in the terminal opens one.

The generators in `showcase/cyber.mjs` are pure and seeded (same input, same frames), with tests in
`showcase/test/ascii.test.mjs`. `src/lib/ascii.ts` builds the pieces at build time and fails the build if one has no
frames. To add a picture: add it to `PIECES`, give `src/lib/ascii.ts` its frames, and (optionally) point a project's
`ascii` at its id.

- **Motion** (`src/scripts/ascii.ts`): frames step only while they're on screen, and not at all for reduced motion,
  where the first frame shows. Every frame is a `<pre>` stacked in one grid cell, so the box never changes size. A
  picture wider than its box takes a tab stop so keyboard users can scroll it. Without the script the sketchbook is
  still all there, just still.
- **Tints** use the theme's pens: `cyan` is the blue pencil, `yellow` the highlighter, `green` the stamp and `chalk`
  the plain linework (`data-tint` in `src/styles/ascii.css`).
- The files: `src/pages/ascii/index.astro` (the page) and `ascii/fonts/[font].json.ts`, `src/components/AsciiFigure.astro`
  (one window and its copy button), `src/components/Sketchbook.astro` (Fig. 3), `src/lib/ascii.ts`,
  `src/scripts/ascii.ts`, `src/styles/ascii.css`, `showcase/ascii.mjs` and `showcase/cyber.mjs`.

## Theme

The site is drawn like a blueprint for the workshop: navy grid paper, chalk-white linework, a yellow
highlighter, cyan dimension lines, handwritten notes and rubber stamps. Headings and body text use Geist,
labels and code use Geist Mono, and the handwritten notes use Caveat.

- Colours, fonts, spacing and linework are CSS variables in `src/styles/tokens.css`. Use those instead of hard-coding values.
- Reusable pieces live in `src/styles/theme.css`: `.panel` / `.glass` (drawing frame), `.glow` (lifts on hover and leaves an
  offset outline; set `--pop` for its colour), `.sheet` and `.titleblock` (crop marks and the drawing's title block),
  `.terminal`, `.btn--primary` / `--secondary` / `--ghost`, `.tag`, `.badge--live` / `--wip` / `--info` (rubber stamps),
  `.hand` (handwritten note), `.circled` (hand-drawn loop around a word), `.text-pop` (highlighter), `.dim` (dimension line)
  and `.eyebrow`. The comment at the top of the file lists them all.
- Scroll motion: `src/scripts/fx.js` makes the stamps thunk down, and deals sheets (section headings, project cards,
  about panels, log entries, the footer's Pip) onto the page as they scroll into view: they drop in at a slight angle,
  the heading's highlighter swipes across and handwritten notes write themselves in. Add a selector to its `SHEETS`
  list to give something else the same entrance. Anything on screen at load stays put. Pure CSS adds a highlighter
  progress line under the header and a little drift on project screenshots (scroll timelines; skipped where
  unsupported). With a mouse, a CAD cursor (also in `fx.js`) snaps a little square to the grid paper's intersections
  and reads out its coordinates. All of it is off for people who prefer reduced motion, and the cursor never
  appears on touch screens.

## Pages

- `/`: the home page: the hero, the featured projects, the workbench grid and a short about.
- `/projects/<repo>/`: a spec sheet for every project on the workbench, made automatically from GitHub: what it is,
  how to get it, its languages, its latest releases and commits, and its whole README (links inside the repo go to GitHub).
- `/about/`: the longer about, how a thing gets made here, and what's on the bench right now.
- `/log/`: the workshop log, every recent commit, release and new project across the workbench, newest first.
- `/ascii/`: the sketchbook, pictures drawn in plain text (see [The sketchbook](#the-sketchbook)).
- `/404.html`: "This page went walkabout.", where GitHub Pages sends any address that doesn't exist.

The hero's terminal takes commands once its intro has typed out: `help` lists them (`ls`, `open pip`, `play
hamster-slots`, `log`, `pip grape`, `pip say hi`, `ascii pip`, `banner hello`, `neofetch`, `hack`, ...). Pip remembers his flavour between visits, and the tab icon matches it.

## Files

- `src/pages/index.astro`: the home page, put together from the sections in `src/components/`.
- `src/pages/projects/[name].astro`, `about.astro`, `log.astro`, `404.astro`: the other pages, all on `src/layouts/Page.astro`.
- `src/lib/readme.ts`: turns a README into HTML for its project page (`src/styles/prose.css` styles it).
- `src/scripts/shell.ts`: the hero terminal's commands.
- `src/components/Hero.astro`: the intro, with the GitHub status badge (`StatusBadge.astro`), jump-links to the
  featured projects and Pip (`Pip.astro`).
- `src/components/FilterBar.astro`: the language / framework / topic filter for the workbench grid.
- `src/layouts/Base.astro`: the `<head>`: title, description, social preview tags, structured data, styles and font preloads.
- `src/lib/site.ts`: the site's name, description and links, used everywhere above.
- `src/lib/showcase.ts`: fetches the GitHub data once per build. Without GitHub it uses the cached
  `data/github-raw.json` with the current `showcase/config.json` applied, so card edits still show up.
- `src/pages/og.png.ts` and `src/lib/og.ts`: draw the 1200×630 social preview card at build time.
- `showcase/`: the GitHub fetch and card rendering (`config.json` to tweak, tests in `test/`). No dependencies.
- `data/github.json`: the last saved copy of the repo data.
- `src/styles/`, `src/scripts/`, `src/fonts/`: the theme, the showcase card styles, and the fonts (Geist, Geist Mono and Caveat; SIL OFL).
- `src/components/pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip).
- `public/`: files served as they are: `img/`, `robots.txt` and `CNAME` (the custom domain; don't delete it).
