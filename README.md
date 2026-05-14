# Robas Law — Website

Modern, responsive website for **Lior Robas Law Firm & Notary** (משרד עורכי דין ונוטריון ליאור רובס).  
Built with vanilla HTML/CSS/JS — zero dependencies, zero build step, instant deploy.

---

## Quick Start

### Option 1: Local Preview
1. Download/unzip the project
2. Open `index.html` in any browser
3. Everything works locally (images load from Unsplash CDN)

### Option 2: Deploy to Cloudflare Pages
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Choose **Upload assets**
3. Name the project (e.g. `robas-law`) — you'll get `robas-law.pages.dev` as test URL
4. Upload the ZIP or drag the unzipped folder
5. Click **Deploy** — site is live in ~30 seconds

### Connecting Your Custom Domain (robas-law.co.il)
1. In your Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `robas-law.co.il`
3. Cloudflare will ask you to update nameservers at your domain registrar
4. Update nameservers → wait for DNS propagation (minutes to 24hrs)
5. HTTPS is automatic — Cloudflare provisions SSL for you

> **Important:** The existing site stays untouched until you change the nameservers. Test everything on `robas-law.pages.dev` first.

---

## Project Structure

```
robas-law/
├── index.html                 # Complete single-page website (Hebrew RTL)
├── css/
│   └── style.css              # Full stylesheet (~1,600 lines)
├── js/
│   └── main.js                # Interactions & animations
├── assets/
│   ├── logo.svg               # Dark logo (for light backgrounds)
│   ├── logo-white.svg         # White logo with text (hero, footer)
│   └── logo-mark.svg          # White monogram only (navigation bar)
├── functions/
│   └── api/
│       └── contact.js         # Cloudflare Pages Function (form handler)
├── _redirects                 # www → non-www, HTTP → HTTPS
├── _headers                   # Security headers & caching rules
└── README.md                  # This file
```

---

## Contact Info (Already Configured)

| Channel   | Value                          | Link Format                              |
|-----------|--------------------------------|------------------------------------------|
| Phone     | 09-8623299                     | `tel:+972-9-8623299`                     |
| Fax       | 09-8612894                     | —                                        |
| Email     | office@robas-law.co.il         | `mailto:office@robas-law.co.il`          |
| WhatsApp  | +972-9-8623299                 | `https://wa.me/97298623299`              |
| Address   | גביש 4, "בית טיטניום", נתניה  | Google Maps embed in contact section     |

All links (phone, WhatsApp, email) are already wired into:
- Navigation bar (WhatsApp button)
- Hero section (CTA buttons)
- Contact section (all four methods + form)
- CTA banner (phone + WhatsApp)
- Floating action button / FAB (bottom-left, all three)
- Footer (all contact details)
- Mobile menu (phone + WhatsApp)

---

## Replacing Placeholder Photos

The site currently loads placeholder images from Unsplash. To replace with real photos:

### Photo Slots

| #  | Section        | What to Shoot                          | Recommended Size   | Replace In HTML                          |
|----|----------------|----------------------------------------|--------------------|------------------------------------------|
| 1  | Hero BG        | Office exterior, Netanya skyline, or abstract architectural shot | 1600×900+ px  | Search for `unsplash.com/photo-1497366216548` |
| 2  | About          | Professional portrait of Lior          | 600×800+ px (3:4)  | Search for `unsplash.com/photo-1560250097` |
| 3  | Why Us         | Office interior or meeting room        | 700×500+ px        | Search for `unsplash.com/photo-1497366754035` |
| 4  | Practice BG    | Subtle texture (marble, concrete)      | 1600×900+ px       | Search for `unsplash.com/photo-1497366811353` |
| 5  | CTA Banner     | Wide shot — building, skyline, abstract | 1600×600+ px       | Search for `unsplash.com/photo-1486406146926` |

### Steps
1. Prepare images — save as `.jpg`, optimize for web (under 200KB each)
2. Place in the `assets/` folder:
   ```
   assets/
     lior-portrait.jpg
     office-interior.jpg
     hero-bg.jpg
     cta-bg.jpg
   ```
