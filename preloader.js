/* TwinzLab load overlay.
   The supplied lottie stores the infinity as three 32×36 PNGs and only
   fades two dots, so playing it looks pixelated and never draws a path.
   This reveals the same infinity as a vector (the favicon path) along its
   centerline, then fades the two dots on that file's timing: 0.59s–0.84s
   and 1.05s–1.31s inside the 2s cycle. */
(function () {
  "use strict";

  var SEEN_KEY = "tz-preloader-seen";
  var CYCLE_MS = 2000;
  var DRAW_MS = 1500;
  var FADE_MS = 800;
  var SAFETY_MS = 4500;
  var DOT_A = [590, 840];
  var DOT_B = [1050, 1310];

  var MARK_D = "M64.5361 84.8408C65.7533 87.2411 67.813 88.4926 70.0752 89.0439C72.3959 89.6094 74.7654 89.3852 76.1641 88.9541L78.5996 92.4268C77.5874 93.7693 76.6929 95.2051 75.9316 96.7188L75.9033 96.7764L75.8711 96.832L65.4062 114.958H73.4648L73.9072 116.61C75.5513 122.749 79.2263 128.063 84.1729 131.785C88.8709 135.32 94.711 137.414 101.046 137.414C116.561 137.414 129.138 124.837 129.138 109.322C129.138 93.8075 116.561 81.2307 101.046 81.2305H56.9551C38.978 81.2305 24.4043 66.6567 24.4043 48.6797C24.4043 30.7026 38.978 16.1289 56.9551 16.1289C69.659 16.1289 80.6582 23.4078 86.0195 34.0117L100.316 58.7734H87.9082C85.8155 65.195 81.7841 70.7352 76.5078 74.7051L73.8271 71.1426C78.7739 67.4207 82.4487 62.1062 84.0928 55.9678L84.5361 54.3154H92.5947L82.1299 36.1895L82.0977 36.1338L82.0684 36.0762C77.4462 26.8856 67.9342 20.5879 56.9551 20.5879C41.4402 20.5879 28.8633 33.1648 28.8633 48.6797C28.8633 64.1946 41.4402 76.7715 56.9551 76.7715H101.046C119.023 76.7717 133.596 91.3453 133.596 109.322C133.596 127.299 119.023 141.872 101.046 141.872C93.7112 141.872 86.9372 139.444 81.4932 135.348C76.2168 131.378 72.1855 125.838 70.0928 119.416H57.6836L71.9902 94.6357C72.1275 94.3646 72.2685 94.0958 72.4131 93.8291C71.312 93.7936 70.1634 93.6544 69.0205 93.376C65.8174 92.5955 62.5014 90.6862 60.5596 86.8564L64.5361 84.8408Z";
  var DRAW_D = "M 78.00 78.00 C 79.23 75.67 83.65 67.17 85.40 64.00 C 87.15 60.83 87.53 60.33 88.50 59.00 C 89.47 57.67 90.12 57.17 91.20 56.00 C 92.28 54.83 94.87 53.67 95.00 52.00 C 95.13 50.33 93.07 47.67 92.00 46.00 C 90.93 44.33 89.73 43.67 88.60 42.00 C 87.47 40.33 86.40 37.83 85.20 36.00 C 84.00 34.17 82.78 32.67 81.40 31.00 C 80.02 29.33 78.68 27.50 76.90 26.00 C 75.12 24.50 73.18 23.13 70.70 22.00 C 68.22 20.87 64.32 20.10 62.00 19.20 C 59.68 18.30 58.80 16.60 56.80 16.60 C 54.80 16.60 52.30 18.30 50.00 19.20 C 47.70 20.10 45.20 20.87 43.00 22.00 C 40.80 23.13 38.48 24.67 36.80 26.00 C 35.12 27.33 33.98 28.67 32.90 30.00 C 31.82 31.33 31.05 32.67 30.30 34.00 C 29.55 35.33 28.95 36.50 28.40 38.00 C 27.85 39.50 27.30 41.33 27.00 43.00 C 26.70 44.67 26.65 46.33 26.60 48.00 C 26.55 49.67 26.47 51.33 26.70 53.00 C 26.93 54.67 27.32 56.17 28.00 58.00 C 28.68 59.83 29.72 62.17 30.80 64.00 C 31.88 65.83 33.12 67.50 34.50 69.00 C 35.88 70.50 36.85 71.75 39.10 73.00 C 41.35 74.25 43.85 75.63 48.00 76.50 C 52.15 77.37 59.00 77.78 64.00 78.20 C 69.00 78.62 72.67 78.78 78.00 79.00 C 83.33 79.22 90.13 79.00 96.00 79.50 C 101.87 80.00 109.17 80.75 113.20 82.00 C 117.23 83.25 118.22 85.33 120.20 87.00 C 122.18 88.67 123.70 90.17 125.10 92.00 C 126.50 93.83 127.70 96.00 128.60 98.00 C 129.50 100.00 130.07 102.00 130.50 104.00 C 130.93 106.00 131.20 108.00 131.20 110.00 C 131.20 112.00 130.97 114.00 130.50 116.00 C 130.03 118.00 129.37 120.00 128.40 122.00 C 127.43 124.00 126.43 126.00 124.70 128.00 C 122.97 130.00 120.78 132.30 118.00 134.00 C 115.22 135.70 110.85 137.10 108.00 138.20 C 105.15 139.30 103.57 140.60 100.90 140.60 C 98.23 140.60 94.58 139.13 92.00 138.20 C 89.42 137.27 87.40 136.20 85.40 135.00 C 83.40 133.80 81.50 132.50 80.00 131.00 C 78.50 129.50 77.57 127.83 76.40 126.00 C 75.23 124.17 74.63 122.33 73.00 120.00 C 71.37 117.67 68.03 114.33 66.60 112.00 C 65.17 109.67 64.47 108.33 64.40 106.00 C 64.33 103.67 65.27 100.33 66.20 98.00 C 67.13 95.67 70.30 93.83 70.00 92.00 C 69.70 90.17 64.07 88.50 64.40 87.00 C 64.73 85.50 69.73 84.25 72.00 83.00 C 74.27 81.75 77.00 80.08 78.00 79.50";

  var html = document.documentElement;
  var overlay = document.getElementById("tz-preloader");

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

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tz-preloader";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    html.appendChild(overlay);
  }

  var NS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "tz-preloader__logo");
  svg.setAttribute("viewBox", "0 0 158 158");
  svg.setAttribute("aria-hidden", "true");

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) {
      if (attrs[key] != null) node.setAttribute(key, attrs[key]);
    }
    return node;
  }

  var defs = el("defs");
  var markGrad = el("linearGradient", {
    id: "tzMarkGrad",
    x1: "86.5702", y1: "18.3584", x2: "86.5702", y2: "139.643",
    gradientUnits: "userSpaceOnUse"
  });
  markGrad.appendChild(el("stop", { offset: "0.211538", "stop-color": "#D9D9D9" }));
  markGrad.appendChild(el("stop", { offset: "0.605769", "stop-color": "#EAAB78" }));
  markGrad.appendChild(el("stop", { offset: "0.875", "stop-color": "#C1DAFF" }));
  var dotGradA = el("linearGradient", {
    id: "tzDotGradA",
    x1: "69.0677", y1: "38.5176", x2: "69.0677", y2: "45.0999",
    gradientUnits: "userSpaceOnUse"
  });
  var dotGradB = el("linearGradient", {
    id: "tzDotGradB",
    x1: "89.3724", y1: "97.1426", x2: "89.3724", y2: "103.725",
    gradientUnits: "userSpaceOnUse"
  });
  [dotGradA, dotGradB].forEach(function (grad) {
    grad.appendChild(el("stop", { offset: "0.706429", "stop-color": "#D9D9D9" }));
    grad.appendChild(el("stop", { offset: "0.826923", "stop-color": "#EAAB78" }));
    grad.appendChild(el("stop", { offset: "1", "stop-color": "#C1DAFF" }));
  });
  var mask = el("mask", {
    id: "tzDrawMask",
    maskUnits: "userSpaceOnUse",
    x: "0", y: "0", width: "158", height: "158"
  });
  var drawPath = el("path", {
    id: "tzDrawPath",
    d: DRAW_D,
    fill: "none",
    stroke: "#fff",
    "stroke-width": "20",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  mask.appendChild(drawPath);
  defs.appendChild(markGrad);
  defs.appendChild(dotGradA);
  defs.appendChild(dotGradB);
  defs.appendChild(mask);
  svg.appendChild(defs);

  var mark = el("path", { id: "tzMark", d: MARK_D, fill: "url(#tzMarkGrad)", mask: "url(#tzDrawMask)" });
  var dotA = el("circle", {
    id: "tzDotA", cx: "68.5919", cy: "41.8087", r: "3.29116",
    fill: "url(#tzDotGradA)", opacity: "0"
  });
  var dotB = el("circle", {
    id: "tzDotB", cx: "88.8966", cy: "100.434", r: "3.29116",
    fill: "url(#tzDotGradB)", opacity: "0"
  });
  svg.appendChild(mark);
  svg.appendChild(dotA);
  svg.appendChild(dotB);

  var oldCanvas = overlay.querySelector("canvas");
  if (oldCanvas && oldCanvas.parentNode) oldCanvas.parentNode.replaceChild(svg, oldCanvas);
  else overlay.insertBefore(svg, overlay.firstChild);

  if (!overlay.querySelector(".tz-preloader__label")) {
    var label = document.createElement("span");
    label.className = "tz-preloader__label";
    label.textContent = "Loading TwinzLab";
    overlay.appendChild(label);
  }

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

  var leaving = false;
  var finished = false;
  var cycled = false;
  var raf = 0;
  var startedAt = 0;
  var length = 0;

  function finish() {
    if (finished) return;
    finished = true;
    if (raf) cancelAnimationFrame(raf);
    html.classList.remove("tz-preloading");
    html.removeAttribute("aria-busy");
    setInert(false);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
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
    setTimeout(end, FADE_MS + 120);
  }

  function pageReady() { return document.readyState === "complete"; }

  function maybeDismiss() {
    if (leaving) return;
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

  function smooth(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  }

  function easeDraw(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  try { length = drawPath.getTotalLength(); }
  catch (err) { length = 0; }

  if (!length) {
    mark.removeAttribute("mask");
    dotA.setAttribute("opacity", "1");
    dotB.setAttribute("opacity", "1");
    setTimeout(markCycled, CYCLE_MS);
    return;
  }

  drawPath.style.strokeDasharray = length + " " + length;
  drawPath.style.strokeDashoffset = String(length);

  function frame(now) {
    if (finished || leaving) return;
    if (!startedAt) startedAt = now;
    var elapsed = now - startedAt;
    if (elapsed >= CYCLE_MS) markCycled();
    var local = elapsed % CYCLE_MS;
    var p = Math.min(1, local / DRAW_MS);
    drawPath.style.strokeDashoffset = String(length * (1 - easeDraw(p)));
    if (p >= 1) mark.removeAttribute("mask");
    else if (!mark.hasAttribute("mask")) mark.setAttribute("mask", "url(#tzDrawMask)");
    dotA.setAttribute("opacity", String(smooth((local - DOT_A[0]) / (DOT_A[1] - DOT_A[0]))));
    dotB.setAttribute("opacity", String(smooth((local - DOT_B[0]) / (DOT_B[1] - DOT_B[0]))));
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
})();
