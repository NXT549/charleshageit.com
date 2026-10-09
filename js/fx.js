// Micro-interactions shared by every page. Load with <script src="./js/fx.js" defer>.

// .glow cards: feed the pointer position into --mx/--my so the gradient ring and
// spotlight follow the cursor. Delegated, so cards added later (e.g. from the
// GitHub API) work without re-binding.
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.addEventListener(
    "pointermove",
    function (e) {
      var el = e.target.closest && e.target.closest(".glow");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", Math.round(e.clientX - r.left) + "px");
      el.style.setProperty("--my", Math.round(e.clientY - r.top) + "px");
    },
    { passive: true }
  );
})();
