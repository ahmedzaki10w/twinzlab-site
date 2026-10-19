(function () {
  "use strict";

  // Contact form recipient. Messages are delivered by FormSubmit.co.
  // signup.js may set the endpoint first so contact, Lab Notes, and the
  // waitlist share one address. FormSubmit sends a one-time activation email.
  var FORM_RECIPIENT = window.TWINZLAB_FORM_RECIPIENT || "hello@twinzlab.online";

  var FORM_ENDPOINT = window.TWINZLAB_FORM_ENDPOINT || ("https://formsubmit.co/ajax/" + FORM_RECIPIENT);
  var EMAIL = "hello@twinzlab.online";
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, "") : location.origin + "/";
  })();

  function pageName() {
    var p = location.pathname.replace(BASE.replace(location.origin, ""), "/");
    var m = /^\/(about|products|contact|lab)\b/.exec(p);
    return m ? m[1] : "home";
  }
  function site(path) { return BASE + path; }
  function mailto(subject, body, to) {
    var q = [];
    if (subject) q.push("subject=" + encodeURIComponent(subject));
    if (body) q.push("body=" + encodeURIComponent(body));
    return "mailto:" + (to || EMAIL) + (q.length ? "?" + q.join("&") : "");
  }
  function slug(s) { return String(s || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function text(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function main() { return document.getElementById("main"); }

  /* ------------------------------------------------------------------ routes */

  // Framer button components, matched by label.
  var BUTTONS = {
    "contact": "contact/#contact-form",
    "get in touch": "contact/#contact-form",
    "explore products": "products/",
    "inside the lab": "lab/",
    "learn more": "about/",
    "view product": "products/#products",
    "coming soon": "lab/",
    "read more": "lab/#posts"
  };

  // Plain Framer frames that should behave like links.
  var LINKS = [
    { sel: ".framer-19vq3br", href: "", label: "TwinzLab home", kind: "plain" },
    { sel: ".framer-qdozql", href: "contact/#contact-form", kind: "text" },
    { sel: ".framer-1es5w7d", mail: "", label: "Email " + EMAIL, kind: "text" },
    { sel: ".framer-14aoz5q", href: "", label: "TwinzLab home", kind: "text" },
    { sel: ".framer-1j8xv75", href: "about/", kind: "text" },
    { sel: ".framer-51s8nu", href: "products/", kind: "text" },
    { sel: ".framer-jfm3mh", href: "lab/", kind: "text" },
    { sel: ".framer-1hoop8f", href: "contact/", kind: "text" },
    { sel: ".framer-1d8ufji", href: "products/?filter=apps#products", label: "Twinz Apps: browse apps", kind: "card" },
    { sel: ".framer-1413m6a", href: "products/?filter=games#products", label: "Twinz Play: browse games", kind: "card" },
    { sel: ".framer-ck2tmp", href: "products/?filter=ai-tools#products", label: "Twinz AI: browse AI tools", kind: "card" },
    { sel: ".framer-1x8ulyn", mail: "", label: "Email " + EMAIL, kind: "text" }
  ];

  // Framer hydrates the header anchors as `./products` (relative to the current
  // directory). From / that reaches /products; from /about/ it becomes
  // /about/products. Pin each item to the site root instead.
  var HEADER_NAV = {
    home: "",
    about: "about/",
    products: "products/",
    lab: "lab/",
    labs: "lab/"
  };

  function headerNavHref(node) {
    var el = node && node.closest ? node : (node && node.parentElement);
    if (!el || !el.closest) return "";
    var a = el.closest("a[href]");
    if (!a || !a.closest("[data-framer-name='header']")) return "";
    var name = (a.getAttribute("data-framer-name") || "").trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(HEADER_NAV, name)) return "";
    return site(HEADER_NAV[name]);
  }

  // Footer social column. The Facebook slot is the TikTok account.
  var SOCIAL = {
    ".framer-ta0yq0": { href: "https://www.linkedin.com/company/twinzlab", label: "LinkedIn" },
    ".framer-tlzm73": { href: "https://www.instagram.com/twinz_lab/", label: "Instagram" },
    ".framer-1gdr5uv": { href: "https://x.com/TwinzLab", label: "X (Twitter)" },
    ".framer-1mshf4g": { href: "https://www.tiktok.com/@twinzlab", label: "TikTok" }
  };

  // Cards whose whole surface forwards to the action inside them.
  var CARD_PROXIES = [
    ".framer-inyeg6",
    ".framer-1ef4b7q", ".framer-nzlyda",
    ".framer-1qxun2q", ".framer-11xoq6b",
    ".framer-eo4uhb"
  ];

  // Real store URLs when a product is public. Empty means the CTA goes to
  // the product card (homepage) or the contact form (on the card itself).
  // TODO: set these when Aresson and Hesba are in a store.
  var STORE_URLS = {
    aresson: "",
    hesba: ""
  };

  function productKeyFromName(name) {
    var n = String(name || "").trim().toLowerCase();
    if (n === "hesba") return "hesba";
    if (n === "aresson") return "aresson";
    return "";
  }

  function productDestination(key, fallbackPath) {
    var url = key && STORE_URLS[key];
    if (url) return { href: url, external: true };
    return { href: site(fallbackPath), external: false };
  }

  function applyDest(el, dest) {
    if (!el || !dest) return;
    setAttr(el, "data-tz-href", dest.href);
    if (el.tagName === "A") setAttr(el, "href", dest.href);
    if (dest.external) setAttr(el, "data-tz-external", "");
    else el.removeAttribute("data-tz-external");
  }

  var PRODUCT_PILLS = [".framer-tdbu6h", ".framer-19so74", ".framer-1y83g0w"];
  var ARTICLE = "lab/the-bug-that-makes-you-laugh/";
  var LAB_READ_MORE = [".framer-17laeob", ".framer-1q7myax"];

  var ANCHORS = {
    home: { ".framer-1lq0uvn": "who-we-are", ".framer-ihlbe4": "what-we-build", ".framer-iyzx2i": "featured-product", ".framer-2dudm4": "process", ".framer-10dq8av": "from-the-lab" },
    about: { ".framer-1yoorx3": "founders", ".framer-14mxnf4": "mission", ".framer-1ugbpjk": "twin-advantage", ".framer-1h7cige": "values" },
    products: { ".framer-q8ddpx": "products", ".framer-1ef4b7q": "aresson", ".framer-nzlyda": "hesba" },
    contact: { ".framer-1d28yuc": "contact-form", ".framer-1wesycm": "direct-contact", ".framer-1k78fk5": "partnerships" },
    lab: { ".framer-1azgdz2": "posts" }
  };

  var FILTERS = {
    lab: {
      chips: ".framer-zk7jz2", list: ".framer-1klyps3",
      cards: [".framer-eo4uhb"],
      tag: ".framer-svx48s, .framer-brf2i9, .framer-1dxoj8z",
      empty: function (label) {
        return { msg: "No " + label + " posts yet.", cta: "Show all posts", filter: "all" };
      }
    }
  };
  var filterState = {};

  /* -------------------------------------------------------------- enhance */

  function makeLink(el, href, kind, label) {
    el.removeAttribute("data-tz-disabled");
    el.removeAttribute("aria-disabled");
    if (el.getAttribute("title") && /coming soon/i.test(el.getAttribute("title"))) el.removeAttribute("title");
    setAttr(el, "data-tz-href", href);
    setAttr(el, "data-tz-kind", kind);
    if (el.tagName === "A") {
      setAttr(el, "href", href);
      return;
    }
    setAttr(el, "role", "link");
    setAttr(el, "tabindex", "0");
    if (label) setAttr(el, "aria-label", label);
  }

  function makeDisabled(el, reason, kind) {
    el.removeAttribute("data-tz-href");
    setAttr(el, "data-tz-kind", kind);
    setAttr(el, "data-tz-disabled", reason);
    setAttr(el, "role", "link");
    setAttr(el, "tabindex", "0");
    setAttr(el, "aria-disabled", "true");
    setAttr(el, "title", reason);
  }

  // The export still ships empty "coming soon" article cards. Hydration
  // puts them back, so drop them on every pass. Published notes are filled
  // from the Lab manifest instead.
  function dropPlaceholderArticles() {
    $$(".framer-qwhetu, .framer-wljenu, .framer-1kvby1z, .framer-1dmwas0", main()).forEach(function (el) {
      el.remove();
    });
  }

  // The products page still ships All / Aresson / Hesba / Soon chips.
  // Hydration puts them back, so drop them on every pass.
  function dropProductFilter() {
    $$(".framer-rimxp0", main()).forEach(function (el) {
      el.remove();
    });
  }

  function enhance() {
    var root = main();
    if (!root) return;
    dropPlaceholderArticles();
    dropProductFilter();
    var page = pageName();

    $$("a.framer-s29zbl", root).forEach(function (a) {
      var target = BUTTONS[text(a).toLowerCase()];
      if (target !== undefined) makeLink(a, site(target), "button");
    });

    LINKS.forEach(function (l) {
      $$(l.sel, root).forEach(function (el) {
        var href = l.mail !== undefined ? mailto(l.mail) : site(l.href);
        makeLink(el, href, l.kind, l.label || "");
      });
    });

    $$("[data-framer-name='header'] a[href]", root).forEach(function (a) {
      var href = headerNavHref(a);
      if (href) makeLink(a, href, "nav");
    });

    Object.keys(SOCIAL).forEach(function (sel) {
      var item = SOCIAL[sel];
      $$(sel, root).forEach(function (el) {
        var labelNode = $(".framer-text", el) || el;
        if (text(labelNode) !== item.label) labelNode.textContent = item.label;
        if (el.getAttribute("data-framer-name") !== item.label) setAttr(el, "data-framer-name", item.label);
        makeLink(el, item.href, "text", item.label);
        setAttr(el, "data-tz-external", "");
      });
    });

    PRODUCT_PILLS.forEach(function (sel) {
      $$(sel, root).forEach(function (el) {
        var card = el.closest(".framer-1ef4b7q, .framer-nzlyda, .framer-tlhq47");
        if (card && card.classList.contains("framer-tlhq47")) return;
        var raw = card ? text($(".framer-9xeidv, .framer-phmefa, .framer-17nt926", card)) : "";
        var key = card && card.classList.contains("framer-nzlyda") ? "hesba"
          : card && card.classList.contains("framer-1ef4b7q") ? "aresson"
          : productKeyFromName(raw);
        var label = key === "hesba" ? "Hesba" : key === "aresson" ? "Aresson" : (raw || "product");
        var dest = productDestination(key, "contact/?topic=" + encodeURIComponent(label) + "#contact-form");
        makeLink(el, dest.href, "pill", "View " + label);
        applyDest(el, dest);
      });
    });

    LAB_READ_MORE.forEach(function (sel) {
      $$(sel, root).forEach(function (el) { makeDisabled(el, "Full post coming soon", "pill"); });
    });
    $$(".framer-1uia4ak, .framer-fwj0dz-container a.framer-s29zbl", root).forEach(function (el) {
      if (el.closest(".framer-1klyps3")) return;
      // Home cards get their own article link in renderHomeArticles.
      if (page === "home" && el.closest(".framer-1ytkcbt") && labArticles().length) return;
      makeLink(el, site(ARTICLE), "button", "Read the article");
    });

    CARD_PROXIES.forEach(function (sel) {
      $$(sel, root).forEach(function (el) { setAttr(el, "data-tz-card", ""); setAttr(el, "data-tz-kind", "card"); });
    });

    var anchors = ANCHORS[page] || {};
    Object.keys(anchors).forEach(function (sel) {
      var el = $(sel, root);
      if (el && !el.id) { el.id = anchors[sel]; setAttr(el, "data-tz-anchor", ""); }
    });

    if (page === "lab") {
      var notes = labArticles();
      renderLabArticles();
      syncLabChips(notes);
      syncLabIntro(notes.length);
      mountLabSignup();
      equalizeLabCards();
    }
    if (page === "products") setupGhost();
    if (FILTERS[page]) setupFilter(page);
    if (page === "contact") { mountPaths(); setupTopics(); mountForm(); }
    paintProductShots();
    if (page === "home") {
      setupFeatured();
      fitProcessDiagram();
      renderHomeArticles();
      fitLabHover();
      setupWho();
    }
  }

  // The sticky Lab cards carry empty padding so they can stick in sequence.
  // The hover belongs on the visible face (image + text), not that padding.
  function fitLabHover() {
    $$(".framer-inyeg6", main()).forEach(function (card) {
      var face = $(".tz-lab-face", card);
      if (!face) {
        face = document.createElement("div");
        face.className = "tz-lab-face";
        while (card.firstChild) face.appendChild(card.firstChild);
        card.appendChild(face);
      }
      card.removeAttribute("data-tz-card");
      card.removeAttribute("data-tz-kind");
      setAttr(face, "data-tz-card", "");
      setAttr(face, "data-tz-kind", "card");
    });
    equalizeLabFaces();
  }

  // Match the three visible cards to the tallest one. The sticky padding stays
  // on the outer card, so it is not part of this height.
  function equalizeLabFaces() {
    var root = main();
    if (!root) return;
    var faces = $$("#from-the-lab .tz-lab-face", root);
    if (faces.length < 2) return;
    faces.forEach(function (face) { face.style.minHeight = ""; });
    var max = 0;
    faces.forEach(function (face) {
      var h = face.offsetHeight;
      if (h > max) max = h;
    });
    if (!max) return;
    var px = Math.ceil(max) + "px";
    faces.forEach(function (face) { face.style.minHeight = px; });
  }

  // The process mark is a fixed 653×344 drawing inside a frame that shrinks.
  // Give the displayed svg the source viewBox so it scales down with that frame.
  function fitProcessDiagram() {
    var svg = $(".framer-2dudm4 .svgContainer svg", main());
    if (!svg || svg.getAttribute("data-tz-fit") === "1") return;
    var use = $("use", svg);
    if (!use) return;
    var ref = use.getAttribute("href") || use.getAttribute("xlink:href") || "";
    var src = document.getElementById(ref.replace("#", ""));
    var vb = src && src.getAttribute("viewBox");
    if (!vb) return;
    var parts = vb.split(/[\s,]+/);
    // The stroke sits on the viewBox edge. Pad it so the tips are not clipped.
    if (parts.length === 4) {
      var pad = 8;
      var x = parseFloat(parts[0]) - pad;
      var y = parseFloat(parts[1]) - pad;
      var w = parseFloat(parts[2]) + pad * 2;
      var h = parseFloat(parts[3]) + pad * 2;
      svg.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
      use.setAttribute("width", String(w));
      use.setAttribute("height", String(h));
    } else {
      svg.setAttribute("viewBox", vb);
    }
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.overflow = "visible";
    svg.setAttribute("data-tz-fit", "1");
  }

  /* ----------------------------------------------------------- who we are */

  // The three bars and the portrait are one set. One is open; the others
  // stay a sliver. They take turns, and a hover opens that one.
  var WHO = [
    {
      sel: ".framer-uhwjz1",
      title: "Ahmed Zaki",
      body: "Ahmed Zaki is one of the twin brothers who founded TwinzLab. He builds the studio's own apps.",
      image: "assets/founders/ahmed-zaki.jpg",
      alt: "Portrait of Ahmed Zaki"
    },
    {
      sel: ".framer-ki8huu",
      title: "Elmodather Zaki",
      body: "Elmodather Zaki founded TwinzLab with his brother. Together they welcome collaborations, challenges, and investment.",
      image: "assets/founders/elmodather-zaki.jpg",
      alt: "Portrait of Elmodather Zaki"
    },
    {
      sel: ".framer-1i7io37",
      title: "The Lab",
      body: "The name joins Twin, Gen Z, and Lab. We experiment here, and we publish the notes from the work.",
      image: "assets/lab/the-bug-that-makes-you-laugh/hero.jpg",
      alt: "A thin wave of light on a dark field"
    },
    {
      sel: ".framer-1yawxw3",
      title: "Who We Are",
      body: "TwinzLab is founded by twin brothers Ahmed Zaki and Elmodather Zaki. We build our own apps, and we welcome collaborations, challenges, and investment.",
      image: "assets/framerusercontent.com/images/5wNTXuzFxrzH948E1qX2FNXw.0gxhl1z.png",
      alt: "Two open hands covered in handwritten notes"
    }
  ];
  var WHO_MS = 4500;
  var whoIndex = WHO.length - 1;
  var whoTimer = 0;
  var whoRewrite = 0;
  var whoGen = 0;
  var whoPaused = false;
  var whoHidden = false;
  var whoListening = false;
  var whoSection = null;

  function whoReduce() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function whoNarrow() {
    return window.matchMedia && window.matchMedia("(max-width: 1023px)").matches;
  }

  function whoSrcMatches(el, path) {
    var cur = (el && el.getAttribute("src")) || "";
    var file = path.split("/").pop();
    return cur.indexOf(file) !== -1;
  }

  function whoArm() {
    clearTimeout(whoTimer);
    whoTimer = 0;
    if (whoPaused || whoHidden) return;
    if (!stageAllows("who")) return;
    whoTimer = setTimeout(function () {
      whoShow((whoIndex + 1) % WHO.length, true);
    }, WHO_MS);
  }

  function whoSyncHero() {
    if (!whoSection) return;
    var hero = $(".framer-1yawxw3 img", whoSection);
    if (!hero) return;
    if (!hero.getAttribute("data-tz-who-src")) setAttr(hero, "data-tz-who-src", hero.getAttribute("src") || site(WHO[WHO.length - 1].image));
    if (!hero.hasAttribute("data-tz-who-srcset")) setAttr(hero, "data-tz-who-srcset", hero.getAttribute("srcset") || "");
    var slide = WHO[whoIndex];
    if (whoNarrow()) {
      // srcset would keep the original hands image on screen after src changes.
      if (hero.hasAttribute("srcset")) hero.removeAttribute("srcset");
      if (!whoSrcMatches(hero, slide.image)) hero.src = site(slide.image);
      setAttr(hero, "alt", slide.alt);
    } else {
      var set = hero.getAttribute("data-tz-who-srcset");
      if (set && hero.getAttribute("srcset") !== set) hero.setAttribute("srcset", set);
      var own = hero.getAttribute("data-tz-who-src");
      if (own && !whoSrcMatches(hero, own)) hero.src = own;
      setAttr(hero, "alt", WHO[WHO.length - 1].alt);
    }
  }

  function whoShow(i, animate) {
    if (!whoSection) return;
    var panels = $$("[data-tz-who-index]", whoSection);
    if (!panels.length) return;
    var slide = WHO[i];
    var title = $(".framer-xhpb82 .framer-text", whoSection);
    var body = $(".framer-ugn879 .framer-text", whoSection);
    whoIndex = i;
    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-tz-who-index") === String(i);
      panel.classList.toggle("is-open", on);
      setAttr(panel, "aria-pressed", on ? "true" : "false");
    });
    whoSyncHero();
    if (!title || !body) return;
    var same = text(title) === slide.title && text(body) === slide.body;
    var gen = ++whoGen;
    clearTimeout(whoRewrite);
    if (!animate || whoReduce() || same) {
      title.textContent = slide.title;
      body.textContent = slide.body;
      whoSection.classList.remove("is-rewriting");
    } else {
      whoSection.classList.add("is-rewriting");
      whoRewrite = setTimeout(function () {
        if (gen !== whoGen || !whoSection) return;
        title.textContent = slide.title;
        body.textContent = slide.body;
        whoSection.classList.remove("is-rewriting");
      }, 280);
    }
    if (animate && !whoPaused) whoArm();
  }

  function setupWho() {
    var section = $(".framer-1lq0uvn", main());
    if (!section) return;
    whoSection = section;
    setAttr(section, "data-tz-who", "1");
    var copy = $(".framer-so8grx", section);
    if (copy) setAttr(copy, "aria-live", "polite");
    WHO.forEach(function (slide, i) {
      var panel = $(slide.sel, section);
      if (!panel) return;
      panel.classList.add("tz-who-panel");
      setAttr(panel, "data-tz-who-index", String(i));
      setAttr(panel, "data-tz-kind", "who");
      setAttr(panel, "role", "button");
      setAttr(panel, "tabindex", "0");
      setAttr(panel, "aria-label", "Show " + slide.title);
      if (!$("img", panel)) {
        var img = document.createElement("img");
        img.className = "tz-who-photo";
        img.alt = slide.alt;
        img.decoding = "async";
        img.src = site(slide.image);
        if (slide.sel === ".framer-1i7io37") img.style.objectPosition = "center";
        panel.appendChild(img);
      }
    });
    if (!section.hasAttribute("data-tz-who-bound")) {
      setAttr(section, "data-tz-who-bound", "1");
      section.addEventListener("pointerover", function (e) {
        var panel = e.target.closest && e.target.closest("[data-tz-who-index]");
        if (!panel || !section.contains(panel)) return;
        whoPaused = true;
        clearTimeout(whoTimer);
        var i = Number(panel.getAttribute("data-tz-who-index"));
        if (i !== whoIndex) whoShow(i, true);
      });
      section.addEventListener("pointerleave", function () {
        whoPaused = false;
        whoArm();
      });
      section.addEventListener("pointerup", function () {
        if (window.matchMedia("(hover: hover)").matches) return;
        whoPaused = false;
        whoArm();
      });
      section.addEventListener("focusin", function (e) {
        var panel = e.target.closest && e.target.closest("[data-tz-who-index]");
        if (!panel) return;
        whoPaused = true;
        clearTimeout(whoTimer);
      });
      section.addEventListener("focusout", function () {
        whoPaused = false;
        whoArm();
      });
      section.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var panel = e.target.closest && e.target.closest("[data-tz-who-index]");
        if (!panel || panel !== e.target) return;
        e.preventDefault();
        whoPaused = true;
        clearTimeout(whoTimer);
        whoShow(Number(panel.getAttribute("data-tz-who-index")), true);
      });
    }
    var start = !section.hasAttribute("data-tz-who-started");
    if (!whoListening) {
      whoListening = true;
      document.addEventListener("visibilitychange", function () {
        whoHidden = document.hidden;
        if (whoHidden) clearTimeout(whoTimer);
        else whoArm();
      });
      var narrowMq = window.matchMedia("(max-width: 1023px)");
      if (narrowMq.addEventListener) narrowMq.addEventListener("change", whoSyncHero);
    }
    whoShow(whoIndex, false);
    if (start) setAttr(section, "data-tz-who-started", "1");
    mountPlay(section, "who", "Who We Are");
    bindStage();
  }

  /* ----------------------------------------------------- featured product */

  // Homepage carousel. Coming soon stays on the products page as a ghost card.
  // Aresson and Hesba art is a blurred photo with the real app screen floating on it.
  var PRODUCT_SHOTS = {
    aresson: {
      alt: "Aresson app onboarding screen: Find your perfect coach, book in seconds",
      bgW: 1200, bgH: 900, screenW: 720, screenH: 1558,
      bgSizes: "(min-width: 1200px) 560px, 100vw",
      screenSizes: "(min-width: 1200px) 240px, 160px",
      bgAvif: "/assets/products/aresson-bg-800.avif 800w, /assets/products/aresson-bg.avif 1200w",
      bgWebp: "/assets/products/aresson-bg-800.webp 800w, /assets/products/aresson-bg.webp 1200w",
      bgFallback: "/assets/products/aresson-bg.webp",
      screenAvif: "/assets/products/aresson-screen-480.avif 480w, /assets/products/aresson-screen.avif 720w",
      screenWebp: "/assets/products/aresson-screen-480.webp 480w, /assets/products/aresson-screen.webp 720w",
      screenFallback: "/assets/products/aresson-screen.webp"
    },
    hesba: {
      alt: "Hesba app sales dashboard",
      bgW: 940, bgH: 680, screenW: 720, screenH: 1616,
      bgSizes: "(min-width: 1200px) 560px, 100vw",
      screenSizes: "(min-width: 1200px) 240px, 160px",
      bgAvif: "/assets/products/hesba-bg-720.avif 720w, /assets/products/hesba-bg.avif 940w",
      bgWebp: "/assets/products/hesba-bg-720.webp 720w, /assets/products/hesba-bg.webp 940w",
      bgFallback: "/assets/products/hesba-bg.webp",
      screenAvif: "/assets/products/hesba-screen-480.avif 480w, /assets/products/hesba-screen.avif 720w",
      screenWebp: "/assets/products/hesba-screen-480.webp 480w, /assets/products/hesba-screen.webp 720w",
      screenFallback: "/assets/products/hesba-screen.webp"
    }
  };

  function shotPicture(shot, kind) {
    var isScreen = kind === "screen";
    var cls = isScreen ? "tz-shot__screen" : "tz-shot__bg";
    var alt = isScreen ? shot.alt : "";
    var w = isScreen ? shot.screenW : shot.bgW;
    var h = isScreen ? shot.screenH : shot.bgH;
    var sizes = isScreen ? shot.screenSizes : shot.bgSizes;
    var avif = isScreen ? shot.screenAvif : shot.bgAvif;
    var webp = isScreen ? shot.screenWebp : shot.bgWebp;
    var fallback = isScreen ? shot.screenFallback : shot.bgFallback;
    return '<picture>' +
      '<source type="image/avif" srcset="' + avif + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + webp + '" sizes="' + sizes + '">' +
      '<img class="' + cls + '" src="' + fallback + '" alt="' + alt + '" width="' + w + '" height="' + h + '" decoding="async">' +
      '</picture>';
  }

  function mountShot(host, key) {
    if (!host) return;
    var existing = host.querySelector(":scope > .tz-shot");
    if (!key || !PRODUCT_SHOTS[key]) {
      if (existing) existing.remove();
      host.removeAttribute("data-tz-shot");
      return;
    }
    if (existing && existing.getAttribute("data-tz-shot") === key) {
      if (host.getAttribute("data-tz-shot") !== key) setAttr(host, "data-tz-shot", key);
      return;
    }
    if (existing) existing.remove();
    setAttr(host, "data-tz-shot", key);
    var shot = PRODUCT_SHOTS[key];
    host.insertAdjacentHTML("beforeend",
      '<div class="tz-shot" data-tz-shot="' + key + '">' +
      shotPicture(shot, "bg") + shotPicture(shot, "screen") +
      '</div>');
  }

  // Products-page art slots. The homepage featured frame is painted per slide.
  function paintProductShots() {
    var root = main();
    if (!root) return;
    mountShot($(".framer-qubl6t", root), "aresson");
    mountShot($(".framer-2p0onn", root), "hesba");
  }

  var FEATURED = [
    {
      name: "Hesba",
      key: "hesba",
      blurb: "A mobile app for kiosk and small-shop owners to manage sales and their team.",
      href: "products/#hesba",
      gradient: "linear-gradient(#1e211d 0%,#274735 66.0661%,#accbda 100%)",
      shot: "hesba"
    },
    {
      name: "Aresson",
      key: "aresson",
      blurb: "Discover and book sports sessions with coaches and trainers across different sports.",
      href: "products/#aresson",
      gradient: "linear-gradient(#1e211d 0%,#4a3428 62%,#e9ab78 100%)",
      shot: "aresson"
    }
  ];
  var featuredIndex = 0;
  var featuredTimer = 0;
  var featuredFadeTimer = 0;
  var featuredGen = 0;
  var STORY_MS = 5000;
  var storyRemain = STORY_MS;
  var storyStamp = 0;

  function featuredRow() {
    var rows = $$(".framer-11xoq6b", main());
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].classList.contains("tz-feat-ghost")) return rows[i];
    }
    return null;
  }

  function paintFeatured() {
    var row = featuredRow();
    if (!row) return;
    var slide = FEATURED[featuredIndex];
    var title = $(".framer-vr1pm9", row);
    var blurb = $(".framer-8nkvf1", row);
    var art = $(".framer-1o9oqkl", row);
    var button = $("a.framer-s29zbl, [data-tz-href]", row);
    if (title) {
      var titleText = title.querySelector("p") || title;
      if (text(titleText) !== slide.name) titleText.textContent = slide.name;
    }
    if (blurb) {
      var blurbText = blurb.querySelector("h2, p") || blurb;
      if (text(blurbText) !== slide.blurb) blurbText.textContent = slide.blurb;
    }
    if (art) {
      if (slide.shot) {
        art.style.background = "";
        mountShot(art, slide.shot);
      } else {
        mountShot(art, "");
        art.style.background = slide.gradient;
      }
    }
    if (button) {
      applyDest(button, productDestination(slide.key, slide.href));
      setAttr(button, "aria-label", "View " + slide.name);
    }
    setAttr(row, "aria-label", slide.name);
    $$(".framer-1ti9ac8 > div", row).forEach(function (dot, i) {
      if (i >= FEATURED.length) {
        setAttr(dot, "data-tz-hidden", "");
        dot.setAttribute("tabindex", "-1");
        return;
      }
      dot.removeAttribute("data-tz-hidden");
      dot.classList.toggle("is-on", i === featuredIndex);
      dot.classList.toggle("is-done", i < featuredIndex);
      if (i !== featuredIndex) dot.classList.remove("is-running");
      setAttr(dot, "aria-pressed", i === featuredIndex ? "true" : "false");
    });
  }

  function stopStoryClock() {
    clearTimeout(featuredTimer);
    featuredTimer = 0;
    storyStamp = 0;
  }

  function holdStory() {
    var row = featuredRow();
    if (row) row.classList.add("tz-story-paused");
    if (storyStamp) {
      storyRemain = Math.max(0, storyRemain - (performance.now() - storyStamp));
      storyStamp = 0;
    }
    clearTimeout(featuredTimer);
    featuredTimer = 0;
  }

  function armFeatured() {
    clearTimeout(featuredTimer);
    featuredTimer = 0;
    if (!stageAllows("featured")) {
      var held = featuredRow();
      if (held) held.classList.add("tz-story-paused");
      return;
    }
    var row = featuredRow();
    if (!row) return;
    if (row.matches(":hover") || document.hidden) {
      row.classList.add("tz-story-paused");
      return;
    }
    row.classList.remove("tz-story-paused");
    storyStamp = performance.now();
    featuredTimer = setTimeout(function () {
      storyStamp = 0;
      showFeatured((featuredIndex + 1) % FEATURED.length, true);
    }, Math.max(0, storyRemain));
  }

  function restartFill(dot) {
    var fill = dot.querySelector(".tz-story-fill");
    if (!fill) return;
    fill.style.animation = "none";
    fill.style.transform = "";
    void fill.offsetWidth;
    fill.style.animation = "";
    fill.style.transform = "";
  }

  function kickStory() {
    storyRemain = STORY_MS;
    storyStamp = 0;
    var row = featuredRow();
    if (!row) return;
    row.style.setProperty("--tz-story-ms", STORY_MS + "ms");
    var dot = $$(".framer-1ti9ac8 > div", row)[featuredIndex];
    if (dot && stageAllows("featured") && !motionReduce()) {
      dot.classList.add("is-running");
      restartFill(dot);
    }
    armFeatured();
  }

  function storyScale(fill) {
    if (!fill || !fill.parentElement) return 0;
    var dot = fill.closest ? fill.closest(".framer-1ti9ac8 > div") : fill.parentElement.parentElement;
    if (dot && dot.classList.contains("is-done")) return 1;
    if (!dot || !dot.classList.contains("is-running")) return 0;
    var anims = fill.getAnimations ? fill.getAnimations() : [];
    if (!anims.length) return 0;
    var dur = STORY_MS;
    try {
      var timing = anims[0].effect.getTiming();
      if (typeof timing.duration === "number") dur = timing.duration;
    } catch (err) {}
    return Math.max(0, Math.min(1, (anims[0].currentTime || 0) / dur));
  }

  function clearFeaturedGhost(row) {
    var parent = row && row.parentElement;
    if (!parent) return;
    $$(".tz-feat-ghost", parent).forEach(function (ghost) { ghost.remove(); });
  }

  function showFeatured(next, animate) {
    var row = featuredRow();
    if (!row) return;
    stopStoryClock();
    clearTimeout(featuredFadeTimer);
    if (next === featuredIndex) {
      clearFeaturedGhost(row);
      kickStory();
      return;
    }
    featuredGen += 1;
    var gen = featuredGen;
    clearFeaturedGhost(row);
    row.classList.remove("tz-feat-swap");
    row.classList.remove("tz-feat-out");
    if (!animate || motionReduce() || typeof row.animate !== "function") {
      featuredIndex = next;
      paintFeatured();
      kickStory();
      return;
    }
    var parent = row.parentElement;
    if (parent && getComputedStyle(parent).position === "static") parent.style.position = "relative";
    var scales = $$(".tz-story-fill", row).map(storyScale);
    var ghost = row.cloneNode(true);
    $$(".tz-story-fill", ghost).forEach(function (fill, i) {
      fill.style.animation = "none";
      fill.style.transform = "scaleX(" + (scales[i] || 0) + ")";
    });
    var placed = getComputedStyle(row);
    ghost.classList.add("tz-feat-ghost");
    ghost.classList.remove("tz-feat-swap", "tz-feat-out");
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.left = row.offsetLeft + "px";
    ghost.style.top = row.offsetTop + "px";
    ghost.style.width = row.offsetWidth + "px";
    ghost.style.height = row.offsetHeight + "px";
    ghost.style.margin = "0";
    ghost.style.transform = placed.transform;
    ghost.style.opacity = "1";
    parent.appendChild(ghost);
    featuredIndex = next;
    paintFeatured();
    // Old slide sits on top at full opacity; the new one is already underneath.
    // animate() runs after the ghost has a painted start value, so the fade is not skipped.
    var fade = ghost.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 800, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
    );
    function done() {
      if (gen !== featuredGen) return;
      clearTimeout(featuredFadeTimer);
      if (ghost.parentNode) ghost.remove();
      kickStory();
    }
    fade.onfinish = done;
    featuredFadeTimer = setTimeout(done, 1100);
  }

  function setupFeatured() {
    var row = featuredRow();
    if (!row) return;
    // The text card used to own the hover. The row (image + copy) owns it now.
    var inner = $(".framer-ncsnc3", row);
    if (inner) {
      inner.removeAttribute("data-tz-card");
      inner.removeAttribute("data-tz-kind");
    }
    if (row.getAttribute("data-tz-featured") !== "ready") {
      setAttr(row, "data-tz-featured", "ready");
      var dots = $$(".framer-1ti9ac8 > div", row);
      var pager = $(".framer-1ti9ac8", row);
      if (pager) {
        setAttr(pager, "role", "group");
        setAttr(pager, "aria-label", "Featured products");
      }
      dots.forEach(function (dot, i) {
        if (!dot.querySelector(".tz-story-track")) {
          var track = document.createElement("span");
          track.className = "tz-story-track";
          track.setAttribute("aria-hidden", "true");
          var fill = document.createElement("span");
          fill.className = "tz-story-fill";
          track.appendChild(fill);
          dot.appendChild(track);
        }
        setAttr(dot, "role", "button");
        setAttr(dot, "tabindex", "0");
        setAttr(dot, "aria-label", FEATURED[i] ? "Show " + FEATURED[i].name : "Show product " + (i + 1));
        dot.addEventListener("click", function (e) {
          if (i >= FEATURED.length) return;
          e.preventDefault();
          e.stopPropagation();
          playHold.featured = false;
          playUser.featured = true;
          playForced = "featured";
          stageActive = "featured";
          showFeatured(i, true);
        });
        dot.addEventListener("keydown", function (e) {
          if (i >= FEATURED.length) return;
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          playHold.featured = false;
          playUser.featured = true;
          playForced = "featured";
          stageActive = "featured";
          showFeatured(i, true);
        });
      });
      row.addEventListener("pointerenter", holdStory);
      row.addEventListener("pointerleave", armFeatured);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) holdStory();
        else armFeatured();
      });
      paintFeatured();
      mountPlay(row.closest(".framer-iyzx2i") || row, "featured", "featured products");
      bindStage();
      return;
    }
    paintFeatured();
    mountPlay(row.closest(".framer-iyzx2i") || row, "featured", "featured products");
    bindStage();
  }

  /* --------------------------------------------------------- lab articles */

  // The Lab page is a Framer export. Article cards are filled from the
  // manifest the build writes into #tz-lab-articles, using the published
  // card as the template so the frame stays the same.
  var labCardTemplate = null;
  var homeLabTemplate = null;

  function labArticles() {
    var node = document.getElementById("tz-lab-articles");
    if (!node) return [];
    try {
      var data = JSON.parse(node.textContent || "[]");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  function labImage(url) {
    var value = String(url || "");
    if (!/^\/assets\/[A-Za-z0-9._~/-]+$/.test(value)) return "";
    return value;
  }

  function seriesNo(article, articles) {
    var dated = articles.slice().sort(function (a, b) {
      return String(a.date || "").localeCompare(String(b.date || ""));
    });
    var n = 1;
    for (var i = 0; i < dated.length; i++) {
      if ((dated[i].slug || "") === (article.slug || "")) { n = i + 1; break; }
    }
    return "No. " + String(n).padStart(3, "0");
  }

  function fillLabCard(card, article, articles) {
    card.removeAttribute("data-tz-hidden");
    card.removeAttribute("data-tz-disabled");
    setAttr(card, "data-tz-card", "");
    setAttr(card, "data-tz-kind", "card");
    setAttr(card, "data-tz-slug", article.slug || "");
    var tagKeys = (article.tags || []).map(slug).filter(Boolean);
    if (tagKeys.length) setAttr(card, "data-tz-tags", tagKeys.join(","));
    else card.removeAttribute("data-tz-tags");
    var title = $(".framer-zdps2f .framer-text", card);
    var excerpt = $(".framer-7454k4 .framer-text", card);
    var tag = $(".framer-svx48s .framer-text", card);
    var pill = $(".framer-svx48s", card);
    var thumb = $(".framer-1p016lq", card);
    var read = $(".framer-1uia4ak", card);
    if (title) title.textContent = article.title || "";
    var no = card.querySelector(".tz-lab-no");
    if (!no) {
      no = document.createElement("p");
      no.className = "tz-lab-no";
      var titleWrap = $(".framer-zdps2f", card);
      if (titleWrap && titleWrap.parentNode) titleWrap.parentNode.insertBefore(no, titleWrap);
      else card.insertBefore(no, card.firstChild);
    }
    if (articles) no.textContent = seriesNo(article, articles);
    if (excerpt) excerpt.textContent = article.excerpt || "";
    if (tag) tag.textContent = article.category || "";
    if (pill) pill.style.display = article.category ? "" : "none";
    if (thumb) {
      var image = labImage(article.card);
      thumb.style.backgroundImage = image ? 'url("' + image + '")' : "none";
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
      thumb.style.backgroundRepeat = "no-repeat";
    }
    if (read) {
      var path = String(article.url || "").replace(/^\//, "");
      makeLink(read, site(path), "button", "Read the article");
    }
  }

  function renderLabArticles() {
    var root = main();
    var list = $(".framer-1klyps3", root);
    if (!list) return;
    var articles = labArticles();
    if (!articles.length) return;
    var signature = articles.map(function (article) {
      return [article.slug || "", article.category || "", (article.tags || []).join(",")].join("~");
    }).join("|");
    var current = $$(".framer-eo4uhb", list);
    if (list.getAttribute("data-tz-lab-sig") === signature && current.length === articles.length) return;

    var seed = current[0] || labCardTemplate;
    if (!labCardTemplate && seed) labCardTemplate = seed.cloneNode(true);
    if (!labCardTemplate) return;

    current.forEach(function (card) { card.remove(); });
    var empty = $(".tz-empty", list);
    articles.forEach(function (article) {
      var card = labCardTemplate.cloneNode(true);
      fillLabCard(card, article, articles);
      if (empty) list.insertBefore(card, empty);
      else list.appendChild(card);
    });
    setAttr(list, "data-tz-lab-sig", signature);
  }

  // Home "From the Lab" is one Framer card. Clone it for each published
  // note, newest first, so a new article shows up here as well as on /lab/.
  function fillHomeCard(card, article) {
    setAttr(card, "data-tz-slug", article.slug || "");
    var title = $(".framer-g4yjk0 .framer-text", card);
    var excerpt = $(".framer-5ysmln .framer-text", card);
    var tag = $(".framer-th7ax0 .framer-text", card);
    var thumb = $(".framer-1oc9la7, .framer-7kjbep, .framer-1ghax4c", card);
    var read = $("a.framer-s29zbl", card);
    var nextTitle = article.title || "";
    var nextExcerpt = article.excerpt || "";
    if (title && title.textContent !== nextTitle) title.textContent = nextTitle;
    if (excerpt && excerpt.textContent !== nextExcerpt) excerpt.textContent = nextExcerpt;
    if (tag && article.category && tag.textContent !== article.category) tag.textContent = article.category;
    if (thumb) {
      var image = labImage(article.card);
      if (image) {
        var bg = 'url("' + image + '")';
        if (thumb.style.backgroundImage !== bg) thumb.style.backgroundImage = bg;
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
        thumb.style.backgroundRepeat = "no-repeat";
      }
    }
    if (read) {
      var path = String(article.url || "").replace(/^\//, "");
      makeLink(read, site(path), "button", "Read the article");
    }
  }

  function renderHomeArticles() {
    var section = document.getElementById("from-the-lab");
    if (!section) return;
    var list = $(".framer-1ytkcbt", section);
    if (!list) return;
    var articles = labArticles();
    if (!articles.length) return;
    var dek = $(".framer-1e6exfl .framer-text", section);
    if (dek && dek.textContent !== "Notes from the work.") dek.textContent = "Notes from the work.";
    var signature = articles.map(function (article) {
      return [article.slug || "", article.title || "", article.card || ""].join("~");
    }).join("|");
    var current = $$(".framer-inyeg6", list);
    if (!homeLabTemplate && current[0]) homeLabTemplate = current[0].cloneNode(true);
    if (list.getAttribute("data-tz-home-sig") === signature && current.length === articles.length) {
      current.forEach(function (card, i) { fillHomeCard(card, articles[i]); });
      return;
    }
    if (!homeLabTemplate) return;
    current.forEach(function (card) { card.remove(); });
    articles.forEach(function (article) {
      var card = homeLabTemplate.cloneNode(true);
      fillHomeCard(card, article);
      list.appendChild(card);
    });
    setAttr(list, "data-tz-home-sig", signature);
  }

  // At most four chips, and only ones that match a published note.
  // Categories without a built-in chip (Opinion) are added. Tags are not.
  function syncLabChips(articles) {
    var bar = $(".framer-zk7jz2", main());
    if (!bar || !articles.length) return;

    function countFor(key) {
      if (key === "all") return articles.length;
      var n = 0;
      articles.forEach(function (article) {
        var labels = [];
        if (article.category) labels.push(article.category);
        (article.tags || []).forEach(function (tag) { labels.push(tag); });
        if (labels.some(function (label) { return slug(label) === key; })) n += 1;
      });
      return n;
    }

    var categories = [];
    articles.forEach(function (article) {
      if (!article.category) return;
      var key = slug(article.category);
      if (!key || categories.some(function (c) { return c.key === key; })) return;
      categories.push({ key: key, label: article.category });
    });
    $$("[data-tz-extra-chip]", bar).forEach(function (chip) {
      var key = slug(text(chip));
      if (!categories.some(function (c) { return c.key === key; })) chip.remove();
    });
    var present = {};
    Array.prototype.forEach.call(bar.children, function (chip) {
      var key = slug(text(chip));
      if (key) present[key] = true;
    });
    var template = bar.children[1] || bar.children[0];
    categories.forEach(function (cat) {
      if (present[cat.key] || !template) return;
      var chip = template.cloneNode(true);
      setAttr(chip, "data-tz-extra-chip", "");
      chip.removeAttribute("data-tz-filter");
      chip.removeAttribute("aria-pressed");
      chip.removeAttribute("data-tz-kind");
      var node = $(".framer-text", chip) || chip;
      node.textContent = cat.label;
      bar.appendChild(chip);
    });

    var visible = [];
    Array.prototype.forEach.call(bar.children, function (chip) {
      var key = slug(text(chip));
      if (!key) return;
      if (key === "all" || countFor(key) > 0) visible.push(chip);
    });
    var keep = visible.slice(0, 4);
    Array.prototype.forEach.call(bar.children, function (chip) {
      if (keep.indexOf(chip) !== -1) chip.removeAttribute("data-tz-hidden");
      else setAttr(chip, "data-tz-hidden", "");
    });
    if (keep.length > 3) setAttr(bar, "data-tz-chip-wrap", "");
  }

  function setPara(sel, index, value) {
    var box = $(sel, main());
    if (!box) return;
    var ps = $$("p", box);
    if (ps[index] && text(ps[index]) !== value) ps[index].textContent = value;
  }

  function syncLabIntro(count) {
    if (!count) return;
    var lead = count === 1 ? "Notes from TwinzLab. The first one is up."
      : count === 2 ? "Notes from TwinzLab. Two are up."
      : "Notes from TwinzLab. " + count + " are up.";
    var note = count === 1 ? "The first note is up."
      : count === 2 ? "Two notes are up."
      : count + " notes are up.";
    var read = count === 1 ? "Read it below." : "Read them below.";
    setPara(".framer-o1lqqo", 0, lead);
    setPara(".framer-1h1nkbv", 0, note);
    setPara(".framer-1do5r12", 0, read);
    setPara(".framer-1do5r12", 1, "More notes will follow when there is something real to share.");
  }

  function equalizeLabCards() {
    var cards = $$(".framer-1klyps3 > .framer-eo4uhb", main()).filter(function (card) {
      return !card.hasAttribute("data-tz-hidden");
    });
    if (cards.length < 2) return;
    cards.forEach(function (card) { card.style.minHeight = ""; });
    var max = 0;
    cards.forEach(function (card) {
      var h = card.offsetHeight;
      if (h > max) max = h;
    });
    if (!max) return;
    var px = Math.ceil(max) + "px";
    cards.forEach(function (card) { card.style.minHeight = px; });
  }

  function mountLabSignup() {
    if (!window.tzSignup) return;
    var posts = document.getElementById("posts") || $(".framer-1azgdz2", main());
    if (!posts) return;
    var host = $(".tz-signup-host", posts);
    if (!host) {
      host = document.createElement("aside");
      host.className = "tz-signup-host";
      host.setAttribute("data-tz-signup", "lab-notes");
      posts.appendChild(host);
    }
    window.tzSignup.mount(host, { preset: "lab-notes" });
  }

  /* -------------------------------------------------------------- filters */

  function setupFilter(page) {
    var cfg = FILTERS[page];
    var bar = $(cfg.chips, main());
    if (!bar) return;
    setAttr(bar, "role", "group");
    setAttr(bar, "aria-label", page === "lab" ? "Filter posts" : "Filter products");
    Array.prototype.forEach.call(bar.children, function (chip) {
      var label = text(chip);
      if (!label) return;
      setAttr(chip, "role", "button");
      setAttr(chip, "tabindex", "0");
      setAttr(chip, "data-tz-kind", "chip");
      setAttr(chip, "data-tz-filter", slug(label));
    });
    if (filterState[page] === undefined) {
      filterState[page] = slug(new URLSearchParams(location.search).get("filter") || "all");
    }
    applyFilter(page, filterState[page], false);
  }

  function applyFilter(page, value, updateUrl) {
    var cfg = FILTERS[page];
    var root = main();
    var bar = $(cfg.chips, root);
    if (!bar) return;
    var chips = $$("[data-tz-filter]", bar);
    if (!chips.some(function (c) { return c.getAttribute("data-tz-filter") === value; })) value = "all";
    filterState[page] = value;
    var label = "";
    chips.forEach(function (c) {
      var on = c.getAttribute("data-tz-filter") === value;
      setAttr(c, "aria-pressed", on ? "true" : "false");
      if (on) label = text(c);
    });

    var shown = 0;
    cfg.cards.forEach(function (sel) {
      $$(sel, root).forEach(function (card) {
        var keys = [];
        var pill = slug(text($(cfg.tag, card)));
        if (pill) keys.push(pill);
        (card.getAttribute("data-tz-tags") || "").split(",").forEach(function (key) {
          if (key && keys.indexOf(key) === -1) keys.push(key);
        });
        var match = value === "all" || keys.indexOf(value) !== -1;
        if (match) { card.removeAttribute("data-tz-hidden"); shown++; }
        else setAttr(card, "data-tz-hidden", "");
      });
    });

    var list = $(cfg.list, root);
    var empty = list && $(".tz-empty", list);
    if (list && shown === 0) {
      var e = cfg.empty(label);
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "tz-empty";
        empty.setAttribute("role", "status");
        list.appendChild(empty);
      }
      empty.innerHTML = "";
      var p = document.createElement("p");
      p.textContent = e.msg;
      empty.appendChild(p);
      var act;
      if (e.href) {
        act = document.createElement("a");
        act.href = e.href;
      } else {
        act = document.createElement("button");
        act.type = "button";
        act.setAttribute("data-tz-set-filter", e.filter);
      }
      act.className = "tz-btn tz-btn--ghost";
      act.textContent = e.cta;
      empty.appendChild(act);
    } else if (empty) {
      empty.remove();
    }

    if (updateUrl) {
      var u = new URL(location.href);
      if (value === "all") u.searchParams.delete("filter"); else u.searchParams.set("filter", value);
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    }
    if (page === "lab") equalizeLabCards();
  }

  /* ------------------------------------------------ coming soon ghost card */

  var GHOST_MARK = '<svg class="tz-ghost-mark" viewBox="0 0 158 158" aria-hidden="true" fill="none" stroke="#eaab78" stroke-width="2.4" stroke-linejoin="round"><path d="M64.5361 84.8408C65.7533 87.2411 67.813 88.4926 70.0752 89.0439C72.3959 89.6094 74.7654 89.3852 76.1641 88.9541L78.5996 92.4268C77.5874 93.7693 76.6929 95.2051 75.9316 96.7188L75.9033 96.7764L75.8711 96.832L65.4062 114.958H73.4648L73.9072 116.61C75.5513 122.749 79.2263 128.063 84.1729 131.785C88.8709 135.32 94.711 137.414 101.046 137.414C116.561 137.414 129.138 124.837 129.138 109.322C129.138 93.8075 116.561 81.2307 101.046 81.2305H56.9551C38.978 81.2305 24.4043 66.6567 24.4043 48.6797C24.4043 30.7026 38.978 16.1289 56.9551 16.1289C69.659 16.1289 80.6582 23.4078 86.0195 34.0117L100.316 58.7734H87.9082C85.8155 65.195 81.7841 70.7352 76.5078 74.7051L73.8271 71.1426C78.7739 67.4207 82.4487 62.1062 84.0928 55.9678L84.5361 54.3154H92.5947L82.1299 36.1895L82.0977 36.1338L82.0684 36.0762C77.4462 26.8856 67.9342 20.5879 56.9551 20.5879C41.4402 20.5879 28.8633 33.1648 28.8633 48.6797C28.8633 64.1946 41.4402 76.7715 56.9551 76.7715H101.046C119.023 76.7717 133.596 91.3453 133.596 109.322C133.596 127.299 119.023 141.872 101.046 141.872C93.7112 141.872 86.9372 139.444 81.4932 135.348C76.2168 131.378 72.1855 125.838 70.0928 119.416H57.6836L71.9902 94.6357C72.1275 94.3646 72.2685 94.0958 72.4131 93.8291C71.312 93.7936 70.1634 93.6544 69.0205 93.376C65.8174 92.5955 62.5014 90.6862 60.5596 86.8564L64.5361 84.8408Z"></path><circle cx="88.8966" cy="100.434" r="3.29116"></circle><circle cx="68.5919" cy="41.8087" r="3.29116"></circle></svg>';

  function setupGhost() {
    $$(".framer-tlhq47", main()).forEach(function (card) {
      card.classList.add("tz-ghost");
      card.removeAttribute("data-tz-card");
      card.removeAttribute("data-tz-kind");
      card.removeAttribute("data-tz-href");
      var pill = $(".framer-1y83g0w", card);
      if (pill) setAttr(pill, "data-tz-hidden", "");
      var frame = $(".framer-1kf9dvd", card);
      if (frame && !frame.querySelector(".tz-ghost-mark")) {
        frame.insertAdjacentHTML("beforeend", GHOST_MARK);
      }
      if (!window.tzSignup) return;
      var content = $(".framer-1nzm4x", card) || card;
      var host = $(".tz-signup-host", card);
      if (!host) {
        host = document.createElement("div");
        host.className = "tz-signup-host";
        host.setAttribute("data-tz-signup", "waitlist");
        content.appendChild(host);
      }
      window.tzSignup.mount(host, { preset: "waitlist" });
    });
  }

  /* ------------------------------------------------------ contact: topics */

  var REPLY_TIME = "We reply within 3 working days";
  var PATHS = [
    { topic: "Partner", line: "Build a product with us, or bring us into one you already have." },
    { topic: "Collaborate", line: "A challenge, a brief, or a skill you want to put next to ours." },
    { topic: "Invest", line: "A conversation about backing the studio and what we ship." }
  ];

  function mountPaths() {
    var old = $(".framer-ckwxg1", main());
    if (old) setAttr(old, "data-tz-hidden", "");
    var formHost = $(".framer-255p7q", main());
    if (!formHost || $(".tz-paths", main())) return;
    var wrap = document.createElement("div");
    wrap.className = "tz-paths";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "How to build with us");
    PATHS.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tz-path";
      btn.setAttribute("data-tz-topic", item.topic);
      btn.setAttribute("aria-pressed", "false");
      var h = document.createElement("span");
      h.className = "tz-path__title";
      h.textContent = item.topic;
      var p = document.createElement("span");
      p.className = "tz-path__line";
      p.textContent = item.line;
      btn.appendChild(h);
      btn.appendChild(p);
      wrap.appendChild(btn);
    });
    var note = document.createElement("p");
    note.className = "tz-paths__note";
    note.textContent = REPLY_TIME;
    wrap.appendChild(note);
    formHost.parentNode.insertBefore(wrap, formHost);
  }

  var topic = "";

  function setupTopics() {
    var wrap = $(".framer-ckwxg1", main());
    if (!wrap) return;
    setAttr(wrap, "role", "group");
    setAttr(wrap, "aria-label", "Pick a topic for your message");
    Array.prototype.forEach.call(wrap.children, function (el) {
      var label = text(el);
      if (!label) return;
      setAttr(el, "role", "button");
      setAttr(el, "tabindex", "0");
      setAttr(el, "data-tz-kind", "tag");
      setAttr(el, "data-tz-topic", label);
      setAttr(el, "aria-pressed", label === topic ? "true" : "false");
    });
  }

  function chooseTopic(label, focus) {
    topic = topic === label ? "" : label;
    $$("[data-tz-topic]").forEach(function (el) { setAttr(el, "aria-pressed", el.getAttribute("data-tz-topic") === topic ? "true" : "false"); });
    renderTopic();
    if (focus) {
      scrollToId("contact-form");
      var msg = document.getElementById("tz-message");
      if (msg) setTimeout(function () { msg.focus({ preventScroll: true }); }, 350);
    }
  }

  /* ------------------------------------------------------ contact: form */

  var form = null;

  function buildForm() {
    var f = document.createElement("form");
    f.className = "tz-form";
    f.noValidate = true;
    f.setAttribute("data-state", "idle");
    f.setAttribute("aria-label", "Contact TwinzLab");
    f.innerHTML =
      '<div class="tz-form__fields">' +
        '<div class="tz-form__row">' +
          field("name", "Your name", '<input id="tz-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" placeholder="Jane Doe">') +
          field("email", "Email address", '<input id="tz-email" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="120" placeholder="you@company.com">') +
        "</div>" +
        '<div class="tz-topic" hidden><span class="tz-topic__label">Reason</span><span class="tz-topic__value"></span><button type="button" class="tz-topic__clear" aria-label="Remove topic">&times;</button></div>' +
        field("message", "Message", '<textarea id="tz-message" name="message" rows="6" required minlength="20" maxlength="2000" placeholder="An idea, a challenge, a partnership, or an investment conversation."></textarea>', '<span class="tz-count" aria-hidden="true">0 / 2000</span>') +
        '<div class="tz-hp" aria-hidden="true"><label for="tz-honey">Leave this field empty</label><input id="tz-honey" name="_honey" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<div class="tz-form__actions">' +
          '<button type="submit" class="tz-btn tz-btn--primary tz-submit"><span class="tz-spinner" aria-hidden="true"></span><span class="tz-submit__label">Send message</span></button>' +
          '<p class="tz-form__note">' + REPLY_TIME + "</p>" +
        "</div>" +
        '<div class="tz-alert tz-alert--error" role="alert" hidden></div>' +
      "</div>" +
      '<div class="tz-result" tabindex="-1" hidden></div>';

    f.addEventListener("submit", onSubmit);
    f.addEventListener("input", function (e) {
      if (e.target.name === "message") updateCount();
      if (e.target.getAttribute("aria-invalid") === "true") validateField(e.target);
      refreshAlert();
    });
    f.addEventListener("focusout", function (e) {
      if (e.target.matches("input, textarea") && e.target.value) validateField(e.target);
      refreshAlert();
    });
    f.querySelector(".tz-topic__clear").addEventListener("click", function () { chooseTopic(topic, false); });
    return f;
  }

  function field(name, label, control, extra) {
    return '<div class="tz-field">' +
      '<label for="tz-' + name + '">' + label + "</label>" +
      control.replace("<input ", '<input aria-describedby="tz-' + name + '-error" ').replace("<textarea ", '<textarea aria-describedby="tz-' + name + '-error" ') +
      '<div class="tz-field__meta"><p class="tz-field__error" id="tz-' + name + '-error"></p>' + (extra || "") + "</div>" +
      "</div>";
  }

  function mountForm() {
    var host = $(".framer-255p7q", main());
    if (!host) return;
    if (!form) {
      form = buildForm();
      prefill();
    }
    if (form.parentNode !== host) host.appendChild(form);
    document.body.classList.add("tz-form-ready");
  }

  function prefill() {
    var params = new URLSearchParams(location.search);
    var t = params.get("topic");
    if (t) {
      topic = t.slice(0, 60);
      var msg = form.querySelector("#tz-message");
      msg.value = "Hi TwinzLab, I'd like to know more about " + topic + ". ";
      updateCount();
    }
    renderTopic();
  }

  function renderTopic() {
    if (!form) return;
    var box = form.querySelector(".tz-topic");
    box.hidden = !topic;
    box.querySelector(".tz-topic__value").textContent = topic;
  }

  function updateCount() {
    var msg = form.querySelector("#tz-message");
    form.querySelector(".tz-count").textContent = msg.value.length + " / 2000";
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateField(el) {
    var v = el.value.trim();
    var msg = "";
    if (el.name === "name") {
      if (!v) msg = "Please enter your name.";
      else if (v.length < 2) msg = "That name looks too short.";
    } else if (el.name === "email") {
      if (!v) msg = "Please enter your email address.";
      else if (!EMAIL_RE.test(v)) msg = "Enter an email like name@example.com.";
    } else if (el.name === "message") {
      if (!v) msg = "Please write a short message.";
      else if (v.length < 20) msg = "Tell us a little more (at least 20 characters).";
    }
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    el.closest(".tz-field").querySelector(".tz-field__error").textContent = msg;
    return !msg;
  }

  function setState(state) {
    form.setAttribute("data-state", state);
    var btn = form.querySelector(".tz-submit");
    var busy = state === "loading";
    btn.disabled = busy;
    btn.setAttribute("aria-busy", busy ? "true" : "false");
    form.querySelector(".tz-submit__label").textContent = busy ? "Sending\u2026" : "Send message";
    $$("input, textarea", form).forEach(function (el) { el.readOnly = busy; });
  }

  function refreshAlert() {
    if (form.querySelector(".tz-alert").hidden) return;
    var n = $$("[aria-invalid='true']", form).length;
    showAlert(!n ? "" : n === 1 ? "Please fix the highlighted field." : "Please fix the " + n + " highlighted fields.");
  }

  function showAlert(msg) {
    var a = form.querySelector(".tz-alert");
    a.textContent = msg;
    a.hidden = !msg;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (form.getAttribute("data-state") === "loading") return;
    var fields = $$("input[name]:not([name^='_']), textarea[name]", form);
    var bad = fields.filter(function (el) { return !validateField(el); });
    if (bad.length) {
      setState("invalid");
      showAlert(bad.length === 1 ? "Please fix the highlighted field." : "Please fix the " + bad.length + " highlighted fields.");
      bad[0].focus();
      return;
    }
    showAlert("");
    setState("loading");

    var name = form.querySelector("#tz-name").value.trim();
    var email = form.querySelector("#tz-email").value.trim();
    var message = form.querySelector("#tz-message").value.trim();
    var honey = form.querySelector("#tz-honey").value;
    var subject = "Website enquiry from " + name + (topic ? " \u2013 " + topic : "");
    var body = message + "\n\n\u2014\n" + name + "\n" + email;
    var ctx = {
      name: name,
      email: email,
      href: mailto(subject, body, FORM_RECIPIENT),
      copyText: "To: " + FORM_RECIPIENT + "\nSubject: " + subject + "\n\n" + body
    };

    var payload = { name: name, email: email, message: message };
    if (topic) payload.topic = topic;
    payload.page = location.href;
    payload._subject = "New TwinzLab contact message";
    payload._template = "table";
    payload._captcha = "false";
    payload._honey = honey;

    var minDelay = new Promise(function (res) { setTimeout(res, 600); });
    // Bots fill the hidden field; pretend it worked without sending anything.
    var request = honey ? Promise.resolve({ success: "true" }) : postForm(payload);
    Promise.all([request, minDelay]).then(function (out) {
      var data = out[0];
      if (data && String(data.success) === "true") finish(true, ctx);
      else finish(false, ctx, data && data.message);
    }, function (err) {
      finish(false, ctx, err && err.message);
    });
  }

  function postForm(payload) {
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error((data && data.message) || "HTTP " + res.status);
        return data;
      });
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function finish(ok, ctx, errMsg) {
    var r = form.querySelector(".tz-result");
    r.innerHTML = "";
    r.className = "tz-result " + (ok ? "tz-result--success" : "tz-result--error");
    var icon = document.createElement("span");
    icon.className = "tz-result__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = ok ? "\u2713" : "!";
    var h = document.createElement("h3");
    var p = document.createElement("p");
    var actions = document.createElement("div");
    actions.className = "tz-result__actions";

    if (ok) {
      h.textContent = "Message sent";
      p.textContent = "Thanks, " + ctx.name + ". Your message is with the team and we'll reply to " + ctx.email + " soon.";
      actions.appendChild(button("Write another message", "tz-btn tz-btn--ghost", reset));
    } else {
      if (errMsg && window.console) console.warn("[twinzlab] contact form:", errMsg);
      var tooLong = ctx.href.length > 1900;
      h.textContent = "We couldn't send your message";
      p.textContent = tooLong
        ? "Something went wrong on our side. Your message is too long for an email link, so copy it below and send it to " + FORM_RECIPIENT + "."
        : "Something went wrong on our side. Nothing is lost: send it by email instead and your message will already be filled in.";
      var direct = document.createElement("a");
      direct.className = "tz-btn " + (tooLong ? "tz-btn--ghost" : "tz-btn--primary");
      direct.href = tooLong ? mailto(null, null, FORM_RECIPIENT) : ctx.href;
      direct.textContent = tooLong ? "Email " + FORM_RECIPIENT : "Send by email instead";
      var copy = button("Copy message", "tz-btn " + (tooLong ? "tz-btn--primary" : "tz-btn--ghost"), function () {
        var done = function () { copy.textContent = "Copied"; copy.setAttribute("data-copied", ""); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(ctx.copyText).then(done, function () { fallbackCopy(ctx.copyText) && done(); });
        else if (fallbackCopy(ctx.copyText)) done();
      });
      if (tooLong) { actions.appendChild(copy); actions.appendChild(direct); }
      else { actions.appendChild(direct); actions.appendChild(copy); }
      actions.appendChild(button("Back to the form", "tz-btn tz-btn--text", function () { setState("idle"); r.hidden = true; form.querySelector(".tz-form__fields").hidden = false; form.querySelector("#tz-message").focus(); }));
    }
    r.appendChild(icon);
    r.appendChild(h);
    r.appendChild(p);
    r.appendChild(actions);
    form.querySelector(".tz-form__fields").hidden = true;
    r.hidden = false;
    setState(ok ? "success" : "error");
    r.focus();
  }

  function fallbackCopy(value) {
    var t = document.createElement("textarea");
    t.value = value;
    t.setAttribute("readonly", "");
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    t.remove();
    return ok;
  }

  function button(label, cls, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function reset() {
    form.reset();
    $$("[aria-invalid]", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
    $$(".tz-field__error", form).forEach(function (el) { el.textContent = ""; });
    topic = "";
    renderTopic();
    setupTopics();
    updateCount();
    form.querySelector(".tz-result").hidden = true;
    form.querySelector(".tz-form__fields").hidden = false;
    setState("idle");
    form.querySelector("#tz-name").focus();
  }

  /* -------------------------------------------------------------- toast */

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "tz-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  /* ----------------------------------------------------------- navigation */

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    return true;
  }

  var leaving = false;

  function go(href) {
    var u = new URL(href, location.href);
    if (u.protocol === "mailto:") { location.href = u.href; return; }
    if (u.origin === location.origin && u.pathname === location.pathname) {
      var page = pageName();
      var f = u.searchParams.get("filter");
      if (FILTERS[page] && f) applyFilter(page, slug(f), true);
      var t = u.searchParams.get("topic");
      if (page === "contact" && t && t !== topic) chooseTopic(t, false);
      if (u.hash) {
        scrollToId(decodeURIComponent(u.hash.slice(1)));
        if (u.hash === "#contact-form") {
          var first = document.getElementById("tz-name");
          if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (u.origin === location.origin) {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce && !leaving) {
        try { sessionStorage.setItem("tz-page-enter", "1"); } catch (err) {}
        leaving = true;
        document.documentElement.classList.add("tz-leaving");
        setTimeout(function () { location.href = u.href; }, 280);
        return;
      }
    }
    location.href = u.href;
  }

  function modified(e) { return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0; }

  // Capture on window runs before React's root listener, so Framer's router never sees these clicks.
  window.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    // Correct the header before the page's own click handler follows `./products`.
    var navHref = headerNavHref(t);
    if (navHref && main() && main().contains(t)) {
      var navA = t.closest("a[href]");
      if (navA) setAttr(navA, "href", navHref);
      if (!(navA && modified(e))) {
        e.preventDefault();
        e.stopPropagation();
        go(navHref);
      }
      return;
    }

    var setF = t.closest("[data-tz-set-filter]");
    if (setF) { e.preventDefault(); applyFilter(pageName(), setF.getAttribute("data-tz-set-filter"), true); return; }

    var hit = t.closest("[data-tz-disabled], [data-tz-href], [data-tz-filter], [data-tz-topic], [data-tz-card]");
    if (!hit || !main() || !main().contains(hit)) return;

    if (hit.hasAttribute("data-tz-disabled")) {
      e.preventDefault(); e.stopPropagation();
      toast(hit.getAttribute("data-tz-disabled") + ". Email us at " + EMAIL + " in the meantime.");
      return;
    }
    if (hit.hasAttribute("data-tz-filter")) {
      e.preventDefault(); e.stopPropagation();
      applyFilter(pageName(), hit.getAttribute("data-tz-filter"), true);
      return;
    }
    if (hit.hasAttribute("data-tz-topic")) {
      e.preventDefault(); e.stopPropagation();
      chooseTopic(hit.getAttribute("data-tz-topic"), true);
      return;
    }
    if (hit.hasAttribute("data-tz-href")) {
      e.stopPropagation();
      if (hit.tagName === "A" && modified(e)) return;
      e.preventDefault();
      var href = hit.getAttribute("data-tz-href");
      if (hit.hasAttribute("data-tz-external")) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      go(href);
      return;
    }
    if (hit.hasAttribute("data-tz-card")) {
      if (t.closest("a, button, input, textarea, select, .framer-1ti9ac8")) return;
      var inner = hit.querySelector("[data-tz-href]");
      if (inner) { e.preventDefault(); e.stopPropagation(); go(inner.getAttribute("data-tz-href")); }
    }
  }, true);

  window.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var t = e.target;
    if (!t || !t.closest || t.matches("a, button, input, textarea, select")) return;
    var hit = t.closest("[role=link][data-tz-href], [role=link][data-tz-disabled], [role=button][data-tz-filter], [role=button][data-tz-topic]");
    if (!hit || hit !== t) return;
    if (hit.getAttribute("role") === "link" && e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    hit.click();
  }, true);

  // lets :active styles show on iOS
  document.addEventListener("touchstart", function () {}, { passive: true });

  /* ---------------------------------------------------- one autoplay at a time */

  var stageActive = "";
  var stageBound = false;
  var playHold = { who: false, featured: false };
  var playUser = { who: false, featured: false };
  var playForced = "";

  function motionReduce() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function stageAllows(which) {
    return stageActive === which;
  }

  function visibleRatio(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var top = Math.max(0, r.top);
    var bot = Math.min(vh, r.bottom);
    var vis = Math.max(0, bot - top);
    return vis / Math.min(r.height || 1, vh);
  }

  function syncPlayButton(which) {
    var btn = document.querySelector('.tz-play[data-tz-play="' + which + '"]');
    if (!btn) return;
    var on = stageActive === which;
    var name = which === "who" ? "Who We Are" : "featured products";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", (on ? "Pause " : "Play ") + name);
    var label = btn.querySelector(".tz-play__label");
    if (label) label.textContent = on ? "Pause" : "Play";
  }

  function syncStage() {
    var whoEl = document.getElementById("who-we-are") || $(".framer-1lq0uvn", main());
    var featEl = document.getElementById("featured-product") || $(".framer-iyzx2i", main());
    var wv = visibleRatio(whoEl);
    var fv = visibleRatio(featEl);
    if (playForced === "who" && wv < 0.2) { playForced = ""; playUser.who = false; }
    if (playForced === "featured" && fv < 0.2) { playForced = ""; playUser.featured = false; }

    var next = "";
    if (playForced && !playHold[playForced]) {
      var forcedRatio = playForced === "who" ? wv : fv;
      if (forcedRatio >= 0.2) next = playForced;
    }
    if (!next && !motionReduce()) {
      var best = 0.35;
      if (!playHold.who && wv >= best) { next = "who"; best = wv; }
      if (!playHold.featured && fv > best) next = "featured";
    } else if (!next) {
      if (playUser.who && !playHold.who && wv >= 0.2) next = "who";
      else if (playUser.featured && !playHold.featured && fv >= 0.2) next = "featured";
    }

    stageActive = next;
    if (next === "who") {
      var row = featuredRow();
      if (row) row.classList.add("tz-story-paused");
      stopStoryClock();
      if (!whoTimer && !whoPaused && !whoHidden) whoArm();
    } else if (next === "featured") {
      clearTimeout(whoTimer);
      whoTimer = 0;
      var featRow = featuredRow();
      var running = featRow && featRow.querySelector(".is-running");
      var idle = featRow && !featRow.matches(":hover") && !document.hidden;
      if (!featuredTimer && idle) {
        if (running) armFeatured();
        else kickStory();
      }
    } else {
      clearTimeout(whoTimer);
      whoTimer = 0;
      var paused = featuredRow();
      if (paused) paused.classList.add("tz-story-paused");
      stopStoryClock();
    }
    syncPlayButton("who");
    syncPlayButton("featured");
  }

  function mountPlay(section, which, name) {
    if (!section || section.querySelector(".tz-play")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tz-play";
    btn.setAttribute("data-tz-play", which);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Play " + name);
    var label = document.createElement("span");
    label.className = "tz-play__label";
    label.textContent = "Play";
    btn.appendChild(label);
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (stageActive === which && !playHold[which]) {
        playHold[which] = true;
        playUser[which] = false;
        if (playForced === which) playForced = "";
      } else {
        playHold[which] = false;
        playUser[which] = true;
        playForced = which;
      }
      syncStage();
    });
    section.appendChild(btn);
  }

  function bindStage() {
    if (pageName() !== "home") return;
    if (!stageBound) {
      stageBound = true;
      var tick = function () { syncStage(); };
      window.addEventListener("scroll", tick, { passive: true });
      window.addEventListener("resize", tick);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(tick, { threshold: [0, 0.25, 0.5, 0.75, 1] });
        var whoEl = $(".framer-1lq0uvn", main());
        var featEl = $(".framer-iyzx2i", main());
        if (whoEl) io.observe(whoEl);
        if (featEl) io.observe(featEl);
      }
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.addEventListener) mq.addEventListener("change", function () {
        playUser.who = false;
        playUser.featured = false;
        playForced = "";
        syncStage();
      });
    }
    syncStage();
  }

  /* --------------------------------------------------------------- boot */

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; enhance(); });
  }

  function isHydrated() {
    var m = main();
    var el = m && m.firstElementChild;
    if (!el) return false;
    for (var k in el) if (k.indexOf("__reactFiber") === 0) return true;
    return false;
  }

  function start() {
    enhance();
    new MutationObserver(schedule).observe(main() || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    var labResize = false;
    window.addEventListener("resize", function () {
      if (labResize) return;
      labResize = true;
      requestAnimationFrame(function () {
        labResize = false;
        if (pageName() === "home") equalizeLabFaces();
        if (pageName() === "lab") equalizeLabCards();
      });
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (pageName() === "home") equalizeLabFaces();
        if (pageName() === "lab") equalizeLabCards();
      });
    }
    if (location.hash) {
      var id = decodeURIComponent(location.hash.slice(1));
      setTimeout(function () { scrollToId(id); }, 300);
    }
    var lastPath = location.pathname;
    setInterval(function () {
      if (location.pathname !== lastPath) { lastPath = location.pathname; filterState = {}; form = null; document.body.classList.remove("tz-form-ready"); schedule(); }
    }, 300);
  }

  var tries = 0;
  (function waitForHydration() {
    if (isHydrated() || tries++ > 80) start();
    else setTimeout(waitForHydration, 100);
  })();
})();
