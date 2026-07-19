# Goatface Tech — design standards

## Readability (standing standard — all Goatface properties)

_Adopted 2026-07-19. Applies to every Goatface property: the marketing site, the blog,
and reading surfaces in the products._

Dark theme stays — but **text is never low-contrast grey on black.**

- **Body/reading text is near-white** (`#e6eaf0`-class), not grey. Muted greys
  (`#4a6070`) are for **hairlines and borders only — never text.**
- **Essay/reading body: 18px with a comfortable line-height (~1.75).**
- **Small letterspaced labels** (FIELD NOTES, DRAFT, READ →, eyebrows, byline, footer)
  keep the brand's decorative mono style, but are **sized up** (≥ ~0.7rem) and
  **high-contrast** (bright `#00e676` or light `#b4bec9`). Decorative text still has to
  be legible.
- **WCAG AA (4.5:1) minimum on every text element**, against the actual background.
  Verify new colours before shipping.
- **The blog is where people read — it must be the most legible page we own.**

Reference implementation: `blog/blog.css` (tokens `--ink`, `--ink-2`, `--green`).

**TODO:** the marketing site (`index.html`) still uses the older low-contrast greys for
some body/label text — bring it up to this standard in a follow-up pass.
