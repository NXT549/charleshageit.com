// Micro-interactions shared by every page. Load with <script src="./js/fx.js" defer>.

// Rubber stamps (.badge) thunk down onto the page as they scroll into view.
// Stamps already on screen when the page loads are left as they are, and
// nothing moves for people who prefer less motion.
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var seen = new WeakSet();
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (!seen.has(el)) {
          // First report: decide whether this stamp starts off screen.
          seen.add(el);
          if (!e.isIntersecting) el.classList.add("is-waiting");
          else io.unobserve(el);
          return;
        }
        if (e.isIntersecting) {
          el.classList.remove("is-waiting");
          el.classList.add("is-stamped");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.6 }
  );

  function watch(root) {
    (root.querySelectorAll ? root.querySelectorAll(".badge") : []).forEach(function (el) {
      if (!seen.has(el)) io.observe(el);
    });
  }
  watch(document);

  // Cards added later (e.g. from the GitHub API) get their stamps watched too.
  new MutationObserver(function (records) {
    records.forEach(function (r) {
      r.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.matches(".badge")) io.observe(n);
        watch(n);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();

// Sheets of the drawing slide onto the table as they scroll into view: section headings, project
// cards, the about panels, log entries. Things that arrive together are dealt out one after another.
// Like the stamps, anything already on screen at load stays put (so nothing above the fold flickers),
// and nothing moves for people who prefer less motion. The look lives in theme.css (.is-waiting / .is-in).
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SHEETS = [
    ".section-head", ".spotlight", ".repo-card", ".showcase-foot", ".about",
    ".about-grid > *", ".flow > li", ".about-chips", ".about-hi__card",
    ".log-month__title", ".log-entry", ".footer-pip", ".does-card", ".how__step", ".proj-fig", ".proj-draft__box"
  ].join(",");

  var seen = new WeakSet();
  var io = new IntersectionObserver(
    function (entries) {
      var batch = 0;
      entries.forEach(function (e) {
        var el = e.target;
        if (!seen.has(el)) {
          seen.add(el);
          if (!e.isIntersecting) { el.classList.add("is-waiting"); return; }
          io.unobserve(el);
          return;
        }
        if (!e.isIntersecting) return;
        io.unobserve(el);
        el.style.setProperty("--in-i", String(Math.min(batch++, 5)));
        el.classList.remove("is-waiting");
        el.classList.add("is-in");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  document.querySelectorAll(SHEETS).forEach(function (el) { io.observe(el); });
})();

// A CAD cursor: with a mouse, a little square snaps to the nearest intersection of the grid paper
// (the page's 24px grid, which scrolls with the page) and a tag reads out its coordinates. Touch
// screens and people who prefer less motion never see it.
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GRID = 24;
  var cad, tag, frame = 0, x = 0, y = 0;

  function pad(n) { return String(n).padStart(3, "0"); }

  function build() {
    cad = document.createElement("div");
    cad.className = "cad";
    cad.setAttribute("aria-hidden", "true");
    cad.innerHTML = '<i class="cad__mark"></i><span class="cad__tag"></span>';
    tag = cad.lastChild;
    document.body.appendChild(cad);
  }

  function draw() {
    frame = 0;
    var top = window.scrollY;
    var gx = Math.round((x + 1) / GRID);
    var gy = Math.round((y + top + 1) / GRID);
    cad.style.transform = "translate(" + (gx * GRID - 1) + "px," + (gy * GRID - 1 - top) + "px)";
    cad.classList.toggle("cad--flip", x > window.innerWidth - 130);
    tag.textContent = "X " + pad(gx) + " \u00b7 Y " + pad(gy);
  }

  function queue() { if (!frame) frame = requestAnimationFrame(draw); }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    if (!cad) build();
    x = e.clientX; y = e.clientY;
    cad.classList.add("is-on");
    queue();
  }, { passive: true });
  window.addEventListener("scroll", function () { if (cad) queue(); }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { if (cad) cad.classList.remove("is-on"); });
})();
