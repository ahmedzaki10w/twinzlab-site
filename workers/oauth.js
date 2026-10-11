/**
 * GitHub sign-in for the Decap CMS editor at /admin.
 *
 * Decap opens /api/auth in a popup. That page tells the editor it is
 * ready, then sends the founder to GitHub. GitHub returns to /api/callback,
 * which exchanges the code and hands the token back to the editor.
 *
 * GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET come from the Worker environment.
 * They are never written into the repository.
 */

const PROVIDER = "github";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return text("Method not allowed", 405);
    }
    if (url.pathname === "/api/auth") return handleAuth(request, env, url);
    if (url.pathname === "/api/callback") return handleCallback(request, env, url);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return text("Not found", 404);
  },
};

async function handleAuth(request, env, url) {
  if (!configured(env)) return text("The editor sign-in is not configured yet.", 503);
  const provider = url.searchParams.get("provider") || PROVIDER;
  if (provider !== PROVIDER) return text("This editor signs in with GitHub.", 400);

  const scope = url.searchParams.get("scope") || "public_repo";
  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("scope", scope);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("redirect_uri", callbackUrl(url));

  const origin = url.origin;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Sign in — TwinzLab</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #17100b; color: #d9d9d9; font: 16px/1.5 "Inter Tight", "Segoe UI", sans-serif; }
    p { margin: 0; }
  </style>
</head>
<body>
  <p id="status">Opening GitHub…</p>
  <script>
    (function () {
      var target = ${JSON.stringify(origin)};
      var next = ${JSON.stringify(authorize.href)};
      var status = document.getElementById("status");
      function receive(event) {
        if (event.origin !== target) return;
        if (event.data !== "authorizing:${PROVIDER}") return;
        window.removeEventListener("message", receive);
        window.location.replace(next);
      }
      window.addEventListener("message", receive, false);
      if (window.opener) {
        window.opener.postMessage("authorizing:${PROVIDER}", target);
      } else {
        status.textContent = "Open the editor at /admin and use Login with GitHub.";
      }
    })();
  </script>
</body>
</html>`;

  return htmlResponse(html, {
    "set-cookie": stateCookie(state, request, 600),
  });
}

async function handleCallback(request, env, url) {
  if (!configured(env)) return text("The editor sign-in is not configured yet.", 503);
  const origin = url.origin;
  const denied = url.searchParams.get("error_description") || url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = readCookie(request.headers.get("cookie") || "", "tz_oauth_state");

  if (denied || !code || !state || !expected || state !== expected) {
    return finish(origin, { message: denied || "Sign-in could not be completed. Close this window and try again from the editor." }, request);
  }

  let data;
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "twinzlab-lab-editor",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        state,
        redirect_uri: callbackUrl(url),
      }),
    });
    data = await response.json();
  } catch (error) {
    return finish(origin, { message: "GitHub could not be reached. Try again in a moment." }, request);
  }

  if (!data || !data.access_token) {
    return finish(origin, { message: (data && (data.error_description || data.error)) || "GitHub did not sign you in." }, request);
  }

  return finish(origin, { token: data.access_token, provider: PROVIDER }, request);
}

function finish(origin, result, request) {
  const message = result.token
    ? `authorization:${PROVIDER}:success:${JSON.stringify({ token: result.token, provider: PROVIDER })}`
    : `authorization:${PROVIDER}:error:${JSON.stringify({ message: result.message || "Sign-in failed." })}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Sign in — TwinzLab</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #17100b; color: #d9d9d9; font: 16px/1.5 "Inter Tight", "Segoe UI", sans-serif; }
    p { max-width: 36ch; margin: 0; text-align: center; }
  </style>
</head>
<body>
  <p id="status">${result.token ? "Signed in. Returning to the editor…" : escapeHtml(result.message || "Sign-in failed.")}</p>
  <script>
    (function () {
      var message = ${JSON.stringify(message)};
      var origin = ${JSON.stringify(origin)};
      if (window.opener) {
        window.opener.postMessage(message, origin);
        window.close();
      }
    })();
  </script>
</body>
</html>`;
  return htmlResponse(html, {
    "set-cookie": stateCookie("", request, 0),
    "referrer-policy": "no-referrer",
  });
}

function configured(env) {
  return Boolean(env && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

function callbackUrl(url) {
  return `${url.origin}/api/callback`;
}

function stateCookie(value, request, maxAge) {
  const secure = new URL(request.url).protocol === "https:";
  const parts = [
    `tz_oauth_state=${value}`,
    "HttpOnly",
    "Path=/api",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function readCookie(header, name) {
  const prefix = `${name}=`;
  for (const part of header.split(";")) {
    const item = part.trim();
    if (item.startsWith(prefix)) return item.slice(prefix.length);
  }
  return "";
}

function htmlResponse(html, extra) {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}

function text(message, status) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
