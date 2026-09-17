# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Website for **Lior Robas Law Firm & Notary** (משרד עורכי דין ונוטריון ליאור רובס).
- Domain: robas-law.co.il
- Hosting: Cloudflare Pages
- Office: שד׳ טום לנטוס 8, בית אופל, קומה חמישית, נתניה (Tom Lantos Blvd 8, "Opal House", 5th floor, Netanya)
  - The firm has moved more than once: קראוזה 3 (to ~2019) → הגביש 4, בית טיטניום → the current address.
  - Every form of the address lives in `site.json` (`address`, `addressShort`, `addressStreet`,
    `addressCity`, `mapQuery`). The footer, hero, contact band, contact page, schema.org
    JSON-LD and the Google Maps embed are all generated from those. Never hardcode it again.
- Phone: 09-8612894 | Fax: 09-8623299 | Email: office@robas-law.co.il
- WhatsApp: **052-975-7798** — a separate mobile line, NOT the office landline (`wa.me/972529757798`)
- Hours: Sun–Thu, 9:00–18:00
- Facebook: facebook.com/1432093250415826

## ⚠️ The HTML in `robas-law-website/` is generated

Never hand-edit `robas-law-website/*.html` — `node build.js` overwrites them.

| To change | Edit | Then |
|-----------|------|------|
| Contact details, nav menu, clients | `site-src/data/site.json` | `node build.js` |
| Notable cases (תיקים בולטים) | `site-src/data/cases.json` | `node build.js` |
| Nav / footer / mobile menu / FAB markup | `site-src/partials/*.html` | `node build.js` |
| A page's content | `site-src/pages/<page>.html` | `node build.js` |
| Styling | `robas-law-website/css/style.css` | edit in place, then `node build.js` to refresh the cache-busting hash |
| Behaviour | `robas-law-website/js/main.js` | same as above |
| Security headers / CSP | `site-src/_headers` | `node build.js` |

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

## Clients

Both client lists come from the single `clients` array in `site.json`:

- the **logo wall** (`.clients__grid`, on `index.html` and `clients.html`) shows only
  entries that have a `slug`, meaning `assets/clients/<slug>.png` exists;
- the **full roll-call** on `clients.html` shows every entry, logo or not.

Until September 2026 the roll-call was hardcoded in `clients.html` and had already
drifted from the logo list: the same client appeared as `אופק מערכות` in one and
`אופק מחשבים` in the other, and as `אובזוטק אקוסטיקה` / `אוזבטק חיפויים וגימורים`.
Do not reintroduce a second list. `build.js` fails if a `slug` has no matching PNG.

Six logos were sourced from the clients' own websites in September 2026; their source
URLs, company numbers and confidence levels are recorded in `photo-credits.json` under
`clientLogos`. **These are third-party trademarks** — the basis for showing them is the
firm's client relationship, so confirm with the client before adding another. Two watch-outs
that cost real time: several companies serve a **white-knockout** logo in their own dark
header (invisible on the white cell — take the dark variant), and Israeli company names are
often written loosely, so match on ח.פ before trusting a name.

Logos may be `.svg` or `.png`; `build.js` prefers SVG, reads each file's real intrinsic
size and emits it on the `<img>`, so the grid does not shift as images load.

The two grids draw their hairlines **per cell** (`box-shadow: 0 0 0 1px var(--line)`)
rather than by letting a `--line` background show through 1px gaps. The list changes
often and rarely divides evenly into 4 or 3 columns; the old approach rendered the
leftover area of the last row as a solid grey block.

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

## Verified facts about the lawyers (researched Sept 2026)

Taken from the **Israel Bar Association member register** (israelbar.biz), matched to the
firm by its phone number **09-8612894**. Do not replace these with numbers from the
firm's old marketing copy, which was frozen in 2019 and is wrong in places.

| Lawyer | Register name | Admitted | On the site |
|--------|---------------|----------|-------------|
| ליאור רובס | **אליאור רובס** (registry) / ליאור רובס (judgments) | **10/06/2004** | computed from `careerStartYear` |
| שמואל שפיגלר | שמואל שפיגלר | **30/06/1975** | computed from `shpiglerAdmissionYear` |
| אוליביה ד. אורנשטיין | אוליביה דוי אורנשטיין | **15/06/2006** | fixed year in the copy |
| אורן אברהם | **could not be matched** | unknown | no seniority claim — see below |

