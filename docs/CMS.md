# Publishing a Lab article

The Lab editor is at [https://twinzlab.online/admin](https://twinzlab.online/admin). You write in the browser. Publishing saves a Markdown file to the site repository, Cloudflare rebuilds the page, and the article shows up on [the Lab](https://twinzlab.online/lab/).

Nothing here is a paid service. The editor is Decap CMS, sign-in is a small Cloudflare route, and the site stays on the existing Cloudflare Worker.

## One-time setup

Do this once, before the first sign-in. You need access to the GitHub repository `ahmedzaki10w/twinzlab-site` and to the Cloudflare account that deploys the site.

### 1. Create the GitHub OAuth app

1. Open GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
   A direct link: [https://github.com/settings/developers](https://github.com/settings/developers).
2. Fill in exactly:
   - **Application name:** `TwinzLab Lab editor`
   - **Homepage URL:** `https://twinzlab.online`
   - **Authorization callback URL:** `https://twinzlab.online/api/callback`
3. Register the application, then **Generate a client secret**.
4. Copy the **Client ID** and the **Client secret**. You will paste them into Cloudflare in the next step. Do not put them in the repository, in a commit, or in this file.

The GitHub account that later clicks “Login with GitHub” must be allowed to push to `ahmedzaki10w/twinzlab-site`.

### 2. Add the two secrets in Cloudflare

1. Open the Cloudflare dashboard → **Workers & Pages** → the Worker that serves twinzlab.online.
2. Go to **Settings → Variables and Secrets**.
3. Add:
   - `GITHUB_CLIENT_ID` — the Client ID
   - `GITHUB_CLIENT_SECRET` — the Client secret, as an encrypted secret
4. Save, and redeploy if Cloudflare asks you to.

The names have to match. The Worker reads them at `/api/auth` and `/api/callback`. They are not in the git history.

### 3. Let Cloudflare build the pages

The repository now has `wrangler.jsonc`. Wrangler runs `npm run build` before it uploads the site. That command turns each file in `content/lab/` into an article page and refreshes the Lab cards.

If the Cloudflare project already has a **Build command**, set it to:

```bash
npm run build
```

The **Deploy command** should stay:

```bash
npx wrangler deploy
```

If the build command box is empty, leave it empty. Wrangler runs the build from `wrangler.jsonc`.

`wrangler.jsonc` names the Worker `twinzlab-site`. If a deploy creates a second Worker instead of updating the live one, change that `name` to the Worker name shown in the dashboard, then deploy again.

### 4. Sign in

1. Open [https://twinzlab.online/admin](https://twinzlab.online/admin).
2. Choose **Login with GitHub** and approve access to public repositories.
3. You should land on the Lab collection.

If GitHub shows an error about the callback URL, the OAuth app callback is not exactly `https://twinzlab.online/api/callback`.

## Write and publish

1. In the editor, open **Lab** and choose **New Article**.
2. Fill in the title, slug, date, and excerpt. The slug is the address: `notes-from-the-lab` becomes `https://twinzlab.online/lab/notes-from-the-lab/`.
3. Pick a category: Experiments, Dev Logs, Product Updates, Behind the Scenes, Announcements, or Opinion. Tags you add become filter chips too.
4. Add a cover if you have one. If you leave it blank, the page uses the Lab color field until you add an image. Uploaded images are stored in `assets/uploads` in the repository.
5. Write the article in Markdown. A heading written as `## A section` is added to the list beside the title.
6. Leave **Draft** off.
7. Choose **Publish**.

Publishing commits to `main`. Cloudflare builds and deploys on its own. Give it a minute, then refresh the Lab page. The newest date is listed first.

To change an article, open it in the editor, edit, and publish again. To take it down, either turn on **Draft** and publish, or delete the entry. A draft stays in the repository and is not built onto the site.

Changing the slug changes the address. The previous address stops working.

## What you do not have to touch

You do not edit HTML, CSS, or the build script to publish. The article pages use the same layout, type, navigation, footer, and contact link as the existing Lab article.

The preview inside the editor is only a writing preview. The designed page is the one on twinzlab.online after the deploy finishes.

## Try it on your own computer

```bash
npm install
npm run build
npx decap-server
```

In a second terminal, serve the site (`python3 -m http.server 4817`) and open `http://127.0.0.1:4817/admin/`. On your computer the editor uses the local repository instead of GitHub. Publish still has to happen on twinzlab.online/admin for the live site to update.
