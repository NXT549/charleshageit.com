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