3. In `index.html`, find the Unsplash URL and replace:
   ```html
   <!-- Change this: -->
   src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80"
   <!-- To this: -->
   src="assets/lior-portrait.jpg"
   ```
4. Re-upload to Cloudflare Pages

> **Tip:** Each photo slot has an HTML comment above it like `<!-- PHOTO SLOT: ... -->` to help you find it.

---

## Customization Checklist

- [ ] Replace placeholder photos with real ones
- [ ] Verify WhatsApp number format works (test the link)
- [ ] Update Google Maps embed with exact coordinates
- [ ] Replace placeholder testimonials with real client quotes
- [ ] Update stats (years of experience, client count, success rate)
- [ ] Review and adjust practice areas text
- [ ] Update "About" section bio with real text from Lior
- [ ] Add Google Analytics or Cloudflare Web Analytics
- [ ] Submit sitemap to Google Search Console
- [ ] Test contact form with Mailgun (see below)

---

## Contact Form Setup

The form currently shows a success animation but doesn't send emails yet.  
To enable real email delivery:

### Option A: Mailgun (Recommended)
1. Create a [Mailgun](https://www.mailgun.com) account (free tier: 5,000 emails/month)
2. In Cloudflare Pages → **Settings** → **Environment variables**, add:
   - `NOTIFICATION_EMAIL` = `office@robas-law.co.il`
   - `MAILGUN_API_KEY` = your Mailgun API key
   - `MAILGUN_DOMAIN` = your Mailgun sending domain
3. In `js/main.js`, uncomment the `fetch('/api/contact', ...)` block and remove the simulated delay
4. Re-deploy

### Option B: Formspree / Getform (Simpler)
1. Sign up at [Formspree](https://formspree.io) or [Getform](https://getform.io)
2. Get your form endpoint URL
3. Update the form's `action` attribute in `index.html`

---

## Technical Details

| Layer         | Technology                                    |
|---------------|-----------------------------------------------|
| Markup        | Semantic HTML5, RTL-native                    |
| Styling       | Custom CSS — variables, grid, flexbox         |
| Typography    | Google Fonts: Frank Ruhl Libre, Noto Sans Hebrew |
| Animations    | CSS transitions + IntersectionObserver        |
| Form Backend  | Cloudflare Pages Functions (serverless)       |
| Hosting       | Cloudflare Pages (free tier)                  |
| CDN & SSL     | Cloudflare (automatic)                        |

### Performance Targets
- Lighthouse: 95+ across all categories
- First load: < 2 seconds on 3G
- Total weight: ~25KB code + images
- No JavaScript frameworks, no build tools

### Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- iOS Safari, Android Chrome
- RTL layout fully supported

---

## File Sizes

| File               | Size (raw) | Size (gzipped) |
|--------------------|------------|----------------|
| index.html         | ~18 KB     | ~5 KB          |
| style.css          | ~38 KB     | ~7 KB          |
| main.js            | ~5 KB      | ~2 KB          |
| Logo SVGs (×3)     | ~3 KB      | ~1 KB          |
| **Total code**     | **~64 KB** | **~15 KB**     |

---

## Google Maps Embed

The current map embed uses a generic Netanya coordinate. To get the exact one:

1. Go to [Google Maps](https://maps.google.com)
2. Search for "גביש 4, נתניה" or "בית טיטניום נתניה"
3. Click **Share** → **Embed a map** → Copy the `<iframe>` code
4. Replace the existing `<iframe>` in the contact section of `index.html`

---

## SEO Notes

Already included:
- Hebrew `<title>` and `<meta description>`
- Open Graph tags for social sharing
- Structured data (JSON-LD) for LocalBusiness schema
- Semantic HTML headings hierarchy
- Image `alt` tags in Hebrew
- `_headers` file with security headers

Still needed after launch:
- Submit `robas-law.co.il` to [Google Search Console](https://search.google.com/search-console)
- Create and submit a `sitemap.xml`
- Set up [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) (free, privacy-friendly)
- Claim/update [Google Business Profile](https://business.google.com) with the new website URL

---

## License

This website was built for Lior Robas Law Firm & Notary. All rights reserved.  
Placeholder images from [Unsplash](https://unsplash.com) (free commercial license).
