/**
 * Worker entry point.
 *
 * The site deploys as a Cloudflare Worker with static assets, not as a Pages project.
 * That matters: a `functions/` folder is a Pages feature, and a Worker ignores it. The
 * contact handler used to live in `robas-law-website/functions/api/contact.js`, where it
 * never ran (POST /api/contact returned 404 on the live site) and was instead served to
 * anyone as a public file, rate-limit thresholds and honeypot field name included.
 *
 * Static files are served by the assets layer before this code runs, with `_headers`
 * and `_redirects` applied there exactly as before. Only a request that matches no file
 * reaches this function, which in practice means /api/contact and genuine 404s.
 */

import { onRequestPost, onRequestOptions } from './contact.js';

export default {
    async fetch(request, env, ctx) {
        const { pathname } = new URL(request.url);

        if (pathname === '/api/contact') {
            // the handler keeps the Pages-style signature, so pass it the same context shape
            const context = { request, env, waitUntil: (p) => ctx.waitUntil(p) };

            if (request.method === 'POST') return onRequestPost(context);
            if (request.method === 'OPTIONS') return onRequestOptions(context);

            return new Response('Method Not Allowed', {
                status: 405,
                headers: { Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' },
            });
        }

        // Anything else that got this far matched no file: let the assets layer answer, so
        // a missing page gets the same 404 it always did.
        if (env.ASSETS) return env.ASSETS.fetch(request);

        return new Response('Not Found', { status: 404 });
    },
};
