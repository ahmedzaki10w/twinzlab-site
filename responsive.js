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

  var path = location.pathname.replace(/index\.html$/, "");
  var depth = path.split("/").filter(Boolean).length;
  var root = depth ? "../".repeat(depth) : "./";
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
    mail.href = "mailto:hello@twinzlab.com";
    mail.textContent = "hello@twinzlab.com";
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
})();
