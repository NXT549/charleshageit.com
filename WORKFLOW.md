# WORKFLOW.md: how work gets done here

The process doc. [AGENTS.md](AGENTS.md) is the map and the rules, [DESIGN.md](DESIGN.md) is how it
fits together. This file is how a change goes from a request to the live site, and how the docs stay
true while that happens.

## Starting a session

1. Read [AGENTS.md](AGENTS.md) (rules, map, gotchas). Open [DESIGN.md](DESIGN.md) for anything
   touching data flow, styling or the sketchbook.
2. Check [Where things stand](#where-things-stand) at the bottom of this file.
3. `git fetch origin main` and look at `git log --oneline -15` to see what changed recently.
4. `npm ci`, then `SHOWCASE_OFFLINE=1 npm run build` to confirm you start from green.

## The loop for one change

```
branch from main ─► change ─► look at it ─► checks ─► update docs ─► commit ─► push ─► PR ─► merge ─► live
```

1. **Branch from `main`.** One PR per batch of related work. If the branch's last PR was already
   merged, reset the branch onto `main` first; never stack on merged history.
2. **Make the change** in the smallest place that owns it (the table in AGENTS.md says where).
   Content tweaks are usually `showcase/config.json` and nothing else.
3. **Look at it.** `npm run dev` on :4321. For anything visual, take screenshots at phone and desktop
   widths, and check it with reduced motion and with JavaScript off. A new visual direction gets
   shown to Charles before it is committed.
4. **Run the checks** (all must pass before a push):
   ```sh
   npm run check
   node --test "showcase/test/*.test.mjs"
   SHOWCASE_OFFLINE=1 npm run build
   ```
   If you touched layout, images, fonts, scripts or anything in `<head>`, also run `npx lhci autorun`.
   If you touched copy, data or art, grep `dist/` for anything that hints at a location.
5. **Update the docs** the change made stale (see [Keeping the docs alive](#keeping-the-docs-alive)).
6. **Commit** with a plain sentence saying what changed for a visitor or a maintainer, in the style
   of `git log` ("Give every page its own social card"). No location details in messages.
7. **Push and open a PR** only when asked to. CI runs the same checks plus Lighthouse, which blocks
   the PR below performance 95 or anything under 100 for accessibility, best practices or SEO.
8. **Merge to `main`** deploys within a couple of minutes. Check the "Build and deploy" run, then the
   live page.

## Definition of done

- [ ] Type check, tests and offline build pass
- [ ] Lighthouse budget holds on every page
- [ ] Works with JavaScript off; motion is skipped for reduced motion; keyboard reachable
- [ ] Colours, fonts and spacing come from tokens; `src/lib/og.ts` mirrored if the theme changed
- [ ] Nothing reveals a location (copy, meta, data, art, commit message)
- [ ] No generated file edited by hand
- [ ] New logic in `showcase/` has a test
- [ ] Docs updated in the same PR

## Recipes

### Change what a project card says

Edit `repos.<name>` in `showcase/config.json` (README.md lists every option). Put screenshots in
`public/img/`, about 1200×630, and set `image`, `imageAlt`, `imageWidth`, `imageHeight`. Offline
builds apply the config to the cached data, so you can preview it without the network.

### Add a page

1. Create `src/pages/<name>.astro` on `layouts/Page.astro`; give it the next sheet number and an
   eyebrow like `Sheet 08 · Title`.
2. Link it from `components/Header.astro`.
3. Add its social card in `src/pages/og/[...slug].png.ts` and pass `image`/`imageAlt` to `Page`.
4. Add entrance selectors to `SHEETS` in `scripts/fx.js` if it has new kinds of blocks.
5. Update the page tables in README.md and DESIGN.md §3, the map and sheet numbers in AGENTS.md.

### Add a sketchbook picture

1. Write a pure, seeded generator in `showcase/cyber.mjs` (or a hand-drawn file in
   `src/ascii/art/`, frames split by a `~~~` line) and add it to `PIECES`.
2. Give it frames in `src/lib/ascii.ts`.
3. Add a test in `showcase/test/ascii.test.mjs` (same seed, same frames; all frames the same size).
4. Optionally point a project at it with `ascii` in the config. Update the list in README.md.

### Add a field from GitHub

1. Add it to the GraphQL `QUERY` and `fromGraphQLRepo`, **and** to `fromRestRepo` in
   `showcase/fetch.mjs`, then carry it through `normalize()`.
2. Add it to the `Repo` type in `src/lib/showcase.ts`, the fixture in `showcase/test/fixtures/` and a test.
3. Render it. Remember the cached snapshot won't have the field, so handle it being missing.

### Add a config option

Read it in `normalize()` (validate and trim it there, as `does`/`how` do), render it, test it, and
document it in README.md's "Customise a card" list. Never rename an existing option casually; the
live config depends on it.

### Change the theme

Edit `src/styles/tokens.css`, mirror the values into `C` in `src/lib/og.ts`, rebuild and look at
`/og.png` plus one project card. Update DESIGN.md §5 and README.md "Theme". Show screenshots first.

### Change a rebuild trigger or CI step

Edit `.github/workflows/deploy.yml` and bring `docs/keeping-it-fresh.md` and DESIGN.md §7 with it.

## When something goes wrong

| Symptom | Likely cause |
| --- | --- |
| Local build shows old or missing projects | It fell back to the cached `data/` (look for the `[showcase] couldn't reach GitHub` warning). Expected in sandboxes. |
| Build fails in `src/lib/ascii.ts` | A sketchbook piece produced no frames. |
| `astro check` fails on a `showcase/*.mjs` import | A JSDoc default made TypeScript infer too narrow a type; see the cast in `src/lib/showcase.ts`. |
| Lighthouse performance dips | A new image without dimensions or `loading="lazy"`, a font not preloaded, or too much inlined CSS/JS. |
| Lighthouse accessibility below 100 | Contrast (use the text tokens), a control without a name, or heading order. README-rendered pages are the usual place. |
| Live site didn't update | See "When a rebuild shows nothing new" in `docs/keeping-it-fresh.md`. |
| `node showcase/build.mjs` errors about `index.html` | That CLI predates Astro; only `--summary` works. |

## Keeping the docs alive

These files are meant to change as the project does. The rule: **the PR that makes a doc wrong also
fixes it.** Edit in place, delete what is no longer true, and keep each fact in one file only.

| If you change... | Update |
| --- | --- |
| A file's location, a new directory, a command, a gotcha | AGENTS.md (map, commands, gotchas) |
| A hard rule or working agreement | AGENTS.md |
| Data flow, a contract, the page list, client JS, CI behaviour | DESIGN.md |
| Tokens, theme pieces, the look, the voice | DESIGN.md §5 (+ README.md "Theme") |
| A design decision someone might undo later | DESIGN.md §8, one row with the reason |
| The process, a checklist item, a recipe, a new failure mode | WORKFLOW.md |
| A `config.json` option, a page, the sketchbook's pictures | README.md |
| Rebuild triggers or secrets | docs/keeping-it-fresh.md |
| What's in progress, done or known-broken | "Where things stand" below |

`CLAUDE.md` only imports AGENTS.md and adds Claude-specific notes; don't duplicate content into it.
Keep every file short enough to read in one sitting. When a section grows past that, cut it rather
than adding another file.

## Where things stand

Update this at the end of a session: move finished items out, add what you left unfinished and
anything the next agent should know. Keep it to a screenful.

**Live**: home (sheets 01-04), about (05), workshop log (06), sketchbook (07), a spec sheet and
social card per project, the hero terminal, workbench filters. Three featured projects:
`hamster-slots`, `pip`, `stock-review`.

**Known loose ends**

- `showcase/build.mjs` is a leftover from before Astro and mostly broken (it wants a root
  `index.html`). Either delete it or reduce it to a script that refreshes `data/`.
- Nothing refreshes the committed `data/` snapshot, so offline previews drift from the live site.
- A few code comments still mention `index.html` and `js/fx.js` (for example the header of
  `src/styles/theme.css`).

**Next up**: nothing queued. Ask Charles.
