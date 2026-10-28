// The sketchbook's plain-text art: Pip's sprites as characters and FIGlet banners.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PIP_CHARS, PIP_PARTS, cropBox, figlet, parseFlf, renderFrames, spriteRows } from "../ascii.mjs";
import { normalize } from "../fetch.mjs";
import pip from "../../src/components/pip-sprites.js";

const here = dirname(fileURLToPath(import.meta.url));
const flf = readFileSync(resolve(here, "../../src/ascii/standard.flf"), "utf8");

test("parseFlf reads the height and glyphs without end marks or hardblanks", () => {
  const font = parseFlf(flf);
  assert.equal(font.height, 6);
  for (const ch of "AZaz09 !~") {
    assert.equal(font.glyphs[ch].length, 6, `glyph ${ch} is ${font.glyphs[ch].length} rows tall`);
    for (const row of font.glyphs[ch]) assert.ok(!row.includes("@"), `end mark left in ${ch}: ${row}`);
    for (const row of font.glyphs[ch]) assert.ok(!row.includes("$"), `hardblank left in ${ch}: ${row}`);
  }
});

test("figlet draws each line of text as banner rows, one glyph after another", () => {
  const font = parseFlf(flf);
  const hi = figlet(font, "HI").split("\n");
  assert.equal(hi.length, 6);
  const h = font.glyphs.H;
  const i = font.glyphs.I;
  assert.equal(hi[0], (h[0] + i[0]).trimEnd());
  // A newline in the text starts a new banner.
  assert.equal(figlet(font, "A\nB").split("\n").length, 12);
});

test("figlet keeps to ASCII, treats unknown characters as spaces and caps the length", () => {
  const font = parseFlf(flf);
  const out = figlet(font, "é" + "x".repeat(200), { max: 5 });
  assert.ok(/^[\x00-\x7f\n]*$/.test(out), "banner has non-ASCII output");
  assert.equal(figlet(font, "é", { max: 5 }), figlet(font, " ", { max: 5 }));
});

test("spriteRows cuts a frame string into rows of the sprite size", () => {
  // A 4×4 sprite is 16 keys: each run of four keys is one row.
  const rows = spriteRows("abcd" + "efgh" + "ijkl" + "mnop", 4);
  assert.deepEqual(rows, ["abcd", "efgh", "ijkl", "mnop"]);
});

test("cropBox is one box for every frame, so an animation does not jump", () => {
  const grid = (cells) => {
    const g = Array.from({ length: 32 }, () => Array(32).fill("."));
    for (const [r, c] of cells) g[r][c] = "B";
    return g;
  };
  const box = cropBox([grid([[2, 3]]), grid([[5, 9]])]);
  assert.deepEqual(box, { r0: 2, r1: 5, c0: 3, c1: 9 });
});

test("renderFrames gives equal-height ASCII frames, cropped to the sprite", () => {
  const texts = renderFrames([pip.frames.idle_0, pip.frames.walk_0, pip.frames.happy_0]);
  const heights = texts.map((t) => t.split("\n").length);
  assert.equal(new Set(heights).size, 1, `frame heights differ: ${heights}`);
  for (const text of texts) {
    assert.ok(/^[\x00-\x7f\n]*$/.test(text), "a Pip frame has non-ASCII output");
    for (const line of text.split("\n")) assert.equal(line, line.trimEnd());
  }
});

test("every key used in Pip's sprites has a character", () => {
  const keys = new Set();
  for (const frame of Object.values(pip.frames)) for (const ch of frame) keys.add(ch);
  for (const key of keys) assert.ok(key in PIP_CHARS, `no character for Pip's key ${JSON.stringify(key)}`);
});

test("the legend names every character Pip is drawn with, and only those", () => {
  const drawn = Object.keys(PIP_CHARS).filter((key) => key !== ".");
  assert.deepEqual(Object.keys(PIP_PARTS).sort(), drawn.sort());
});

test("a project's ascii piece from config reaches its card and sheet", () => {
  const config = JSON.parse(readFileSync(resolve(here, "../config.json"), "utf8"));
  const raw = JSON.parse(readFileSync(resolve(here, "../../data/github-raw.json"), "utf8"));
  const data = normalize(raw, config, {});
  assert.equal(data.repos.find((r) => r.name === "pip").ascii, "pip-walk");
  assert.equal(data.repos.find((r) => r.name === "hamster-slots").ascii, null);
});

test("every ascii id in config names a piece the sketchbook draws", () => {
  const config = JSON.parse(readFileSync(resolve(here, "../config.json"), "utf8"));
  const scenes = JSON.parse(readFileSync(resolve(here, "../../src/ascii/stock-review.json"), "utf8")).scenes.map((s) => s.id);
  for (const [name, repo] of Object.entries(config.repos)) {
    if (!repo.ascii) continue;
    const known = repo.ascii.startsWith("pip-") || scenes.includes(repo.ascii);
    assert.ok(known, `${name}: ascii "${repo.ascii}" is not a piece in src/lib/ascii.ts or src/ascii/stock-review.json`);
  }
});
