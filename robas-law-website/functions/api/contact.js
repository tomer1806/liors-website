/**
 * Cloudflare Pages Function — contact form handler
 *
 * POST /api/contact  →  emails the enquiry to the office.
 *
 * ── Configuration (Cloudflare Pages → Settings → Environment variables) ──
 *
 *   NOTIFICATION_EMAIL   where enquiries are delivered (default office@robas-law.co.il)
 *
 *   Then ONE of these providers:
 *
 *   Mailgun:   MAILGUN_API_KEY, MAILGUN_DOMAIN   (optional MAILGUN_REGION=eu)
 *   Resend:    RESEND_API_KEY, RESEND_FROM       (RESEND_FROM must be a verified sender)
 *
 * If NEITHER is configured the endpoint returns 503 and the site tells the visitor
 * to phone or WhatsApp instead. That is deliberate: the previous version logged the
 * enquiry to the console and returned success, so a visitor saw "your message was
 * sent" while the office received nothing at all.
 */

const OFFICE_EMAIL = 'office@robas-law.co.il';
const OFFICE_PHONE = '09-8612894';

const json = (body, status, origin) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });

/* Field labels, in the order they should appear in the notification email. */
const FIELDS = [
    ['name', 'שם'],
    ['phone', 'טלפון'],
    ['email', 'אימייל'],
    ['subject', 'נושא הפנייה'],
    ['scope', 'תחומים'],
    ['message', 'הודעה'],
];

const clean = (v) => (typeof v === 'string' ? v.trim().slice(0, 5000) : '');

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
        throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
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
        throw new Error(`Resend ${res.status}: ${await res.text()}`);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const origin = new URL(request.url).origin;

    let data;

    try {
        data = await request.json();
    } catch (e) {
        return json({ error: 'בקשה לא תקינה.' }, 400, origin);
    }

    const values = {};
    for (const [key] of FIELDS) values[key] = clean(data[key]);

    if (values.name === '' || values.phone === '') {
        return json({ error: 'שם וטלפון הם שדות חובה.' }, 400, origin);
    }

    // Honeypot: a hidden field only a bot fills in. Answer 200 so it learns nothing.
    if (clean(data.company) !== '') {
        return json({ ok: true }, 200, origin);
    }

    const lines = FIELDS
        .filter(([key]) => values[key] !== '')
        .map(([key, label]) => `${label}: ${values[key]}`);

    lines.push('');
    lines.push(`התקבל: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
    lines.push(`IP: ${request.headers.get('CF-Connecting-IP') || 'לא ידוע'}`);

    const subject = values.subject
        ? `פנייה חדשה מהאתר (${values.subject}): ${values.name}`
        : `פנייה חדשה מהאתר: ${values.name}`;

    const hasMailgun = Boolean(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN);
    const hasResend = Boolean(env.RESEND_API_KEY && env.RESEND_FROM);

    if (hasMailgun === false && hasResend === false) {
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
            origin
        );
    }

    try {
        if (hasMailgun) {
            await sendViaMailgun(env, subject, lines.join('\n'), values.email || null);
        } else {
            await sendViaResend(env, subject, lines.join('\n'), values.email || null);
        }
    } catch (error) {
        console.error('Contact form delivery failed:', error.message);

        return json(
            {
                error: `אירעה תקלה בשליחה. אפשר להתקשר ${OFFICE_PHONE} או לכתוב ל-${OFFICE_EMAIL}`,
                reason: 'delivery_failed',
            },
            502,
            origin
        );
    }

    return json({ ok: true, message: 'הפנייה נשלחה בהצלחה' }, 200, origin);
}

export async function onRequestOptions(context) {
    const origin = new URL(context.request.url).origin;

    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}
