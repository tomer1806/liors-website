# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website for **Lior Robas Law Firm & Notary** (משרד עורכי דין ונוטריון ליאור רובס).
- Domain: robas-law.co.il
- Hosting: Cloudflare Pages
- Office: Gavish 4, "Titanium Building", Netanya
- Phone: 09-8623299 | Email: office@robas-law.co.il | Fax: 09-8612894

## Tech Stack

- Vanilla HTML/CSS/JS — no framework, no build step
- RTL Hebrew
- Fonts: Frank Ruhl Libre (display), Noto Sans Hebrew (body)
- Design: "Quiet Authority" — charcoal `#1A1A2E` / gold `#C9A84C` / cream `#FAF8F5`
- Logo: LR monogram SVG (3 versions in `assets/`)
- Contact form backend: Cloudflare Pages Functions (`functions/api/contact.js`)

## Status

v1 complete. Sections: hero, about, practice areas (6 incl. notary), why us, testimonials, CTA banner, contact + form + map, footer. Floating WhatsApp/phone/email FAB. Placeholder images from Unsplash. Next: deploy to Cloudflare Pages, replace photos, test, point domain.

## Development

**Local preview:** Open `robas-law-website/index.html` directly in a browser. No server needed — images load from Unsplash CDN.

**Deployment:** Cloudflare Pages via `npx wrangler deploy`. The asset directory is `robas-law-website/`.

## Architecture

All source files live under `robas-law-website/`:

- `index.html` — Single-page site with all sections. Hebrew RTL (`dir="rtl"`).
- `css/style.css` — Complete stylesheet (~1,600 lines). Uses CSS custom properties in `:root` for the design system.
- `js/main.js` — Client-side interactions: nav scroll effect, mobile menu toggle, smooth scroll, IntersectionObserver reveal animations, FAB toggle, contact form submission (currently simulated), counter animation, active nav link tracking.
- `functions/api/contact.js` — Cloudflare Pages Function for contact form POST. Sends email via Mailgun when `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` env vars are set. Currently the form in `main.js` uses a simulated delay instead of calling this endpoint.
- `_headers` — Security headers and static asset caching rules.
- `_redirects` — Cloudflare Pages redirect rules. **Must use relative URLs only** (absolute URLs cause deploy failures).
- `assets/` — Three SVG logos: `logo.svg` (dark), `logo-white.svg` (white with text), `logo-mark.svg` (white monogram for nav).

## Key Conventions

- All images are currently Unsplash placeholders. Each has an HTML comment `<!-- PHOTO SLOT: ... -->` marking where to swap in real photos.
- Contact info (phone, WhatsApp, email, address) is hardcoded in multiple places throughout `index.html`: nav, hero, contact section, CTA banner, FAB, footer, and mobile menu.
- CSS uses BEM naming: `.block__element--modifier` (e.g., `.nav__link--active`, `.btn--primary`).
- Scroll-reveal animations use `.reveal` / `.reveal-slide` classes activated by IntersectionObserver adding `.visible`.
- Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile).
