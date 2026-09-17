/**
 * Cloudflare Pages Function — contact form handler
 *
 * POST /api/contact  →  emails the enquiry to the office.
 *
 * ── Configuration (Cloudflare → Settings → Environment variables) ──
 *
 *   NOTIFICATION_EMAIL   where enquiries are delivered (default office@robas-law.co.il)
 *
 *   Then ONE of these providers:
 *
 *   Mailgun:   MAILGUN_API_KEY, MAILGUN_DOMAIN   (optional MAILGUN_REGION=eu)
 *   Resend:    RESEND_API_KEY, RESEND_FROM       (RESEND_FROM must be a verified sender)
 *
 * If NEITHER is configured the endpoint returns 503 and the site tells the visitor
 * to phone or WhatsApp instead. That is deliberate: an earlier version logged the
 * enquiry to the console and returned success, so a visitor saw "your message was
 * sent" while the office received nothing at all.
 *
 * ── Abuse controls ──
 *
 * This endpoint spends the firm's money (a mail-provider send) and lands in a human
 * inbox, so it is the only part of the site worth attacking. In order of appearance:
 *
 *   1. Same-origin check      — blocks a form on someone else's page POSTing here.
 *   2. Body size cap          — refused before JSON.parse, not after.
 *   3. Honeypot               — hidden `company` field; answers 200 so bots learn nothing.
 *   4. Rate limit             — per IP, best-effort (see rateLimited()).
 *   5. Per-field length caps  — a 4 KB message, not a 5 MB one.
 *   6. Control-char stripping — CR/LF out of everything that becomes a mail header.
 *   7. Reply-To validation    — a strict single address, or no Reply-To at all.
 */

const OFFICE_EMAIL = 'office@robas-law.co.il';
const OFFICE_PHONE = '09-8612894';

/* Generous enough for a real enquiry, small enough that nothing interesting fits. */
const MAX_BODY_BYTES = 16 * 1024;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_PER_IP = 5;
const RATE_MAX_TRACKED_IPS = 5000;

const json = (body, status, origin) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });

/* Field labels and per-field caps, in the order they appear in the notification email.
   `multiline` marks the one field allowed to contain newlines. */
const FIELDS = [
    { key: 'name',    label: 'שם',         max: 120 },
    { key: 'phone',   label: 'טלפון',       max: 40 },
    { key: 'email',   label: 'אימייל',      max: 160 },
    { key: 'subject', label: 'נושא הפנייה', max: 160 },
    { key: 'scope',   label: 'תחומים',      max: 400 },
    { key: 'message', label: 'הודעה',       max: 4000, multiline: true },
];

/* Strip control characters. Anything that reaches a mail header — the subject line,
   Reply-To — must not carry CR or LF, which is how header injection works. The one
   multiline field keeps TAB and LF so paragraphs survive; in every other field they
   are flattened to spaces rather than deleted, so words cannot be silently joined. */
const CTRL_ALL = /[\u0000-\u001F\u007F]/g;
const CTRL_KEEP_BREAKS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

function clean(value, max, multiline) {
    if (typeof value !== 'string') return '';

    const stripped = multiline
        ? value.replace(/\r\n?/g, '\n').replace(CTRL_KEEP_BREAKS, '')
        : value.replace(CTRL_ALL, ' ');

    return stripped.trim().slice(0, max);
}

/* Deliberately stricter than the RFC: no quoted locals, no comma or semicolon (which
   would let one field become several recipients), no angle brackets, no whitespace.
   A visitor whose address this rejects still gets their enquiry delivered — it just
   travels without a Reply-To, and the address is in the body for the office to read. */
