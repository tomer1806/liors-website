# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website for **Lior Robas Law Firm & Notary** (משרד עורכי דין ונוטריון ליאור רובס).
- Domain: robas-law.co.il
- Hosting: Cloudflare Pages
- Office: הגביש 4, בית טיטניום, קומה א', נתניה (Gavish 4, "Titanium Building", Floor 1, Netanya)
- Phone: 09-8612894 | Fax: 073-2758870 | Email: office@robas-law.co.il
- WhatsApp: 09-8612894 (same as office phone, formatted as `wa.me/97298612894`)
- Hours: Sun–Thu, 9:00–18:00
- Facebook: facebook.com/1432093250415826

## Tech Stack

- Vanilla HTML/CSS/JS — no framework, no build step
- RTL Hebrew (`lang="he" dir="rtl"` on every page)
- Fonts: Frank Ruhl Libre (display/headings), Noto Sans Hebrew (body)
- Design: "Bold & Warm" — navy `#1B2A4A` / gold `#C8963E` / burgundy `#7A1E32` / warm-white `#FDF8F3` / cream `#F5EDE0`
- Logo: LR monogram SVG (3 versions in `assets/`)
- Contact form backend: Cloudflare Pages Functions (`functions/api/contact.js`)

## Status

v2 (multi-page) complete. All pages use real Hebrew content from the live site (robas-law.co.il). Placeholder images from Unsplash — each marked with `<!-- PHOTO SLOT: ... -->`. Next: replace photos with real ones, deploy to Cloudflare Pages, test all pages, point domain.

## Development

**Local preview:** Open `robas-law-website/index.html` directly in a browser. No server needed for static pages — images load from Unsplash CDN. For contact form testing, use `npx wrangler pages dev robas-law-website/`.

**Deployment:** Cloudflare Pages via `npx wrangler deploy`. The asset directory is `robas-law-website/`.

## Architecture

All source files live under `robas-law-website/`:

### Core Files
- `css/style.css` — Complete stylesheet with CSS custom properties in `:root`. BEM naming convention.
- `js/main.js` — Shared JS for all pages: nav scroll effect, mobile menu, smooth scroll, IntersectionObserver reveal animations, active nav link detection, contact form submission.
- `functions/api/contact.js` — Cloudflare Pages Function for contact form POST (Mailgun).
- `_headers` — Security headers and caching rules.
- `_redirects` — Cloudflare Pages redirect rules. **Must use relative URLs only.**
- `assets/` — SVG logos: `logo.svg` (dark), `logo-white.svg` (white with text), `logo-mark.svg` (white monogram for nav).

### Pages (multi-page site)
| File | Page | Hebrew Title |
|------|------|-------------|
| `index.html` | Homepage | ראשי |
| `about.html` | About the office | המשרד |
| `lior.html` | About Lior Robas | אודות ליאור |
| `practice-areas.html` | Practice areas | תחומי התמחות |
| `clients.html` | Clients & testimonials | לקוחות |
| `real-estate.html` | Real estate services | ליווי עסקאות נדל״ן |
| `commercial.html` | Commercial companies | ייצוג חברות מסחריות |
| `notary.html` | Notary services | שירותי נוטריון |
| `power-of-attorney.html` | Continuous POA (how it works) | ייפוי כוח מתמשך |
| `poa-guide.html` | Full POA guide | מדריך מלא |
| `house-rules.html` | Office values | חוקי הבית |
| `contact.html` | Contact form + map | צור קשר |
| `privacy.html` | Privacy policy | הצהרת פרטיות |

### Navigation Structure
The nav and footer are duplicated in every HTML file (no templating engine). The homepage (`index.html`) uses a transparent nav that becomes solid on scroll. All inner pages use `nav--dark` class for an immediately solid navy nav.

Dropdown menus:
- **אודות** → המשרד, תחומי התמחות, לקוחות, אודות ליאור
- **ייפוי כוח מתמשך** → איך זה עובד?, מדריך מלא

## Key Conventions

- All images are currently Unsplash placeholders. Each has `<!-- PHOTO SLOT: ... -->` marking where to swap in real photos.
- Contact info is hardcoded in multiple places across ALL HTML files: nav, mobile menu, footer, FAB, CTA banners, and the contact page. See "How to Change" section below.
- CSS uses BEM naming: `.block__element--modifier`.
- Scroll-reveal animations use `.reveal` / `.reveal-slide` classes activated by IntersectionObserver adding `.visible`.
- Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile).
- Inner pages use the `page-header` component for the top banner area.
- Long-form content pages (real-estate, commercial, POA guide, privacy) use the `content-page` class for readable prose styling.

## How to Change Content

