/* Lab Notes and the product waitlist.
   Founders: set ENDPOINT_OVERRIDE to a form endpoint that accepts a JSON POST
   and returns { "success": "true" }. Leave it empty to use FormSubmit for
   hello@twinzlab.online (activate that address once, from FormSubmit's email).
   A failed post never says the person is subscribed. */
(function () {
  "use strict";

  var ENDPOINT_OVERRIDE = "";
  var RECIPIENT = "hello@twinzlab.online";
  var ENDPOINT = ENDPOINT_OVERRIDE || ("https://formsubmit.co/ajax/" + RECIPIENT);

  window.TWINZLAB_FORM_ENDPOINT = ENDPOINT;
  window.TWINZLAB_FORM_RECIPIENT = RECIPIENT;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var PRESETS = {
    "lab-notes": {
      compact: false,
      source: "lab-notes",
      title: "Lab Notes",
      dek: "A short email when a new note is up. No schedule we can't keep.",
      button: "Email me new notes",
      subject: "Lab Notes signup",
      success: function (email) {
        return "You're on the list. We'll email " + email + " when a new note is up.";
      }
    },
    waitlist: {
      compact: true,
      source: "waitlist",
      title: "Waitlist",
      dek: "An email when there is a real product to show.",
      button: "Join the waitlist",
      subject: "Product waitlist",
      success: function (email) {
        return "You're on the list. We'll email " + email + " when there's something to show.";
      }
    }
  };

  function mailto(subject, body) {
    return "mailto:" + RECIPIENT + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function mount(host, options) {
    if (!host || host.getAttribute("data-tz-signup-ready") === "1") return host && host.querySelector(".tz-signup");
    var preset = PRESETS[(options && options.preset) || host.getAttribute("data-tz-signup")] || PRESETS["lab-notes"];
    var opts = preset;
    host.setAttribute("data-tz-signup-ready", "1");

    var form = document.createElement("form");
    form.className = "tz-signup" + (opts.compact ? " tz-signup--compact" : "");
    form.noValidate = true;
    form.setAttribute("data-state", "idle");
    form.innerHTML =
      (opts.compact ? "" : '<h2 class="tz-signup__title"></h2>') +
      '<p class="tz-signup__dek"></p>' +
      '<div class="tz-signup__row">' +
        '<label class="tz-signup__label"><span class="tz-signup__label-text">Email address</span>' +
          '<input class="tz-signup__input" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="120" placeholder="you@company.com">' +
        "</label>" +
        '<button type="submit" class="tz-btn tz-btn--primary tz-signup__submit"><span class="tz-signup__btn-label"></span></button>' +
      "</div>" +
      '<div class="tz-hp" aria-hidden="true"><label>Leave this field empty<input name="_honey" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="tz-signup__error" role="alert" hidden></p>' +
      '<div class="tz-signup__result" tabindex="-1" hidden></div>';

    var title = form.querySelector(".tz-signup__title");
    if (title) title.textContent = opts.title;
    form.querySelector(".tz-signup__dek").textContent = opts.dek;
    form.querySelector(".tz-signup__btn-label").textContent = opts.button;
    if (opts.compact) form.setAttribute("aria-label", opts.title);
    host.appendChild(form);

    var input = form.querySelector(".tz-signup__input");
    var error = form.querySelector(".tz-signup__error");
    var result = form.querySelector(".tz-signup__result");

    function showError(msg) {
      error.textContent = msg || "";
      error.hidden = !msg;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.getAttribute("data-state") === "loading") return;
      var email = input.value.trim();
      var honey = (form.querySelector("[name='_honey']") || {}).value || "";
      if (!EMAIL_RE.test(email)) {
        showError("Enter an email like name@example.com.");
        input.focus();
        return;
      }
      showError("");
      form.setAttribute("data-state", "loading");
      form.querySelector(".tz-signup__submit").disabled = true;

      var subject = opts.subject;
      var body = "Please add " + email + " to the TwinzLab " + opts.title + " list.\n\nPage: " + location.href;
      var href = mailto(subject, body);

      function fail() {
        form.setAttribute("data-state", "error");
        form.querySelector(".tz-signup__submit").disabled = false;
        result.hidden = false;
        result.innerHTML = "";
        var p = document.createElement("p");
        p.textContent = "We couldn't add this address from the site. Send it by email instead — nothing was subscribed.";
        var a = document.createElement("a");
        a.className = "tz-btn tz-btn--ghost";
        a.href = href;
        a.textContent = "Email " + RECIPIENT;
        result.appendChild(p);
        result.appendChild(a);
        result.focus();
      }

      if (honey) {
        fail();
        return;
      }

      var payload = {
        email: email,
        source: opts.source,
        page: location.href,
        _subject: opts.subject + " from the website",
        _template: "table",
        _captcha: "false",
        _honey: honey
      };
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data || String(data.success) !== "true") throw new Error("rejected");
          return data;
        });
      }).then(function () {
        form.setAttribute("data-state", "success");
        form.querySelector(".tz-signup__row").hidden = true;
        result.hidden = false;
        result.innerHTML = "";
        var p = document.createElement("p");
        p.textContent = opts.success(email);
        result.appendChild(p);
        result.focus();
      }).catch(fail).finally(function () { if (timer) clearTimeout(timer); });
    });

    return form;
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-tz-signup]");
    Array.prototype.forEach.call(nodes, function (host) {
      mount(host, { preset: host.getAttribute("data-tz-signup") });
    });
  }

  window.tzSignup = { mount: mount, presets: PRESETS };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
