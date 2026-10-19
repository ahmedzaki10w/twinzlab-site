# TwinzLab site

Static marketing site for TwinzLab (HTML/CSS/JS).

## Run locally

Serve the repo root with any static file server (paths are absolute from `/`).

```bash
# Python
python3 -m http.server 4817

# Node (if you have npx)
npx --yes serve -l 4817
```

Open [http://127.0.0.1:4817](http://127.0.0.1:4817).

Use a non-default port (e.g. `4817`) if `3000` / `8080` are already in use.

## Lab articles

Founders publish Lab articles from [twinzlab.online/admin](https://twinzlab.online/admin). The steps for GitHub sign-in and Cloudflare are in [docs/CMS.md](docs/CMS.md).

```bash
npm install
npm run build
```

`npm run build` turns `content/lab/*.md` into the article pages and the Lab card list.

## Notes

- Contact, the Lab Notes signup, and the coming-soon waitlist share one endpoint. Set `ENDPOINT_OVERRIDE` at the top of `signup.js` if you move off FormSubmit. Leave it empty to post to `https://formsubmit.co/ajax/hello@twinzlab.online`. Activate that FormSubmit address once the site is publicly hosted. A failed post opens a mailto draft and does not say the person is subscribed. Store links for Aresson and Hesba stay empty in `STORE_URLS` inside `interactions.js` until the apps are public. The reply-time line is `REPLY_TIME` in the same file.
- Keep `responsive.css` / `responsive.js`, `interactions.css` / `interactions.js`, `assets/`, page folders, and `f2c-sw.js` at the repo root.

## Branding notes

Framer editor badge / Edit Content button are disabled. Site icons live in `assets/icons/` (TwinzLab logo). Document titles are TwinzLab-branded on all pages.
