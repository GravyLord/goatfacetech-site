#!/usr/bin/env node
/* Goatface Tech blog build — tiny static renderer (no framework).
 * Reads blog/posts/*.md (frontmatter: title, date, description, og-image),
 * renders through blog/templates/{post,index}.html, and writes the WHOLE site to
 * _site/ (static passthrough + generated blog). Cloudflare Pages runs this as its
 * build command with output dir _site. Layout changes = edit the templates once. */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const BLOG = __dirname;
const ROOT = path.join(BLOG, "..");
const OUT = path.join(ROOT, "_site");
const SITE = "https://goatfacetech.com";
const DEFAULT_OG = SITE + "/logo.png";

// Root entries NOT copied to _site (build/dev files + the blog dir, handled below).
const BLOCK = new Set([
  "node_modules", ".git", "_site", ".claude", "package.json", "package-lock.json",
  ".node-version", ".gitignore", "index.html.backup", "blog",
]);

const read = (p) => fs.readFileSync(p, "utf8");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fill = (t, v) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in v ? v[k] : ""));

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// ── fresh output ─────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1) static passthrough (everything at repo root except BLOCK)
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (BLOCK.has(e.name)) continue;
  const s = path.join(ROOT, e.name), d = path.join(OUT, e.name);
  if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
}

// 2) blog assets: stylesheet + images/
fs.mkdirSync(path.join(OUT, "blog"), { recursive: true });
fs.copyFileSync(path.join(BLOG, "blog.css"), path.join(OUT, "blog", "blog.css"));
if (fs.existsSync(path.join(BLOG, "images"))) copyDir(path.join(BLOG, "images"), path.join(OUT, "blog", "images"));

// 3) parse + render posts
const postsDir = path.join(BLOG, "posts");
const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")) : [];

const posts = files.map((file) => {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = matter(read(path.join(postsDir, file)));
  let html = marked.parse(content);
  // bare image refs -> /blog/images/<name>; all images lazy + responsive (via CSS)
  html = html.replace(/<img([^>]*?)src="(?!https?:|\/)([^"]+)"/g, '<img$1src="/blog/images/$2"');
  html = html.replace(/<img /g, '<img loading="lazy" ');
  const dateObj = data.date ? new Date(data.date) : null;
  const words = content.split(/\s+/).filter(Boolean).length;
  const ogRaw = data["og-image"] ? String(data["og-image"]).trim() : "";
  const ogImage = !ogRaw ? DEFAULT_OG : (/^https?:/.test(ogRaw) ? ogRaw : `${SITE}/blog/images/${ogRaw}`);
  return {
    slug,
    title: data.title || "Untitled",
    description: data.description || "",
    url: `${SITE}/blog/${slug}`,
    ogImage,
    dateObj,
    dateHuman: dateObj ? dateObj.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "",
    dateIso: dateObj ? dateObj.toISOString().slice(0, 10) : "",
    reading: `${Math.max(1, Math.round(words / 200))} min read`,
    html,
  };
});

// newest first
posts.sort((a, b) => (b.dateObj?.getTime() || 0) - (a.dateObj?.getTime() || 0));

const postTpl = read(path.join(BLOG, "templates", "post.html"));
for (const p of posts) {
  const out = fill(postTpl, {
    TITLE: esc(p.title), DESCRIPTION: esc(p.description), OG_IMAGE: p.ogImage,
    URL: p.url, DATE_HUMAN: esc(p.dateHuman), DATE_ISO: p.dateIso,
    READING: esc(p.reading), CONTENT: p.html,
  });
  // Flat file: Cloudflare Pages strips `.html`, serving it at the clean, no-trailing-
  // slash URL /blog/<slug> — matching the canonical/og:url the template emits.
  fs.writeFileSync(path.join(OUT, "blog", p.slug + ".html"), out);
}

// 4) index (newest first: title + date + description)
const items = posts.map((p) => `      <a class="post-item" href="/blog/${p.slug}">
        <p class="post-meta">${esc(p.dateHuman)}</p>
        <h2>${esc(p.title)}</h2>
        <p class="excerpt">${esc(p.description)}</p>
        <span class="more">Read →</span>
      </a>`).join("\n");
const indexTpl = read(path.join(BLOG, "templates", "index.html"));
fs.writeFileSync(path.join(OUT, "blog", "index.html"), fill(indexTpl, { POSTS: items || '      <p class="excerpt">No posts yet.</p>' }));

console.log(`blog build: ${posts.length} post(s) -> _site/blog/  (` + posts.map((p) => p.slug).join(", ") + ")");
