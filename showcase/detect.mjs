// Small pure helpers: slugs, language colours, framework detection,
// README excerpts and release download buttons. No network, no side effects.

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GitHub Linguist colours, for the REST fallback (GraphQL hands us these directly).
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#663399",
  SCSS: "#c6538c",
  Shell: "#89e051",
  PowerShell: "#012456",
  Batchfile: "#C1F12E",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Lua: "#000080",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  "Jupyter Notebook": "#DA5B0B",
  GDScript: "#355570",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  MDX: "#fcb32c",
  Markdown: "#083fa1",
};

export function language(name, color) {
  if (!name) return null;
  return { name, slug: slugify(name), color: color || LANGUAGE_COLORS[name] || "#8b949e" };
}

// slug -> [label, matchers]. A matcher is a dependency name in package.json,
// or a package name in requirements.txt / pyproject.toml.
const FRAMEWORKS = {
  vite: ["Vite", ["vite"]],
  react: ["React", ["react"]],
  preact: ["Preact", ["preact"]],
  vue: ["Vue", ["vue"]],
  svelte: ["Svelte", ["svelte"]],
  sveltekit: ["SvelteKit", ["@sveltejs/kit"]],
  solid: ["Solid", ["solid-js"]],
  nextjs: ["Next.js", ["next"]],
  nuxt: ["Nuxt", ["nuxt"]],
  astro: ["Astro", ["astro"]],
  eleventy: ["Eleventy", ["@11ty/eleventy"]],
  electron: ["Electron", ["electron"]],
  tauri: ["Tauri", ["@tauri-apps/api", "@tauri-apps/cli"]],
  "react-native": ["React Native", ["react-native"]],
  expo: ["Expo", ["expo"]],
  phaser: ["Phaser", ["phaser"]],
  threejs: ["three.js", ["three"]],
  pixijs: ["PixiJS", ["pixi.js"]],
  tailwind: ["Tailwind CSS", ["tailwindcss"]],
  express: ["Express", ["express"]],
  nodejs: ["Node.js", []],
  "discord-js": ["discord.js", ["discord.js"]],
  flask: ["Flask", ["flask"]],
  django: ["Django", ["django"]],
  fastapi: ["FastAPI", ["fastapi"]],
  pygame: ["Pygame", ["pygame", "pygame-ce"]],
  streamlit: ["Streamlit", ["streamlit"]],
  pandas: ["pandas", ["pandas"]],
};

// Topics people commonly use for the same thing.
const TOPIC_ALIASES = {
  "next-js": "nextjs",
  next: "nextjs",
  "three-js": "threejs",
  three: "threejs",
  "pixi-js": "pixijs",
  tailwindcss: "tailwind",
  "tailwind-css": "tailwind",
  node: "nodejs",
  "node-js": "nodejs",
  vuejs: "vue",
  reactjs: "react",
  "electron-app": "electron",
  discordjs: "discord-js",
};

export function frameworkLabel(slug) {
  return FRAMEWORKS[slug] ? FRAMEWORKS[slug][0] : slug;
}

function packageJsonDeps(text) {
  try {
    const pkg = JSON.parse(text);
    return new Set(
      Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }).map((d) =>
        d.toLowerCase()
      )
    );
  } catch {
    return new Set();
  }
}

