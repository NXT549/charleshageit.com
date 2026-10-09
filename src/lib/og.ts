// Renders the 1200×630 social preview card at build time (satori → SVG → PNG).
// It's drawn like the site: a blueprint sheet with Pip as figure 1 and a title block along the bottom.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import SPRITES from "../components/pip-sprites.js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Same values as the theme tokens (src/styles/tokens.css); satori can't read CSS variables.
const C = {
  navy: "#0b2240",
  paper: "rgba(11, 34, 64, 0.88)",
  chalk: "#e6f0ff",
  muted: "#a9c2e6",
  faint: "#8eabd3",
  border: "rgba(230, 240, 255, 0.5)",
  hatch: "rgba(230, 240, 255, 0.22)",
  grid: "rgba(170, 205, 255, 0.13)",
  gridMajor: "rgba(170, 205, 255, 0.26)",
  highlighter: "#ffd23f",
  bluePencil: "#5fd4ff",
  stampGreen: "#34d399",
};
const STROKE = 3; // the page's 1.5px linework, at the card's 2x scale

export interface OgCard {
  /** Big headline. Its last word gets the hand-drawn loop. */
  title: string;
  /** One or two lines under the headline. */
  subtitle: string;
  /** Small uppercase label above the headline. */
  eyebrow?: string;
  /** Handwritten note pointing at Pip. */
  note?: string;
  /** The rubber stamp in the corner. */
  stamp?: string;
  /** Cells of the title block along the bottom, as [label, value]. */
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

// The grid paper behind everything: a fine 24px grid with a heavier line every 120px.
function gridSvg(): string {
  let lines = "";
  for (let x = 0; x <= OG_WIDTH; x += 24) {
    lines += `<rect x="${x}" y="0" width="${x % 120 ? 1 : 2}" height="${OG_HEIGHT}" fill="${x % 120 ? C.grid : C.gridMajor}"/>`;
  }
  for (let y = 0; y <= OG_HEIGHT; y += 24) {
    lines += `<rect x="0" y="${y}" width="${OG_WIDTH}" height="${y % 120 ? 1 : 2}" fill="${y % 120 ? C.grid : C.gridMajor}"/>`;
  }
  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">${lines}</svg>`);
}

// Figure 1: Pip (from the same sprite data the page uses) standing on a hatched floor in a dashed frame.
const FIG = { w: 400, h: 236, floor: 196, scale: 8 };
function figureSvg(): string {
  const frame = SPRITES.frames.idle_0;
  const pal: Record<string, string> = { ...SPRITES.base, ...SPRITES.flavors.cherry };
  const W = 32, H = 19, s = FIG.scale;
  const left = 48, top = FIG.floor - H * s;
  let pip = "";
  for (let i = 0; i < frame.length; i++) {
    const ch = frame[i];
    if (ch === ".") continue;
    pip += `<rect x="${left + (i % W) * s}" y="${top + Math.floor(i / W) * s}" width="${s}" height="${s}" fill="${pal[ch]}"/>`;
  }
  let hatch = "";
  for (let x = -20; x < FIG.w; x += 14) {
    hatch += `<line x1="${x}" y1="${FIG.floor + 20}" x2="${x + 20}" y2="${FIG.floor}" stroke="${C.hatch}" stroke-width="2"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${FIG.w}" height="${FIG.h}" shape-rendering="crispEdges">
    <rect x="1.5" y="1.5" width="${FIG.w - 3}" height="${FIG.h - 3}" fill="none" stroke="${C.border}" stroke-width="${STROKE}" stroke-dasharray="9 7"/>
    <clipPath id="floor"><rect x="3" y="${FIG.floor}" width="${FIG.w - 6}" height="20"/></clipPath>
    <g clip-path="url(#floor)" shape-rendering="geometricPrecision">${hatch}</g>
    <rect x="3" y="${FIG.floor}" width="${FIG.w - 6}" height="${STROKE}" fill="${C.chalk}"/>
    ${pip}
  </svg>`;
  return dataUri(svg);
}

// The site's hand-drawn loop (the one around "for fun." in the hero), stretched over a word.
function loopSvg(w: number, h: number): string {
  const sx = w / 300, sy = h / 100;
  const pts = [22, 58, 22, 16, 268, 6, 288, 40, 302, 76, 128, 98, 44, 84, 2, 76, 4, 40, 64, 24];
  const p = pts.map((v, i) => (i % 2 ? v * sy : v * sx).toFixed(1));
  const d = `M${p[0]} ${p[1]} C ${p[2]} ${p[3]}, ${p[4]} ${p[5]}, ${p[6]} ${p[7]} C ${p[8]} ${p[9]}, ${p[10]} ${p[11]}, ${p[12]} ${p[13]} C ${p[14]} ${p[15]}, ${p[16]} ${p[17]}, ${p[18]} ${p[19]}`;
  return dataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" overflow="visible"><path d="${d}" fill="none" stroke="${C.highlighter}" stroke-width="6" stroke-linecap="round"/></svg>`,
  );
}

// The little arrow under the handwritten note, pointing down at Pip.
function arrowSvg(): string {
  return dataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 30" width="69" height="45"><path d="M42 3 C 32 8, 22 20, 6 26 M6 26 l9 -1 M6 26 l4 -8" fill="none" stroke="${C.highlighter}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
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

// A dimension line: |—— label ——|
function dim(label: string, width: number) {
  const tick = (side: "left" | "right") =>
    h("div", {
      style: {
        flex: 1,
        height: 12,
        marginTop: 12,
        borderTop: `2px solid ${C.bluePencil}`,
        [side === "left" ? "borderLeft" : "borderRight"]: `2px solid ${C.bluePencil}`,
      },
    });
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 12, width, ...mono(16, C.bluePencil) } },
    tick("left"),
    label,
    tick("right"),
  );
}

