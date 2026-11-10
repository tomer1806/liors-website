# Maintaining robas-law.co.il

Start here before changing anything, whether you are a person or an AI agent. This file covers
**where everything lives, how a change gets to the live site, and what must not break**. The
details are in [README.md](README.md) (how to edit content) and [CLAUDE.md](CLAUDE.MD) (design
rules, accessibility, security, research already done).

The site went live on the domain on **10 November 2026**, replacing the old WordPress install.

---

## Where everything lives

| What | Where | Notes |
|------|-------|-------|
| Code | this repo, branch `main` | Public repo: never commit secrets, personal emails or account IDs |
| Hosting | Cloudflare Worker **`robas-law-website`** | Static files from `robas-law-website/` plus `worker/` for `/api/contact` |
| Deploys | Cloudflare **Workers Builds** | Every push to `main` runs `wrangler deploy` (config: `wrangler.jsonc`) |
| Domain registration | **LiveDNS** (`.co.il` registrar) | Owned by the firm. Nameservers: `gordon.ns.cloudflare.com`, `zainab.ns.cloudflare.com` |
| DNS | Cloudflare, zone `robas-law.co.il` (Free plan) | See "DNS and email" below |
| Email | **Microsoft 365** | Not hosted by Cloudflare; only its DNS records live there |
| Contact form email | Resend or Mailgun via Worker env vars | **Not configured yet**: see "Open items" |
| Preview URL | `robas-law-website.<account>.workers.dev` | Same Worker, useful for testing |

---

## Making a change

1. **Edit the source, not the output.** The HTML in `robas-law-website/` is generated.

   | To change | Edit |
   |-----------|------|
   | Phone, address, hours, menu, client list | `site-src/data/site.json` |
   | Notable cases | `site-src/data/cases.json` |
   | A page's text | `site-src/pages/<page>.html` |
   | Header, footer, menus, accessibility panel | `site-src/partials/*.html` |
   | Security headers / CSP | `site-src/_headers` |
   | Old-URL redirects | `robas-law-website/_redirects` |
   | Styling | `robas-law-website/css/style.css` (hand-written) |
   | Behaviour | `robas-law-website/js/main.js` (hand-written) |

2. **Build:** `node build.js`. No dependencies. It fails loudly on a bad front-matter block, an
   unknown `{{token}}` or a missing client logo, and it refreshes the cache-busting hashes and the
   CSP script hashes. Always run it, even after a CSS-only change.
3. **Preview:** `cd robas-law-website && python3 -m http.server 8899`, or `npx wrangler dev` (port
   8787) to run the real Worker with headers, redirects and the contact endpoint.
4. **Check:** the browser console shows no CSP errors, the page works at phone width (375px), and
   any changed text that read-aloud will speak is written with ״ in abbreviations (see below).
5. **Ship:** open a pull request to `main`. Merging deploys within about a minute; watch the
   Cloudflare check on the PR.
6. **Verify live:** `curl -sI https://robas-law.co.il/` returns 200, and the page shows your change
   after a hard reload. CSS and JS URLs carry a content hash, so nobody gets a stale copy.

**Rolling back:** Cloudflare → Workers & Pages → `robas-law-website` → Deployments → roll back to
the previous version (instant), then fix forward or `git revert` on `main`.

---

## Rules that must not break

These are summaries; [CLAUDE.md](CLAUDE.MD) explains each one.

- **Never put server code inside `robas-law-website/`.** Everything in it is a public file.
  Server code goes in `worker/`.
- **No inline `style=` and no new inline `<script>`.** The Content-Security-Policy blocks them.
  Adding any third-party script, font, embed or analytics tag needs a CSP change in `site-src/_headers`.
- **Abbreviations use ״ (U+05F4), never a plain `"`**, as in `עו״ד`, `חוו״ד`. The read-aloud voice
  pronounces a plain quote mark as a word. If it misreads a new abbreviation, add it to `SPOKEN`
  in `main.js`.