function pythonDeps(text) {
  const deps = new Set();
  for (const line of String(text || "").split(/\r?\n/)) {
    // requirements.txt lines, or quoted entries in a pyproject dependencies list.
    const m = line.trim().replace(/^["']/, "").match(/^([A-Za-z0-9_.-]+)\s*(?:[<>=!~;\[,"' ]|$)/);
    if (m && !line.trim().startsWith("#")) deps.add(m[1].toLowerCase().replace(/_/g, "-"));
  }
  return deps;
}

/**
 * Work out which frameworks a repo uses, from its manifests, topics and any manual overrides.
 * Returns framework slugs, most specific first.
 */
export function detectFrameworks({ packageJson, requirements, pyproject, topics = [], extra = [] } = {}) {
  const found = new Set();
  const deps = new Set([
    ...(packageJson ? packageJsonDeps(packageJson) : []),
    ...(requirements ? pythonDeps(requirements) : []),
    ...(pyproject ? pythonDeps(pyproject) : []),
  ]);
  for (const [slug, [, matchers]] of Object.entries(FRAMEWORKS)) {
    if (matchers.some((m) => deps.has(m))) found.add(slug);
  }
  for (const topic of topics) {
    const slug = TOPIC_ALIASES[topic] || topic;
    if (FRAMEWORKS[slug]) found.add(slug);
  }
  for (const slug of extra) found.add(slugify(slug));
  // A package.json with no front-end/app framework is still a Node project.
  if (packageJson && found.size === 0) {
    try {
      const pkg = JSON.parse(packageJson);
      if (pkg.bin || pkg.main || (pkg.scripts && pkg.scripts.start)) found.add("nodejs");
    } catch {
      /* not JSON */
    }
  }
  // SvelteKit implies Svelte; keep the more specific one only.
  if (found.has("sveltekit")) found.delete("svelte");
  return [...found];
}

/**
 * A plain-text excerpt of a README: the first real paragraph(s), with markdown,
 * HTML, badges and headings stripped. Inline `code` spans are kept as backticks.
 */
export function readmeExcerpt(markdown, maxLength = 320) {
  if (!markdown) return null;
  let text = String(markdown)
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, "\n") // fenced code blocks
    .replace(/<(picture|table|details)[\s\S]*?<\/\1>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .filter((line) => !/^\s*(#|>|\||[-*_]{3,}\s*$|!\[|\[!\[)/.test(line)) // headings, quotes, tables, rules, images, badges
        .join(" ")
    )
    .map((p) =>
      p
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1") // reference links
        .replace(/(\*\*|__)(.+?)\1/g, "$2")
        .replace(/(^|[\s(])[*_](\S[^*_]*?)[*_](?=[\s).,!?:;]|$)/g, "$1$2")
        .replace(/^\s*([-*+]|\d+\.)\s+/, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((p) => p.length >= 40 && /[a-z]/i.test(p));

  if (!paragraphs.length) return null;
  let out = paragraphs[0];
  if (out.length < 140 && paragraphs[1]) out += " " + paragraphs[1];
  if (out.length > maxLength) {
    out = out.slice(0, maxLength);
    out = out.slice(0, Math.max(out.lastIndexOf(" "), maxLength - 40)).replace(/[\s,;:.–-]+$/, "") + "…";
  }
  return out;
}

const PLATFORMS = [
  ["windows", "Windows", /\.(exe|msi|msix|appx)$|[-_.]win(dows|32|64)?([-_.][^/]*)?\.zip$/i],
  ["macos", "Mac", /\.(dmg|pkg)$|[-_.](mac|macos|darwin|osx|universal)([-_.][^/]*)?\.zip$/i],
  ["linux", "Linux", /\.(appimage|deb|rpm|flatpak|snap)$|[-_.]linux([-_.][^/]*)?\.(zip|tar\.gz|tgz)$/i],
  ["android", "Android", /\.apk$/i],
];

/**
 * One download button per platform from a release's assets (first match wins).
 * Platforms listed in `expected` that have no asset link to the release page instead,
 * for apps whose installer for that platform lives somewhere else.
 */
export function releaseDownloads(assets = [], { expected = [], releaseUrl = null } = {}) {
  const out = [];
  for (const [platform, label, pattern] of PLATFORMS) {
    const asset = assets.find((a) => a && a.name && pattern.test(a.name) && !/\.blockmap$/i.test(a.name));
    if (asset) out.push({ platform, label, name: asset.name, url: asset.url });
    else if (expected.includes(platform) && releaseUrl) out.push({ platform, label, name: null, url: releaseUrl });
  }
  return out;
}

/** "Merge pull request #13 from owner/branch" says nothing; use the PR title from the body instead. */
export function commitHeadline(headline, body) {
  const m = /^Merge pull request #(\d+) from \S+$/.exec(String(headline || "").trim());
  const title = String(body || "").split("\n").map((l) => l.trim()).find(Boolean);
  return m && title ? `${title} (#${m[1]})` : headline;
}