### Changing Contact Info (phone, email, WhatsApp, address, fax)
Contact details appear in **every HTML file** in these locations:
1. **Nav** — WhatsApp CTA button (`nav__cta`)
2. **Mobile menu** — Phone link and WhatsApp button
3. **Footer** — Phone, email, address, fax in `footer__contact-item` elements
4. **FAB** — Floating buttons (WhatsApp, phone, email)
5. **CTA banners** — Phone number in some CTAs
6. **Contact page** (`contact.html`) — Full contact info section

To update a phone number, do a **global find-and-replace** across all `.html` files:
- Office phone: search `09-8612894` and `97298612894` (WhatsApp international format)
- Fax: search `073-2758870`
- Email: search `office@robas-law.co.il`
- Address: search `הגביש 4, בית טיטניום`

### Changing WhatsApp Number
The WhatsApp link format is `https://wa.me/PHONENUMBER?text=MESSAGE`. The phone number must be in international format without `+` or dashes. For Israeli numbers: remove the leading `0`, prepend `972`. Example: `09-8612894` → `97298612894`.

### Replacing Placeholder Photos
Search for `<!-- PHOTO SLOT:` across all HTML files. Each comment describes what photo should go there. Replace the Unsplash `src` URL with a path to the real image (e.g., `assets/photos/lior-portrait.jpg`). Recommended to add real photos to an `assets/photos/` directory.

### Adding/Editing a Page
1. Copy an existing inner page as a template (e.g., `about.html`).
2. Update the `<title>`, `<meta description>`, page header content, and body content.
3. The nav, mobile menu, footer, and FAB should stay identical across all pages.
4. If adding a new nav link, update the nav and mobile menu in **every HTML file**.

### Editing the Navigation Menu
The nav menu is duplicated in every page. To add/remove/rename a link:
1. Edit the nav in **every HTML file** — both the desktop `.nav__links` and the `.mobile-menu`.
2. If it's a dropdown item, update the `.nav__dropdown-menu` as well.

### Changing Colors / Design Tokens
All colors are CSS custom properties defined in `:root` at the top of `css/style.css`. Change the variable value and it updates site-wide.

### Changing Office Hours
Office hours appear only in `contact.html` in the contact info section.

## Known Issues & Fixes Applied

The following visual bugs were found after the initial build and fixed. Documenting them here so future sessions know the patterns to avoid:

1. **Dropdown menus rendered as visible inline text** — CSS `opacity: 0; visibility: hidden` alone was NOT enough to hide `.nav__dropdown-menu`. Fix: added `display: none` as default, `display: block` on `:hover`. Always use `display: none` for hidden menus, not just opacity/visibility.

2. **Footer social icons rendered at full viewport size** — SVG elements without explicit `width`/`height` HTML attributes ignored CSS sizing rules. Fix: added `width="18" height="18"` attributes directly on all `<svg>` elements in the footer social links across ALL pages. Also added `overflow: hidden` and `max-width`/`max-height` constraints on `.footer__social a` in CSS. **Rule: always add explicit `width` and `height` attributes to inline SVGs.**

3. **Card components (service, team, testimonial) had no visible backgrounds or borders** — CSS custom variables (`var(--white)`, `var(--border)`) were not resolving for card backgrounds in some contexts. Fix: hardcoded `#FFFFFF` for backgrounds and `#E5DDD0` for borders instead of using CSS variables. If re-introducing variables, test card rendering thoroughly.

4. **Grid layouts collapsed to single column** — `grid-template-columns: repeat(auto-fill, minmax(Xpx, 1fr))` didn't produce multi-column layouts reliably. Fix: changed to explicit `repeat(3, 1fr)` / `repeat(4, 1fr)` with responsive overrides at 1024px and 768px breakpoints.

5. **Quote block invisible on navy background** — Inline `style` attributes using `var(--white)` for text color on a dark background didn't render. Fix: removed inline styles, added dedicated `.section--navy .quote-block`, `.section--navy .quote-block__text`, `.section--navy .quote-block__author` CSS rules with hardcoded white/gold colors.

6. **CTA banner background not rendering** — `background: linear-gradient(...)` with CSS variables didn't apply. Fix: hardcoded hex colors in the gradient (`#1B2A4A`, `#0F1A30`, `#7A1E32`).

**General lesson:** When CSS custom properties (`var(--xxx)`) don't resolve in production, hardcode hex values as fallback. Test in a real browser after every major CSS change — CSS parsing errors can silently break rules that follow the error.

## Team Members (as of 2026)
1. **עו"ד ליאור רובס** — Owner & Founder. 17 years in the field, 15 as active attorney. Lives in Even Yehuda, father of 3. Football enthusiast.
2. **עו"ד שמואל שפיגלר** — Senior Counsel. 40+ years experience. All court levels, corporate law, wills, inheritance, taxes, real estate.
3. **עו"ד אוליביה ד. אורנשטיין** — Bar member since 2006. LL.M in commercial law. Banking, enforcement, wills, inheritance, real estate.
4. **עו"ד אורן אברהם** — 6 years experience. Corporate law, commercial law, real estate, institutional client support.
