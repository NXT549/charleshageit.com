# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/** (GitHub Pages, from the `main` branch).

It's plain HTML with no build step. To see it locally, open `index.html` in a browser.

## Adding a project

1. Put a screenshot in `img/` (a `.webp` or `.png` around 1200×630 works well).
2. In `index.html`, copy one `<article class="card glass glow">` block under **The projects** and change the
   words, links and image. Set `data-repo="your-repo-name"` and the "updated … ago" tag fills in by itself.
3. The stamp can be `badge--live` (shipped) or `badge--wip` (in progress).

The **On the workbench** list fetches every public repo from GitHub when the page loads, so new repos
show up there automatically. Give a repo a description on GitHub and it appears on its card.

## Theme

The site is drawn like a blueprint for the workshop: navy grid paper, chalk-white linework, a yellow
highlighter, cyan dimension lines, handwritten notes and rubber stamps. Headings and body text use Geist,
labels and code use Geist Mono, and the handwritten notes use Caveat.

- Colours, fonts, spacing and linework are CSS variables in `css/tokens.css`. Use those instead of hard-coding values.
- Reusable pieces live in `css/theme.css`: `.panel` / `.glass` (drawing frame), `.glow` (lifts on hover and leaves an
  offset outline; set `--pop` for its colour), `.sheet` and `.titleblock` (crop marks and the drawing's title block),
  `.terminal`, `.btn--primary` / `--secondary` / `--ghost`, `.tag`, `.badge--live` / `--wip` / `--info` (rubber stamps),
  `.hand` (handwritten note), `.circled` (hand-drawn loop around a word), `.text-pop` (highlighter), `.dim` (dimension line)
  and `.eyebrow`. The comment at the top of the file lists them all.
- `js/fx.js` makes the stamps thunk down as they scroll into view.

## Files

- `index.html`: the page, with its layout styles and scripts inline.
- `css/tokens.css`, `css/theme.css`, `js/fx.js`: the shared theme (see above).
- `fonts/`: Geist, Geist Mono and Caveat, trimmed to Latin characters, with their licences (SIL OFL).
- `pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip), for the Pip who walks around the top of the page.
- `img/`: screenshots and icons.
- `CNAME`: the custom domain. Don't delete it.
