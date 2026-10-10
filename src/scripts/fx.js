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
    ".log-month__title", ".log-entry", ".footer-pip"
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
