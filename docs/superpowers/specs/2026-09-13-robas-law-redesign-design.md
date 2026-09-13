# Robas Law — redesign around the firm's real identity

**Date:** 2026-09-13
**Status:** implemented

## Problem

The v2 site was structurally sound — 13 pages, real Hebrew content from the live site,
a working contact endpoint — but it read as machine-generated, and its content had
drifted from the firm's own material.

### What made it read as generated

| Tell | Where |
|---|---|
| Emoji as service icons (🏠 🏢 📜 📋 ⚖️ 🏦) | homepage + practice-areas (16 of them) |
| Four stock photos of strangers presented as the firm's lawyers | index, about |
| Invented statistic "100+ חברות ולקוחות" with a counting animation | index, lior |
| Everything a card in a 3-column grid | every page, same rhythm |
| Navy→burgundy 135° gradient CTA banner | every page |
| Letter-circle avatars and oversized quote marks | testimonials |
| A testimonial attributed to "לקוחה מרוצה" | index, clients |
| Scroll-reveal applied uniformly to all 36 elements | every page |
| Placeholder LinkedIn link pointing at `linkedin.com` | footer, all pages |

### Maintainability

Nav, mobile menu, footer, contact band and FAB were copy-pasted into all 13 files, with
45–61 inline `style` attributes each. A menu change meant 13 hand edits. `CLAUDE.md`
recorded a false diagnosis ("CSS variables don't resolve in production — hardcode hex"),
leaving the codebase with a confusing mix of both.

### Content gaps against robas-law.co.il

- The live homepage's **בין לקוחותינו** logo strip (12 institutional clients) was absent.
- **ההתחייבות שלנו** ("אנחנו לא ששים אלי קרב…") was absent.
- Concrete real-estate specifics — תמ״א 38, פינוי־בינוי, קבוצות רכישה, עסקאות
  קומבינציה, הסכמי שיתוף — were absent.
- The live site's eight ייפוי־כוח־מתמשך pages were represented by two.
- Nav said "אודות ליאור"; the live site says "עליי".

## Decisions

Each was put to the user and chosen explicitly.

### 1. Identity: match the real office

The palette is sampled from two photographs of the office rather than chosen from a
"law firm colours" idea. Navy/gold/burgundy retired.

| Token | Value | Sampled from |
|---|---|---|
| `--ink` | `#161719` | reception desk, door frames, signage lettering |
| `--paper` | `#F4F2EE` | the walls |
| `--oak` | `#C69A5F` | floor and desk top |
| `--ochre` | `#D3B14E` | the two armchairs |
| `--slate` | `#6E8B92` | the sea triptych above the desk |

### 2. Typography: follow the signage

Assistant (200–600) for all Hebrew, one voice throughout; Jost for the Latin
`LIOR ROBAS / LAW FIRM & NOTARY` lockup and for numerals. Frank Ruhl Libre — the default
Hebrew law-firm serif — is dropped.

### 3. Icons: removed rather than restyled

Services become a numbered typographic index (`01`–`06`, title, one line of copy,
hairline rule). Replacing emoji with line icons would have kept the icon-grid cliché;
removing the icon row removes it.

### 4. Team: photo-free as the final design

There are no photographs of the lawyers and there will be none. The roster is
typographic — name in large light type, role in tracked small caps, bio, hairline
separators. This is the intended end state, not a placeholder.

### 5. Motion: crossfade hero, parallax band, nothing else

Hero cycles the office photographs, ~7s hold, 1.6s crossfade, slow 4% drift. One
full-bleed photo band mid-homepage scrolls at 0.85×. The blanket 36-element reveal is
replaced by a single 12px fade-up, fired once. All of it is disabled under
`prefers-reduced-motion`.

Considered and rejected: a continuously scrolling marquee (restless on a law firm site),
and a pinned photo with content scrolling over it (heavy on mobile, fights RTL flow).

### 6. Build: partials assembled by a dependency-free script

```
site-src/{data,partials,pages}  →  build.js  →  robas-law-website/
```

Output stays committed at the existing asset directory, so the deploy flow is unchanged
and Cloudflare needs no build command. `site.json` is the single source for contact
details, the nav tree and the client list.

Considered and rejected: leaving the duplication and only centralising CSS (leaves the
nav hazard); injecting chrome with JS at runtime (empty nav on first crawl — bad for a
firm that wants to rank locally).

### 7. Content

- **Client logos recovered.** The old site published them as four sprite PNGs with
  dividers baked in. Split programmatically (gap–bar–gap separator detection), edge
  fragments removed, two logos drawn white-on-transparent re-rendered as ink
  silhouettes. Twelve usable logos: בנק הפועלים, הבנק הבינלאומי, פאג״י, שירביט,
  Manpower, Kaymera, הינומה מוטורס, אופק מערכות, אובזוטק, שיווק המאה, MISS N.R.G,
  מידע שיווקי סי.איי.
- **ההתחייבות שלנו** and the real-estate specifics added.
- **ייפוי כוח מתמשך: eight pages → four** (איך זה עובד / המדריך המלא / טפסים והגשה /
  ייפוי כוח רפואי), with 301s from all eight legacy URLs. Eight near-duplicate pages is
  itself a content-farm signal.
- **Fabrications removed**: the "100+" stat and its counter, the "לקוחה מרוצה"
  testimonial, the placeholder LinkedIn link. Copyright back to 2019.
- Nav renamed to **עליי** to match the live site.

## Incidental fixes

- `_headers` caches `/css/*` and `/js/*` immutable for a year while the URLs were
  static — a stylesheet change would never have reached a returning visitor. `build.js`
  now appends a content hash (`style.css?v=0c240db0`).
- The contact page's Google Maps embed used a fabricated place ID; replaced with a
  query-based embed. The page gained the firm's full contact details, which it lacked.
- `functions/api/contact.js` fell back to `lior@robas-law.co.il`; the firm's address is
  `office@robas-law.co.il`.
- `_redirects` gained the two percent-encoded Hebrew legacy URLs, `/author/robas-law/`,
  and catch-alls for `/wp-content/*`, `/wp-admin/*`, `/feed/`, `/category/*`, `/tag/*`.
- Missing hero/band photographs are removed from the DOM on error, so the hero degrades
  to a plain ink panel rather than showing broken-image icons.

## Known limitations

- **The two office photographs are not in the repo yet.** They belong at
  `assets/photos/office-reception.jpg` and `assets/photos/office-entrance.jpg`. Until
  they are added, the hero renders as flat ink and the mid-page photo band is empty.
- Client logos are only ~140px tall — recovered from low-resolution sprites. Adequate at
  render size; better source files would improve them.
- The live WordPress site is serving injected SEO spam (casino paragraphs with outbound
  links) in its homepage content. Out of scope here, but Lior should be told.
