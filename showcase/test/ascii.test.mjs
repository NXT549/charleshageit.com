// The sketchbook's plain-text art: Pip's sprites as characters, the cyber pictures and FIGlet banners.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PIP_CHARS, PIP_PARTS, cropBox, figlet, parseFlf, renderFrames, spriteRows, splitFrames } from "../ascii.mjs";
import {
  PIECES,
  bar,
  bootFrames,
  canvas,
  chartFrames,
  chipFrames,
  pipBinaryFrames,
  pipBootFrames,
  pipGlitchFrames,
  processTable,
  rng,
  slotFrames,
} from "../cyber.mjs";
import { normalize } from "../fetch.mjs";
import pip from "../../src/components/pip-sprites.js";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFileSync(resolve(here, path), "utf8");
const ASCII = /^[\x00-\x7f]*$/;
const lines = (frame) => frame.split("\n");
const sameHeight = (frames) => new Set(frames.map((frame) => lines(frame).length)).size === 1;

const projects = [
  { name: "pip", version: "v1.2.0", status: "done", pushed: "2026-10-11", language: "JavaScript", share: 97, commits: 5 },
  { name: "hamster-slots", version: "v1.8.0", status: "wip", pushed: "2026-10-03", language: "TypeScript", share: 88, commits: 4 },
  { name: "stock-review", version: "v2.3", status: null, pushed: "2026-10-11", language: "Python", share: 100, commits: 3 },
];
const pipRows = renderFrames([pip.frames.idle_0])[0].split("\n");

// ---------------------------------------------------------------- FIGlet

test("parseFlf reads the height and glyphs without end marks or hardblanks", () => {
  const font = parseFlf(read("../../src/ascii/fonts/standard.flf"));
  assert.equal(font.height, 6);
  for (const ch of "AZaz09 !~") {
    assert.equal(font.glyphs[ch].length, 6, `glyph ${ch} is ${font.glyphs[ch].length} rows tall`);
    for (const row of font.glyphs[ch]) assert.ok(!row.includes("@") && !row.includes("$"), `marks left in ${ch}: ${row}`);
  }
});

test("figlet draws each line of text as banner rows, one glyph after another", () => {
  const font = parseFlf(read("../../src/ascii/fonts/standard.flf"));
  const hi = figlet(font, "HI").split("\n");
  assert.equal(hi.length, 6);
  assert.equal(hi[0], (font.glyphs.H[0] + font.glyphs.I[0]).trimEnd());
  assert.equal(figlet(font, "A\nB").split("\n").length, 12); // a newline starts a new banner
});

test("figlet keeps to ASCII, treats unknown characters as spaces and caps the length", () => {
  const font = parseFlf(read("../../src/ascii/fonts/standard.flf"));
  assert.ok(ASCII.test(figlet(font, "é" + "x".repeat(200), { max: 5 })));
  assert.equal(figlet(font, "é", { max: 5 }), figlet(font, " ", { max: 5 }));
});

test("every banner font in src/ascii/fonts is plain ASCII and draws every printable character", () => {
  const files = readdirSync(resolve(here, "../../src/ascii/fonts")).filter((f) => f.endsWith(".flf"));
  assert.ok(files.length >= 6, `only ${files.length} fonts`);
  for (const file of files) {
    const text = read(`../../src/ascii/fonts/${file}`);
    assert.ok(ASCII.test(text), `${file} has non-ASCII bytes`);
    const font = parseFlf(text);
    for (let code = 33; code <= 126; code++) {
      const glyph = font.glyphs[String.fromCharCode(code)];
      assert.equal(glyph?.length, font.height, `${file}: glyph ${String.fromCharCode(code)} is not ${font.height} rows`);
    }
    const banner = figlet(font, "Hello, Pip 1.0!");
    assert.ok(ASCII.test(banner) && banner.trim().length > 0, `${file} drew nothing`);
  }
});

// ---------------------------------------------------------------- Pip's sprite

test("spriteRows cuts a frame string into rows of the sprite size", () => {
  assert.deepEqual(spriteRows("abcd" + "efgh" + "ijkl" + "mnop", 4), ["abcd", "efgh", "ijkl", "mnop"]);
});

