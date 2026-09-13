# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Website for **Lior Robas Law Firm & Notary** (משרד עורכי דין ונוטריון ליאור רובס).
- Domain: robas-law.co.il
- Hosting: Cloudflare Pages
- Office: הגביש 4, בית טיטניום, קומה א', נתניה (Gavish 4, "Titanium Building", Floor 1, Netanya)
- Phone: 09-8612894 | Fax: 073-2758870 | Email: office@robas-law.co.il
- WhatsApp: **052-975-7798** — a separate mobile line, NOT the office landline (`wa.me/972529757798`)
- Hours: Sun–Thu, 9:00–18:00
- Facebook: facebook.com/1432093250415826

## ⚠️ The HTML in `robas-law-website/` is generated

Never hand-edit `robas-law-website/*.html` — `node build.js` overwrites them.

| To change | Edit | Then |
|-----------|------|------|
| Contact details, nav menu, client list | `site-src/data/site.json` | `node build.js` |
| Notable cases (תיקים בולטים) | `site-src/data/cases.json` | `node build.js` |
| Nav / footer / mobile menu / FAB markup | `site-src/partials/*.html` | `node build.js` |
| A page's content | `site-src/pages/<page>.html` | `node build.js` |
| Styling | `robas-law-website/css/style.css` | edit in place, then `node build.js` to refresh the cache-busting hash |
| Behaviour | `robas-law-website/js/main.js` | same as above |

`build.js` has no dependencies and exits non-zero on a bad front-matter block or an
unknown `{{token}}`. Always run it before considering a change finished.

**Ask before running the build** only if the user wants to drive it themselves;
otherwise `node build.js` is safe and fast.

## Tech Stack

- Vanilla HTML/CSS/JS. One ~90-line Node build script, no npm dependencies.
- RTL Hebrew (`lang="he" dir="rtl"`), applied once in `site-src/partials/layout.html`.
- Fonts: **Assistant** (all Hebrew, weights 200–600), **Jost** (Latin wordmark and
  numerals only). Frank Ruhl Libre and Noto Sans Hebrew were removed in the 2026 redesign.
- Contact form backend: Cloudflare Pages Function (`functions/api/contact.js`, Mailgun).

## Design system

The palette is **sampled from photographs of the actual office**, not invented:

| Token | Value | Source |
|-------|-------|--------|
| `--ink` | `#161719` | reception desk, door frames, signage lettering |
| `--paper` | `#F4F2EE` | the walls |
| `--oak` | `#C69A5F` | the floor and desk top |
| `--ochre` | `#D3B14E` | the two armchairs |
| `--slate` | `#6E8B92` | the sea triptych above the desk |

All tokens are CSS custom properties in `:root` at the top of `css/style.css`.

### Rules that keep it from drifting back to a template look

1. **No emoji, and no icon grids.** Services are a numbered typographic index
   (`01`–`06`, title, one line, hairline rule). If you are reaching for an icon set,
   reconsider the layout instead.
2. **No photographs of the lawyers — ever.** There are none and there will be none.
   The team is a typographic roster (`.roster`). Never substitute stock portraits.
3. **Photography is licensed, architectural, and used as full-bleed bands.** The firm's
   own photographs come first. Beyond those, only Unsplash-licensed images (free for
   commercial use) are permitted, and only as `.band-photo` breaks between sections —
   never as decorative cards, never people in suits, never gavels or scales. Every image
   is downloaded into `assets/photos/`, graded to 55% saturation for a single consistent
   look, and its provenance recorded in `site-src/data/photo-credits.json`. Never
   hotlink, and never use an image whose licence you have not checked.
4. **No invented numbers, testimonials, or bylines.** Every statistic and every quote
   must be traceable to the firm's own material. A testimonial without a real name is
   not published.
5. **Motion is an accent, not a default.** One 12px fade-up per element, once, plus the
   hero crossfade and the photo-band parallax. Everything respects
   `prefers-reduced-motion`.
6. **Flat surfaces.** Hairline borders (`--line`), no rounded cards, no drop shadows,
   no gradients. Section separation comes from `--white` / `--paper` alternation.

