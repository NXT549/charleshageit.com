# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/** (GitHub Pages, from the `main` branch).

It's plain HTML. To see it locally, open `index.html` in a browser.

## The projects (from GitHub)

The project cards are built from the GitHub API, not written by hand. A GitHub Action
(`.github/workflows/showcase.yml`) runs every 6 hours and on every push to `main`: it pulls every public
repo (stars, language, topics, latest commit, latest release, README), writes `data/github.json`, renders
the cards into `index.html` and commits the result. Nothing calls GitHub when someone visits the page.

- **New repos show up by themselves** under **On the workbench**. Give a repo a description and some
  topics on GitHub and they appear on its card. Forks, archived repos and your profile repo are skipped.
- **The projects** (the big spotlight cards) are the repos listed under `featured` in `showcase/config.json`,
  plus any repo with the `featured` topic on GitHub.
- **Hide a repo** by adding it to `hide` in `showcase/config.json`.
- **Customise a card** under `repos` in `showcase/config.json`: `blurb`, `highlights`, `status` (`done` or
  `wip`), `image` and `imageAlt` (put screenshots in `img/`, around 1200×630), `live` (the "Play it live"
  link, otherwise the repo's website from GitHub), `embed: true` (adds a "Try it right here" button that
  plays the live site inside the card), `pop` (the card's hover colour, a theme colour name like `lemon`
  or `cherry`), `scene: "desk"` (Pip's night-time desk behind a pixel-art image), `platforms` (download
  buttons to always show, linking to the release page when there's no installer for one) and `frameworks`
  (extra framework tags if they aren't detected).
- **Download buttons** come from the latest GitHub release: an `.exe`/`.msi` becomes Windows, a `.dmg`
  becomes macOS, an `.AppImage`/`.deb` becomes Linux.
- **Frameworks** (Vite, Electron, React, Flask, ...) are detected from each repo's `package.json`,
  `requirements.txt` or `pyproject.toml`, and from its topics.

To refresh straight away, run the **GitHub showcase** workflow from the Actions tab, or locally:

```sh
node showcase/build.mjs            # fetch from GitHub and re-render (set GITHUB_TOKEN to raise the rate limit)
node showcase/build.mjs --offline  # no network: re-apply the config to the cached data/github-raw.json and re-render
node --test "showcase/test/*.test.mjs"
```

Each card carries `data-language`, `data-frameworks`, `data-topics` and `data-tags` attributes, and
`data/github.json` lists every language, framework and topic with counts under `facets`, for filters.
Don't edit anything between the `<!-- showcase:… -->` markers in `index.html`; it's overwritten on every build.

## Theme

The site is a dark toy box: an inky purple night with cream text, candy colours from Pip's flavours
(plus emerald `#10B981` and cyan `#06B6D4` as the main accents), chunky outlines and hard shadows.
Headings use Pixelify Sans, body text Geist, and code and labels Geist Mono.

- Colours, fonts, spacing and effects are CSS variables in `css/tokens.css`. Use those instead of hard-coding values.
- Reusable pieces live in `css/theme.css`: `.panel` / `.glass` (chunky card), `.glow` (hops up on hover with a
  candy shadow; set `--pop` to pick the colour), `.terminal` (retro window with prompt lines, typed commands and a
  cursor), `.btn--primary` / `--secondary` / `--ghost`, `.tag`, `.badge--live` / `--wip` / `--info` (stickers),
  `.eyebrow` (tilted sticker label; set `--sticker`), `.text-pop` and `.wiggle`. The comment at the top of the file lists them all.
- Clicking Pip changes `--flavour`, so hover shadows and the hero's "for fun." turn his colour.
- `js/fx.js` adds pixel sparkles when you press a button (or anything with `data-sparkle`).

## Files

- `index.html`: the page, with its layout styles and scripts inline. The project cards inside it are generated.
- `showcase/`: the GitHub showcase build (`config.json` to tweak, `build.mjs` to run, tests in `test/`). No dependencies, just Node 20+.
- `data/github.json`: the repo data the cards were built from, and `data/github-raw.json`, the cached API response it came from (both generated).
- `css/showcase.css`, `js/showcase.js`: card layout, plus "3 days ago" dates, copy-to-clipboard and demo embeds.
- `css/tokens.css`, `css/theme.css`, `js/fx.js`: the shared theme (see above).
- `fonts/`: Pixelify Sans, Geist and Geist Mono, trimmed to Latin characters, with their licences (SIL OFL).
- `pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip), for the Pip who walks around the top of the page.
- `img/`: screenshots and icons.
- `CNAME`: the custom domain. Don't delete it.