test("cropBox is one box for every frame, so an animation does not jump", () => {
  const grid = (cells) => {
    const g = Array.from({ length: 32 }, () => Array(32).fill("."));
    for (const [r, c] of cells) g[r][c] = "B";
    return g;
  };
  assert.deepEqual(cropBox([grid([[2, 3]]), grid([[5, 9]])]), { r0: 2, r1: 5, c0: 3, c1: 9 });
});

test("renderFrames gives equal-height ASCII frames, cropped to the sprite", () => {
  const texts = renderFrames([pip.frames.idle_0, pip.frames.walk_0, pip.frames.happy_0]);
  assert.ok(sameHeight(texts));
  for (const text of texts) {
    assert.ok(ASCII.test(text));
    for (const line of lines(text)) assert.equal(line, line.trimEnd());
  }
});

test("every key used in Pip's sprites has a character, and the legend names exactly those", () => {
  const keys = new Set();
  for (const frame of Object.values(pip.frames)) for (const ch of frame) keys.add(ch);
  for (const key of keys) assert.ok(key in PIP_CHARS, `no character for Pip's key ${JSON.stringify(key)}`);
  assert.deepEqual(Object.keys(PIP_PARTS).sort(), Object.keys(PIP_CHARS).filter((k) => k !== ".").sort());
});

// ---------------------------------------------------------------- the toolkit

test("rng gives the same run for the same seed, and a different run for another", () => {
  const take = (seed) => { const r = rng(seed); return [r(), r(), r()]; };
  assert.deepEqual(take(7), take(7));
  assert.notDeepEqual(take(7), take(8));
  for (const n of take(7)) assert.ok(n >= 0 && n < 1);
});

test("canvas puts text, draws boxes, centres and trims", () => {
  const c = canvas(10, 4).box(0, 0, 10, 3).put(2, 1, "hi").center(3, "ab");
  assert.equal(c.toString(), [".--------.", "| hi     |", "'--------'", "    ab"].join("\n"));
  assert.equal(canvas(3, 1).put(2, 0, "xyz").toString(), "  x"); // anything off the edge is dropped
});

test("bar fills in proportion and stays in range", () => {
  assert.equal(bar(0.6, 10), "[######----]");
  assert.equal(bar(2, 4), "[####]");
  assert.equal(bar(-1, 4), "[----]");
});

// ---------------------------------------------------------------- the cyber pictures

test("every generator draws plain ASCII, the same way every time", () => {
  const make = () => ({
    slots: slotFrames(),
    chip: chipFrames(),
    boot: bootFrames(projects),
    table: processTable(projects),
    chart: chartFrames(),
    pipBoot: pipBootFrames(pipRows),
    pipBinary: pipBinaryFrames(pipRows),
    pipGlitch: pipGlitchFrames(pipRows),
  });
  const first = make();
  assert.deepEqual(make(), first);
  for (const [name, frames] of Object.entries(first)) {
    assert.ok(frames.length > 0, `${name} has no frames`);
    for (const frame of frames) assert.ok(ASCII.test(frame), `${name} has non-ASCII characters`);
  }
});

test("the slot machine spins, stops on 7 7 7 and pays out", () => {
  const frames = slotFrames();
  assert.equal(frames.length, 10);
  assert.ok(sameHeight(frames.slice(0, 7)));
  assert.match(frames[0], /INSERT COIN/);
  assert.match(frames[1], /SPINNING/);
  for (const frame of frames.slice(7)) {
    assert.match(frame, /\|   7   \|   7   \|   7   \|/);
    assert.match(frame, /JACKPOT/);
  }
  assert.ok(new Set(frames).size > 7, "the frames barely change");
});

test("the chip's pulses move and its LED blinks", () => {
  const frames = chipFrames();
  assert.equal(frames.length, 8);
  assert.ok(sameHeight(frames));
  assert.ok(frames[0].includes("(o)") && frames[7].includes("( )"));
  assert.equal(new Set(frames).size, 8);
});

test("the boot log lists every project with its version, one line per frame, and ends blinking", () => {
  const frames = bootFrames(projects);
  assert.ok(sameHeight(frames));
  const last = frames[frames.length - 1];
  for (const p of projects) assert.ok(last.includes(p.name) && last.includes(p.version), `${p.name} is missing from the log`);
  assert.match(last, /IN PROGRESS/);
  assert.match(last, /SHIPPED/);
  assert.ok(!frames[0].includes("hamster-slots"), "the first frame shows the whole log");
  assert.notEqual(frames[frames.length - 1], frames[frames.length - 2]); // the cursor blinks
});

