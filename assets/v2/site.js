/* Shared v2 behaviour: mobile menu, scroll reveal companions, matrix dots, hero text. */
(function () {
  document.querySelectorAll("img.cv-fallback").forEach(function (img) {
    var canvas = img.parentElement && img.parentElement.querySelector("canvas");
    if (canvas && canvas.getContext) img.hidden = true;
  });

  var burger = document.querySelector(".burger");
  var sheet = document.getElementById("nav-sheet");
  if (burger && sheet) {
    function setOpen(open) {
      sheet.classList.toggle("is-open", open);
      sheet.hidden = !open;
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      burger.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("nav-open", open);
    }
    burger.addEventListener("click", function () {
      setOpen(!sheet.classList.contains("is-open"));
    });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) {
        setOpen(false);
        burger.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 701px)").matches) setOpen(false);
    });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    requestAnimationFrame(function () {
      document.querySelectorAll(".t-stagger").forEach(function (el) { el.classList.add("is-shown"); });
    });
  } else {
    document.querySelectorAll(".t-stagger").forEach(function (el) { el.classList.add("is-shown"); });
  }

  var cyc = 1200;
  var tables = {
    scan: function (i) { return (i % 4) * cyc / 10; },
    twinkle: function (i) { return [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4].indexOf(i) * cyc / 16; },
    orbit: function (i) {
      var r = [1, 2, 7, 11, 14, 13, 8, 4].indexOf(i);
      return r < 0 ? -1 : r * cyc / 8;
    },
    pulse: function (i) { return [5, 6, 9, 10].indexOf(i) >= 0 ? 0 : cyc * 0.16; }
  };
  document.querySelectorAll(".t-matrix").forEach(function (matrix) {
    if (matrix.childElementCount) return;
    var fn = tables[matrix.dataset.variant] || tables.scan;
    for (var i = 0; i < 16; i++) {
      var cell = document.createElement("i");
      var delay = fn(i);
      if (delay < 0) cell.className = "is-still";
      else cell.style.setProperty("--d", delay);
      matrix.appendChild(cell);
    }
  });
})();
