// Renders a repo's README.md for its project page (src/pages/projects/[name].astro).
// Links and images that point inside the repo are sent to GitHub, headings get GitHub's ids so
// the README's own "#download" links still work, and raw HTML is dropped rather than trusted.
import { Marked } from "marked";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
const unesc = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => Object.entries(ESC).find(([, v]) => v === m)?.[0] ?? m);

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces to hyphens, repeats numbered. */
export function slugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

export interface ReadmeRepo {
  fullName: string;
  title: string;
  name: string;
}

/**
 * README markdown to HTML. Headings move down a level (the page has its own h1 and h2), and a
 * leading "# Project name" is dropped because the page already shows it.
 */
export function renderReadme(markdown: string, repo: ReadmeRepo): string {
  const blob = `https://github.com/${repo.fullName}/blob/HEAD/`;
  const raw = `https://raw.githubusercontent.com/${repo.fullName}/HEAD/`;
  const slug = slugger();
  // The README sits under the page's h2, so its headings start at h3 and never skip a level
  // (a README that jumps from "##" to "####" would otherwise break the heading order).
  let prev = 2;

  const resolve = (href: string, base: string): string | null => {
    const h = href.trim();
    if (h.startsWith("#")) return h;
    if (/^(https?:|mailto:)/i.test(h)) return h;
    if (/^[a-z][a-z\d+.-]*:/i.test(h) || h.startsWith("//")) return null; // javascript:, data: and friends
    return base + h.replace(/^\.?\//, "");
  };

  const md = new Marked({ gfm: true, async: false });
  md.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const level = Math.min(depth + 1, prev + 1, 6);
        prev = level;
        const id = slug(unesc(html.replace(/<[^>]+>/g, "")));
        return `<h${level} id="${esc(id)}">${html}</h${level}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const url = resolve(href, blob);
        if (!url) return text;
        // A badge with no alt text would leave the link with no name at all, so name it by where it goes.
        const named = /[^\s<>]/.test(text.replace(/<img\b[^>]*\balt="[^"]+"[^>]*>/g, "x").replace(/<[^>]+>/g, ""));
        const label = named ? "" : ` aria-label="${esc(title || url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""))}"`;
        return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ""}${label}>${text}</a>`;
      },
      image({ href, title, text }) {
        const url = resolve(href, raw);
        if (!url || url.startsWith("#")) return esc(text);
        return `<img src="${esc(url)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy" decoding="async" />`;
      },
      html() {
        return "";
      },
    },
  });

  const title = new RegExp(`^\\s*#\\s+(${[repo.title, repo.name].map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*\\n`, "i");
  return md.parse(markdown.replace(title, "")) as string;
}