// An L-shaped crop mark just outside a corner of the sheet.
function cropMark(corner: "tl" | "br") {
  const edge = `${STROKE}px solid ${C.chalk}`;
  return h("div", {
    style: {
      position: "absolute",
      width: 28,
      height: 28,
      ...(corner === "tl"
        ? { top: -16, left: -16, borderTop: edge, borderLeft: edge }
        : { bottom: -16, right: -16, borderBottom: edge, borderRight: edge }),
    },
  });
}

export async function renderOgPng(card: OgCard): Promise<Uint8Array> {
  const {
    title,
    subtitle,
    eyebrow = "Sheet 01 · Things I've vibe-coded",
    note = "this is Pip!",
    stamp = "Vibe-coded",
    titleblock = [
      ["Drawn by", "Charles"],
      ["Location", "Redlands, Brisbane"],
      ["See it at", "charleshageit.com"],
    ],
  } = card;

  const words = title.trim().split(/\s+/);
  const last = words.pop() ?? "";
  const titleSize = 104;
  // Wide enough for the circled word in Geist 800; the loop overshoots it a little, like the hand-drawn one.
  const loopW = Math.round(last.length * titleSize * 0.6 + 60);
  const loopH = Math.round(titleSize * 1.4);

  const sheetInset = 40;
  const sheetW = OG_WIDTH - 2 * sheetInset;
  const sheetH = OG_HEIGHT - 2 * sheetInset;

  const tree = h(
    "div",
    {
      style: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        position: "relative",
        backgroundColor: C.navy,
        fontFamily: "Geist",
        color: C.chalk,
      },
    },
    h("img", { src: gridSvg(), width: OG_WIDTH, height: OG_HEIGHT, style: { position: "absolute", left: 0, top: 0 } }),
    // The sheet
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: sheetInset,
          top: sheetInset,
          width: sheetW,
          height: sheetH,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.paper,
          border: `${STROKE}px solid ${C.chalk}`,
        },
      },
      cropMark("tl"),
      cropMark("br"),
      // Drawing area
      h(
        "div",
        { style: { flex: 1, display: "flex", padding: "44px 48px 0 52px", position: "relative" } },
        // Words
        h(
          "div",
          { style: { flex: 1, display: "flex", flexDirection: "column" } },
          h("div", { style: mono(20, C.bluePencil) }, eyebrow),
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                marginTop: 18,
                fontWeight: 800,
                fontSize: titleSize,
                lineHeight: 1,
                letterSpacing: -titleSize * 0.035,
              },
            },
            words.length ? h("div", null, words.join(" ")) : "",
            h(
              "div",
              { style: { display: "flex", position: "relative", marginTop: 6 } },
              h("div", null, last),
              h("img", {
                src: loopSvg(loopW, loopH),
                width: loopW,
                height: loopH,
                style: { position: "absolute", left: -30, top: -26 },
              }),
            ),
          ),
          h("div", { style: { marginTop: 34, fontSize: 30, lineHeight: 1.35, color: C.muted, maxWidth: 560 } }, subtitle),
        ),
        // Figure 1
        h(
          "div",
          { style: { width: FIG.w, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 30, position: "relative" } },
          h("div", { style: { display: "flex", ...mono(16, C.faint), marginBottom: 14 } }, "Fig. 1 · Pip, jellybean"),
          dim(`${32 * FIG.scale} px`, FIG.w),
          h(
            "div",
            { style: { display: "flex", position: "relative", marginTop: 14 } },
            h("img", { src: figureSvg(), width: FIG.w, height: FIG.h }),
            h(
              "div",
              {
                style: {
                  position: "absolute",
                  right: 20,
                  top: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  transform: "rotate(4deg)",
                },
              },
              h("div", { style: { fontFamily: "Caveat", fontWeight: 600, fontSize: 44, lineHeight: 1, color: C.highlighter } }, note),
              h("img", { src: arrowSvg(), width: 69, height: 45, style: { marginTop: 2, marginRight: 4 } }),
            ),
          ),
        ),
        // The rubber stamp
        h(
          "div",
          {
            style: {
              position: "absolute",
              top: 30,
              right: 44,
              display: "flex",
              padding: "10px 18px 8px",
              ...mono(24, C.stampGreen, { fontWeight: 800, letterSpacing: 24 * 0.16 }),
              border: `5px solid ${C.stampGreen}`,
              borderRadius: 6,
              backgroundColor: C.paper,
              transform: "rotate(-6deg)",
            },
          },
          stamp,
        ),
      ),
      // Title block
      h(
        "div",
        { style: { display: "flex", borderTop: `${STROKE}px solid ${C.chalk}`, flexShrink: 0 } },
        ...titleblock.map(([label, value], i) =>
          h(
            "div",
            {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "12px 20px 14px",
                borderLeft: i ? `${STROKE}px solid ${C.chalk}` : "none",
              },
            },
            h("div", { style: mono(13, C.faint) }, label),
            h("div", { style: { ...mono(20, C.chalk), marginTop: 4 } }, value),
          ),
        ),
      ),
    ),
  );

  const [sans800, sans400, mono500, mono800, hand600] = await Promise.all([
    font("@fontsource/geist-sans/files/geist-sans-latin-800-normal.woff"),
    font("@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff"),
    font("@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff"),
    font("@fontsource/geist-mono/files/geist-mono-latin-800-normal.woff"),
    font("@fontsource/caveat/files/caveat-latin-600-normal.woff"),
  ]);

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Geist", data: sans800, weight: 800, style: "normal" },
      { name: "Geist", data: sans400, weight: 400, style: "normal" },
      { name: "Geist Mono", data: mono500, weight: 500, style: "normal" },
      { name: "Geist Mono", data: mono800, weight: 800, style: "normal" },
      { name: "Caveat", data: hand600, weight: 600, style: "normal" },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
}
