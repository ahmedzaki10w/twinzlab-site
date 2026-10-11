(function () {
  "use strict";

  // Contact form recipient. Messages are delivered by FormSubmit.co.
  // FormSubmit sends a one-time activation email to each new address.
  var FORM_RECIPIENT = "hello@twinzlab.online";

  var FORM_ENDPOINT = "https://formsubmit.co/ajax/" + FORM_RECIPIENT;
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
    ".framer-1ef4b7q", ".framer-nzlyda", ".framer-tlhq47",
    ".framer-1qxun2q", ".framer-11xoq6b",
    ".framer-eo4uhb"
  ];

  var PRODUCT_PILLS = [".framer-tdbu6h", ".framer-19so74", ".framer-1y83g0w"];
  var ARTICLE = "lab/the-bug-that-makes-you-laugh/";
  var LAB_READ_MORE = [".framer-17laeob", ".framer-1q7myax"];

  var ANCHORS = {
    home: { ".framer-1lq0uvn": "who-we-are", ".framer-ihlbe4": "what-we-build", ".framer-iyzx2i": "featured-product", ".framer-2dudm4": "process", ".framer-10dq8av": "from-the-lab" },
    about: { ".framer-1yoorx3": "founders", ".framer-14mxnf4": "mission", ".framer-1ugbpjk": "twin-advantage", ".framer-1h7cige": "values" },
    products: { ".framer-q8ddpx": "products", ".framer-1ef4b7q": "aresson", ".framer-nzlyda": "daftar" },
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

  // The export still ships two empty "coming soon" article cards. Hydration
  // puts them back, so drop them on every pass. Only one note is published.
  function dropPlaceholderArticles() {
    $$(".framer-qwhetu, .framer-wljenu, .framer-1kvby1z, .framer-1dmwas0", main()).forEach(function (el) {
      el.remove();
    });
  }

  // The products page still ships All / Aresson / Daftar / Soon chips.
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
        var name = card ? text($(".framer-9xeidv, .framer-phmefa, .framer-17nt926", card)) : "";
        makeLink(el, site("contact/?topic=" + encodeURIComponent(name || "Products") + "#contact-form"), "pill", "View " + (name || "product") + ": ask about it");
      });
    });

    LAB_READ_MORE.forEach(function (sel) {
      $$(sel, root).forEach(function (el) { makeDisabled(el, "Full post coming soon", "pill"); });
    });
    $$(".framer-1uia4ak, .framer-fwj0dz-container a.framer-s29zbl", root).forEach(function (el) {
      if (el.closest(".framer-1klyps3")) return;
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

    if (page === "lab") renderLabArticles();
    if (FILTERS[page]) setupFilter(page);
    if (page === "contact") { setupTopics(); mountForm(); }
    if (page === "home") {
      setupFeatured();
      fitProcessDiagram();
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
      image: "assets/framerusercontent.com/images/xjnUozwBcroSgyqhO9rSPKg1Dr0.0mvmq25.jpg",
      alt: "Portrait of Ahmed Zaki"
    },
    {
      sel: ".framer-ki8huu",
      title: "Elmodather Zaki",
      body: "Elmodather Zaki founded TwinzLab with his brother. Together they welcome collaborations, challenges, and investment.",
      image: "assets/framerusercontent.com/images/eaGTdL1Y6fiZm7RNrpgyVO8Ymps.0mqmx3e.jpg",
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
    if (whoPaused || whoHidden || whoReduce()) return;
    whoTimer = setTimeout(function () {
      whoShow((whoIndex + 1) % WHO.length, true);
    }, WHO_MS);
  }

  function whoSyncHero() {
    if (!whoSection) return;
    var hero = $(".framer-1yawxw3 img", whoSection);
    if (!hero) return;
    if (!hero.getAttribute("data-tz-who-src")) setAttr(hero, "data-tz-who-src", hero.getAttribute("src") || site(WHO[WHO.length - 1].image));
    var slide = WHO[whoIndex];
    if (whoNarrow()) {
      if (!whoSrcMatches(hero, slide.image)) hero.src = site(slide.image);
      setAttr(hero, "alt", slide.alt);
    } else {
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
    if (start) {
      setAttr(section, "data-tz-who-started", "1");
      whoArm();
    }
  }

  /* ----------------------------------------------------- featured product */

  // Copy and links are the three product cards already on the Products page.
  var FEATURED = [
    {
      name: "Daftar",
      blurb: "A mobile app for kiosk and small-shop owners to manage sales and their team.",
      href: "products/#daftar",
      gradient: "linear-gradient(#1e211d 0%,#274735 66.0661%,#accbda 100%)"
    },
    {
      name: "Aresson",
      blurb: "Discover and book sports sessions with coaches and trainers across different sports.",
      href: "products/#aresson",
      gradient: "linear-gradient(#1e211d 0%,#4a3428 62%,#e9ab78 100%)"
    },
    {
      name: "Coming soon",
      blurb: "More products coming soon. We will add them when there is something real to show.",
      href: "products/#products",
      gradient: "linear-gradient(#1e211d 0%,#231d17 58%,#d9d9d9 100%)"
    }
  ];
  var featuredIndex = 0;
  var featuredTimer = 0;
  var featuredFadeTimer = 0;
  var featuredGen = 0;
  var featuredReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    if (art) art.style.background = slide.gradient;
    if (button) {
      setAttr(button, "data-tz-href", site(slide.href));
      if (button.tagName === "A") setAttr(button, "href", site(slide.href));
      setAttr(button, "aria-label", "View " + slide.name);
    }
    setAttr(row, "aria-label", slide.name);
    $$(".framer-1ti9ac8 > div", row).forEach(function (dot, i) {
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
    if (featuredReduce) return;
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
    if (dot && !featuredReduce) {
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
    if (!animate || featuredReduce || typeof row.animate !== "function") {
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
          e.preventDefault();
          e.stopPropagation();
          showFeatured(i, true);
        });
        dot.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
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
      kickStory();
      return;
    }
    paintFeatured();
  }

  /* --------------------------------------------------------- lab articles */

  // The Lab page is a Framer export. Article cards are filled from the
  // manifest the build writes into #tz-lab-articles, using the published
  // card as the template so the frame stays the same.
  var labCardTemplate = null;

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

  function fillLabCard(card, article) {
    card.removeAttribute("data-tz-hidden");
    card.removeAttribute("data-tz-disabled");
    setAttr(card, "data-tz-card", "");
    setAttr(card, "data-tz-kind", "card");
    setAttr(card, "data-tz-slug", article.slug || "");
    var title = $(".framer-zdps2f .framer-text", card);
    var excerpt = $(".framer-7454k4 .framer-text", card);
    var tag = $(".framer-svx48s .framer-text", card);
    var pill = $(".framer-svx48s", card);
    var thumb = $(".framer-1p016lq", card);
    var read = $(".framer-1uia4ak", card);
    if (title) title.textContent = article.title || "";
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
    var signature = articles.map(function (article) { return article.slug || ""; }).join("|");
    var current = $$(".framer-eo4uhb", list);
    if (list.getAttribute("data-tz-lab-sig") === signature && current.length === articles.length) return;

    var seed = current[0] || labCardTemplate;
    if (!labCardTemplate && seed) labCardTemplate = seed.cloneNode(true);
    if (!labCardTemplate) return;

    current.forEach(function (card) { card.remove(); });
    var empty = $(".tz-empty", list);
    articles.forEach(function (article) {
      var card = labCardTemplate.cloneNode(true);
      fillLabCard(card, article);
      if (empty) list.insertBefore(card, empty);
      else list.appendChild(card);
    });
    setAttr(list, "data-tz-lab-sig", signature);
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
        var tag = slug(text($(cfg.tag, card)));
        var match = value === "all" || tag === value;
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
  }

  /* ------------------------------------------------------ contact: topics */

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
          '<p class="tz-form__note">We read every message and reply to the email address you give us.</p>' +
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
      });
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (pageName() === "home") equalizeLabFaces();
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