### Component vocabulary

`.index-list`/`.index-row` (numbered services) · `.roster` (team) · `.clients__grid`
(logo wall) · `.quotes`/`.quote-item` (testimonials) · `.band-photo` (full-bleed
parallax) · `.content-page` (long-form prose) · `.detail-list` (label/value pairs) ·
`.page-header` (inner-page banner) · `.callout`.

Legacy class names from the pre-redesign build (`.service-card`, `.team-card`,
`.testimonial-card`, `.section--cream`, `.section--navy`, `.btn--primary`…) are still
**aliased** in the stylesheet so older page bodies render correctly. Prefer the new
vocabulary for anything you write.

## Pages

| File | Hebrew title |
|------|-------------|
| `index.html` | ראשי |
| `about.html` | המשרד |
| `lior.html` | עליי |
| `practice-areas.html` | תחומי התמחות |
| `notable-cases.html` | תיקים בולטים |
| `clients.html` | לקוחות |
| `real-estate.html` | ליווי עסקאות נדל״ן |
| `commercial.html` | ייצוג חברות מסחריות |
| `notary.html` | שירותי נוטריון |
| `power-of-attorney.html` | ייפוי כוח מתמשך — איך זה עובד? |
| `poa-guide.html` | המדריך המלא |
| `poa-forms.html` | טפסים והגשה |
| `poa-medical.html` | ייפוי כוח רפואי |
| `house-rules.html` | חוקי הבית |
| `contact.html` | צור קשר |
| `privacy.html` | הצהרת פרטיות |

The old WordPress site had **eight** ייפוי־כוח־מתמשך pages; they are consolidated into
four here, with 301s from all eight in `_redirects`.

## Notable cases (תיקים בולטים)

Entries live in `site-src/data/cases.json` and render on `notable-cases.html`; those
marked `"featured": true` also appear in a shorter form on the homepage.

**Publishing rules — these are not stylistic:**

- Only publish a case that is verifiable from the judgment itself, or from material the
  firm has already published publicly.
- **Never state an outcome a source does not state.** "The firm appeared as counsel" is
  not "the firm won". If the outcome is unclear, leave the case out.
- Prefer the firm's own wording when describing what the court held.
- Case numbers, dates, party names and the bench must be copied exactly, not recalled.
- The disclaimer at the bottom of `notable-cases.html` stays. It notes that a result in
  one case does not promise a result in another — relevant both to accuracy and to the
  Bar's advertising rules (כללי לשכת עורכי הדין (פרסומת), התשס"א-2001). Lior should sign
  off on anything added here.

## Caching

`_headers` marks `/css/*`, `/js/*` and `/assets/*` immutable for a year. `build.js`
therefore appends a content hash to the stylesheet and script URLs. **Do not remove the
`?v={{CSS_V}}` / `?v={{JS_V}}` query strings from `layout.html`** — without them a CSS
change would not reach anyone who has visited before.

## Local preview

```bash
node build.js && cd robas-law-website && python3 -m http.server 8899
```

Use `npx wrangler pages dev robas-law-website/` when testing the contact form, since
plain HTTP has no `/api/contact` route.

## Deployment

```bash
node build.js
npx wrangler pages deploy robas-law-website/
```

Asset directory is `robas-law-website/`. Build output is committed, so Cloudflare needs
no build command configured.

## Live site caveat

`robas-law.co.il` is still the old WordPress install and, as of September 2026, is
serving **injected SEO spam** (casino paragraphs with outbound links) inside its
homepage content. When pulling reference content from the live site, read it
critically — do not copy it wholesale.

## Historical note

The pre-2026 build duplicated the nav, mobile menu, footer, contact band and FAB across
all 13 HTML files, with 45–61 inline `style` attributes per page. A note in this file
used to claim that CSS custom properties "don't resolve in production" and recommended
hardcoding hex values. That diagnosis was wrong — `var()` works fine; the original
symptom was almost certainly a CSS parse error earlier in the file swallowing the rules
that followed it. Do not reintroduce hardcoded hex fallbacks.
