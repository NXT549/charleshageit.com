// Renders the 1200×630 social preview card at build time (satori → SVG → PNG).
// It's printed like the site: vanilla paper, licorice ink, a disc of cherry ink with Pip standing on it,
// a halftone field of the partner ink and a colophon along the bottom.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import SPRITES from "../components/pip-sprites.js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Same values as the theme tokens (src/styles/tokens.css); satori can't read CSS variables.
// The card is always the cherry printing.
const C = {
  paper: "#f7f0e1",
  paper3: "#fffaf0",
  ink: "#241a2e",
  soft: "#54485e",
  onInk: "#f7f0e1",
  onInkFaint: "#a79cb0",
  spot: "#f15060",
  spot2: "#5b8def",
};
const STROKE = 3; // the page's 1.5px rules, at the card's 2x scale
const BAND = 78; // the colophon's height

export interface OgCard {
  /** Big headline. */
  title: string;
  /** One or two lines under the headline. */
  subtitle: string;
  /** Small uppercase label above the headline. */
  eyebrow?: string;
  /** Handwritten note pointing at Pip. */
  note?: string;
  /** The sticker in the corner. */
  stamp?: string;
  /** Cells of the colophon along the bottom, as [label, value]. */
  titleblock?: [string, string][];
}

type Child = Node | string;
interface Node {
  type: string;
  props: Record<string, unknown> & { children?: Child | Child[] };
}

