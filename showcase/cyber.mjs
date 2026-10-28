// The sketchbook's cyber art: pictures that are built, not copied. Every function is pure and seeded, so the
// same input always draws the same frames (the build, the tests and the browser agree), and none of them
// touch the network or the clock. Frames are plain strings, one per picture; more than one animates.

/** A small seeded random generator (mulberry32): the same seed gives the same run of numbers. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A grid of characters to draw on: place text, blit art, draw boxes, then read it back as a string. */
export function canvas(width, height) {
  const rows = Array.from({ length: height }, () => Array(width).fill(" "));
  const api = {
    /** Put text at x, y. With `solid` false its spaces leave what's underneath alone. */
    put(x, y, text, solid = true) {
      for (let i = 0; i < text.length; i++) {
        const cx = x + i;
        if (y < 0 || y >= height || cx < 0 || cx >= width) continue;
        if (solid || text[i] !== " ") rows[y][cx] = text[i];
      }
      return api;
    },
    /** Put a block of lines at x, y. */
    blit(x, y, block, solid = true) {
      String(block).split("\n").forEach((line, i) => api.put(x, y + i, line, solid));
      return api;
    },
    box(x, y, w, h) {
      api.put(x, y, "." + "-".repeat(w - 2) + ".");
      for (let r = 1; r < h - 1; r++) api.put(x, y + r, "|" + " ".repeat(w - 2) + "|");
      api.put(x, y + h - 1, "'" + "-".repeat(w - 2) + "'");
      return api;
    },
    /** Centre text between x0 and x0 + w. */
    center(y, text, x0 = 0, w = width) {
      api.put(x0 + Math.floor((w - text.length) / 2), y, text);
      return api;
    },
    toString() {
      return rows.map((row) => row.join("").trimEnd()).join("\n");
    },
  };
  return api;
}

/** A progress bar: bar(0.6, 10) is "[######----]". */
export function bar(fraction, width = 10) {
  const full = Math.max(0, Math.min(width, Math.round(fraction * width)));
  return `[${"#".repeat(full)}${"-".repeat(width - full)}]`;
}

// ------------------------------------------------------------------ HAMSTER SLOTS

const SYMBOLS = ["7", "$", "#", "*", "@", "&", "%"];

/**
 * A slot machine that spins: the lever drops, the reels blur, stop one by one on 7 7 7 and the machine
 * pays out. Ten frames.
 */
export function slotFrames({ seed = 11 } = {}) {
  const r = rng(seed);
  const spin = () => [0, 1, 2].map(() => SYMBOLS[Math.floor(r() * SYMBOLS.length)]);
  const idle = [["$", "#", "*"], ["#", "$", "@"], ["*", "&", "$"]]; // columns of [above, payline, below]
  const won = [["$", "7", "#"], ["@", "7", "*"], ["*", "7", "$"]];
  // For each frame: which reels have stopped, the lever, the message and any coins in the air.
  const plan = [
    { reels: "idle", lever: 0, msg: "[ INSERT COIN ]" },
    { reels: "spin", lever: 1, msg: "[ SPINNING...  ]" },
    { reels: "spin", lever: 1, msg: "[ SPINNING...  ]" },
    { reels: "spin", lever: 0, msg: "[ SPINNING...  ]" },
    { reels: "spin", lever: 0, msg: "[ SPINNING...  ]" },
    { reels: "one", lever: 0, msg: "[ SPINNING...  ]" },
    { reels: "two", lever: 0, msg: "[ ALMOST...    ]" },
    { reels: "won", lever: 0, msg: "*** JACKPOT ***", coins: 1 },
    { reels: "won", lever: 0, msg: "*** JACKPOT ***", coins: 2 },
    { reels: "won", lever: 0, msg: "*** JACKPOT ***", coins: 1 },
  ];
  return plan.map(({ reels, lever, msg, coins = 0 }) => {
    const cols = [0, 1, 2].map((i) => {
      if (reels === "idle") return idle[i];
      if (reels === "won") return won[i];
      const stopped = reels === "one" ? i < 1 : reels === "two" ? i < 2 : false;
      return stopped ? won[i] : spin();
    });
    const c = canvas(45, 17);
    c.box(4, 0, 33, 3).center(1, "* H A M S T E R   S L O T S *", 4, 33);
    c.box(2, 3, 37, 11);
    // the reel window
    c.put(7, 5, ".-------.-------.-------.");
    for (let row = 0; row < 3; row++) c.put(7, 6 + row, `|   ${cols[0][row]}   |   ${cols[1][row]}   |   ${cols[2][row]}   |`);
    c.put(7, 9, "'-------'-------'-------'");
    c.put(4, 7, ">>").put(33, 7, "<<");
    c.center(11, msg, 3, 35);
    c.put(5, 14, "|__|").put(32, 14, "|__|");
    // the lever: up (knob on top) or pulled (knob below)
    c.put(39, 9, "==").put(41, 9, "=#=", true);
    if (lever === 0) {
      for (let y = 5; y <= 8; y++) c.put(42, y, "|");
      c.put(41, 4, "(@)");
    } else {
      for (let y = 10; y <= 12; y++) c.put(42, y, "|");
      c.put(41, 13, "(@)");
    }
    // coins in the air when it pays out
    if (coins === 1) c.put(0, 1, "$").put(37, 0, "$").put(1, 12, "*").put(43, 2, "*");
    if (coins === 2) c.put(1, 0, "*").put(38, 1, "$").put(0, 11, "$").put(44, 12, "*");
    return c.toString();
  });
}