test("the process table has square columns and one row per project, with a bar for its language", () => {
  const [table] = processTable(projects);
  const grid = lines(table).filter((line) => /^[+|]/.test(line));
  assert.equal(new Set(grid.map((line) => line.length)).size, 1, "the rows are different widths");
  for (const p of projects) assert.ok(table.includes(p.name) && table.includes(p.pushed) && table.includes(p.language));
  assert.match(table, /\[##########\]/); // 100%
  assert.match(table, /\[#########-\]/); // 88%
  assert.match(table, /3 running \/\/ 12 recent commits/);
  // a long language name widens its column instead of breaking the table
  const long = processTable([{ ...projects[0], language: "Jupyter Notebook" }])[0];
  assert.equal(new Set(lines(long).filter((line) => /^[+|]/.test(line)).map((line) => line.length)).size, 1);
});

test("the chart scrolls: same box every frame, new candles at the edge, and made-up tickers", () => {
  const frames = chartFrames();
  assert.equal(frames.length, 12);
  assert.ok(sameHeight(frames));
  assert.equal(new Set(frames).size, 12);
  assert.match(frames[0], /MARKET\.SYS/);
  assert.match(frames[0], /\$HAMS|\$PIP/);
});

test("Pip boots to ONLINE, keeps his shape in ones and zeros, and snaps back from a glitch", () => {
  const boot = pipBootFrames(pipRows);
  assert.ok(sameHeight(boot));
  assert.match(boot[0], /LOADING 0%/);
  assert.match(boot[boot.length - 1], /ONLINE/);
  assert.ok(lines(boot[boot.length - 1]).slice(0, pipRows.length).every((line, i) => line === pipRows[i]));

  const binary = pipBinaryFrames(pipRows);
  assert.equal(binary.length, 4);
  for (const frame of binary) {
    assert.ok(/[01]/.test(frame) && !/[=+:^]/.test(frame.replace(/\^/g, "")) , "some body characters were left");
    // the outline and eyes never move
    lines(frame).forEach((line, y) => [...line].forEach((ch, x) => { if ("#@o*_".includes(ch)) assert.equal(pipRows[y][x], ch); }));
  }
  assert.notEqual(binary[0], binary[1]);

  const glitch = pipGlitchFrames(pipRows);
  assert.equal(glitch[0], pipRows.join("\n"));
  assert.equal(glitch[glitch.length - 1], pipRows.join("\n"));
  assert.ok(glitch.slice(1, -1).every((frame) => frame !== pipRows.join("\n")));
});

test("the hand-drawn robot has equal frames of plain ASCII", () => {
  const frames = splitFrames(read("../../src/ascii/art/robot.txt"));
  assert.equal(frames.length, 5);
  assert.ok(sameHeight(frames));
  for (const frame of frames) assert.ok(ASCII.test(frame));
  assert.equal(new Set(frames).size, 5);
});

// ---------------------------------------------------------------- the catalogue and the config

test("the catalogue has unique ids and only known groups and tints", () => {
  assert.equal(new Set(PIECES.map((p) => p.id)).size, PIECES.length);
  for (const piece of PIECES) {
    assert.ok(["pip", "projects", "hardware"].includes(piece.group), `${piece.id}: group ${piece.group}`);
    assert.ok(["cyan", "yellow", "green", "chalk"].includes(piece.tint), `${piece.id}: tint ${piece.tint}`);
    assert.match(piece.file, /^[\w .-]+$/);
  }
});

test("a project's ascii piece from config reaches its card and sheet", () => {
  const config = JSON.parse(read("../config.json"));
  const raw = JSON.parse(read("../../data/github-raw.json"));
  const data = normalize(raw, config, {});
  assert.equal(data.repos.find((r) => r.name === "pip").ascii, "pip-boot");
  assert.equal(data.repos.find((r) => r.name === "hamster-slots").ascii, "slots");
});

test("every ascii id in config names a piece the sketchbook draws", () => {
  const config = JSON.parse(read("../config.json"));
  const ids = PIECES.map((p) => p.id);
  for (const [name, repo] of Object.entries(config.repos)) {
    if (repo.ascii) assert.ok(ids.includes(repo.ascii), `${name}: ascii "${repo.ascii}" is not in the catalogue (showcase/cyber.mjs)`);
  }
});
