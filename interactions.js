(function () {
  "use strict";

  // Contact form recipient. Messages are delivered by FormSubmit.co, and the
  // mailto fallback uses it too. Temporary inbox: swap for the domain mailbox
  // later (FormSubmit sends a one-time activation email to each new address).
  var FORM_RECIPIENT = "ahmed240017@gmail.com";

  var FORM_ENDPOINT = "https://formsubmit.co/ajax/" + FORM_RECIPIENT;
  var EMAIL = "hello@twinzlab.com";
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

  var SOCIAL = [".framer-ta0yq0", ".framer-tlzm73", ".framer-1gdr5uv", ".framer-1mshf4g"];

  // Cards whose whole surface forwards to the action inside them.
  var CARD_PROXIES = [
    ".framer-inyeg6", ".framer-1kvby1z", ".framer-1dmwas0",
    ".framer-1ef4b7q", ".framer-nzlyda", ".framer-tlhq47",
    ".framer-1qxun2q", ".framer-ncsnc3",
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
    products: {
      chips: ".framer-rimxp0", list: ".framer-ob073m",
      cards: [".framer-1ef4b7q", ".framer-nzlyda", ".framer-tlhq47"],
      tag: ".framer-14uwwsz, .framer-1ag9kqb, .framer-1g5nybw",
      empty: function (label) {
        return { msg: "No " + label + " published yet. We're building them now.", cta: "Tell us what you'd like to see", href: site("contact/?topic=" + encodeURIComponent(label) + "#contact-form") };
      }
    },
    lab: {
      chips: ".framer-zk7jz2", list: ".framer-1klyps3",
      cards: [".framer-eo4uhb", ".framer-qwhetu", ".framer-wljenu"],
      tag: ".framer-svx48s, .framer-brf2i9, .framer-1dxoj8z",
      empty: function (label) {
        return { msg: "No " + label + " posts yet.", cta: "Show all posts", filter: "all" };
      }
    }
  };
  var filterState = {};

  /* -------------------------------------------------------------- enhance */

  function makeLink(el, href, kind, label) {
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

  function enhance() {
    var root = main();
    if (!root) return;
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

    SOCIAL.forEach(function (sel) {
      $$(sel, root).forEach(function (el) {
        makeDisabled(el, text(el) + " profile coming soon", "text");
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

    if (FILTERS[page]) setupFilter(page);
    if (page === "contact") { setupTopics(); mountForm(); }
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
    location.href = u.href;
  }

  function modified(e) { return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0; }

  // Capture on window runs before React's root listener, so Framer's router never sees these clicks.
  window.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

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
      go(hit.getAttribute("data-tz-href"));
      return;
    }
    if (hit.hasAttribute("data-tz-card")) {
      if (t.closest("a, button, input, textarea, select")) return;
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
