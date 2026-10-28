// The sketchbook's motion and buttons. Each piece is plain text without this script, so nothing breaks
// if it doesn't run, and nothing moves for anyone who asks for reduced motion.
import { figlet } from "../../showcase/ascii.mjs";

interface Font {
  height: number;
  glyphs: Record<string, string[]>;
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Frames: a stage holds one <pre class="ascii-frame"> per frame, stacked in one grid cell so the box
// never changes size. The frames step only while the stage is on screen, so a page of pictures costs
// nothing when nobody is looking at it.
function animate(stage: HTMLElement) {
  const frames = [...stage.querySelectorAll<HTMLElement>(".ascii-frame")];
  if (frames.length < 2 || reduced) return;
  const interval = Number(stage.dataset.interval) || 420;
  let at = 0;
  let timer: number | undefined;
  const show = (n: number) => {
    at = n;
    frames.forEach((frame, k) => frame.classList.toggle("is-on", k === n));
  };
  stage.classList.add("is-live");
  show(0);
  new IntersectionObserver((entries) => {
    // Batched entries arrive oldest first, and only the latest says where the stage is now.
    const visible = entries[entries.length - 1].isIntersecting;
    if (visible && timer === undefined) {
      timer = window.setInterval(() => show((at + 1) % frames.length), interval);
    } else if (!visible && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  }).observe(stage);
}
document.querySelectorAll<HTMLElement>("[data-frames]").forEach(animate);

// A stage wider than its box scrolls sideways (the wide pictures on a phone, a long banner), so it takes
// a tab stop while it overflows and keyboard users can scroll it with the arrow keys.
const stages = [...document.querySelectorAll<HTMLElement>(".ascii-stage")];
const reachable = (stage: HTMLElement) => {
  if (stage.scrollWidth > stage.clientWidth) stage.tabIndex = 0;
  else stage.removeAttribute("tabindex");
};
const resized = new ResizeObserver((entries) => entries.forEach((entry) => reachable(entry.target as HTMLElement)));
stages.forEach((stage) => resized.observe(stage));
// The monospace font arriving changes how wide the art is without resizing its box.
document.fonts?.ready.then(() => stages.forEach(reachable));

// The banner maker: type words, pick a font, get letters. The words and the font live in the address bar,
// so a banner can be shared, and the terminal's `banner <words>` command opens it with the words already
// there. The page carries its first font inline; the others are fetched (once) when someone picks one.
const form = document.querySelector<HTMLFormElement>("[data-banner]");
const inline = document.getElementById("banner-font");
if (form && inline?.textContent) {
  const input = form.querySelector<HTMLInputElement>("input")!;
  const select = form.querySelector<HTMLSelectElement>("select")!;
  // The output sits in its own figure beside the form, so look for it on the whole page.
  const out = document.querySelector<HTMLElement>("[data-banner-out]")!;
  const first = inline.dataset.id ?? select.value;
  const fonts = new Map<string, Font>([[first, JSON.parse(inline.textContent) as Font]]);
  const params = new URLSearchParams(location.search);
  if (params.get("banner")) input.value = params.get("banner")!;
  const wanted = params.get("font");
  if (wanted && [...select.options].some((option) => option.value === wanted)) select.value = wanted;

  const load = async (id: string) => {
    if (!fonts.has(id)) fonts.set(id, (await (await fetch(`/ascii/fonts/${encodeURIComponent(id)}.json`)).json()) as Font);
    return fonts.get(id)!;
  };
  let latest = 0;
  const draw = async (remember: boolean) => {
    const turn = ++latest;
    let font: Font;
    try {
      font = await load(select.value);
    } catch {
      return; // offline or the file is missing: leave the banner as it is
    }
    if (turn !== latest) return; // a newer change got here first
    out.textContent = figlet(font, input.value);
    const stage = out.closest<HTMLElement>(".ascii-stage");
    if (stage) reachable(stage);
    if (!remember) return;
    const url = new URL(location.href);
    if (input.value) url.searchParams.set("banner", input.value);
    else url.searchParams.delete("banner");
    if (select.value !== first) url.searchParams.set("font", select.value);
    else url.searchParams.delete("font");
    history.replaceState(null, "", url);
  };
  input.addEventListener("input", () => void draw(true));
  select.addEventListener("change", () => void draw(true));
  form.addEventListener("submit", (e) => e.preventDefault());
  void draw(false);
}

// Copy buttons: a figure copies the frame on screen right now, and `data-copy-from` names another
// element (the banner). They only appear where the clipboard works, like the clone button.
const live = document.createElement("p");
live.className = "visually-hidden";
live.setAttribute("aria-live", "polite");
document.body.appendChild(live);

if (navigator.clipboard && window.isSecureContext) {
  document.querySelectorAll<HTMLButtonElement>("[data-copy-art]").forEach((btn) => {
    btn.hidden = false;
    const label = btn.querySelector("span");
    const original = label ? label.textContent : "";
    let timer: number | undefined;
    btn.addEventListener("click", () => {
      const from = btn.dataset.copyFrom;
      const figure = btn.closest(".ascii-figure");
      // `.is-on` is the frame on screen. (A selector list like ".is-on, .frame" would return whichever
      // comes first in the page, which is always the first frame.) A still figure has no `.is-on`.
      const source = from
        ? document.querySelector<HTMLElement>(from)
        : (figure?.querySelector<HTMLElement>(".ascii-frame.is-on") ?? figure?.querySelector<HTMLElement>(".ascii-frame"));
      const text = source?.textContent ?? "";
      if (!text.trim()) return;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("is-copied");
        if (label) label.textContent = "copied!";
        live.textContent = "Copied to the clipboard";
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          btn.classList.remove("is-copied");
          if (label) label.textContent = original;
        }, 1600);
      });
    });
  });
}

export {};
