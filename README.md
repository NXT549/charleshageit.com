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
  tagline), `highlights`, `status` (`done` gives it a "Shipped" sticker, `wip` "In progress"), `image` and `imageAlt`
  (put screenshots in `public/img/`, around 1200×630), `live` (the "Play in your browser" link, otherwise the repo's
  website from GitHub), `embed: true` (adds a "Try it right here" button that plays the live site inside the
  card), `pop` (the card's own ink, for its picture's backdrop, its number and its halftone shadow: a flavour name
  like `lemon` or `cherry`), `scene: "desk"` (stands a pixel-art image on a ground line in front of a disc of ink), `note` (a handwritten note on
  the picture, `\n` for a new line), `platforms` (download buttons to always show, linking to the release page
  when there's no installer for one), `frameworks` (extra framework tags if they aren't detected),
  `does` (up to 8 `{title, text}` cards under "What it does" on the project's page) and `how` (up to 8
  `{title, text, note?}` steps under "How it works", with an optional handwritten `note`). Projects with
  neither show a "Still at the printer" sticker instead.
- **A picture from the sketchbook** on the project's page: `ascii` names a piece (`slots`, `market`, `pip-boot`, ...),
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
it, and a project's page shows its own picture when `ascii` is set. There are nine pictures, listed in
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
- **Tints** use the printing's inks, on a block of solid ink: `yellow` is the spot ink, `cyan` its partner, `green` a
  fixed mint and `chalk` the paper colour (`data-tint` in `src/styles/ascii.css`). The first two change with Pip's flavour.
- The files: `src/pages/ascii/index.astro` (the page) and `ascii/fonts/[font].json.ts`, `src/components/AsciiFigure.astro`
  (one window and its copy button), `src/components/Sketchbook.astro` (Fig. 3), `src/lib/ascii.ts`,
  `src/scripts/ascii.ts`, `src/styles/ascii.css`, `showcase/ascii.mjs` and `showcase/cyber.mjs`.

## Theme

The site is printed like a catalogue off a risograph: vanilla paper, licorice ink and one bright spot ink, with
halftone dots for shadows and big soft headlines. **The spot ink is Pip's flavour.** Click Pip, type `pip grape` in
the terminal or pick a bean in the footer and the whole site is reprinted in that ink, flooding out from where it was
picked. The choice is remembered, and applied before the next page paints.

- **Tokens**: colours, fonts, spacing and linework are CSS variables in `src/styles/tokens.css`. Use those instead of
  hard-coding values. `--paper`, `--ink` and their quieter shades are fixed; `--spot` (the loud colour), `--spot-ink`
  (the same ink, dark enough for text on paper) and `--spot-2` (the partner ink, for overprints and halftones) change
  with the flavour.
- **The nine inks**: one per flavour in `src/components/pip-sprites.js` (cherry, lime, blueberry, lemon, grape,
  licorice, bubblegum, pumpkin, candy cane), each a bright colour and an `-ink` shade, plus a
  `:root[data-flavour="..."]` rule that picks its partner. A bright ink always reads under ink text and as text on an
  ink block; `showcase/test/theme.test.mjs` checks that for all nine, since Lighthouse only ever sees cherry. To add a
  flavour, add its two colours and its rule there.
- **Flavour** (`src/scripts/flavour.ts`): sets `data-flavour` on `<html>`, saves it, fires `flavourchange` and runs the
  ink flood (a view transition; skipped where unsupported and for reduced motion). `Pip.astro` and the footer's picker
  both go through it. `PipIcon.astro` is the little SVG Pip in the masthead and footer, coloured by CSS variables
  that `Base.astro` writes from the sprite palettes, so it changes flavour without a script.
- **Type**: headlines are Fraunces (a cut made for this site: the 144pt optical size, soft and wonky, weights 600 to
  900, with an 800 italic), body text is Geist, labels and code are Geist Mono and the handwritten notes are Caveat.
  All self-hosted in `src/fonts/` under the SIL OFL. The Fraunces files were cut from the variable font with
  fontTools' instancer (`opsz=144, SOFT=100, WONK=1`); `Fraunces-Display-900.woff` is the same cut for the social cards.
