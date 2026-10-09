# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/** (GitHub Pages, from the `main` branch).

It's plain HTML with no build step. To see it locally, open `index.html` in a browser.

## Adding a project

1. Put a screenshot in `img/` (a `.webp` or `.png` around 1200×630 works well).
2. In `index.html`, copy one `<article class="card glass glow">` block under **The projects** and change the
   words, links and image. Set `data-repo="your-repo-name"` and the "updated … ago" tag fills in by itself.
3. The status badge can be `badge--live` (released) or `badge--wip` (playable & growing).

The **On the workbench** list fetches every public repo from GitHub when the page loads, so new repos
show up there automatically. Give a repo a description on GitHub and it appears on its card.

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

- `index.html`: the page, with its layout styles and scripts inline.
- `css/tokens.css`, `css/theme.css`, `js/fx.js`: the shared theme (see above).
- `fonts/`: Pixelify Sans, Geist and Geist Mono, trimmed to Latin characters, with their licences (SIL OFL).
- `pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip), for the Pip who walks around the top of the page.
- `img/`: screenshots and icons.
- `CNAME`: the custom domain. Don't delete it.
