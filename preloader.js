/* TwinzLab load overlay.
   Plays assets/twinzlab-logo.lottie with the self-hosted dotLottie web player
   (assets/dotlottie/, @lottiefiles/dotlottie-web 0.81.0) on the first view
   of a tab session. Later pages in that tab skip it. Reduced motion skips it. */
(function () {
  "use strict";

  var SEEN_KEY = "tz-preloader-seen";
  var CYCLE_MS = 2000;
  var FADE_MS = 400;
  var SAFETY_MS = 4000;

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/[^/]*$/, "") : "/";

  function reduced() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function seen() {
    try { return sessionStorage.getItem(SEEN_KEY) === "1"; }
    catch (err) { return false; }
  }

  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, "1"); }
    catch (err) {}
  }

  var html = document.documentElement;
  var overlay = document.getElementById("tz-preloader");

  if (reduced()) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    html.classList.remove("tz-preloading");
    html.removeAttribute("aria-busy");
    return;
  }
  if (!overlay && seen()) return;

  markSeen();
  window.__tzPreloaderOwned = true;
  html.classList.add("tz-preloading");
  html.setAttribute("aria-busy", "true");

  var canvas = overlay && overlay.querySelector("canvas");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tz-preloader";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    html.appendChild(overlay);
  }
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "tz-preloader__logo";
    canvas.setAttribute("aria-hidden", "true");
    overlay.insertBefore(canvas, overlay.firstChild);
  }
  if (!overlay.querySelector(".tz-preloader__label")) {
    var label = document.createElement("span");
    label.className = "tz-preloader__label";
    label.textContent = "Loading TwinzLab";
    overlay.appendChild(label);
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var css = 220;
  if (window.matchMedia && window.matchMedia("(min-width: 1280px)").matches) css = 256;
  var rect = canvas.getBoundingClientRect();
  if (rect.width) css = rect.width;
  canvas.width = Math.max(1, Math.round(css * dpr));
  canvas.height = Math.max(1, Math.round(css * dpr));

  function blockScroll(event) { event.preventDefault(); }
  overlay.addEventListener("wheel", blockScroll, { passive: false });
  overlay.addEventListener("touchmove", blockScroll, { passive: false });

  var inertOn = false;
  function setInert(on) {
    var main = document.getElementById("main");
    if (!main) return;
    if (on) {
      main.setAttribute("inert", "");
      inertOn = true;
    } else if (inertOn) {
      main.removeAttribute("inert");
      inertOn = false;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setInert(true); });
  else setInert(true);

  var player = null;
  var leaving = false;
  var failed = false;
  var cycled = false;
  var played = false;
  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    html.classList.remove("tz-preloading");
    html.removeAttribute("aria-busy");
    setInert(false);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (player) {
      try { player.destroy(); } catch (err) {}
      player = null;
    }
    requestAnimationFrame(function () {
      document.dispatchEvent(new Event("tz-preloader-done"));
    });
  }

  function dismiss() {
    if (leaving) return;
    leaving = true;
    overlay.classList.add("is-leaving");
    var removed = false;
    function end() {
      if (removed) return;
      removed = true;
      finish();
    }
    overlay.addEventListener("transitionend", function (event) {
      if (event.target === overlay && event.propertyName === "opacity") end();
    });
    setTimeout(end, FADE_MS + 80);
  }

  function pageReady() { return document.readyState === "complete"; }

  function maybeDismiss() {
    if (leaving) return;
    if (failed) {
      if (pageReady()) dismiss();
      return;
    }
    if (cycled && pageReady()) dismiss();
  }

  function markCycled() {
    if (cycled) return;
    cycled = true;
    maybeDismiss();
  }

  window.addEventListener("load", maybeDismiss);
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) dismiss();
  });
  setTimeout(function () { dismiss(); }, SAFETY_MS);

  function preload(href, asType, cross) {
    if (!document.head) return;
    var link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = asType;
    if (cross) link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  var wasmUrl = base + "assets/dotlottie/dotlottie-player.wasm";
  var lottieUrl = base + "assets/twinzlab-logo.lottie";
  // The player fetches the .lottie with default credentials, which does not
  // match a preload, so only the wasm (loaded with CORS) is preloaded.
  preload(wasmUrl, "fetch", true);

  import(base + "assets/dotlottie/dotlottie-web.js").then(function (mod) {
    if (leaving || !mod || !mod.DotLottie) {
      failed = true;
      maybeDismiss();
      return;
    }
    var DotLottie = mod.DotLottie;
    DotLottie.setWasmUrl(wasmUrl);
    player = new DotLottie({
      canvas: canvas,
      src: lottieUrl,
      loop: true,
      autoplay: true,
      backgroundColor: "transparent",
      layout: { fit: "contain", align: [0.5, 0.5] },
      renderConfig: {
        autoResize: true,
        freezeOnOffscreen: false,
        devicePixelRatio: dpr,
        quality: 100
      }
    });
    player.addEventListener("play", function () {
      if (played) return;
      played = true;
      setTimeout(markCycled, CYCLE_MS);
    });
    player.addEventListener("loop", markCycled);
    player.addEventListener("complete", markCycled);
    player.addEventListener("loadError", function () { failed = true; maybeDismiss(); });
    player.addEventListener("renderError", function () { failed = true; maybeDismiss(); });
  }).catch(function () {
    failed = true;
    maybeDismiss();
  });
})();
