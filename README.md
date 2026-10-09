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

The site is dark-only: a zinc background with emerald (`#10B981`) and cyan (`#06B6D4`) accents,
Geist for text and Geist Mono for code and labels.

- Colours, fonts, spacing and effects are CSS variables in `css/tokens.css`. Use those instead of hard-coding values.
- Reusable pieces live in `css/theme.css`: `.glass` (frosted panel), `.glow` (gradient border and spotlight on hover),
  `.terminal` (window with prompt lines, typed commands and a blinking cursor), `.btn--primary` / `--secondary` / `--ghost`,
  `.tag`, `.badge--live` / `--wip` / `--info`, `.eyebrow` and `.section-head`. The comment at the top of the file lists them all.
- `js/fx.js` makes the `.glow` spotlight follow the mouse, including on cards added later by script.

## Files

- `index.html`: the page, with its layout styles and scripts inline.
- `css/tokens.css`, `css/theme.css`, `js/fx.js`: the shared theme (see above).
- `fonts/`: Geist and Geist Mono, trimmed to Latin characters, with their licence (SIL OFL).
- `pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip), for the Pip who walks around the top of the page.
- `img/`: screenshots and icons.
- `CNAME`: the custom domain. Don't delete it.