// ------------------------------------------------------------------ the chip

/** A microchip with data pulses running along its pins and an LED that blinks. Eight frames. */
export function chipFrames() {
  const frames = [];
  for (let f = 0; f < 8; f++) {
    const c = canvas(45, 11);
    c.box(10, 1, 25, 8);
    for (let k = 0; k < 10; k++) {
      const x = 13 + k * 2;
      c.put(x, 0, "|").put(x, 1, "+").put(x, 8, "+").put(x, 9, "|");
    }
    c.center(3, "C H A R L E S", 10, 25);
    c.center(4, ".SYS  v2026.10", 10, 25);
    c.center(5, "[ vibes: 100% ]", 10, 25);
    c.put(28, 6, f < 4 ? "(o)" : "( )");
    c.put(14, 6, "PIP-1000");
    // traces in and out, with a pulse running along each
    for (let row = 0; row < 4; row++) {
      const y = 3 + row;
      const into = "=".repeat(10).split("");
      into[(f * 2 + row * 3) % 10] = ">";
      const out = "=".repeat(10).split("");
      out[(f * 2 + row * 3 + 5) % 10] = "o";
      c.put(0, y, into.join("")).put(35, y, out.join(""));
    }
    frames.push(c.toString());
  }
  return frames;
}

// ------------------------------------------------------------------ the boot log

const STATE = { done: ["OK", "SHIPPED"], wip: ["..", "IN PROGRESS"] };

/** What a project reads as in a log line: a version and a state. */
function logLine(p) {
  const [mark, label] = STATE[p.status] ?? ["OK", "ONLINE"];
  return `[ ${mark} ] ${p.name.padEnd(p.pad)} ${String(p.version || "dev").padEnd(8)} ${p.label ?? label}`;
}

/**
 * A boot log, one line at a time, on a monitor. `projects` are { name, version, status } (the showcase data),
 * so the log is always the real list. The last frames blink the cursor.
 */
export function bootFrames(projects) {
  const pad = Math.max(0, ...projects.map((p) => p.name.length));
  const lines = [
    "$ ./boot.sh --workshop",
    "[ OK ] mounting /projects",
    ...projects.map((p) => logLine({ ...p, pad })),
    logLine({ name: "vibes", version: "100%", label: "IMMACULATE", pad }),
  ];
  const width = Math.max(...lines.map((l) => l.length), 30) + 4;
  const height = lines.length + 3;
  const frames = [];
  const draw = (shown, cursor) => {
    const c = canvas(width + 2, height + 2);
    c.box(0, 0, width + 2, height);
    lines.slice(0, shown).forEach((line, i) => c.put(3, 1 + i, line));
    c.put(3, 1 + shown, cursor ? "$ _" : "$");
    // the stand
    const mid = Math.floor((width + 2) / 2);
    c.put(mid - 4, height, "_|____|_").put(mid - 6, height + 1, "/__________\\");
    return c.toString();
  };
  for (let n = 1; n <= lines.length; n++) frames.push(draw(n, true));
  for (let k = 0; k < 4; k++) frames.push(draw(lines.length, k % 2 === 0));
  return frames;
}

// ------------------------------------------------------------------ the process table

/**
 * The projects as a process table. `projects` are { name, version, pushed, language, share, commits }.
 * Built from the live showcase data, so it never goes stale.
 */
