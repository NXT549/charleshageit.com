// Micro-interactions shared by every page. Load with <script src="./js/fx.js" defer>.

// Pixel sparkles: a little burst of candy-coloured squares. Fires when you press
// a .btn or anything with [data-sparkle], and other scripts can call
// window.sparkle(x, y) (Pip does). Skipped for people who prefer less motion.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var COLOURS = ["--cherry", "--lemon", "--lime", "--blueberry", "--grape", "--bubblegum", "--cyan", "--flavour"];

  function colour(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function sparkle(x, y, count) {
    if (reduced.matches || !document.body.animate) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "sparkle";
      s.style.left = x - 3 + "px";
      s.style.top = y - 3 + "px";
      s.style.background = colour(COLOURS[(Math.random() * COLOURS.length) | 0]);
      document.body.appendChild(s);
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      var dist = 28 + Math.random() * 30;
      var dx = Math.round(Math.cos(angle) * dist / 3) * 3; // snap to a 3px grid so it stays pixelly
      var dy = Math.round(Math.sin(angle) * dist / 3) * 3;
      s.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: "translate(" + dx + "px," + (dy + 14) + "px) scale(0.4)", opacity: 0 }
        ],
        { duration: 520 + Math.random() * 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      ).onfinish = s.remove.bind(s);
    }
  }
  window.sparkle = sparkle;

  document.addEventListener("pointerdown", function (e) {
    var el = e.target.closest && e.target.closest(".btn, [data-sparkle]");
    if (el) sparkle(e.clientX, e.clientY, 8);
  });
})();