// A tiny element factory so we don't need React for satori's input.
function h(type: string, props: Record<string, unknown> | null, ...children: Child[]): Node {
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

const require = createRequire(import.meta.url);
async function font(file: string) {
  return readFile(require.resolve(file));
}

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// A halftone field: rows of dots in the partner ink.
function dotsSvg(w: number, h: number, pitch = 16, r = 3.6): string {
  let dots = "";
  for (let y = pitch / 2; y < h; y += pitch) {
    for (let x = pitch / 2; x < w; x += pitch) dots += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  }
  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" fill="${C.spot2}">${dots}</svg>`);
}

// Pip, from the same sprite data the page uses, one square per pixel, cut out like a sticker: a border of
// paper all the way round, so he shows up on his own colour.
const PIP = { w: 32, h: 19, scale: 11 };
function pipSvg(): string {
  const frame = SPRITES.frames.idle_0;
  const pal: Record<string, string> = { ...SPRITES.base, ...SPRITES.flavors.cherry };
  const s = PIP.scale;
  let border = "";
  let pip = "";
  for (let i = 0; i < frame.length; i++) {
    const ch = frame[i];
    if (ch === ".") continue;
    const x = ((i % PIP.w) + 1) * s;
    const y = (Math.floor(i / PIP.w) + 1) * s;
    border += `<rect x="${x - s}" y="${y - s}" width="${3 * s}" height="${3 * s}" fill="${C.paper3}"/>`;
    pip += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${pal[ch]}"/>`;
  }
  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${(PIP.w + 2) * s}" height="${(PIP.h + 2) * s}" shape-rendering="crispEdges">${border}${pip}</svg>`);
}

// The little arrow under the handwritten note, pointing down at Pip.
function arrowSvg(): string {
  return dataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 30" width="69" height="45"><path d="M42 3 C 32 8, 22 20, 6 26 M6 26 l9 -1 M6 26 l4 -8" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  );
}

const mono = (size: number, color: string, extra: Record<string, unknown> = {}) => ({
  fontFamily: "Geist Mono",
  fontWeight: 500,
  fontSize: size,
  letterSpacing: size * 0.1,
  textTransform: "uppercase",
  color,
  ...extra,
});

// A jellybean of ink, like the one in front of every label on the site.
const bean = (color: string, size = 26) =>
  h("div", {
    style: {
      width: size,
      height: size * 0.66,
      borderRadius: size,
      backgroundColor: color,
      border: `${STROKE}px solid ${C.ink}`,
      transform: "rotate(-14deg)",
    },
  });

export async function renderOgPng(card: OgCard): Promise<Uint8Array> {
  const {
    title,
    subtitle,
    eyebrow = "No. 01 · Things I've vibe-coded",
    note = "this is Pip!",
    stamp = "Vibe-coded",
    titleblock = [
      ["Made by", "Charles"],
      ["Printed in", "Licorice + cherry"],
      ["See it at", "charleshageit.com"],
    ],
  } = card;

  // Shrink long names so the longest word still fits beside Pip.
  const longest = Math.max(...title.trim().split(/\s+/).map((w) => w.length));
  const titleSize = Math.max(72, Math.min(132, Math.floor(600 / (longest * 0.56))));
  const pipW = (PIP.w + 2) * PIP.scale;
  const pipH = (PIP.h + 2) * PIP.scale;
  const main = OG_HEIGHT - BAND;

  const tree = h(
    "div",
    {
      style: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.paper,
        fontFamily: "Geist",
        color: C.ink,
      },
    },
    // The printed area
    h(
      "div",
      { style: { height: main, display: "flex", position: "relative", overflow: "hidden" } },
      // The disc of spot ink, sliding off the right edge, and the halftone field overprinting it
      h("div", { style: { position: "absolute", right: -70, top: 36, width: 540, height: 540, borderRadius: 270, backgroundColor: C.spot } }),
      h("img", { src: dotsSvg(304, 208), width: 304, height: 208, style: { position: "absolute", left: 664, top: 330 } }),
      // Pip, and the note pointing at him
      h("img", { src: pipSvg(), width: pipW, height: pipH, style: { position: "absolute", right: 101, top: 221 } }),
      h(
        "div",
        { style: { position: "absolute", right: 70, top: 112, display: "flex", flexDirection: "column", alignItems: "flex-end", transform: "rotate(4deg)" } },
        h("div", { style: { fontFamily: "Caveat", fontWeight: 600, fontSize: 50, lineHeight: 1, color: C.ink } }, note),
        h("img", { src: arrowSvg(), width: 69, height: 45, style: { marginTop: 4, marginRight: 30 } }),
      ),
      // The sticker
      h(
        "div",
        {
          style: {
            position: "absolute",
            left: 700,
            top: 60,
            display: "flex",
            alignItems: "center",
            padding: "12px 20px 10px",
            ...mono(22, C.onInk, { fontWeight: 800, letterSpacing: 22 * 0.12 }),
            backgroundColor: C.ink,
            borderRadius: 14,
            transform: "rotate(-6deg)",
          },
        },
        h("div", { style: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.spot, marginRight: 12 } }),
        stamp,
      ),
      // Words
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", width: 650, padding: "58px 0 0 64px" } },
        h("div", { style: { display: "flex", alignItems: "center" } }, bean(C.spot), h("div", { style: { ...mono(20, C.soft), marginLeft: 14 } }, eyebrow)),
        h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: 26,
              fontFamily: "Fraunces",
              fontWeight: 900,
              fontSize: titleSize,
              lineHeight: 0.94,
              letterSpacing: -titleSize * 0.035,
              textShadow: `${Math.round(titleSize * 0.04)}px ${Math.round(titleSize * 0.04)}px 0 ${C.spot}`,
            },
          },
          title,
        ),
        h("div", { style: { marginTop: 30, fontSize: 30, lineHeight: 1.35, color: C.soft, maxWidth: 560 } }, subtitle),
      ),
    ),
    // The colophon: a band of ink along the bottom
    h(
      "div",
      { style: { height: BAND, display: "flex", alignItems: "center", backgroundColor: C.ink, padding: "0 64px" } },
      ...titleblock.map(([label, value], i) =>
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", marginRight: 56, flexShrink: i === titleblock.length - 1 ? 1 : 0 } },
          h("div", { style: mono(12, C.onInkFaint) }, label),
          h("div", { style: { ...mono(19, C.onInk), marginTop: 5 } }, value),
        ),
      ),
      // the printer's colour bar
      h(
        "div",
        { style: { display: "flex", marginLeft: "auto" } },
        ...[C.spot, C.spot2, C.paper3].map((c, i) =>
          h("div", { style: { width: 34, height: 34, borderRadius: 17, backgroundColor: c, marginLeft: i ? -10 : 0, border: `${STROKE}px solid ${C.ink}` } }),
        ),
      ),
    ),
  );

  const [display900, sans400, mono500, mono800, hand600] = await Promise.all([
    // Fraunces, cut for headlines like the site's (144pt, soft, wonky); see README for how it was made.
    readFile(resolve(process.cwd(), "src/fonts/Fraunces-Display-900.woff")),
    font("@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff"),
    font("@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff"),
    font("@fontsource/geist-mono/files/geist-mono-latin-800-normal.woff"),
    font("@fontsource/caveat/files/caveat-latin-600-normal.woff"),
  ]);

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Fraunces", data: display900, weight: 900, style: "normal" },
      { name: "Geist", data: sans400, weight: 400, style: "normal" },
      { name: "Geist Mono", data: mono500, weight: 500, style: "normal" },
      { name: "Geist Mono", data: mono800, weight: 800, style: "normal" },
      { name: "Caveat", data: hand600, weight: 600, style: "normal" },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
}