export function processTable(projects) {
  const col = (key, head) => Math.max(head.length, ...projects.map((p) => String(p[key]).length));
  const langName = Math.max(10, ...projects.map((p) => String(p.language).length));
  const widths = { name: col("name", "PROJECT"), version: col("version", "VERSION"), pushed: col("pushed", "LAST PUSH"), lang: langName + 1 + 12 };
  const cell = (text, w) => ` ${String(text).padEnd(w)} `;
  const line = () => `+${Object.values(widths).map((w) => "-".repeat(w + 2)).join("+")}+`;
  const row = (a, b, c, d) => `|${cell(a, widths.name)}|${cell(b, widths.version)}|${cell(c, widths.pushed)}|${cell(d, widths.lang)}|`;
  const total = projects.reduce((n, p) => n + (p.commits || 0), 0);
  const out = [
    "WORKSHOP.SYS :: PROCESS TABLE",
    line(),
    row("PROJECT", "VERSION", "LAST PUSH", "MADE OF"),
    line(),
    ...projects.map((p) => row(p.name, p.version, p.pushed, `${String(p.language).padEnd(langName + 1)}${bar((p.share || 0) / 100, 10)}`)),
    line(),
    `${projects.length} running // ${total} recent commits // 0 zombies`,
  ];
  return [out.join("\n")];
}

// ------------------------------------------------------------------ the market

const TICKERS = ["$PIP", "$HAMS", "$SNAX", "$WHEEL", "$VIBE", "$BUGS", "$NUTS"];

/**
 * A candlestick chart that scrolls, with a ticker tape under it. The prices are made up (a seeded random
 * walk) and the symbols are silly on purpose: this is a picture of a market, not one.
 */
export function chartFrames({ seed = 5, width = 44, height = 12, frames = 12 } = {}) {
  const r = rng(seed);
  const count = width + frames;
  const candles = [];
  let price = 100;
  let velocity = 0;
  for (let i = 0; i < count; i++) {
    // momentum: each step carries on most of the last one, so the chart trends instead of shivering
    velocity = velocity * 0.72 + (r() - 0.47) * 2.4;
    const open = price;
    const close = open + velocity;
    const high = Math.max(open, close) + r() * 0.9;
    const low = Math.min(open, close) - r() * 0.9;
    candles.push({ open, close, high, low });
    price = close;
  }
  const hi = Math.max(...candles.map((k) => k.high));
  const lo = Math.min(...candles.map((k) => k.low));
  const rowOf = (p) => Math.round(((hi - p) / (hi - lo)) * (height - 1));
  const tape = TICKERS.map((t) => `${t} ${r() > 0.45 ? "+" : "-"}${(r() * 4).toFixed(1)}%`).join("   ") + "   ";
  const out = [];
  for (let f = 0; f < frames; f++) {
    const view = candles.slice(f, f + width);
    const last = view[view.length - 1];
    const first = view[0];
    const change = ((last.close - first.open) / first.open) * 100;
    const c = canvas(width + 9, height + 4);
    c.put(0, 0, `MARKET.SYS // $PIP ${last.close.toFixed(2)} ${change >= 0 ? "^" : "v"} ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`);
    c.put(0, 1, hi.toFixed(0).padStart(5)).put(0, height, lo.toFixed(0).padStart(5));
    for (let y = 1; y <= height; y++) c.put(6, y, "|");
    c.put(6, height + 1, "+" + "-".repeat(width) + ">");
    view.forEach((k, x) => {
      const col = 7 + x;
      for (let y = rowOf(k.high); y <= rowOf(k.low); y++) c.put(col, 1 + y, "|");
      const up = k.close >= k.open;
      const a = rowOf(Math.max(k.open, k.close));
      const b = rowOf(Math.min(k.open, k.close));
      for (let y = a; y <= b; y++) c.put(col, 1 + y, up ? "#" : ":");
    });
    const start = (f * 3) % tape.length;
    const window = (tape + tape).slice(start, start + width + 7);
    c.put(0, height + 3, window);
    out.push(c.toString());
  }
  return out;
}

// ------------------------------------------------------------------ Pip, in the machine

