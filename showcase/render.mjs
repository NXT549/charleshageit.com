// Turns showcase data into HTML strings. Pure functions, so any build step can use them.
// Styling comes from css/tokens.css + css/theme.css (glass, glow, terminal, btn, tag, badge)
// and the layout rules in css/showcase.css.

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) URLs and site-relative paths make it into an href/src. */
export function safeUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(\.\/)?[\w-][\w./-]*$/.test(s) && !s.includes("..")) return s; // "img/x.webp", "./img/x.webp"
  return null;
}

/** Escaped text with `inline code` turned into <code>. */
export function richText(text) {
  return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

const ICONS = {
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z",
  fork: "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z",
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  commit: "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  tag: "M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  external: "M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z",
  download: "M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z",
  copy: "M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z",
  play: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z",
  code: "m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z",
  sheet: "M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z",
  close: "M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z",
};

export function iconSprite() {
  const symbols = Object.entries(ICONS)
    .map(([name, d]) => `<symbol id="i-${name}" viewBox="0 0 16 16"><path d="${d}"/></symbol>`)
    .join("");
  return `<svg class="icon-sprite" aria-hidden="true" hidden>${symbols}</svg>`;
}

export function icon(name) {
  return `<svg class="icon" aria-hidden="true" width="16" height="16"><use href="#i-${name}"/></svg>`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** A <time> showing an absolute date; js/showcase.js swaps in "3 days ago" on load. */
export function time(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `<time datetime="${esc(d.toISOString())}" data-relative>${esc(DATE_FMT.format(d))}</time>`;
}

function compact(n) {
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
}

function dataAttrs(repo) {
  return [
    `data-repo="${esc(repo.name)}"`,
    `data-language="${esc(repo.language ? repo.language.slug : "")}"`,
    `data-frameworks="${esc(repo.frameworks.join(" "))}"`,
    `data-topics="${esc(repo.topics.join(" "))}"`,
    `data-tags="${esc(repo.tags.join(" "))}"`,
    `data-stars="${repo.stars}"`,
    `data-pushed="${esc(repo.pushedAt || "")}"`,
  ].join(" ");
}

/** Each project's own page on the site (src/pages/projects/[name].astro). */
export function projectPath(repo) {
  return `/projects/${encodeURIComponent(repo.name)}/`;
}

// Rubber stamps: keep the words short, the theme sets them in uppercase.
const STATUS = {
  done: ["badge--live", "Shipped"],
  wip: ["badge--wip", "In progress"],
  live: ["badge--live", "Live"],
  archived: ["badge--info", "Archived"],
};

/** A card's hover colour, from a theme colour name in the config ("blue-pencil" -> var(--blue-pencil)). */
export function popStyle(repo) {
  return repo.pop ? ` style="--pop: var(--${esc(repo.pop)})"` : "";
}

export function statusBadge(repo, extraClass = "") {
  const s = STATUS[repo.status];
  if (!s) return "";
  return `<span class="badge ${s[0]} ${extraClass}">${esc(s[1])}</span>`;
}

function languageChip(lang) {
  if (!lang) return "";
  return `<span class="repo-lang"><i style="--lang:${esc(lang.color)}"></i>${esc(lang.name)}</span>`;
}

/** The tag, plus the release's name when it says more than the version: v1.9.1 "Welcome Mat". */
function releaseLabel(r) {
  const version = String(r.tag).replace(/^v/i, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const extra = String(r.name || "")
    .replace(new RegExp(`^v?${version}`, "i"), "")
    .replace(/^[\s:–—-]+/, "")
    .trim();
  return extra && extra.toLowerCase() !== String(r.tag).toLowerCase() ? `${r.tag} "${extra}"` : r.tag;
}

export function releaseTag(repo, { named = false } = {}) {
  const r = repo.release;
  if (!r) return "";
  const url = safeUrl(r.url);
  const label = `${icon("tag")}${esc(named ? releaseLabel(r) : r.tag)}`;
  const attrs = `class="tag tag--accent repo-release" data-released="${esc(r.date || "")}" title="Latest release${r.name && r.name !== r.tag ? `: ${esc(r.name)}` : ""}"`;
  return url ? `<a ${attrs} href="${esc(url)}">${label}</a>` : `<span ${attrs}>${label}</span>`;
}

export function tagList(repo, max = 8) {
  const items = [
    ...repo.frameworks.map((f) => `<li class="tag tag--accent-2" data-facet="framework" data-value="${esc(f)}">${esc(f)}</li>`),
    ...repo.topics
      .filter((t) => !repo.frameworks.includes(t))
      .map((t) => `<li class="tag" data-facet="topic" data-value="${esc(t)}">#${esc(t)}</li>`),
  ].slice(0, max);
  return items.length ? `<ul class="repo-tags" aria-label="Tags">${items.join("")}</ul>` : "";
}

export function stats(repo) {
  const parts = [
    languageChip(repo.language),
    `<span class="repo-stat" title="${repo.stars} star${repo.stars === 1 ? "" : "s"}">${icon("star")}${compact(repo.stars)}<span class="visually-hidden"> stars</span></span>`,
  ];
  if (repo.forks) {
    parts.push(
      `<span class="repo-stat" title="${repo.forks} fork${repo.forks === 1 ? "" : "s"}">${icon("fork")}${compact(repo.forks)}<span class="visually-hidden"> forks</span></span>`
    );
  }
  return parts.join("");
}

function commitLine(repo) {
  const c = repo.latestCommit;
  if (!c) return repo.pushedAt ? `<p class="repo-commit">${icon("commit")}<span>pushed ${time(repo.pushedAt)}</span></p>` : "";
  const url = safeUrl(c.url);
  const sha = `<code>${esc(c.shortSha || String(c.sha).slice(0, 7))}</code>`;
  return `<p class="repo-commit">${icon("commit")}${url ? `<a href="${esc(url)}">${sha}</a>` : sha}<span class="repo-commit__msg">${esc(
    c.message
  )}</span><span class="repo-commit__when">${time(c.date)}</span></p>`;
}

export function cloneButton(repo) {
  const cmd = `git clone ${repo.url}.git`;
  return `<button class="btn btn--ghost btn--sm repo-copy" type="button" data-copy="${esc(cmd)}" title="${esc(cmd)}" hidden>${icon(
    "copy"
  )}<span>git clone</span></button>`;
}

export function liveLabel(repo) {
  return repo.status === "wip" || /game|play/i.test(repo.topics.join(" ")) ? "Play in your browser" : "Live preview";
}

/** "First sentence. The rest." -> the first sentence as a bold tagline, the rest as the paragraph under it. */
export function splitBlurb(text) {
  const m = /^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(String(text || "").trim());
  return m ? [m[1], m[2]] : [String(text || "").trim(), ""];
}

// ------------------------------------------------------------------ spotlight

/** True when a README excerpt just restates the blurb above it. */
function repeats(excerpt, blurb) {
  const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const head = norm(excerpt).slice(0, 48);
  return head.length > 0 && norm(blurb).includes(head);
}

function spotlightCard(repo, index) {
  const repoUrl = safeUrl(repo.url);
  const live = safeUrl(repo.homepage);
  const embed = safeUrl(repo.embed);
  const img = repo.image && safeUrl(repo.image.src);
  const media = img
    ? `<img class="spotlight__shot${repo.image.pixelArt ? " spotlight__shot--pixel" : ""}" src="${esc(img)}" alt="${esc(repo.image.alt)}"${repo.image.width ? ` width="${repo.image.width}"` : ""}${
        repo.image.height ? ` height="${repo.image.height}"` : ""
      } loading="lazy" decoding="async" />`
    : `<div class="spotlight__placeholder" aria-hidden="true"><span class="prompt">~/</span>${esc(repo.name)}<span class="cursor"></span></div>`;

  const demo = embed
    ? `<button class="btn btn--primary btn--sm spotlight__demo" type="button" data-embed="${esc(embed)}" data-title="${esc(
        repo.title
      )} demo" hidden>${icon("play")}<span>Try it right here</span></button>`
    : "";

  const actions = [
    live ? `<a class="btn btn--primary" href="${esc(live)}">${icon("play")}${esc(liveLabel(repo))}</a>` : "",
    ...((repo.release && repo.release.downloads) || []).map(
      (d) =>
        `<a class="btn btn--secondary" href="${esc(safeUrl(d.url) || "#")}" title="${esc(d.name || `${d.label} downloads for ${repo.release.tag}`)}">${icon(
          "download"
        )}${esc(d.label)}</a>`
    ),
    `<a class="btn btn--ghost" href="${esc(projectPath(repo))}">${icon("sheet")}Spec sheet</a>`,
    repoUrl ? `<a class="btn btn--ghost" href="${esc(repoUrl)}">${icon("code")}See the code</a>` : "",
    cloneButton(repo),
  ].filter(Boolean);

  const readme = repo.readmeExcerpt && !repeats(repo.readmeExcerpt, repo.blurb || repo.description)
    ? `<figure class="terminal spotlight__readme">
          <figcaption class="terminal__bar"><span class="terminal__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="terminal__title">README.md</span></figcaption>
          <div class="terminal__body">
            <p class="terminal__line" aria-hidden="true"><span class="prompt">$</span> head README.md</p>
            <p class="terminal__line terminal__out">${richText(repo.readmeExcerpt)}</p>
          </div>
        </figure>`
    : "";

  const [tagline, blurb] = splitBlurb(repo.blurb || repo.description);
  // Pip's spec drawing: a dimension line over the sprite (css/showcase.css draws it 168px wide).
  const sceneBits = repo.scene === "desk" ? `<span class="dim spotlight__dim" aria-hidden="true">168 px</span>` : "";
  const note = repo.note ? `<span class="hand spotlight__note">${esc(repo.note).replace(/\n/g, "<br />")}</span>` : "";

  const highlights = repo.highlights.length
    ? `<ul class="spotlight__highlights">${repo.highlights.map((h) => `<li>${richText(h)}</li>`).join("")}</ul>`
    : "";

  return `
    <article class="spotlight glass glow${index % 2 ? " spotlight--flip" : ""}" id="project-${esc(repo.name)}" ${dataAttrs(repo)}${popStyle(repo)}>
      <div class="spotlight__media${repo.scene ? ` spotlight__media--${esc(repo.scene)}` : ""}">
        ${sceneBits}${media}
        ${note}
        ${demo}
      </div>
      <div class="spotlight__body">
        ${statusBadge(repo, "spotlight__status")}
        <p class="spotlight__path"><span class="prompt__path">~/${esc(repo.fullName.split("/")[0])}/</span><span>${esc(repo.name)}</span></p>
        <h3 class="spotlight__title"><a href="${esc(projectPath(repo))}">${esc(repo.title)}</a></h3>
        ${tagline ? `<p class="spotlight__tagline">${richText(tagline)}</p>` : ""}
        ${blurb ? `<p class="spotlight__blurb">${richText(blurb)}</p>` : ""}
        ${readme}
        ${highlights}
        <div class="repo-meta">${stats(repo)}${releaseTag(repo, { named: true })}</div>
        ${commitLine(repo)}
        ${tagList(repo)}
        <div class="repo-actions">${actions.join("")}</div>
      </div>
    </article>`;
}

export function renderSpotlight(data) {
  const byName = new Map(data.repos.map((r) => [r.name, r]));
  const featured = (data.featured || []).map((n) => byName.get(n)).filter(Boolean);
  if (!featured.length) return `${iconSprite()}\n<p class="showcase-empty">Nothing in the spotlight yet.</p>`;
  return `${iconSprite()}
  <div class="spotlight-list">${featured.map(spotlightCard).join("")}
  </div>`;
}

// ------------------------------------------------------------------ repo grid

function repoCard(repo) {
  const repoUrl = safeUrl(repo.url);
  const live = safeUrl(repo.homepage);
  const desc = repo.description || "A new thing. No description yet!";
  return `
      <article class="repo-card glass glow" ${dataAttrs(repo)}${popStyle(repo)}>
        <header class="repo-card__head">
          ${icon("repo")}
          <h3 class="repo-card__name"><a class="repo-card__link" href="${esc(projectPath(repo))}">${esc(repo.name)}</a></h3>
          ${repo.featured ? `<a class="badge badge--info repo-card__featured" href="#project-${esc(repo.name)}">featured</a>` : ""}
        </header>
        <p class="repo-card__desc">${richText(desc)}</p>
        ${tagList(repo, 5)}
        <div class="repo-meta">${stats(repo)}${releaseTag(repo)}</div>
        ${commitLine(repo)}
        <div class="repo-card__actions">
          ${live ? `<a class="btn btn--secondary btn--sm" href="${esc(live)}">${icon("external")}${esc(liveLabel(repo))}</a>` : ""}
          ${repoUrl ? `<a class="btn btn--ghost btn--sm" href="${esc(repoUrl)}">${icon("code")}Code</a>` : ""}
          ${cloneButton(repo)}
        </div>
      </article>`;
}

export function renderRepoGrid(data) {
  const synced = data.generatedAt ? `<p class="showcase-synced">${icon("commit")}synced with GitHub ${time(data.generatedAt)}</p>` : "";
  const profile = safeUrl(data.user && data.user.url) || "https://github.com/";
  return `
  <div class="repo-grid" id="repo-grid">${data.repos.map(repoCard).join("")}
  </div>
  <p class="showcase-empty" id="repo-grid-empty" hidden>No projects match those filters.</p>
  <div class="showcase-foot">
    ${synced}
    <a class="showcase-more" href="${esc(profile)}?tab=repositories"><span class="hand">+ more soon</span><span>see it all on GitHub</span></a>
  </div>`;
}

// ------------------------------------------------------------------ injection

/**
 * Replace the content between <!-- showcase:NAME:start --> and <!-- showcase:NAME:end -->.
 * Throws if a marker pair is missing so a broken merge can't silently drop the showcase.
 */
export function inject(html, name, content) {
  const start = `<!-- showcase:${name}:start -->`;
  const end = `<!-- showcase:${name}:end -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`index.html is missing the ${start} … ${end} markers`);
  const indent = (html.slice(0, i).match(/[ \t]*$/) || [""])[0];
  return html.slice(0, i + start.length) + "\n" + content.trim().replace(/^/gm, indent) + "\n" + indent + html.slice(j);
}

export function renderInto(html, data) {
  return inject(inject(html, "spotlight", renderSpotlight(data)), "repos", renderRepoGrid(data));
}
