/**
 * Cloudflare Pages Function — Contact Form Handler
 * 
 * This handles POST requests from the contact form.
 * It sends an email notification via Cloudflare Email Workers
 * or a third-party service like Mailgun/SendGrid.
 * 
 * Setup:
 * 1. Add environment variable NOTIFICATION_EMAIL in Cloudflare Pages settings
 * 2. Optionally add MAILGUN_API_KEY and MAILGUN_DOMAIN for email delivery
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://robas-law.co.il',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const data = await request.json();
        const { name, phone, email, message } = data;

        // Basic validation
        if (!name || !phone) {
            return new Response(
                JSON.stringify({ error: 'שם וטלפון הם שדות חובה' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Rate limiting (basic — consider using Cloudflare Rate Limiting for production)
        const ip = request.headers.get('CF-Connecting-IP');

        // Build notification content
        const notificationBody = `
פנייה חדשה מהאתר
====================
שם: ${name}
טלפון: ${phone}
${email ? `אימייל: ${email}` : ''}
${message ? `הודעה: ${message}` : ''}
====================
IP: ${ip}
תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        `.trim();

        // Option 1: Send via Mailgun (recommended)
        if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
            const mailgunResponse = await fetch(
                `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        from: `אתר רובס <noreply@${env.MAILGUN_DOMAIN}>`,
                        to: env.NOTIFICATION_EMAIL || 'lior@robas-law.co.il',
                        subject: `פנייה חדשה מ${name}`,
                        text: notificationBody,
                    }),
                }
            );

            if (!mailgunResponse.ok) {
                throw new Error('Failed to send email via Mailgun');
            }
        }

        // Option 2: Log to console (for testing / development)
        console.log('New contact form submission:', notificationBody);

        return new Response(
            JSON.stringify({ success: true, message: 'הפנייה נשלחה בהצלחה' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Contact form error:', error);
        return new Response(
            JSON.stringify({ error: 'שגיאה בשליחת הפנייה. נסו שוב.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': 'https://robas-law.co.il',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}
