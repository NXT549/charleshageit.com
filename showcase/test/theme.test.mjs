// The theme's inks, checked where Lighthouse can't see: it only ever loads the cherry printing, so this
// reads src/styles/tokens.css and checks every flavour's colours against the paper and the ink.
// Run with: node --test "showcase/test/*.test.mjs"
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import SPRITES from "../../src/components/pip-sprites.js";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const css = await read("src/styles/tokens.css");
const config = JSON.parse(await read("showcase/config.json"));

/** The custom properties declared in one rule, by selector: block(":root") -> { "--paper": "#f7f0e1", ... }. */
function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(match, `tokens.css has no ${selector} rule`);
  return Object.fromEntries([...match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const root = block(":root");
/** A token's colour for one flavour, following var(--other) until it reaches a hex. */
function colour(name, flavour = {}) {
  let value = flavour[name] ?? root[name];
  for (let hops = 0; hops < 5 && value; hops++) {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    if (!ref) break;
    value = flavour[ref[1]] ?? root[ref[1]];
  }
  assert.match(value ?? "", /^#[0-9a-f]{6}$/i, `${name} should resolve to a six-digit hex colour`);
  return value;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours. */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const flavours = Object.keys(SPRITES.flavors);
const papers = ["--paper", "--paper-2", "--paper-3"];

test("the contrast maths matches the spec's own examples", () => {
  assert.equal(contrast("#000000", "#ffffff"), 21);
  assert.equal(Math.round(contrast("#767676", "#ffffff") * 100) / 100, 4.54);
});

test("text colours are readable on every paper, and on ink", () => {
  for (const text of ["--ink", "--ink-soft", "--ink-faint"]) {
    for (const paper of papers) {
      const ratio = contrast(colour(text), colour(paper));
      assert.ok(ratio >= AA, `${text} on ${paper} is ${ratio.toFixed(2)}:1`);
    }
  }
  for (const text of ["--on-ink", "--on-ink-soft", "--on-ink-faint", "--on-ink-ok", "--on-ink-alert"]) {
    const ratio = contrast(colour(text), colour("--ink"));
    assert.ok(ratio >= AA, `${text} on --ink is ${ratio.toFixed(2)}:1`);
  }
});

test("every flavour of Pip has a printing", () => {
  for (const name of flavours) {
    const flavour = block(`:root[data-flavour="${name}"]`);
    assert.deepEqual(Object.keys(flavour).sort(), ["--spot", "--spot-2", "--spot-ink"], `${name} sets the three inks`);
    assert.equal(flavour["--spot"], `var(--${name})`);
    assert.equal(flavour["--spot-ink"], `var(--${name}-ink)`);
  }
  // cherry is the default: the page prints in it before (or without) any script
  const cherry = block(':root[data-flavour="cherry"]');
  for (const token of ["--spot", "--spot-ink", "--spot-2"]) assert.equal(root[token], cherry[token]);
});

test("every ink is readable in all nine printings", () => {
  for (const name of flavours) {
    const flavour = block(`:root[data-flavour="${name}"]`);
    // ink text sits on the spot colours (buttons, highlights, stickers), and they are text on ink blocks
    for (const spot of ["--spot", "--spot-2"]) {
      const ratio = contrast(colour("--ink"), colour(spot, flavour));
      assert.ok(ratio >= AA, `${name}: --ink on ${spot} is ${ratio.toFixed(2)}:1`);
    }
    // the dark shade is text on paper (handwritten notes, the sketchbook's boot line)
    for (const paper of papers) {
      const ratio = contrast(colour("--spot-ink", flavour), colour(paper));
      assert.ok(ratio >= AA, `${name}: --spot-ink on ${paper} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("a project's own ink is one of the flavours", () => {
  for (const [repo, options] of Object.entries(config.repos)) {
    if (options.pop) assert.ok(flavours.includes(options.pop), `${repo}: "pop" should be a flavour, got ${options.pop}`);
  }
});

test("the copies of the palette outside the stylesheet match it", async () => {
  // a meta tag and satori can't read CSS variables, so these two keep their own hex values
  const head = await read("src/layouts/Base.astro");
  assert.match(head, new RegExp(`name="theme-color" content="${colour("--paper")}"`));

  const og = await read("src/lib/og.ts");
  const copies = { paper: "--paper", paper3: "--paper-3", ink: "--ink", soft: "--ink-soft", onInk: "--on-ink", onInkFaint: "--on-ink-faint", spot: "--cherry", spot2: "--blueberry" };
  for (const [key, token] of Object.entries(copies)) {
    assert.match(og, new RegExp(`\\b${key}: "${colour(token)}"`), `og.ts ${key} should be ${token}`);
  }
});