/** Pip builds himself from the top down, behind a scan line, then says he's online. */
export function pipBootFrames(rows) {
  const width = Math.max(...rows.map((row) => row.length), 24);
  const steps = Math.ceil(rows.length / 2);
  const out = [];
  const status = (fraction, word) => `${bar(fraction, 10)} ${word}`;
  for (let s = 0; s <= steps; s++) {
    const shown = Math.min(rows.length, s * 2);
    const c = canvas(width, rows.length + 2);
    rows.slice(0, shown).forEach((row, y) => c.put(0, y, row));
    if (shown < rows.length) c.put(0, shown, "~".repeat(width));
    c.put(0, rows.length + 1, status(shown / rows.length, shown < rows.length ? `LOADING ${Math.round((shown / rows.length) * 100)}%` : "ONLINE"));
    out.push(c.toString());
  }
  // a beat on the finished picture, with the word blinking
  for (let k = 0; k < 3; k++) {
    const c = canvas(width, rows.length + 2);
    rows.forEach((row, y) => c.put(0, y, row));
    c.put(0, rows.length + 1, status(1, k % 2 === 0 ? "ONLINE <3" : "ONLINE"));
    out.push(c.toString());
  }
  return out;
}

/** Pip made of ones and zeros: his outline and face stay put and the rest flickers. */
export function pipBinaryFrames(rows, { frames = 4, seed = 3 } = {}) {
  const r = rng(seed);
  const body = new Set("=+-:^");
  const cells = rows.map((row) => [...row].map((ch) => (body.has(ch) ? (r() < 0.5 ? "0" : "1") : ch)));
  const out = [];
  for (let f = 0; f < frames; f++) {
    out.push(cells.map((row) => row.join("").trimEnd()).join("\n"));
    cells.forEach((row) => row.forEach((ch, x) => { if ((ch === "0" || ch === "1") && r() < 0.4) row[x] = ch === "0" ? "1" : "0"; }));
  }
  return out;
}

/** Pip glitching: rows slip sideways and bits of noise show up, then he snaps back. */
export function pipGlitchFrames(rows, { frames = 6, seed = 9 } = {}) {
  const r = rng(seed);
  const noise = "#%&?!/\\|<>^~";
  const out = [];
  for (let f = 0; f < frames; f++) {
    if (f === 0 || f === frames - 1) {
      out.push(rows.join("\n"));
      continue;
    }
    const g = [...rows];
    const hits = 2 + Math.floor(r() * 3);
    for (let k = 0; k < hits; k++) {
      const y = Math.floor(r() * g.length);
      const shift = Math.floor(r() * 7) - 3 || 2;
      g[y] = shift > 0 ? " ".repeat(shift) + g[y] : g[y].slice(-shift);
    }
    const y = Math.floor(r() * g.length);
    const x = Math.floor(r() * Math.max(1, g[y].length - 6));
    const burst = Array.from({ length: 3 + Math.floor(r() * 4) }, () => noise[Math.floor(r() * noise.length)]).join("");
    g[y] = g[y].slice(0, x) + burst + g[y].slice(x + burst.length);
    out.push(g.map((row) => row.trimEnd()).join("\n"));
  }
  return out;
}

// ------------------------------------------------------------------ the catalogue

/**
 * Every picture in the sketchbook: its id (what a project's `ascii` config names), the file name on its
 * terminal window, what it's called, where it sits on the page, how it's tinted (a theme pen: cyan is the
 * blue pencil, yellow the highlighter, green the stamp, chalk the plain linework) and how fast it plays.
 * src/lib/ascii.ts draws each one.
 */
export const PIECES = [
  { id: "pip-boot", file: "pip.exe", title: "Pip boots up", group: "pip", tint: "cyan", interval: 220 },
  { id: "pip-binary", file: "pip.bin", title: "Pip, in ones and zeros", group: "pip", tint: "green", interval: 260 },
  { id: "pip-glitch", file: "pip.glitch", title: "Pip glitches", group: "pip", tint: "chalk", interval: 170 },
  { id: "slots", file: "hamster-slots.exe", title: "Hamster Slots", group: "projects", tint: "yellow", interval: 260 },
  { id: "market", file: "stock-review.sys", title: "Stock Review", group: "projects", tint: "green", interval: 380 },
  { id: "boot", file: "workshop.boot", title: "The workshop boots", group: "projects", tint: "green", interval: 520 },
  { id: "procs", file: "ps aux", title: "Every project, right now", group: "projects", tint: "chalk", interval: 0 },
  { id: "robot", file: "unit-01.bot", title: "Unit 01", group: "hardware", tint: "chalk", interval: 650 },
  { id: "chip", file: "pip-1000.chip", title: "The Pip-1000", group: "hardware", tint: "cyan", interval: 220 },
];