- **Reusable pieces** live in `src/styles/theme.css`: `.panel` / `.glass` (a card), `.glow` (a card with a halftone
  shadow that grows on hover; set `--pop` for its ink), `.ink-block` and `.terminal` (solid ink with light text),
  `.btn--primary` / `--secondary` / `--ghost`, `.tag`, `.badge--live` / `--wip` / `--info` (stickers: shipped is solid,
  in progress is outlined, so status never depends on colour), `.burst` (the starburst sticker), `.hand` (handwritten
  note), `.text-pop` (a bar of spot ink behind a word), `.dots` (a halftone field) and `.eyebrow`. The comment at the
  top of the file lists them all. `.bean-word` in `page.css` sits a headline's last words on a jellybean of spot ink.
- **Motion**: `src/scripts/fx.js` slaps the stickers down and brings the pieces of a page (section headings, project
  cards, about panels, log entries, the footer's Pip) in as they scroll into view: they rise into place, the spot bar
  is printed across the heading and handwritten notes write themselves in. Add a selector to its `SHEETS` list to give
  something else the same entrance. Anything on screen at load stays put. Pure CSS does the rest: the headline's spot
  pass sliding into register, the ticker under the hero, the turning starburst, a progress line under the masthead
  and a little drift on project screenshots (scroll timelines; skipped where unsupported). All of it is off for
  people who prefer reduced motion.
- **Outside the stylesheet**: `src/lib/og.ts` (the social cards) and the `theme-color` meta tag in `Base.astro` can't
  read CSS variables, so they keep their own copies of the colours. The theme test fails if they drift.

## Pages

- `/`: the home page: the hero (the headline, the terminal, Pip's runway and the ticker), the featured projects,
  the sketchbook teaser, the workbench grid and a short about.
- `/projects/<repo>/`: a spec sheet for every project on the workbench, made automatically from GitHub: what it is,
  how to get it, its languages, its latest releases and commits, and its whole README (links inside the repo go to GitHub).
- `/about/`: the longer about, how a thing gets made here, and what's on the bench right now.
- `/log/`: the workshop log, every recent commit, release and new project across the workbench, newest first.
- `/ascii/`: the sketchbook, pictures drawn in plain text (see [The sketchbook](#the-sketchbook)).
- `/404.html`: "This page is out of print.", where GitHub Pages sends any address that doesn't exist.

The hero's terminal takes commands once its intro has typed out: `help` lists them (`ls`, `open pip`, `play
hamster-slots`, `log`, `pip grape`, `pip say hi`, `ascii pip`, `banner hello`, `neofetch`, `hack`, ...). Pip remembers his
flavour between visits, the site is printed in it, and the tab icon matches it.

Every page carries a number, like pages in a catalogue: the home page's sections are No. 01 to 04, about is page 05,
the log 06 and the sketchbook 07, and each project is a plate (P-01 onward, featured projects first).

## Files

- `src/pages/index.astro`: the home page, put together from the sections in `src/components/`.
- `src/pages/projects/[name].astro`, `about.astro`, `log.astro`, `404.astro`: the other pages, all on `src/layouts/Page.astro`.
- `src/lib/readme.ts`: turns a README into HTML for its project page (`src/styles/prose.css` styles it).
- `src/scripts/shell.ts`: the hero terminal's commands.
- `src/components/Hero.astro`: the intro, with the GitHub status pill (`StatusBadge.astro`), jump-links to the
  featured projects, the terminal, Pip on his runway (`Pip.astro`) and the ticker.
- `src/components/Header.astro` and `Footer.astro`: the dateline and masthead, and the colophon with the ink picker.
- `src/components/FilterBar.astro`: the language / framework / topic filter for the workbench grid.
- `src/layouts/Base.astro`: the `<head>`: title, description, social preview tags, structured data, styles, font
  preloads and the one inline line that applies the saved flavour before the page paints.
- `src/lib/site.ts`: the site's name, description and links, used everywhere above.
- `src/lib/showcase.ts`: fetches the GitHub data once per build. Without GitHub it uses the cached
  `data/github-raw.json` with the current `showcase/config.json` applied, so card edits still show up.
- `src/pages/og.png.ts` and `src/lib/og.ts`: draw the 1200×630 social preview card at build time.
- `showcase/`: the GitHub fetch and card rendering (`config.json` to tweak, tests in `test/`). No dependencies.
- `data/github.json`: the last saved copy of the repo data.
- `src/styles/`, `src/scripts/`, `src/fonts/`: the theme, the showcase card styles, and the fonts (Fraunces, Geist, Geist Mono and Caveat; SIL OFL).
- `src/components/pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip).
- `public/`: files served as they are: `img/`, `robots.txt` and `CNAME` (the custom domain; don't delete it).
