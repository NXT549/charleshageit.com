// Small enhancements for the GitHub showcase (the cards themselves are static HTML,
// rendered at build time by showcase/build.mjs). Load with <script src="./js/showcase.js" defer>.
(function () {
  // ---------- "3 days ago" for every <time data-relative> ----------
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" }) : null;
  var UNITS = [
    ["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60]
  ];
  function ago(date) {
    var secs = (date.getTime() - Date.now()) / 1000;
    for (var i = 0; i < UNITS.length; i++) {
      if (Math.abs(secs) >= UNITS[i][1]) return rtf.format(Math.trunc(secs / UNITS[i][1]), UNITS[i][0]);
    }
    return "just now";
  }
  if (rtf) {
    document.querySelectorAll("time[data-relative]").forEach(function (el) {
      var d = new Date(el.getAttribute("datetime"));
      if (isNaN(d)) return;
      el.title = el.textContent;
      el.textContent = ago(d);
    });
  }

  // ---------- fresh releases get a "new" glow for two weeks ----------
  document.querySelectorAll("[data-released]").forEach(function (el) {
    var d = new Date(el.getAttribute("data-released"));
    if (!isNaN(d) && Date.now() - d < 14 * 86400000) el.classList.add("is-new");
  });

  // ---------- copy "git clone …" ----------
  var live = document.createElement("p");
  live.className = "visually-hidden";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);

  if (navigator.clipboard && window.isSecureContext) {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.hidden = false;
      var label = btn.querySelector("span");
      var original = label ? label.textContent : "";
      var timer;
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
          btn.classList.add("is-copied");
          if (label) label.textContent = "copied!";
          live.textContent = "Copied " + btn.getAttribute("data-copy");
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.classList.remove("is-copied");
            if (label) label.textContent = original;
          }, 1600);
        });
      });
    });
  }

  // ---------- play a demo inside its spotlight card ----------
  document.querySelectorAll("[data-embed]").forEach(function (btn) {
    var media = btn.parentElement;
    var label = btn.querySelector("span");
    var use = btn.querySelector("use");
    var openText = label ? label.textContent : "";
    var frame = null;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      if (frame) {
        frame.remove();
        frame = null;
        media.classList.remove("is-playing");
        if (label) label.textContent = openText;
        if (use) use.setAttribute("href", "#i-play");
        return;
      }
      frame = document.createElement("iframe");
      frame.className = "spotlight__frame";
      frame.src = btn.getAttribute("data-embed");
      frame.title = btn.getAttribute("data-title") || "Live demo";
      frame.allow = "fullscreen; autoplay; gamepad";
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms");
      media.insertBefore(frame, btn);
      media.classList.add("is-playing");
      if (label) label.textContent = "Close the demo";
      if (use) use.setAttribute("href", "#i-close");
    });
  });
})();
