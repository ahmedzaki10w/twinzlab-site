/**
 * Turn content/lab/*.md into Lab article pages and a card manifest.
 *
 * The article chrome (nav, footer, partnership band, fonts) is the existing
 * Lab article, kept in scripts/partials/article.template.html. Markdown
 * becomes the prose. The Lab index keeps its Framer layout; this script
 * only drops a JSON manifest into the page so interactions.js can list
 * cards after Framer hydrates.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { Marked } from "marked";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://twinzlab.online";
const CONTENT_DIR = path.join(root, "content", "lab");
const LAB_DIR = path.join(root, "lab");
const TEMPLATE = fs.readFileSync(path.join(root, "scripts", "partials", "article.template.html"), "utf8");
const SHARE = fs.readFileSync(path.join(root, "scripts", "partials", "share.html"), "utf8");
const MARKER = "twinzlab-lab-article";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_CTA = "Building with AI? Let's compare notes";
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" style="--34440n:currentColor;--fbr8zx:1.5"><use href="#3403169090"></use></svg>';

const FALLBACK_COVER = "/assets/lab/cover-fallback.png";
const FALLBACK_ALT = "Soft warm and cool light on a dark field.";

const marked = new Marked();
let usedIds = new Set();
marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    heading({ text, depth }) {
      const plain = text.replace(/<[^>]+>/g, "");
      let id = slugify(decode(plain)) || "section";
      let n = 2;
      while (usedIds.has(id)) id = `${slugify(decode(plain)) || "section"}-${n++}`;
      usedIds.add(id);
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const safe = String(href || "").trim();
      if (!safe || /^\s*javascript:/i.test(safe)) return text;
      const titleAttr = title ? ` title="${esc(title)}"` : "";
      const external = /^https?:\/\//i.test(safe) && !safe.startsWith(SITE);
      const extra = external ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<a href="${esc(safe)}"${titleAttr}${extra}>${text}</a>`;
    },
  },
});

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function decode(value) {
  return String(value ?? "")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function rel(url) {
  if (!url) return "";
  if (/^(https?:|mailto:|#)/.test(url)) return url;
  return `../../${String(url).replace(/^\//, "")}`;
}

function abs(url) {
  if (!url) return "";
  if (/^https?:/.test(url)) return url;
  return SITE + (String(url).startsWith("/") ? url : `/${url}`);
}

function rootPath(url) {
  if (!url) return "";
  if (/^https?:/.test(url)) return url;
  return String(url).startsWith("/") ? url : `/${url}`;
}

function dateISO(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

function asList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => (typeof item === "string" ? item : item && (item.tag || item.name)) || "")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function preprocess(markdown) {
  return markdown.replace(/^##\s+(.+?)\s+\{#([A-Za-z0-9_-]+)\}\s*$/gm, (_, text, id) => {
    return `\n<h2 id="${id}">${esc(text)}</h2>\n`;
  });
}

function renderMarkdown(markdown) {
  const source = String(markdown || "").trim();
  if (!source) return "";
  usedIds = new Set();
  return marked.parse(preprocess(source)).trim();
}

function extractSources(html) {
  const match = html.match(/<section class="sources"[\s\S]*?<\/section>/i);
  if (!match) return { prose: html.trim(), sources: "" };
  return { prose: html.replace(match[0], "").trim(), sources: match[0].trim() };
}

function sourcesFrom(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<section")) return trimmed;
  let html = renderMarkdown(trimmed);
  if (!html) return "";
  if (!/id="sources-heading"/.test(html)) {
    if (/<h2\b/.test(html)) html = html.replace(/<h2\b([^>]*)>/, '<h2 id="sources-heading"$1>');
    else html = `<h2 id="sources-heading">Sources</h2>\n${html}`;
  }
  return `<section class="sources" aria-labelledby="sources-heading">\n${html}\n</section>`;
}

function headings(html) {
  const found = [];
  const re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = re.exec(html))) {
    const idMatch = match[1].match(/\bid="([^"]+)"/);
    const label = match[2].replace(/<[^>]+>/g, "").trim();
    const id = idMatch ? idMatch[1] : slugify(decode(label));
    if (!id || !label) continue;
    found.push({ id, label });
  }
  return found;
}

function countWords(markdown) {
  const text = String(markdown || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_\[\]()`]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

function authorLink(article) {
  if (!article.author) return "";
  const url = article.authorUrl || (article.author === "Ahmed Zaki" ? "/about/" : "");
  if (!url) return esc(article.author);
  return `<a href="${rel(url)}">${esc(article.author)}</a>`;
}

function byline(article) {
  const bits = [];
  if (article.author) bits.push(`<span class="byline-by">By</span>${authorLink(article)}`);
  bits.push(`<time datetime="${article.date}">${formatDate(article.date)}</time>`);
  bits.push(`<span>${esc(article.reading)}</span>`);
  return `<p class="byline">${bits.join('<span class="sep" aria-hidden="true">·</span>')}</p>`;
}

function authorNote(article) {
  const note = article.authorNote || (article.author ? `${article.author} is a co-founder of TwinzLab.` : "");
  if (!note) return "";
  if (article.author && note.startsWith(article.author) && (article.authorUrl || article.author === "Ahmed Zaki")) {
    const rest = note.slice(article.author.length);
    return `<p class="author-note">${authorLink(article)}${esc(rest)}</p>`;
  }
  return `<p class="author-note">${esc(note)}</p>`;
}

function shareBlock(article) {
  const pageUrl = `${SITE}/lab/${article.slug}/`;
  return SHARE
    .replaceAll("{{PAGE_URL}}", esc(pageUrl))
    .replaceAll("{{LINKEDIN}}", esc(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`))
    .replaceAll("{{TWEET}}", esc(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(article.title)}`));
}

function ctaBlock(article) {
  const label = article.cta || DEFAULT_CTA;
  return `<a class="topic-cta" href="../../contact/#contact-form" data-tz-kind="card">
  <span class="topic-cta__title">${esc(label)}</span>
  <svg class="topic-cta__arrow" viewBox="0 0 24 24" aria-hidden="true" style="--34440n:#eaab78;--fbr8zx:1.5"><use href="#3403169090"></use></svg>
</a>`;
}

function moreLab(article, articles) {
  const others = articles.filter((item) => item.slug !== article.slug);
  if (!others.length) {
    return `<aside class="more-lab" aria-label="More from the Lab">
  <p class="more-lab__label">More from the Lab</p>
  <p class="more-lab__note">More experiments coming soon</p>
  <p class="more-lab__links"><a href="../../lab/">Lab ${ARROW}</a><a href="../../products/">Products ${ARROW}</a></p>
</aside>`;
  }
  const links = others.slice(0, 4).map((item) => `<a href="../${item.slug}/">${esc(item.title)} ${ARROW}</a>`).join("");
  return `<aside class="more-lab" aria-label="More from the Lab">
  <p class="more-lab__label">More from the Lab</p>
  <p class="more-lab__links">${links}<a href="../../lab/">Lab ${ARROW}</a></p>
</aside>`;
}

function navBlock(items) {
  if (!items.length) return "";
  const lis = items.map((item) => `            <li><a href="#${item.id}">${item.label}</a></li>`).join("\n");
  return `        <nav class="section-nav" aria-label="In this article">
          <ol>
${lis}
          </ol>
        </nav>`;
}

function metaBlock(article) {
  const pageUrl = `${SITE}/lab/${article.slug}/`;
  const description = article.description || article.excerpt;
  const image = article.og || article.cover;
  const lines = [
    `<title>${esc(article.title)} — TwinzLab</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${pageUrl}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="TwinzLab">`,
    `<meta property="og:title" content="${esc(article.title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${pageUrl}">`,
  ];
  if (image) {
    lines.push(`<meta property="og:image" content="${abs(image)}">`);
    lines.push(`<meta property="og:image:width" content="1200">`);
    lines.push(`<meta property="og:image:height" content="630">`);
  }
  lines.push(`<meta property="article:published_time" content="${article.date}">`);
  if (article.author) {
    lines.push(`<meta name="author" content="${esc(article.author)}">`);
    lines.push(`<meta property="article:author" content="${esc(article.author)}">`);
  }
  for (const tag of article.tags) lines.push(`<meta property="article:tag" content="${esc(tag)}">`);
  lines.push(`<meta name="twitter:card" content="summary_large_image">`);
  lines.push(`<meta name="twitter:title" content="${esc(article.title)}">`);
  lines.push(`<meta name="twitter:description" content="${esc(description)}">`);
  if (image) lines.push(`<meta name="twitter:image" content="${abs(image)}">`);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
  };
  if (article.author) {
    ld.author = { "@type": "Person", name: article.author };
    const authorUrl = article.authorUrl || (article.author === "Ahmed Zaki" ? "/about/" : "");
    if (authorUrl) ld.author.url = abs(authorUrl.endsWith("/") || authorUrl.startsWith("http") ? authorUrl : `${authorUrl}/`);
  }
  ld.datePublished = article.date;
  ld.publisher = { "@type": "Organization", name: "TwinzLab" };
  if (image) ld.image = abs(image);
  ld.mainEntityOfPage = pageUrl;
  lines.push(`<script type="application/ld+json">\n${JSON.stringify(ld)}\n</script>`);
  return lines.join("\n");
}

function articleHtml(article, articles) {
  const [proseSource, sourcesSource = ""] = article.body.split(/<!--\s*sources\s*-->/i);
  let prose = renderMarkdown(proseSource);
  let sources = sourcesFrom(sourcesSource);
  const pulled = extractSources(prose);
  prose = pulled.prose;
  if (!sources && pulled.sources) sources = pulled.sources;
  const navItems = headings(`${prose}\n${sources}`);
  const hero = article.cover
    ? `        <figure class="hero">\n          <img src="${rel(article.cover)}" width="1600" height="900" alt="${esc(article.coverAlt || "")}">\n        </figure>`
    : "";
  const dek = article.dek || article.excerpt;
  const parts = [
    prose,
    authorNote(article),
    shareBlock(article).trim(),
    ctaBlock(article),
    moreLab(article, articles),
    sources,
    `<p class="back-top"><a href="#top">${ARROW} Back to top</a></p>`,
  ].filter(Boolean);

  return `  <article class="article" id="top">
    <div class="article-body">
      <div class="article-side">
        <p class="kicker"><a href="../../lab/"><svg class="kicker-arrow" viewBox="0 0 24 24" aria-hidden="true" style="--34440n:currentColor;--fbr8zx:1.5"><use href="#3403169090"></use></svg> Lab</a></p>
        <h1>${esc(article.title)}</h1>
${navBlock(navItems)}
      </div>
      <div class="article-main">
        ${byline(article)}
${hero}
        <p class="dek">${esc(dek)}</p>
        <div class="prose">
${parts.join("\n")}
        </div>
      </div>
    </div>
  </article>`;
}

function loadArticles() {
  if (!fs.existsSync(CONTENT_DIR)) return { articles: [], errors: [] };
  const errors = [];
  const articles = [];
  for (const name of fs.readdirSync(CONTENT_DIR)) {
    if (!name.endsWith(".md") || name.startsWith("_") || name.startsWith(".")) continue;
    const slug = name.slice(0, -3);
    const full = path.join(CONTENT_DIR, name);
    const parsed = matter(fs.readFileSync(full, "utf8"));
    const data = parsed.data || {};
    if (data.draft === true) continue;
    const title = String(data.title || "").trim();
    const body = String(parsed.content || "").trim();
    const date = dateISO(data.date);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === "shared") {
      errors.push(`${name}: the filename must be a lowercase slug, like notes-from-the-lab.md`);
      continue;
    }
    if (!title || !body || !date) {
      errors.push(`${name}: needs a title, a date, and a body before it can be published`);
      continue;
    }
    const minutes = Number(data.minutes);
    const readingMinutes = Number.isFinite(minutes) && minutes > 0
      ? Math.round(minutes)
      : Math.max(1, Math.round(countWords(body) / 200));
    articles.push({
      slug,
      title,
      date,
      excerpt: String(data.excerpt || data.description || "").trim(),
      description: String(data.description || data.excerpt || "").trim(),
      dek: String(data.dek || data.excerpt || data.description || "").trim(),
      cover: String(data.cover || "").trim() || FALLBACK_COVER,
      coverAlt: String(data.coverAlt || data.cover_alt || "").trim() || (String(data.cover || "").trim() ? "" : FALLBACK_ALT),
      card: String(data.card || data.cover || "").trim() || FALLBACK_COVER,
      og: String(data.og || data.card || data.cover || "").trim() || FALLBACK_COVER,
      category: String(data.category || "").trim(),
      tags: asList(data.tags),
      author: String(data.author || "").trim(),
      authorUrl: String(data.authorUrl || "").trim(),
      authorNote: String(data.authorNote || "").trim(),
      cta: String(data.cta || "").trim(),
      reading: `${readingMinutes} min read`,
      body,
    });
  }
  articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? -1 : 1));
  return { articles, errors };
}

function writeArticle(article, articles) {
  const dir = path.join(LAB_DIR, article.slug);
  fs.mkdirSync(dir, { recursive: true });
  const meta = metaBlock(article);
  const inner = articleHtml(article, articles);
  let html = TEMPLATE.replace("{{META}}", meta).replace("{{ARTICLE}}", inner);
  if (!html.includes(`<!-- ${MARKER} -->`)) {
    html = html.replace("<head>", `<head><!-- ${MARKER} -->`);
  }
  if (html.includes("{{META}}") || html.includes("{{ARTICLE}}")) {
    throw new Error(`Template placeholders left in ${article.slug}`);
  }
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function removeStale(slugs) {
  for (const name of fs.readdirSync(LAB_DIR)) {
    if (slugs.has(name) || name === "shared") continue;
    const dir = path.join(LAB_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const index = path.join(dir, "index.html");
    if (!fs.existsSync(index)) continue;
    const html = fs.readFileSync(index, "utf8");
    if (html.includes(MARKER)) fs.rmSync(dir, { recursive: true, force: true });
  }
}

function manifest(articles) {
  return articles.map((article) => ({
    title: article.title,
    slug: article.slug,
    date: article.date,
    excerpt: article.excerpt,
    category: article.category,
    tags: article.tags,
    card: rootPath(article.card || article.cover),
    url: `/lab/${article.slug}/`,
  }));
}

function injectManifest(json) {
  const indexPath = path.join(LAB_DIR, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const block = `<!-- tz-lab-articles --><script type="application/json" id="tz-lab-articles">${json}</script><!-- /tz-lab-articles -->`;
  if (html.includes("<!-- tz-lab-articles -->")) {
    html = html.replace(/<!-- tz-lab-articles -->[\s\S]*?<!-- \/tz-lab-articles -->/, block);
  } else if (!html.includes("</head>")) {
    throw new Error("lab/index.html has no </head>, so the article list cannot be added");
  } else {
    html = html.replace("</head>", `${block}</head>`);
  }
  fs.writeFileSync(indexPath, html);
}

function vendorDecap() {
  const srcDir = path.join(root, "node_modules", "decap-cms", "dist");
  const destDir = path.join(root, "admin");
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  const bundled = fs.readdirSync(srcDir).filter((name) => name === "decap-cms.js" || name.endsWith(".decap-cms.js"));
  for (const name of bundled) fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
  for (const name of fs.readdirSync(destDir)) {
    const chunk = name === "decap-cms.js" || name.endsWith(".decap-cms.js");
    if (chunk && !bundled.includes(name)) fs.rmSync(path.join(destDir, name));
  }
  const pkg = path.join(root, "node_modules", "decap-cms", "package.json");
  if (fs.existsSync(pkg)) {
    const version = JSON.parse(fs.readFileSync(pkg, "utf8")).version;
    fs.writeFileSync(path.join(destDir, "VERSION"), `decap-cms@${version}\n`);
  }
}

function writeSitemap(articles) {
  const staticUrls = ["/", "/about/", "/products/", "/contact/", "/lab/"];
  const urls = [
    ...staticUrls.map((loc) => `  <url><loc>${SITE}${loc}</loc></url>`),
    ...articles.map((article) => `  <url><loc>${SITE}/lab/${article.slug}/</loc><lastmod>${article.date}</lastmod></url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
  fs.writeFileSync(
    path.join(root, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`,
  );
}

const { articles, errors } = loadArticles();
if (!articles.length && errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
for (const article of articles) writeArticle(article, articles);
removeStale(new Set(articles.map((article) => article.slug)));
const listed = manifest(articles);
const inline = JSON.stringify(listed).replace(/</g, "\\u003c");
injectManifest(inline);
fs.writeFileSync(path.join(LAB_DIR, "articles.json"), `${JSON.stringify(listed, null, 2)}\n`);
writeSitemap(articles);
vendorDecap();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Published ${articles.length} Lab article${articles.length === 1 ? "" : "s"}.`);
