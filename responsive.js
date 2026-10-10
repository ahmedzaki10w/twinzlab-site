(function () {
  var VIEWPORT = "width=device-width, initial-scale=1";

  // Framer's runtime writes the page's configured viewport (width=1200) on hydration.
  function fixViewport() {
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "viewport";
      document.head.appendChild(m);
    }
    if (m.content !== VIEWPORT) m.content = VIEWPORT;
  }
  fixViewport();
  new MutationObserver(fixViewport).observe(document.head, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["content"],
  });

  // Absolute site root. `../products/` is one directory off when the address
  // has no trailing slash, and `./products` (what Framer writes) nests under
  // the current page. responsive.js lives at the site root, so its URL is the root.
  function siteRoot() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (/(?:^|\/)responsive\.js(?:[?#]|$)/.test(src)) return src.replace(/[^/]*$/, "");
    }
    return location.origin + "/";
  }
  var root = siteRoot();
  var links = [
    ["Home", root],
    ["About", root + "about/"],
    ["Products", root + "products/"],
    ["Lab", root + "lab/"],
  ];

  function current(href) {
    var a = document.createElement("a");
    a.href = href;
    var here = location.pathname.replace(/index\.html$/, "");
    var there = a.pathname.replace(/index\.html$/, "");
    if (there === here) return true;
    return there.slice(-5) === "/lab/" && here.indexOf(there) === 0;
  }

  function build() {
    if (document.querySelector(".tz-menu-btn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tz-menu-btn";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "tz-menu");
    btn.innerHTML = "<span></span><span></span>";

    var nav = document.createElement("nav");
    nav.className = "tz-menu";
    nav.id = "tz-menu";
    nav.setAttribute("aria-label", "Mobile");
    nav.setAttribute("aria-hidden", "true");
    links.forEach(function (l) {
      var a = document.createElement("a");
      a.href = l[1];
      a.textContent = l[0];
      if (current(l[1])) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });
    var cta = document.createElement("a");
    cta.href = root + "contact/";
    cta.className = "tz-menu__cta";
    cta.textContent = "Contact";
    if (current(cta.href)) cta.setAttribute("aria-current", "page");
    nav.appendChild(cta);
    var mail = document.createElement("a");
    mail.className = "tz-menu__mail";
    mail.href = "mailto:hello@twinzlab.online";
    mail.textContent = "hello@twinzlab.online";
    nav.appendChild(mail);

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      nav.setAttribute("aria-hidden", open ? "false" : "true");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("tz-menu-open", open);
    }
    btn.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });

    document.body.appendChild(nav);
    document.body.appendChild(btn);
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);

  /* --------------------------------------------------------- blur reveal */

  // Major page bands, then the cards inside them. Hashes are this Framer export.
  var REVEAL_SECTIONS = [
    ".framer-152oa6t", ".framer-dj3hi8", ".framer-et1gw2", ".framer-1cs6vvp", ".framer-1d28yuc",
    ".framer-1lq0uvn", ".framer-ihlbe4", ".framer-iyzx2i", ".framer-2dudm4",
    ".framer-14mxnf4", ".framer-1ugbpjk", ".framer-1h7cige",
    ".framer-q8ddpx", ".framer-1azgdz2", ".framer-1wesycm", ".framer-1k78fk5",
    ".framer-14b4bh3"
  ];
  var REVEAL_CARDS = [
    ".framer-1d8ufji", ".framer-1413m6a", ".framer-ck2tmp",
    ".framer-11xoq6b",
    ".framer-1ef4b7q", ".framer-nzlyda", ".framer-tlhq47",
    ".framer-eo4uhb",
    ".framer-1luoeas > *",
    ".tz-lab-face"
  ];
  var revealGroups = typeof WeakMap === "function" ? new WeakMap() : null;
  var revealObserver = null;

  function revealReduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function revealInView(el) {
    var rect = el.getBoundingClientRect();
    var view = window.innerHeight || document.documentElement.clientHeight || 800;
    return rect.top < view * 0.92 && rect.bottom > 0;
  }

  // filter/transform on a sticky element, or on an ancestor of one, cancels sticky.
  function revealSticky(el) {
    if (window.getComputedStyle(el).position === "sticky") return "self";
    var nodes = el.querySelectorAll("*");
    for (var i = 0; i < nodes.length; i++) {
      if (window.getComputedStyle(nodes[i]).position === "sticky") return "child";
    }
    return "";
  }

  function revealShow(list) {
    for (var i = 0; i < list.length; i++) list[i].classList.add("is-in");
  }

  function armReveal(nodes, stagger, cascade) {
    if (!revealObserver) return;
    var live = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.getAttribute("data-tz-reveal") === "1") continue;
      if (el.closest && el.closest("[data-framer-name='header'], .framer-ntizu1, .tz-menu")) continue;
      var rect = el.getBoundingClientRect();
      if (rect.height < 32 || rect.width < 32) continue;
      var sticky = revealSticky(el);
      if (sticky === "child") continue;
      el.setAttribute("data-tz-reveal", "1");
      el.classList.add("tz-reveal");
      // Opacity only. Blur or translate on the sticky box itself cancels sticking.
      if (sticky === "self") el.classList.add("tz-reveal-soft");
      var delay = Math.min((stagger || 0) + (cascade ? live.length * 80 : 0), 280);
      if (delay) el.style.setProperty("--tz-reveal-delay", delay + "ms");
      live.push(el);
    }
    if (!live.length) return;
    if (revealGroups) revealGroups.set(live[0], live);
    if (revealInView(live[0])) revealShow(live);
    else revealObserver.observe(live[0]);
  }

  function articleGroups() {
    var groups = [];
    [".article-side", ".byline", ".hero", ".dek"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) groups.push([el]);
    });
    var prose = document.querySelector(".prose");
    if (prose) {
      var current = [];
      Array.prototype.forEach.call(prose.children, function (el) {
        if (el.tagName === "H2" && current.length) {
          groups.push(current);
          current = [];
        }
        current.push(el);
      });
      if (current.length) groups.push(current);
    }
    [".author-note", ".share", ".topic-cta", ".more-lab", ".sources"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) groups.push([el]);
    });
    return groups;
  }

  function scanReveal() {
    if (revealReduced() || !revealObserver) return;
    REVEAL_SECTIONS.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { armReveal([el], 0); });
    });
    var cards = document.querySelectorAll(REVEAL_CARDS.join(","));
    var byParent = [];
    Array.prototype.forEach.call(cards, function (el) {
      var parent = el.parentElement;
      var row = null;
      for (var i = 0; i < byParent.length; i++) if (byParent[i].parent === parent) row = byParent[i];
      if (!row) {
        row = { parent: parent, els: [] };
        byParent.push(row);
      }
      row.els.push(el);
    });
    byParent.forEach(function (row) { armReveal(row.els, 40, true); });
    articleGroups().forEach(function (group, index) { armReveal(group, index < 4 ? index * 60 : 0, false); });
    document.documentElement.classList.add("tz-reveal-on");
  }

  function bootReveal() {
    if (revealReduced() || !("IntersectionObserver" in window)) return;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var list = revealGroups && revealGroups.get(entry.target);
        revealShow(list || [entry.target]);
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    var started = false;
    function startReveal() {
      if (started) return;
      started = true;
      scanReveal();
      var queued = false;
      var root = document.getElementById("main") || document.body;
      if (window.MutationObserver && root) {
        new MutationObserver(function () {
          if (queued) return;
          queued = true;
          requestAnimationFrame(function () { queued = false; scanReveal(); });
        }).observe(root, { childList: true, subtree: true });
      }
      // Framer hydration replaces the section tree after this script.
      setTimeout(scanReveal, 400);
      setTimeout(scanReveal, 1600);
    }

    // The load overlay covers the first viewport. Arming the reveal while it
    // is up spends the entrance on a hidden page, so wait until it is gone.
    // The timeout matches the overlay's own 4s ceiling plus the fade.
    if (document.documentElement.classList.contains("tz-preloading")) {
      document.addEventListener("tz-preloader-done", startReveal);
      setTimeout(startReveal, 5000);
    } else {
      startReveal();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootReveal);
  else bootReveal();
})();
