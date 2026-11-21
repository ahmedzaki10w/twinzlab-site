/* Contact form. Posts to the same endpoint as Lab Notes (signup.js). */
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var RECIPIENT = window.TWINZLAB_FORM_RECIPIENT || "hello@twinzlab.online";
  var ENDPOINT = window.TWINZLAB_FORM_ENDPOINT || ("https://formsubmit.co/ajax/" + RECIPIENT);
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var fields = form.querySelector(".form-fields");
  var result = form.querySelector(".form-result");
  var alertEl = form.querySelector(".form-alert");
  var submit = form.querySelector(".btn");

  function mailto(subject, body) {
    return "mailto:" + RECIPIENT + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function validate(el) {
    var value = el.value.trim();
    var msg = "";
    if (el.name === "name") {
      if (!value) msg = "Please enter your name.";
      else if (value.length < 2) msg = "That name looks too short.";
    } else if (el.name === "email") {
      if (!value) msg = "Please enter your email address.";
      else if (!EMAIL_RE.test(value)) msg = "Enter an email like name@example.com.";
    } else if (el.name === "message") {
      if (!value) msg = "Please write a short message.";
      else if (value.length < 20) msg = "Tell us a little more (at least 20 characters).";
    }
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    var err = document.getElementById(el.id + "-error");
    if (err) err.textContent = msg;
    return !msg;
  }

  function setBusy(busy) {
    submit.disabled = busy;
    submit.textContent = busy ? "Sending…" : "Send message";
    submit.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function showAlert(msg) {
    alertEl.textContent = msg || "";
    alertEl.hidden = !msg;
  }

  var params = new URLSearchParams(location.search);
  var preset = params.get("topic");
  if (preset) {
    var match = Array.prototype.find.call(form.querySelectorAll('input[name="topic"]'), function (input) {
      return input.value.toLowerCase() === preset.toLowerCase();
    });
    if (match) match.checked = true;
    var message = document.getElementById("tz-message");
    if (message && !message.value) message.value = "Hi TwinzLab, I'd like to know more about " + preset.slice(0, 60) + ". ";
  }

  form.addEventListener("focusout", function (e) {
    if (e.target.matches("input, textarea") && e.target.value) validate(e.target);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submit.disabled) return;
    var controls = Array.prototype.filter.call(
      form.querySelectorAll("input[name]:not([type=radio]):not([name^='_']), textarea[name]"),
      function (el) { return !validate(el); }
    );
    if (controls.length) {
      showAlert(controls.length === 1 ? "Please fix the highlighted field." : "Please fix the highlighted fields.");
      controls[0].focus();
      return;
    }
    showAlert("");
    setBusy(true);

    var name = document.getElementById("tz-name").value.trim();
    var email = document.getElementById("tz-email").value.trim();
    var message = document.getElementById("tz-message").value.trim();
    var topic = (form.querySelector('input[name="topic"]:checked') || {}).value || "";
    var honey = (form.querySelector("[name='_honey']") || {}).value || "";
    var subject = "Website enquiry from " + name + (topic ? " – " + topic : "");
    var body = message + "\n\n—\n" + name + "\n" + email + (topic ? "\n" + topic : "");
    var href = mailto(subject, body);
    var copyText = "To: " + RECIPIENT + "\nSubject: " + subject + "\n\n" + body;

    var payload = {
      name: name,
      email: email,
      message: message,
      topic: topic,
      page: location.href,
      _subject: "New TwinzLab contact message",
      _template: "table",
      _captcha: "false",
      _honey: honey
    };

    var request = honey
      ? Promise.resolve({ success: "true" })
      : fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error((data && data.message) || "HTTP " + res.status);
            return data;
          });
        });

    request.then(function (data) {
      finish(data && String(data.success) === "true", name, email, href, copyText);
    }).catch(function () {
      finish(false, name, email, href, copyText);
    });
  });

  function finish(ok, name, email, href, copyText) {
    setBusy(false);
    result.hidden = false;
    result.innerHTML = "";
    fields.hidden = true;
    var h = document.createElement("h3");
    var p = document.createElement("p");
    var acts = document.createElement("div");
    acts.className = "acts";
    if (ok) {
      h.textContent = "Message sent";
      p.textContent = "Thanks, " + name + ". Your message is with the team and we'll reply to " + email + " soon.";
      var again = document.createElement("button");
      again.type = "button";
      again.className = "btn s";
      again.textContent = "Write another message";
      again.addEventListener("click", function () {
        form.reset();
        fields.hidden = false;
        result.hidden = true;
        document.getElementById("tz-name").focus();
      });
      acts.appendChild(again);
    } else {
      h.textContent = "We couldn't send your message";
      p.textContent = "Nothing is lost. Send it by email instead and your message will already be filled in.";
      var mail = document.createElement("a");
      mail.className = "btn p";
      mail.href = href.length > 1900 ? mailto("", "") : href;
      mail.textContent = "Send by email instead";
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn s";
      copy.textContent = "Copy message";
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = "Copied"; };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(copyText).then(done, function () {});
        else done();
      });
      acts.appendChild(mail);
      acts.appendChild(copy);
    }
    result.appendChild(h);
    result.appendChild(p);
    result.appendChild(acts);
    result.focus();
  }
})();