- Lior is listed in the Bar's open dataset as **מוסמך ייפוי כוח מתמשך**, which supports
  the claim made on the POA pages.
- The old copy said Lior had "17 years in the field, 15 of them as an active attorney".
  The register shows he was admitted in 2004, so the two-number split was wrong and has
  been replaced with one figure.

### Case research — already done, September 2026. Do not redo it.

Seven research passes covered the Supreme Court exhaustively and all eight District
courts, for all four lawyers, 2021–2026. **Result: exactly one publishable case**, the
one already on `notable-cases.html`. Before spending effort here again, read this:

- **Free sources that work:** `judgments.org.il` (full text, indexes counsel lines,
  `?s=<term>&type=judgment&paged=N`), `israelbar.biz` (Bar register, plain URLs),
  `takdin.co.il` free search-results pages, `he.afiklaw.com`, `toledano.co.il`.
- **Blocked or useless:** court.gov.il and supremedecisions.court.gov.il (bot-blocked),
  Google/Bing/DuckDuckGo (CAPTCHA), Nevo and Takdin full documents (paywalled),
  `psika.net` (now a sports-betting site), `psakdin.co.il` lawyer pages (a generic press
  feed — its articles often carry `הכותב לא ייצג בתיק`; never cite them as wins).
- **judgments.org.il gotchas:** its search is **contiguous-phrase, not AND**; it does not
  normalise `"` vs `״` (sweep both); pagination hard-caps around 104 results; and it tags
  **every** document `סוג מסמך: פסק דין` even when the body is an interlocutory `החלטה`.
  Only the document body tells you what a decision actually is.
- **Name traps:** Judge **אבישי רובס** (Deputy President, Haifa) and Judge **איתן
  אורנשטיין** dominate surname searches · **עו״ד אור דויד רובס** and **עו״ד ליאור רוב**
  are different lawyers · **נדב שפיגלר** also practises in Netanya · a ynet article under
  Lior's name is **his own commentary, not his case**.

