#!/usr/bin/env node
/* ============================================================
   ROBAS LAW — static site builder

   Assembles site-src/pages/*.html + site-src/partials/*.html
   into plain static HTML in robas-law-website/.

   No dependencies. Run:  node build.js
   Output is committed to the repo, so Cloudflare Pages needs
   no build step of its own.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT      = __dirname;
const SRC       = path.join(ROOT, 'site-src');
const PAGES     = path.join(SRC, 'pages');
const PARTIALS  = path.join(SRC, 'partials');
const OUT       = path.join(ROOT, 'robas-law-website');

const site = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'site.json'), 'utf8'));

/* ---------- helpers ---------- */

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');
const esc  = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`;

/* _headers caches /css/* and /js/* as immutable for a year, so the URL has to
   change whenever the file does — otherwise returning visitors keep the old one. */
function assetVersion(relPath) {
    const full = path.join(OUT, relPath);
    if (fs.existsSync(full) === false) return '0';
    return crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex').slice(0, 8);
}

/* Pull the {"..."} front-matter comment off the top of a page file. */
function frontMatter(src, file) {
    const m = src.match(/^<!--@([\s\S]*?)@-->\s*/);
    if (!m) throw new Error(`${file}: missing <!--@ {...} @--> front-matter block`);
    let meta;
    try {
        meta = JSON.parse(m[1]);
    } catch (e) {
        throw new Error(`${file}: front-matter is not valid JSON — ${e.message}`);
    }
    return { meta, body: src.slice(m[0].length) };
}

/* ---------- generated chrome ---------- */

function navLinks(active) {
    return site.nav.map((item) => {
        const isActive = item.href === active ||
            (item.children || []).some((c) => c.href === active);
        if (item.children) {
            const menu = item.children
                .map((c) => `<a href="${c.href}"${c.href === active ? ' aria-current="page"' : ''}>${c.label}</a>`)
                .join('\n                        ');
            return `<div class="nav__item nav__item--has-menu${isActive ? ' is-active' : ''}">
                    <button class="nav__link nav__link--menu" type="button" aria-expanded="false">${item.label}<svg class="nav__chev" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
                    <div class="nav__menu">
                        ${menu}
                    </div>
                </div>`;
        }
        return `<a class="nav__link${isActive ? ' is-active' : ''}" href="${item.href}"${isActive ? ' aria-current="page"' : ''}>${item.label}</a>`;
    }).join('\n                ');
}

function mobileLinks(active) {
    return site.nav.map((item) => {
        const top = `<a class="m-nav__link${item.href === active ? ' is-active' : ''}" href="${item.href}">${item.label}</a>`;
        if (!item.children) return top;
        const subs = item.children
            .map((c) => `<a class="m-nav__sub${c.href === active ? ' is-active' : ''}" href="${c.href}">${c.label}</a>`)
            .join('\n                ');
        return `${top}\n                ${subs}`;
    }).join('\n                ');
}

const linkList = (items, active) => items
    .map((i) => `<a class="footer__link${i.href === active ? ' is-active' : ''}" href="${i.href}">${i.label}</a>`)
    .join('\n                    ');

const clientLogos = () => site.clients
    .map((c) => `<div class="clients__cell"><img src="assets/clients/${c.slug}.png" alt="${esc(c.name)}" class="clients__logo" loading="lazy" width="220" height="70"></div>`)
    .join('\n                ');

/* ---------- render ---------- */

/* {{key}} — looked up in the page context first, then in site.json. */
function substitute(str, ctx) {
    return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, key) => {
        if (key in ctx) return ctx[key];
        if (key in site) return site[key];
        throw new Error(`unknown token {{${key}}}`);
    });
}

function render(template, ctx) {
    let out = template;
    let guard = 0;

    // {{> partial}} — recursive, so partials may include partials
    while (/\{\{>\s*([\w-]+)\s*\}\}/.test(out)) {
        if (++guard > 20) throw new Error('partial include loop (>20 levels deep)');
        out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => read(PARTIALS, `${name}.html`));
    }

    return substitute(out, ctx);
}

/* ---------- build ---------- */

const year = new Date().getFullYear();
const cssV = assetVersion('css/style.css');
const jsV = assetVersion('js/main.js');
let built = 0;
const problems = [];

for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith('.html')).sort()) {
    let meta, body;
    try {
        ({ meta, body } = frontMatter(read(PAGES, file), file));
    } catch (e) {
        problems.push(e.message);
        continue;
    }

    const active = meta.nav || file;
    const ctx = {
        TITLE:            esc(meta.title),
        DESCRIPTION:      esc(meta.description),
        CANONICAL:        `${site.domain}/${file === 'index.html' ? '' : file}`,
        BODY:             '',
        NAV_LINKS:        navLinks(active),
        MOBILE_LINKS:     mobileLinks(active),
        FOOTER_SERVICES:  linkList(site.footerServices, active),
        FOOTER_OFFICE:    linkList(site.footerOffice, active),
        CLIENT_LOGOS:     clientLogos(),
        NAV_MODIFIER:     meta.transparentNav ? ' nav--over-hero' : '',
        BODY_CLASS:       meta.bodyClass || '',
        WA_HREF:          waHref,
        YEAR:             String(year),
        CSS_V:            cssV,
        JS_V:             jsV,
    };

    let html;
    try {
        // the body is substituted first, so pages may use tokens such as {{CLIENT_LOGOS}} too
        ctx.BODY = substitute(body.trimEnd(), ctx);
        html = render(read(PARTIALS, 'layout.html'), ctx);
    } catch (e) {
        problems.push(`${file}: ${e.message}`);
        continue;
    }

    fs.writeFileSync(path.join(OUT, file), html);
    built++;
}

if (problems.length) {
    console.error('\nBuild failed:');
    problems.forEach((p) => console.error('  • ' + p));
    process.exit(1);
}

console.log(`Built ${built} pages → ${path.relative(ROOT, OUT)}/`);
