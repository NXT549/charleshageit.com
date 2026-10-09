# charleshageit.com

Charles's workshop: the little things I've vibe-coded, finished and in progress.
Live at **https://charleshageit.com/** (GitHub Pages, from the `main` branch).

It's plain HTML with no build step. To see it locally, open `index.html` in a browser.

## Adding a project

1. Put a screenshot in `img/` (a `.webp` or `.png` around 1200×630 works well).
2. In `index.html`, copy one `<article class="card">` block under **The projects** and change the
   words, links and image. Set `data-repo="your-repo-name"` and the "updated … ago" tag fills in by itself.
3. The sticker can be `done` (Released!), `wip` (Playable & growing) or `learn` (Learning).

The **On the workbench** list fetches every public repo from GitHub when the page loads, so new repos
show up there automatically. Give a repo a description on GitHub and it appears on its card.

## Files

- `index.html`: the whole site (styles and scripts inline).
- `pip-sprites.js`: Pip's sprites and flavours, copied from [NXT549/pip](https://github.com/NXT549/pip), for the Pip who walks around the top of the page.
- `img/`: screenshots and icons.
- `CNAME`: the custom domain. Don't delete it.
