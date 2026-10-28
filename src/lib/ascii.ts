// The sketchbook's pictures, all plain text and all made at build time: Pip's own sprite frames put through
// boot, binary and glitch effects, the cyber pictures in showcase/cyber.mjs (the boot log and the process
// table are drawn from the live project list, so they're never out of date), the hand-drawn robot in
// src/ascii/art/, and the FIGlet fonts behind the banner maker.
import { parseFlf, PIP_CHARS, PIP_PARTS, renderFrames, splitFrames } from "../../showcase/ascii.mjs";
import {
  PIECES as CATALOGUE,
  bootFrames,
  chartFrames,
  chipFrames,
  pipBinaryFrames,
  pipBootFrames,
  pipGlitchFrames,
  processTable,
  slotFrames,
} from "../../showcase/cyber.mjs";
import pip from "../components/pip-sprites.js";
import { getShowcase, type Repo } from "./showcase";

/** A theme pen: cyan is the blue pencil, yellow the highlighter, green the stamp, chalk the plain linework. */
export type Tint = "cyan" | "yellow" | "green" | "chalk";
export type Group = "pip" | "projects" | "hardware";

export interface Piece {
  /** The anchor on the sketchbook page, and the value a project's `ascii` config names. */
  id: string;
  /** The file name on its terminal window. */
  file: string;
  title: string;
  group: Group;
  tint: Tint;
  /** Milliseconds per frame (0 for a still picture). */
  interval: number;
  /** Each frame is one picture; more than one means it animates. */
  frames: string[];
}

type Row = Repo & {
  status?: string | null;
  release?: { tag: string } | null;
  languages?: { name: string; share: number }[];
  commits?: unknown[];
};

// Hand-drawn art: src/ascii/art/<name>.txt, frames separated by a line holding only `~~~`.
const arts = import.meta.glob("../ascii/art/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const art = (name: string) => splitFrames(arts[`../ascii/art/${name}.txt`] ?? "");

async function build(): Promise<Piece[]> {
  const data = await getShowcase();
  // Featured projects first, in their spotlight order, then the rest: the same order as the page.
  const order = [...data.featured, ...data.repos.filter((r) => !r.featured).map((r) => r.name)];
  const repos = order.map((name) => data.repos.find((r) => r.name === name)).filter((r): r is Repo => r !== undefined) as Row[];
  const projects = repos.map((r) => ({
    name: r.name,
    version: r.release?.tag ?? "dev",
    status: r.status ?? null,
    pushed: r.pushedAt?.slice(0, 10) ?? "-",
    language: r.language?.name ?? "Mixed",
    share: r.languages?.[0]?.share ?? 0,
    commits: r.commits?.length ?? 0,
  }));

  const sprites = (pip as { frames: Record<string, string> }).frames;
  const pipRows = renderFrames([sprites.idle_0])[0].split("\n");

  const frames: Record<string, string[]> = {
    "pip-boot": pipBootFrames(pipRows),
    "pip-binary": pipBinaryFrames(pipRows),
    "pip-glitch": pipGlitchFrames(pipRows),
    slots: slotFrames(),
    market: chartFrames(),
    boot: bootFrames(projects),
    procs: processTable(projects),
    robot: art("robot"),
    chip: chipFrames(),
  };
  return (CATALOGUE as Omit<Piece, "frames">[]).map((piece) => {
    const own = frames[piece.id];
    // A catalogue entry with no art would be an empty window: fail the build instead.
    if (!own?.length) throw new Error(`sketchbook: no frames for "${piece.id}"`);
    return { ...piece, frames: own };
  });
}

let cached: Promise<Piece[]> | undefined;

/** Every picture, built once per build. */
export function getPieces(): Promise<Piece[]> {
  return (cached ??= build());
}

/** One picture by its id, or undefined (a typo in a config should not break the build). */
export async function getPiece(id: string | undefined | null): Promise<Piece | undefined> {
  return (await getPieces()).find((piece) => piece.id === id);
}

/** Pip's legend: each character and what part of him it draws. */
const pipChars: Record<string, string> = PIP_CHARS;
export const PIP_LEGEND = Object.entries(PIP_PARTS as Record<string, string>).map(([key, part]) => ({ char: pipChars[key], part }));

// ------------------------------------------------------------------ banner fonts

const flfs = import.meta.glob("../ascii/fonts/*.flf", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** The fonts the banner maker offers, in the order it lists them. The first is the one it opens with. */
export const FONTS = [
  { id: "cyberlarge", label: "Cyberlarge" },
  { id: "cybermedium", label: "Cybermedium" },
  { id: "cybersmall", label: "Cybersmall" },
  { id: "speed", label: "Speed" },
  { id: "slant", label: "Slant" },
  { id: "standard", label: "Standard" },
];

/** A parsed font ({ height, glyphs }), ready for figlet() here and in the browser. */
export function fontById(id: string) {
  const text = flfs[`../ascii/fonts/${id}.flf`];
  if (!text) throw new Error(`sketchbook: no banner font "${id}"`);
  return parseFlf(text);
}