**Cases examined and rejected** — do not publish any of these: ת״א 7256-01-23 (claim
struck out, ₪42,500 costs against the firm's clients) · ת״א 20407-05-21 (dismissed on the
merits, ₪60,000 costs against the client) · ת״א 24764-11-21 (s.79A, clients paid ₪55,000)
· ת״א 13713-10-22 (s.79A, client ordered to pay; counsel identity unprovable) · רע״א
55705-01-21 (the firm's clients abstained) · ת״א 65769-08-21 and ת״א 15339-04-23
(interlocutory orders, no outcome) · תאד״מ 3681-05-25 and ת״א 16497-07-22 (consent
outcomes, not wins).

A large share of Israeli decisions are never published, so "not found" is not "does not
exist" — but nothing else citable exists in the free record. The only way to add cases is
to **ask the lawyers for case numbers** and verify each counsel line individually.

### ⚠️ אורן אברהם — do not add a seniority claim or case list

Nationally there are only **two** active members named אורן אברהם (admitted 2010 and
2017) and **neither carries the firm's phone number**. The site's old line "חבר לשכת
עורכי הדין מזה שש שנים" was already live in 2019, implying admission around 2013, which
matches neither. It has been removed rather than corrected.

**The address is not an identifier.** A second firm, **קובי אורן ושות׳**, occupies the
the address the firm used to occupy, הגביש 4 בית טיטניום קומה א׳, and lists
`עו״ד אורן אברהם` among its owners. Any judgment naming "עו״ד אורן אברהם, הגביש 4 נתניה"
is that firm's, not this one's — and since the firm has now moved to שד׳ טום לנטוס 8, a הגביש 4
address in any record is a positive signal it is NOT this firm. The five registry cases under
that name almost certainly belong to them. To fix this properly, ask him for his מספר רישיון / תאריך הסמכה.

Also note: a well-known convicted fraudster shares the name and dominates search results
for it. Worth knowing before building any SEO around the bare name.

## Caching

`robas-law-website/_headers` is **generated** from `site-src/_headers` — edit the source,
not the output. It marks `/css/*`, `/js/*` and `/assets/*` immutable for a year. `build.js`
therefore appends a content hash to the stylesheet and script URLs. **Do not remove the
`?v={{CSS_V}}` / `?v={{JS_V}}` query strings from `layout.html`** — without them a CSS
change would not reach anyone who has visited before.

## Security

Audited September 2026. The attack surface is small — a static brochure site with one
POST endpoint — so the work was mostly about closing the gaps that surface leaves open.

### Response headers (`site-src/_headers` → generated)

`Content-Security-Policy` is the substantive one. It is an allow-list of exactly what the
site loads, which means **adding a third-party script, font, analytics tag, embed or CDN
will silently break it until you add that origin to the policy.** Check the browser
console after any such change.

| Directive | Why |
|-----------|-----|
| `script-src 'self' 'sha256-…'` | No `'unsafe-inline'`. The hash covers the schema.org JSON-LD, and `build.js` recomputes it from the built pages on every build — change `site.json` and the policy follows. Never paste that hash in by hand. |
| `style-src 'self' fonts.googleapis.com` | Also no `'unsafe-inline'`, which is why there are **zero inline `style=` attributes** in `site-src/`. Use a class. (`element.style.x = …` from JS is unaffected — CSP does not police the CSSOM, so the parallax still works.) |
| `img-src 'self'` | Every photo is served from this repo. Hotlinking was already banned on licensing grounds; now it fails loudly too. |
| `frame-src https://www.google.com` | The one Maps embed on `contact.html`. |
| `frame-ancestors 'none'` + `X-Frame-Options: DENY` | Nobody frames the firm's site into theirs. |
| `base-uri 'none'`, `object-src 'none'`, `form-action 'self'` | Cheap, and they close the usual escape hatches. |

Also set: `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, `X-Content-Type-Options`,
`Referrer-Policy`, and a `Permissions-Policy` that switches off every sensor API.

The Maps iframe deliberately carries **no `referrerpolicy` attribute**. It used to say
`no-referrer-when-downgrade`, which *overrode* the document policy and widened it from
origin-only to full-URL. Leaving the attribute off lets `Referrer-Policy` apply.

### `functions/api/contact.js`

The only code that runs on request, and the only thing worth attacking: it spends money
(a mail-provider send) and lands in a human inbox. Controls, in order: same-origin check,
body-size cap before parsing, honeypot, per-IP rate limit, per-field length caps,
control-character stripping, and a strict Reply-To allow-list.

Two of those deserve a note:

- **Reply-To is validated, not just trimmed.** The visitor's address becomes a mail
  header. A comma or a CRLF in it is how you turn one recipient into several, or inject
  a header. An address that fails validation does not lose the enquiry — it is delivered
  without a Reply-To, with a line in the body saying so.
- **The rate limit is best-effort.** It lives in the Worker isolate, and isolates are
  per-colo and short-lived, so a distributed flood will not all land on the same counter.
  It stops one script from one address, for free, with nothing to configure. For a hard
  limit, add a **Cloudflare WAF rate-limiting rule on `/api/contact`** in the dashboard.

### Still on the firm's side (cannot be done from this repo)

1. **Set the mail provider env vars.** `NOTIFICATION_EMAIL` plus either
   `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` or `RESEND_API_KEY` + `RESEND_FROM`. Until then
   the endpoint correctly returns 503 and the page offers WhatsApp/phone instead — but
   every enquiry is being written to the Cloudflare log rather than delivered, which is
   also the one place PII currently lands. Configuring a provider fixes both.
2. **HSTS is `max-age=31536000` only.** Add `; includeSubDomains` once you have confirmed
   every subdomain (webmail included) is HTTPS, and `; preload` only if you intend the
   commitment — preload is hard to undo.
3. **A WAF rate-limiting rule on `/api/contact`**, as above.
4. The old WordPress install on `robas-law.co.il` is still serving injected SEO spam.
   Cutting DNS over to this deployment is itself the fix.

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
