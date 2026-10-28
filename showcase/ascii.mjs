// Plain-text art: Pip's pixels as characters, and FIGlet banners. Pure functions with no
// dependencies, so the build, the browser and the tests all use the same code.

// Pip's sprites are 32×32 grids of palette keys (src/components/pip-sprites.js). Each key is
// drawn as one character, chosen by what the part is: outline as #, body as =, shading as +,
// and so on. A frame's '.' is transparent, which becomes a space.
export const PIP_CHARS = {
  ".": " ",
  O: "#", // outline
  B: "=", // body
  D: "+", // body shade (belly, underside)
  L: "-", // body light
  H: "^", // gloss streak
  F: ":", // far legs
  E: "@", // eye
  W: "o", // eye shine
  K: "*", // blush
  M: "_", // mouth
  A: "&", // props
};

/** What each of Pip's characters is, for the legend on the sketchbook page. */
export const PIP_PARTS = {
  O: "outline",
  B: "body",
  D: "belly shade",
  L: "body light",
  H: "gloss",
  F: "far legs",
  E: "eyes",
  W: "eye shine",
  K: "blush",
  M: "mouth",
  A: "props",
};

/** A frame string of size×size keys, as rows. */
export function spriteRows(frame, size = 32) {
  return Array.from({ length: size }, (_, r) => frame.slice(r * size, (r + 1) * size));
}

/**
 * The box round every non-transparent key across all the frames. Cropping every frame of an
 * animation to the same box stops it jumping about as the pixels move.
 */
export function cropBox(grids) {
  let r0 = Infinity, r1 = -1, c0 = Infinity, c1 = -1;
  for (const grid of grids) {
    grid.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === ".") continue;
        r0 = Math.min(r0, r);
        r1 = Math.max(r1, r);
        c0 = Math.min(c0, c);
        c1 = Math.max(c1, c);
      }
    });
  }
  if (r1 < 0) return { r0: 0, r1: 0, c0: 0, c1: 0 };
  return { r0, r1, c0, c1 };
}

/** Frames (sprite strings) to plain-text frames, all cropped to one box and trimmed at the right. */
export function renderFrames(frames, chars = PIP_CHARS, size = 32) {
  const grids = frames.map((frame) => spriteRows(frame, size));
  const box = cropBox(grids);
  return grids.map((grid) =>
    grid
      .slice(box.r0, box.r1 + 1)
      .map((row) =>
        row
          .slice(box.c0, box.c1 + 1)
          .split("")
          .map((key) => chars[key] ?? " ")
          .join("")
          .trimEnd()
      )
      .join("\n")
  );
}

/**
 * Parse a FIGlet font (.flf). Only the 95 printable ASCII characters (32–126) are kept, which is
 * all a banner needs. Each glyph is a list of rows, with the end marks and hardblanks cleaned up.
 */
export function parseFlf(text) {
  const lines = text.split(/\r?\n/);
  const header = lines[0] ?? "";
  // "flf2a$" is the signature; the character after "flf2a" is the hardblank, a non-breaking space.
  const hardblank = header.charAt(5);
  const [height, , , , commentLines] = header.slice(6).trim().split(/\s+/).map(Number);
  const glyphs = {};
  let i = 1 + (commentLines || 0);
  for (let code = 32; code <= 126; code++) {
    const rows = [];
    for (let r = 0; r < height; r++) {
      const line = lines[i++] ?? "";
      // Each row ends with an end mark; the last row of a glyph ends with two.
      const strip = r === height - 1 ? 2 : 1;
      rows.push(line.slice(0, Math.max(0, line.length - strip)).split(hardblank).join(" "));
    }
    glyphs[String.fromCharCode(code)] = rows;
  }
  return { height, glyphs };
}

/**
 * Draw text as a banner, one glyph after another. Lines in the text become banner lines too.
 * Glyphs are not smushed together, so letters keep a little space between them.
 */
export function figlet(font, text, { max = 40 } = {}) {
  const input = String(text ?? "").slice(0, max).split(/\r?\n/);
  const blocks = input.map((line) => {
    const rows = Array.from({ length: font.height }, () => "");
    for (const ch of line) {
      const glyph = font.glyphs[ch] ?? font.glyphs[" "];
      for (let r = 0; r < font.height; r++) rows[r] += glyph[r] ?? "";
    }
    return rows.map((row) => row.trimEnd());
  });
  return blocks.flat().join("\n");
}
