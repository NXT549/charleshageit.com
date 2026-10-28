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

// A stage wider than its box scrolls sideways (the market scenes on a phone, a long banner), so it takes
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

// The banner maker: type words, get letters. The words live in the address bar, so a banner can be
// shared, and the terminal's `banner <words>` command opens it with the words already there.
const form = document.querySelector<HTMLFormElement>("[data-banner]");
const fontJson = document.getElementById("banner-font")?.textContent;
if (form && fontJson) {
  const font = JSON.parse(fontJson) as Font;
  const input = form.querySelector<HTMLInputElement>("input")!;
  // The output sits in its own figure beside the form, so look for it on the whole page.
  const out = document.querySelector<HTMLElement>("[data-banner-out]")!;
  const from = new URLSearchParams(location.search).get("banner");
  if (from) input.value = from;
  const draw = (remember: boolean) => {
    out.textContent = figlet(font, input.value);
    const stage = out.closest<HTMLElement>(".ascii-stage");
    if (stage) reachable(stage);
    if (!remember) return;
    const url = new URL(location.href);
    if (input.value) url.searchParams.set("banner", input.value);
    else url.searchParams.delete("banner");
    history.replaceState(null, "", url);
  };
  input.addEventListener("input", () => draw(true));
  form.addEventListener("submit", (e) => e.preventDefault());
  draw(false);
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
