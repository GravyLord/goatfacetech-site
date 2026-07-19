# Publishing to the blog

1. Write your post as Markdown in `blog/posts/` — the filename is the URL slug (`my-post.md` → `/blog/my-post`).
2. Add frontmatter at the top: `title`, `date` (YYYY-MM-DD), `description`, and optional `og-image` (a filename in `blog/images/`, or a full URL).
3. Put images in `blog/images/` and reference them in Markdown as `![alt](my-image.png)` — they're made responsive automatically.
4. Commit and push — Cloudflare Pages runs the build; your post goes live (newest first on `/blog/`).
5. Change the design once in `blog/templates/post.html` or `index.html` (styles in `blog/blog.css`); every post re-renders.
