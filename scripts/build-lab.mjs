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
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DEFAULT_CTA = "Building with AI? Let's compare notes";
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L16 12 L8 19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
      const reveal = depth === 2 ? " data-reveal" : "";
      return `<h${depth} id="${id}"${reveal}>${text}</h${depth}>\n`;
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
    return `\n<h2 id="${id}" data-reveal>${esc(text)}</h2>\n`;
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

function stripSourceArrows(html) {
  return String(html || "")
    .replace(/<span class="sep"[^>]*>\s*(?:·|&#183;|&middot;)\s*<\/span>\s*<a\b[^>]*class="src-back"[^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/<span\b[^>]*aria-hidden=(?:"true"|'true')[^>]*>\s*(?:&#x2197;|&#8599;|&nearr;|[↗↖↘↙←→↑↓↔↕↩↪⤴⤵])\s*<\/span>/gi, "")
    .replace(/(?:&#x2197;|&#8599;|&nearr;|[↗↖↘↙←→↑↓↔↕↩↪⤴⤵])/g, "")
    .replace(/<a\b[^>]*>\s*<\/a>/gi, "");
}

function withReveal(html) {
  return String(html || "").replace(/<h2\b(?![^>]*\bdata-reveal\b)/gi, "<h2 data-reveal");
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
  return `<a class="topic-cta" href="../../contact/#contact-form">
  <span class="topic-cta__title">${esc(label)}</span>
  <svg class="topic-cta__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 L16 12 L8 19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
</a>`;
}

function moreLab(article, articles) {
  const others = articles.filter((item) => item.slug !== article.slug);
  if (!others.length) {
    return `<aside class="more-lab" aria-label="More from the Lab">
  <p class="more-lab__label">More from the Lab</p>
  <p class="more-lab__note">More experiments coming soon</p>
  <p class="more-lab__links"><a href="../../lab/">Lab ${ARROW}</a><a href="../../#coming-soon">Coming soon ${ARROW}</a></p>
</aside>`;
  }
  const links = others.slice(0, 4).map((item) => `<a href="../${item.slug}/">${esc(item.title)} ${ARROW}</a>`).join("");
  return `<aside class="more-lab" aria-label="More from the Lab">
  <p class="more-lab__label">More from the Lab</p>
  <p class="more-lab__links">${links}<a href="../../lab/">Lab ${ARROW}</a></p>
</aside>`;
}

const icon = (d) => `<svg class="pxi" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
const PX = {
  cat: icon("M8.41421 1H1v21h12.5297l-2.6 -2.6 6.9 -6.9H23V5H12.4142L8.41421 1ZM22.0508 17.6V14h-3.6l-5.4 5.4 3.6 3.6 5.4 -5.4Zm-2.5205 -0.0697 1 -1 -1.0606 -1.0606 -1 1 1.0606 1.0606Z"),
  date: icon("M16 3H8V1H6v2H1v4.25h22V3h-5V1h-2v2ZM1 23V8.75h22V23H1Zm4 -8.5h3v-2H5v2Zm3 5H5v-2h3v2Zm2.5 -5h3v-2h-3v2Zm8.5 0h-3v-2h3v2Zm-8.5 5h3v-2h-3v2Z"),
  time: icon("M13 4V1h-2v3h1a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0 -19h1ZM2.207 7.207l4.5 -4.5 -1.414 -1.414 -4.5 4.5 1.414 1.414Zm15.086 -4.5 4.5 4.5 1.414 -1.414 -4.5 -4.5 -1.414 1.414ZM11 8v6h4.5v-2H13V8h-2Z"),
  share: icon("M14.306 7.189a4.25 4.25 0 1 1 0.78 1.842l-5.392 2.28a4.28 4.28 0 0 1 0 1.378l5.391 2.28a4.25 4.25 0 1 1 -0.78 1.842l-5.39 -2.28a4.25 4.25 0 1 1 0 -5.061l5.39 -2.281Z"),
  arrow: '<svg class="pxi" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><rect x="8" y="2" width="2" height="2"/><rect x="10" y="4" width="2" height="2"/><rect x="0" y="6" width="2" height="2"/><rect x="2" y="6" width="2" height="2"/><rect x="4" y="6" width="2" height="2"/><rect x="6" y="6" width="2" height="2"/><rect x="8" y="6" width="2" height="2"/><rect x="10" y="6" width="2" height="2"/><rect x="12" y="6" width="2" height="2"/><rect x="10" y="8" width="2" height="2"/><rect x="8" y="10" width="2" height="2"/></svg>',
};

function readingLabel(article) {
  return String(article.reading || "").replace(/\s*read$/i, "");
}

function tocBlock(items) {
  const lis = items.map((item) => `<li><a href="#${item.id}" data-for="${item.id}">${esc(decode(item.label))}</a></li>`).join("");
  return `<nav class="toc" aria-label="Contents" id="sb-drop"><p class="toc-l">Contents</p><div class="railbox"><div class="rail" aria-hidden="true"></div><ol>${lis}</ol></div></nav>`;
}

function fromLab(article, articles) {
  const others = articles.filter((item) => item.slug !== article.slug);
  const cards = others.length
    ? others.map(labCard).join("")
    : `<p class="body">More notes when there is something real to share.</p>`;
  return `<section class="lab"><div class="wrap">
 <div class="lab-head"><h2 data-reveal>From the Lab <span class="sub">Notes from the work.</span></h2><a class="tl" href="../../lab/">Read all notes</a></div>
 <div class="prgrid">${cards}</div>
</div></section>`;
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
  sources = stripSourceArrows(sources);
  const navItems = headings(prose).filter((item) => item.id !== "sources-heading");
  const intro = article.dek || article.excerpt || article.description;
  const cover = article.card || article.cover;
  const coverAlt = article.coverAlt || "";
  const category = article.category || "Lab";
  const pageUrl = `${SITE}/lab/${article.slug}/`;
  const coverFig = cover
    ? `<figure class="acover"><img src="${rel(cover)}" width="1600" height="900" alt="${esc(coverAlt)}"></figure>`
    : "";
  const proseParts = [withReveal(prose), authorNote(article), withReveal(sources)].filter(Boolean).join("\n");

  return `<article class="art" id="top">
<header class="ahero wrap"><div class="agrid">
 <div class="ahero-main" data-enter>
  <h1 class="e2" data-reveal>${esc(article.title)}</h1>
  <p class="adek e3" data-reveal data-reveal-delay="150">${esc(intro)}</p>
 </div>
 <ul class="ameta" data-enter>
  <li class="e3">${PX.cat}<span class="ml">Category</span><a class="mv" href="../../lab/">${esc(category)}</a></li>
  <li class="e3">${PX.date}<span class="ml">Date</span><span class="mv"><time datetime="${esc(article.date)}">${esc(longDate(article.date))}</time></span></li>
  <li class="e3">${PX.time}<span class="ml">Reading time</span><span class="mv">${esc(readingLabel(article))}</span></li>
  <li class="e3">${PX.share}<span class="ml">Share</span><button class="mv copy" type="button" data-url="${esc(pageUrl)}">Copy link</button><span class="sr" role="status" aria-live="polite"></span></li>
 </ul>
</div></header>
<div class="abody wrap"><div class="agrid">
 ${coverFig}
 ${tocBlock(navItems)}
 <div class="prose">
${proseParts}
 </div>
</div></div>
<div class="wrap notes-signup" id="lab-notes"><aside class="tz-signup-host" data-tz-signup="lab-notes" aria-label="Lab Notes"></aside></div>
</article>
${fromLab(article, articles)}`;
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
    reading: article.reading,
  }));
}

function longDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])} ${MONTHS_LONG[Number(match[2]) - 1]} ${match[1]}`;
}

function labCard(article, index) {
  const blurb = article.excerpt || article.description;
  const delay = index % 2 ? " d1" : "";
  return `<a class="card pr rv${delay}" href="/lab/${article.slug}/"><div class="frame pcv"><img src="${esc(rootPath(article.card))}" alt=""></div>
 <div class="ptx"><div><h3>${esc(article.title)}</h3><p class="meta">${esc(longDate(article.date))} · ${esc(article.reading)}</p></div><p class="body">${esc(blurb)}</p></div></a>`;
}

function labFeature(article) {
  if (!article) return `<p class="lead">More notes when there is something real to share.</p>`;
  const lead = article.description || article.excerpt;
  return `<a class="card pf e4" href="/lab/${article.slug}/">
  <div class="pft"><div><h2>${esc(article.title)}</h2><p class="meta">${esc(longDate(article.date))} · ${esc(article.reading)}</p></div><div><p class="lead">${esc(lead)}</p><p style="margin-top:24px"><span class="tl">Read the note</span></p></div></div>
  <div class="frame pcv"><img src="${esc(rootPath(article.card))}" alt=""></div></a>`;
}

function fillRegion(file, start, end, inner) {
  const html = fs.readFileSync(file, "utf8");
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(html)) throw new Error(`${file} is missing ${start}`);
  fs.writeFileSync(file, html.replace(pattern, `${start}\n${inner}\n${end}`));
}

function injectCards(articles) {
  const cards = articles.length
    ? articles.map(labCard).join("")
    : `<p class="body">More notes when there is something real to share.</p>`;
  fillRegion(path.join(root, "index.html"), "<!-- tz-home-cards -->", "<!-- /tz-home-cards -->", cards);
  fillRegion(path.join(LAB_DIR, "index.html"), "<!-- tz-lab-feature -->", "<!-- /tz-lab-feature -->", labFeature(articles[0]));
  fillRegion(path.join(LAB_DIR, "index.html"), "<!-- tz-lab-cards -->", "<!-- /tz-lab-cards -->", cards);
}

function injectManifest(json) {
  const block = `<!-- tz-lab-articles --><script type="application/json" id="tz-lab-articles">${json}</script><!-- /tz-lab-articles -->`;
  for (const indexPath of [path.join(LAB_DIR, "index.html"), path.join(root, "index.html")]) {
    let html = fs.readFileSync(indexPath, "utf8");
    if (html.includes("<!-- tz-lab-articles -->")) {
      html = html.replace(/<!-- tz-lab-articles -->[\s\S]*?<!-- \/tz-lab-articles -->/, block);
    } else if (!html.includes("</head>")) {
      throw new Error(`${indexPath} has no </head>, so the article list cannot be added`);
    } else {
      html = html.replace("</head>", `${block}</head>`);
    }
    fs.writeFileSync(indexPath, html);
  }
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
  const staticUrls = ["/", "/about/", "/contact/", "/lab/"];
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
injectCards(articles);
fs.writeFileSync(path.join(LAB_DIR, "articles.json"), `${JSON.stringify(listed, null, 2)}\n`);
writeSitemap(articles);
vendorDecap();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Published ${articles.length} Lab article${articles.length === 1 ? "" : "s"}.`);
