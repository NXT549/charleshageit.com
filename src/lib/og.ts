// Renders the 1200×630 social preview card at build time (satori → SVG → PNG).
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import SPRITES from "../components/pip-sprites.js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Same values as the theme tokens (src/styles/tokens.css); satori can't read CSS variables.
const C = {
  bg: "#16131e",
  surface: "#211c2c",
  line: "#0b0910",
  text: "#f7f0e6",
  muted: "#c3b9d2",
  cherry: "#e2415a",
  lemon: "#f2cc3d",
  lime: "#68c445",
  limeDark: "#4fa632",
  emerald: "#10b981",
  cyan: "#06b6d4",
};

export interface OgCard {
  /** Big headline, in the pixel font. */
  title: string;
  /** One or two lines under the headline. */
  subtitle: string;
  /** The command shown on the prompt line, e.g. "whoami". */
  command?: string;
  /** Text in the window's title bar. */
  path?: string;
  /** The tilted sticker in the corner. */
  sticker?: string;
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

// Pip, drawn from the same sprite data the page uses, as a crisp pixel-art SVG.
function pipSvg(): string {
  const frame = SPRITES.frames.idle_0;
  const pal: Record<string, string> = { ...SPRITES.base, ...SPRITES.flavors.cherry };
  const W = 32;
  let rects = "";
  for (let i = 0; i < frame.length; i++) {
    const ch = frame[i];
    if (ch === ".") continue;
    rects += `<rect x="${i % W}" y="${Math.floor(i / W)}" width="1" height="1" fill="${pal[ch]}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 19" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function dot(color: string) {
  return h("div", { style: { width: 20, height: 20, borderRadius: 10, backgroundColor: color, border: `3px solid ${C.line}` } });
}

export async function renderOgPng(card: OgCard): Promise<Uint8Array> {
  const { title, subtitle, command = "whoami", path = "charles@workshop", sticker = "vibe-coded!" } = card;

  const tree = h(
    "div",
    {
      style: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.bg,
        fontFamily: "Geist",
        color: C.text,
      },
    },
    // The retro window
    h(
      "div",
      {
        style: {
          width: OG_WIDTH - 2 * 64,
          height: OG_HEIGHT - 2 * 56,
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          border: `5px solid ${C.line}`,
          backgroundColor: C.surface,
          boxShadow: `12px 12px 0 ${C.line}`,
          overflow: "hidden",
        },
      },
      // Title bar
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 24px",
            backgroundColor: C.cyan,
            borderBottom: `5px solid ${C.line}`,
          },
        },
        dot(C.cherry),
        dot(C.lemon),
        dot(C.lime),
        h("div", { style: { marginLeft: 18, fontFamily: "Pixelify Sans", fontSize: 28, color: C.line } }, path),
      ),
      // Body
      h(
        "div",
        { style: { flex: 1, display: "flex", flexDirection: "column", padding: "32px 48px 0", position: "relative" } },
        h(
          "div",
          { style: { display: "flex", fontFamily: "Geist Mono", fontSize: 28, color: C.muted } },
          h("span", { style: { color: C.emerald, marginRight: 16 } }, "$"),
          h("span", null, command),
        ),
        h("div", { style: { marginTop: 16, fontFamily: "Pixelify Sans", fontSize: 92, lineHeight: 1 } }, title),
        h("div", { style: { marginTop: 20, fontSize: 34, lineHeight: 1.35, color: C.muted, maxWidth: 640 } }, subtitle),
        h(
          "div",
          {
            style: {
              position: "absolute",
              top: 28,
              right: 44,
              display: "flex",
              padding: "8px 18px",
              fontFamily: "Pixelify Sans",
              fontSize: 30,
              color: C.line,
              backgroundColor: C.lemon,
              border: `4px solid ${C.line}`,
              borderRadius: 10,
              boxShadow: `5px 5px 0 ${C.line}`,
              transform: "rotate(6deg)",
            },
          },
          sticker,
        ),
        h("img", {
          src: pipSvg(),
          width: 256,
          height: 152,
          style: { position: "absolute", right: 64, bottom: -2 },
        }),
      ),
      // A strip of pixel grass for Pip to stand on
      h("div", {
        style: {
          height: 30,
          flexShrink: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${C.lime} 0px, ${C.lime} 20px, ${C.limeDark} 20px, ${C.limeDark} 40px)`,
          borderTop: `5px solid ${C.line}`,
        },
      }),
    ),
  );

  const [pixel700, sans400, mono400] = await Promise.all([
    font("@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff"),
    font("@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff"),
    font("@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff"),
  ]);

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Pixelify Sans", data: pixel700, weight: 700, style: "normal" },
      { name: "Geist", data: sans400, weight: 400, style: "normal" },
      { name: "Geist Mono", data: mono400, weight: 400, style: "normal" },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
}