const EMAIL_RE = /^[^\s@,;:<>()[\]\\"]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,180}[a-zA-Z0-9])?\.[a-zA-Z]{2,24}$/;

const isMailboxSafe = (v) => v.length > 0 && v.length <= 160 && EMAIL_RE.test(v);

/* Best-effort rate limit.
 *
 * Workers isolates are per-colo and short-lived, so this is a speed bump, not a
 * guarantee: a flood spread across regions will not all land on the same isolate.
 * It does stop the realistic case — one script hammering the endpoint from one
 * address — at zero cost and with no extra binding to configure. A hard limit needs
 * a Cloudflare WAF rate-limiting rule on /api/contact; see CLAUDE.md. Kept bounded
 * so it can never become a memory leak.
 */
const recentHits = new Map();

function rateLimited(ip) {
    const now = Date.now();

    if (recentHits.size > RATE_MAX_TRACKED_IPS) recentHits.clear();

    for (const [key, times] of recentHits) {
        const fresh = times.filter((t) => now - t < RATE_WINDOW_MS);

        if (fresh.length === 0) {
            recentHits.delete(key);
        } else {
            recentHits.set(key, fresh);
        }
    }

    const mine = recentHits.get(ip) || [];

    if (mine.length >= RATE_MAX_PER_IP) return true;

    mine.push(now);
    recentHits.set(ip, mine);

    return false;
}

async function sendViaMailgun(env, subject, text, replyTo) {
    const host = env.MAILGUN_REGION === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';

    const body = new URLSearchParams({
        from: `אתר ליאור רובס <noreply@${env.MAILGUN_DOMAIN}>`,
        to: env.NOTIFICATION_EMAIL || OFFICE_EMAIL,
        subject,
        text,
    });

    if (replyTo) body.set('h:Reply-To', replyTo);

    const res = await fetch(`https://${host}/v3/${env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });

    if (res.ok === false) {
        throw new Error(`Mailgun ${res.status}`);
    }
}

async function sendViaResend(env, subject, text, replyTo) {
    const payload = {
        from: env.RESEND_FROM,
        to: [env.NOTIFICATION_EMAIL || OFFICE_EMAIL],
        subject,
        text,
    };

    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (res.ok === false) {
        throw new Error(`Resend ${res.status}`);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const selfOrigin = new URL(request.url).origin;

    /* Browsers always send Origin on a POST. A mismatch means the request came from
       a page that is not ours, which no legitimate visitor produces. An absent Origin
       is not treated as hostile — it just means the caller is not a browser, and the
       remaining controls still apply. */
    const sentOrigin = request.headers.get('Origin');

    if (sentOrigin !== null && sentOrigin !== selfOrigin) {
        return json({ error: 'בקשה לא תקינה.' }, 403, selfOrigin);
    }

    const declaredLength = Number(request.headers.get('Content-Length') || 0);

    if (declaredLength > MAX_BODY_BYTES) {
        return json({ error: 'הפנייה ארוכה מדי.' }, 413, selfOrigin);
    }

    /* Content-Length can lie or be absent under chunked encoding, so measure the body
       that actually arrived before handing it to the JSON parser. */
    let raw;

    try {
        raw = await request.text();
    } catch (e) {
        return json({ error: 'בקשה לא תקינה.' }, 400, selfOrigin);
    }

    if (raw.length > MAX_BODY_BYTES) {
        return json({ error: 'הפנייה ארוכה מדי.' }, 413, selfOrigin);
    }

    let data;

    try {
        data = JSON.parse(raw);
    } catch (e) {
        return json({ error: 'בקשה לא תקינה.' }, 400, selfOrigin);
    }

    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        return json({ error: 'בקשה לא תקינה.' }, 400, selfOrigin);
    }

    // Honeypot: a hidden field only a bot fills in. Answer 200 so it learns nothing.
    if (clean(data.company, 200, false) !== '') {
        return json({ ok: true }, 200, selfOrigin);
    }

    const values = {};
    for (const f of FIELDS) values[f.key] = clean(data[f.key], f.max, f.multiline === true);

    if (values.name === '' || values.phone === '') {
        return json({ error: 'שם וטלפון הם שדות חובה.' }, 400, selfOrigin);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    if (rateLimited(ip)) {
        return json(
            {
                error: `נשלחו כמה פניות ברצף. אפשר להתקשר ${OFFICE_PHONE} או לנסות שוב בעוד מספר דקות.`,
                reason: 'rate_limited',
            },
            429,
            selfOrigin
        );
    }

    const lines = FIELDS
        .filter((f) => values[f.key] !== '')
        .map((f) => `${f.label}: ${values[f.key]}`);

    lines.push('');
    lines.push(`התקבל: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
    lines.push(`IP: ${ip}`);

    const replyTo = isMailboxSafe(values.email) ? values.email : null;

    if (values.email !== '' && replyTo === null) {
        lines.push('הערה: כתובת המייל שהוזנה אינה תקינה, לכן לא ניתן להשיב ישירות להודעה זו.');
    }

    const subject = values.subject
        ? `פנייה חדשה מהאתר (${values.subject}): ${values.name}`
        : `פנייה חדשה מהאתר: ${values.name}`;

    const hasMailgun = Boolean(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN);
    const hasResend = Boolean(env.RESEND_API_KEY && env.RESEND_FROM);

    if (hasMailgun === false && hasResend === false) {
        /* Logs the enquiry because losing a client's message is worse than having it
           sit in Cloudflare's log tail. It stops the moment a provider is configured,
           which is the actual fix — see CLAUDE.md. */
        console.error(
            'CONTACT FORM NOT CONFIGURED — no mail provider set. ' +
            'Set MAILGUN_API_KEY + MAILGUN_DOMAIN, or RESEND_API_KEY + RESEND_FROM. ' +
            'Enquiry that could not be delivered:\n' + lines.join('\n')
        );

        return json(
            {
                error: `לא הצלחנו לשלוח את הפנייה כרגע. אפשר להתקשר ${OFFICE_PHONE} או לכתוב ל-${OFFICE_EMAIL}`,
                reason: 'mail_not_configured',
            },
            503,
            selfOrigin
        );
    }

    try {
        if (hasMailgun) {
            await sendViaMailgun(env, subject, lines.join('\n'), replyTo);
        } else {
            await sendViaResend(env, subject, lines.join('\n'), replyTo);
        }
    } catch (error) {
        /* Only the status line is logged. A provider's error body can quote the whole
           request back, which would put the enquiry — and sometimes the credential
           that sent it — into the log. */
        console.error('Contact form delivery failed:', error.message);

        return json(
            {
                error: `אירעה תקלה בשליחה. אפשר להתקשר ${OFFICE_PHONE} או לכתוב ל-${OFFICE_EMAIL}`,
                reason: 'delivery_failed',
            },
            502,
            selfOrigin
        );
    }

    return json({ ok: true, message: 'הפנייה נשלחה בהצלחה' }, 200, selfOrigin);
}

export async function onRequestOptions(context) {
    const selfOrigin = new URL(context.request.url).origin;

    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': selfOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            'Cache-Control': 'no-store',
        },
    });
}
