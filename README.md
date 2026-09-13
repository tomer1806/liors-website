# Robas Law — Website

Website for **משרד עורכי דין ונוטריון ליאור רובס** (Lior Robas Law Firm & Notary), Netanya.
Vanilla HTML/CSS/JS, Hebrew RTL, deployed on Cloudflare Pages.

---

## How this repo is laid out

```
site-src/                     ← EDIT HERE
├── data/site.json            phone, fax, email, address, hours, nav tree, client list
├── data/cases.json           תיקים בולטים — notable cases
├── partials/                 layout, nav, mobile-menu, contact-band, footer, fab
└── pages/                    per-page content only (front-matter + body)

build.js                      assembles site-src → robas-law-website (no dependencies)

robas-law-website/            ← BUILD OUTPUT, committed, what Cloudflare serves
├── *.html                    15 generated pages — do not hand-edit, they get overwritten
├── css/style.css             the design system (hand-written, edit directly)
├── js/main.js                site behaviour (hand-written, edit directly)
├── assets/                   logos (SVG), client logos (PNG), photos
├── functions/api/contact.js  Cloudflare Pages Function for the contact form
├── _headers                  security headers + caching
└── _redirects                301s from every legacy WordPress URL
```

**The HTML files in `robas-law-website/` are generated.** Editing them directly works
until the next build, then your change is gone. Edit `site-src/` and rebuild.

`css/style.css` and `js/main.js` are *not* generated — edit those in place.

---

## Building

```bash
node build.js
```

That's it — no npm install, no dependencies. It prints `Built 15 pages` and fails
loudly (non-zero exit) if a page has broken front-matter or an unknown `{{token}}`.

The output is committed to the repo, so **Cloudflare needs no build step of its own**
and `wrangler` keeps working exactly as before. Just remember to run the build before
you commit.

### Local preview

```bash
cd robas-law-website && python3 -m http.server 8899
```

Then open http://localhost:8899. For the contact form, use
`npx wrangler pages dev robas-law-website/` instead — plain HTTP has no `/api/contact`.

---

## Common edits

### Phone, email, address, hours, fax
One place: `site-src/data/site.json`. Rebuild. Every page updates.

### Menu links
`site-src/data/site.json` → the `nav` array. Dropdowns are the nested `children`
arrays. The mobile menu, desktop nav and active-link highlighting are all generated
from it, so there is nothing to keep in sync by hand.

### Page text
`site-src/pages/<page>.html`. Each starts with a front-matter block:

```html
<!--@ {
  "title": "...",              page <title> and og:title
  "description": "...",        meta description and og:description
  "nav": "about.html",         which nav link to mark active
  "transparentNav": true       optional — nav sits over the hero (homepage only)
} @-->
```

### Adding a notable case
Append an entry to `site-src/data/cases.json` and rebuild. `"featured": true` also puts
it on the homepage. Only publish what the judgment or the firm's own published material
actually states — never an outcome you inferred.

### Colours and type
CSS custom properties in `:root` at the top of `robas-law-website/css/style.css`.
The palette is sampled from the office photographs — ink, paper, oak, ochre, slate.

### Adding a page
1. Create `site-src/pages/new-page.html` with a front-matter block.
2. Add it to `nav` (and/or `footerServices` / `footerOffice`) in `site.json`.
3. `node build.js`.

---

## Photographs

Real photographs of the office live in `robas-law-website/assets/photos/`:

| File | Used by |
|------|---------|
| `office-reception.jpg` | homepage hero (slide 1) and the mid-page photo band |
| `office-entrance.jpg`  | homepage hero (slide 2) |

If a file is missing, `js/main.js` removes the broken image and the hero degrades to a
plain ink panel — no broken-image icon — but the site is much better with them there.

**There are deliberately no photographs of the lawyers.** The team is presented as a
typographic roster. Do not add stock portraits.

---

## Client logos

`assets/clients/*.png`, listed in `site.json` under `clients`. They were recovered from
the sprite strips on the old WordPress site, so they are only ~140px tall — good enough
at the size they render, but if better files turn up, drop them in with the same
filenames. They render monochrome and return to full colour on hover.

---

## Deployment

Cloudflare Pages, asset directory `robas-law-website/`.

```bash
node build.js
npx wrangler pages deploy robas-law-website/
```

`_headers` caches `/css/*`, `/js/*` and `/assets/*` as immutable for a year, so
`build.js` appends a content hash to the stylesheet and script URLs
(`style.css?v=0c240db0`). Change the file, the URL changes, visitors get the new one.

`_redirects` maps every URL the old WordPress site published — including the eight
ייפוי־כוח־מתמשך pages, which are now four — so nothing that is currently indexed 404s.

---

## Note on the current live site

`robas-law.co.il` is still the old WordPress install, and as of September 2026 it is
serving injected SEO spam (casino paragraphs with outbound links) inside its homepage
content. That is a compromise of the WordPress site, not of this project. Worth telling
Lior regardless — and a reason not to copy content from it wholesale.
