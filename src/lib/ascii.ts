// The sketchbook's pieces, all plain text: Pip's sprite frames drawn one character per pixel (built
// here at build time), Stock Review's market scenes (src/ascii/stock-review.json, made from its
// ascii_art.py stills) and the FIGlet font behind the banner maker.
import { figlet, parseFlf, PIP_CHARS, PIP_PARTS, renderFrames } from "../../showcase/ascii.mjs";
import pip from "../components/pip-sprites.js";
import scenes from "../ascii/stock-review.json";
import standardFlf from "../ascii/standard.flf?raw";

export interface Piece {
  /** The anchor on the sketchbook page, and the value a project's `ascii` config names. */
  id: string;
  title: string;
  source: "pip" | "stock-review";
  /** Each frame is one picture; more than one means it animates. */
  frames: string[];
}

// Pip's animations, each a set of his sprite frames (src/components/pip-sprites.js).
const PIP_GROUPS: { id: string; title: string; names: string[] }[] = [
  { id: "pip-idle", title: "Standing about", names: ["idle_0", "idle_1", "idle_2", "idle_3", "idle_blink"] },
  { id: "pip-walk", title: "Out for a walk", names: ["walk_0", "walk_1", "walk_2", "walk_3"] },
  { id: "pip-wave", title: "Waving hello", names: ["wave_0", "wave_1", "wave_2"] },
  { id: "pip-happy", title: "Happy", names: ["happy_0", "happy_1", "happy_2"] },
  { id: "pip-dizzy", title: "A bit dizzy", names: ["dizzy_0", "dizzy_1", "dizzy_2", "dizzy_3"] },
];

const pipFrames = (pip as { frames: Record<string, string> }).frames;

export const PIECES: Piece[] = [
  ...PIP_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    source: "pip" as const,
    frames: renderFrames(group.names.map((name) => pipFrames[name])),
  })),
  ...(scenes as { scenes: { id: string; title: string; frames: string[] }[] }).scenes.map((scene) => ({
    id: scene.id,
    title: scene.title,
    source: "stock-review" as const,
    frames: scene.frames,
  })),
];

/** One piece by its id, or undefined (a typo in a config should not break the build). */
export const pieceById = (id: string | undefined | null) => PIECES.find((piece) => piece.id === id);

/** Pip's legend: each character and what part of him it draws. */
const pipChars: Record<string, string> = PIP_CHARS;
export const PIP_LEGEND = Object.entries(PIP_PARTS as Record<string, string>).map(([key, part]) => ({ char: pipChars[key], part }));

/** The banner font, parsed once; the banner maker in the browser draws with the same code. */
export const BANNER_FONT = parseFlf(standardFlf);

export { figlet };
