// The site is printed in Pip's flavour: data-flavour on <html> picks the spot ink (src/styles/tokens.css).
// Pip (src/components/Pip.astro) and the footer's ink picker both change it through here, so they stay in
// step with each other. The choice is remembered, and src/layouts/Base.astro applies it again before the
// next page paints.

export const STORE = "pip-flavour";
export const DEFAULT = "cherry";

type Transition = { finished: Promise<void> };
type ViewDocument = Document & { startViewTransition?: (update: () => void) => Transition };

export function currentFlavour(): string {
  return document.documentElement.dataset.flavour || DEFAULT;
}

/**
 * Reprint the site in another flavour. With an `origin` (where it was picked, in viewport pixels) the new
 * ink floods out from there, where the browser can and the visitor hasn't asked for less motion.
 * Fires "flavourchange" on window either way, with the flavour's name as its detail.
 */
export function setFlavour(name: string, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (currentFlavour() !== name) {
    const apply = () => { root.dataset.flavour = name; };
    const doc = document as ViewDocument;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (origin && doc.startViewTransition && !reduced) {
      root.style.setProperty("--ink-x", `${origin.x}px`);
      root.style.setProperty("--ink-y", `${origin.y}px`);
      root.classList.add("is-inking");
      doc.startViewTransition(apply).finished.finally(() => root.classList.remove("is-inking"));
    } else {
      apply();
    }
  }
  try { localStorage.setItem(STORE, name); } catch { /* private mode: just don't remember */ }
  window.dispatchEvent(new CustomEvent("flavourchange", { detail: name }));
}

/** The middle of an element, for setFlavour's origin. */
export function centreOf(el: Element) {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}