- **No invented content:** no statistics, testimonials or case outcomes that the firm's own
  material or the judgment does not state. Lior signs off on anything added to notable cases.
- **No photographs of the lawyers, and no stock "lawyer" imagery** (suits, gavels, scales).
- **Accessibility is a legal requirement in Israel** (ת״י 5568 / WCAG 2.0 AA). Keep the contrast
  rules, focus rings and heading order described in CLAUDE.md, and update `accessibilityUpdated`
  in `site.json` when the site is re-checked.
- **Client logos are third-party trademarks.** Add one only with the client's consent.

---

## DNS and email

The Cloudflare zone holds exactly these records. **The email records carry the firm's mail**:
breaking them stops email, not just the website.

| Record | Value | Purpose |
|--------|-------|---------|
| `robas-law.co.il`, `www` | managed by the Worker (Custom Domains) | the website |
| `MX @` | `robaslaw-co-il01c.mail.protection.outlook.com` (priority 0) | Microsoft 365 mail |
| `TXT @` | `v=spf1 include:spf.protection.outlook.com -all` | SPF |
| `TXT @` | `MS=ms55940708` | Microsoft domain verification |
| `CNAME autodiscover` | `autodiscover.outlook.com` | Outlook setup |

- All email records are **DNS only** (grey cloud). A proxied `autodiscover` breaks Outlook.
- **Never enable Cloudflare Email Routing.** It replaces the MX records and mail stops reaching
  Microsoft 365.
- **Don't create A or CNAME records for `@` or `www` by hand.** The Worker's Custom Domains own
  them (Workers & Pages → `robas-law-website` → Domains). To move the site, change it there.
- SSL is a free certificate Cloudflare renews automatically. **Always Use HTTPS** is on.
- The site sends `Strict-Transport-Security` for one year, so browsers that have visited will
  refuse plain HTTP for a year. Never plan on serving the domain without HTTPS.

### Changing nameservers or registrar settings

Done at LiveDNS by the domain owner. Lessons from the move in November 2026:

- **Cloudflare deletes a domain that stays "Pending" for weeks.** Add the domain to Cloudflare
  and switch the nameservers the same day.
- **A pending Cloudflare zone serves no records.** Between the registry publishing new
  nameservers and Cloudflare marking the zone Active, fresh lookups get nothing. Click
  "Check nameservers now" right after the registry publishes.
- **The `.co.il` registry accepts a change immediately but publishes it later** (about 1.5 hours
  in November 2026). `whois -h whois.isoc.org.il robas-law.co.il` shows what was accepted;
  `dig NS robas-law.co.il @nsb.ns.il` shows what is published.
- The registry requires the new nameservers to answer for the domain before it accepts them.

---

## Open items

1. **Contact form delivery.** Set `NOTIFICATION_EMAIL` and either `RESEND_API_KEY` +
   `RESEND_FROM` or `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` in the Worker's Settings → Variables and
   Secrets. Put keys in as **Secrets**. Until then the form returns 503 and points visitors to
   WhatsApp and phone.
2. **Rate limiting:** add a Cloudflare WAF rate-limiting rule on `/api/contact`. The Worker's own
   limit is best-effort.
3. **Email hardening:** enable DKIM in Microsoft 365 and add a DMARC record. Cloudflare's DNS page
   recommends DMARC too.
4. **`www` → apex redirect** (optional), so search engines see one address.
5. **The old WordPress server** (Hetzner): back it up, then shut it down once nobody needs it.
6. **Accessibility statement:** a מורשה נגישות שירות should review and sign it.
7. **Read-aloud on real phones:** tested on desktop browsers and in emulation only.

---

## Where to read more

| File | What's in it |
|------|--------------|
| [README.md](README.md) | Repo layout, building, common edits, photos, client logos |
| [CLAUDE.md](CLAUDE.MD) | Design system, accessibility rules, security model, verified facts about the lawyers, case research already done |
| `docs/` | The original redesign spec (September 2026) |
| `site-src/data/photo-credits.json` | Licence and source of every photo and client logo |
