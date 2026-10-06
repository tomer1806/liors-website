/* ============================================================
   ROBAS LAW — site behaviour
   ============================================================ */

(function () {
    'use strict';

    var root = document.documentElement;
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Motion is off when the OS asks for it, or when the visitor switches it off in the
       accessibility panel. The second can change while the page is open, so this is
       asked at the moment it matters rather than read once at load. */
    var isStill = function () {
        return motionQuery.matches || root.classList.contains('a11y-motion');
    };

    /* ---------- nav: solid background once scrolled ---------- */

    var nav = document.getElementById('nav');

    if (nav && nav.classList.contains('nav--over-hero')) {
        var syncNav = function () {
            nav.classList.toggle('is-scrolled', window.scrollY > 40);
        };

        syncNav();
        window.addEventListener('scroll', syncNav, { passive: true });
    }

    /* ---------- mobile menu ---------- */

    var burger = document.getElementById('navBurger');
    var mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        var setMenu = function (open) {
            burger.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
            document.body.style.overflow = open ? 'hidden' : '';

            if (open) {
                mobileMenu.hidden = false;
                // next frame, so the opacity transition has a starting value to animate from
                requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); });
            } else {
                mobileMenu.classList.remove('is-open');
                window.setTimeout(function () {
                    if (mobileMenu.classList.contains('is-open') === false) {
                        mobileMenu.hidden = true;
                    }
                }, isStill() ? 0 : 350);
            }
        };

        burger.addEventListener('click', function () {
            setMenu(mobileMenu.hidden === true);
        });

        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () { setMenu(false); });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileMenu.hidden === false) {
                setMenu(false);
                burger.focus();
            }
        });
    }

    /* ---------- desktop dropdowns: keyboard + touch ---------- */

    document.querySelectorAll('.nav__item--has-menu').forEach(function (item) {
        var trigger = item.querySelector('.nav__link--menu');

        if (trigger === null) return;

        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            var open = item.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', String(open));
        });

        item.addEventListener('focusout', function () {
            window.setTimeout(function () {
                if (item.contains(document.activeElement) === false) {
                    item.classList.remove('is-open');
                    trigger.setAttribute('aria-expanded', 'false');
                }
            }, 0);
        });
    });

    document.addEventListener('click', function (e) {
        document.querySelectorAll('.nav__item--has-menu.is-open').forEach(function (item) {
            if (item.contains(e.target) === false) {
                item.classList.remove('is-open');
                var t = item.querySelector('.nav__link--menu');
                if (t !== null) t.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* ---------- photography: never leave a broken image on the page ----------
       The hero and the photo bands sit on ink, so a missing file degrades to a
       plain dark panel rather than a broken-image icon. */

    document.querySelectorAll('.hero__slide img, .band-photo__img').forEach(function (img) {
        var drop = function () {
            var slide = img.closest('.hero__slide');
            if (slide !== null) slide.remove();
            else img.remove();
        };

        if (img.complete === true && img.naturalWidth === 0) drop();
        img.addEventListener('error', drop);
    });

    /* ---------- hero: slow crossfade between office photographs ---------- */

    var heroMedia = document.querySelector('.hero__media');

    if (heroMedia !== null) {
        var slides = Array.prototype.slice.call(heroMedia.querySelectorAll('.hero__slide'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('.hero__dot'));
        var dotsWrap = document.querySelector('.hero__dots');

        // nothing to page through — hide the pagination rather than show dead controls
        if (slides.length < 2 && dotsWrap !== null) dotsWrap.hidden = true;
        if (slides.length > 0) slides[0].classList.add('is-active');

        if (slides.length > 1) {
            var current = 0;

            var show = function (next) {
                slides[current].classList.remove('is-active');
                slides[next].classList.add('is-active');

                if (dots.length === slides.length) {
                    dots[current].classList.remove('is-active');
                    dots[next].classList.add('is-active');
                }

                current = next;
            };

            var timer = window.setInterval(function () {
                if (document.hidden === false && isStill() === false) {
                    show((current + 1) % slides.length);
                }
            }, 7000);

            dots.forEach(function (dot, i) {
                dot.addEventListener('click', function () {
                    window.clearInterval(timer);
                    show(i);
                });
            });
        }
    }

    /* ---------- full-bleed photo bands: parallax ---------- */

    var bands = Array.prototype.slice.call(document.querySelectorAll('.band-photo__img'));

    if (bands.length > 0) {
        var ticking = false;

        var positionBands = function () {
            if (isStill() === true) {
                bands.forEach(function (img) { img.style.transform = ''; });
                ticking = false;
                return;
            }

            bands.forEach(function (img) {
                // the image may have been pulled from the DOM by the error handler above
                if (img.isConnected === false || img.parentElement === null) return;

                var rect = img.parentElement.getBoundingClientRect();

                if (rect.bottom < 0 || rect.top > window.innerHeight) return;

                // -1 (band entering from below) … 1 (band leaving above)
                var progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
                img.style.transform = 'translate3d(0, ' + (progress * 7).toFixed(2) + '%, 0)';
            });

            ticking = false;
        };

        var onScroll = function () {
            if (ticking === false) {
                ticking = true;
                requestAnimationFrame(positionBands);
            }
        };

        positionBands();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
    }

    /* ---------- one entrance animation, once ---------- */

    var risers = document.querySelectorAll('.reveal, .reveal-slide, .u-rise');

    if (isStill() === true || 'IntersectionObserver' in window === false) {
        risers.forEach(function (el) { el.classList.add('visible'); });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting === true) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

        risers.forEach(function (el) { observer.observe(el); });
    }

    /* ---------- floating contact buttons ---------- */

    var fab = document.getElementById('fab');

    if (fab !== null) {
        var syncFab = function () {
            fab.classList.toggle('is-visible', window.scrollY > 420);
        };

        syncFab();
        window.addEventListener('scroll', syncFab, { passive: true });
    }

    /* ---------- contact form ---------- */

    var form = document.getElementById('contactForm');

    if (form !== null) {
        var status = document.getElementById('formStatus');
        var submit = form.querySelector('[type="submit"]');

        var say = function (message, ok) {
            if (status === null) return;
            status.textContent = message;
            status.className = 'form-status ' + (ok ? 'form-status--ok' : 'form-status--err');
        };

        /* If the endpoint is unconfigured or down, the visitor must not hit a dead end.
           Offer the same enquiry, already written out, over WhatsApp or email — both of
           which reach the office without depending on the mail provider at all. */
        var offerFallback = function (message) {
            if (status === null) return;

            var data = Object.fromEntries(new FormData(form));
            var labels = { name: 'שם', phone: 'טלפון', email: 'דוא״ל', subject: 'נושא', scope: 'תחומים', message: 'הודעה' };
            var body = Object.keys(labels)
                .filter(function (k) { return data[k]; })
                .map(function (k) { return labels[k] + ': ' + data[k]; })
                .join('\n');

            var waBase = form.getAttribute('data-fallback-wa');
            var email = form.getAttribute('data-fallback-email');
            var phone = form.getAttribute('data-fallback-phone');

            status.textContent = '';
            status.className = 'form-status form-status--err';

            var note = document.createElement('p');
            note.textContent = message;
            status.appendChild(note);

            var row = document.createElement('div');
            row.className = 'form-fallback';

            if (waBase) {
                var wa = document.createElement('a');
                wa.className = 'btn btn--solid btn--sm';
                wa.href = waBase + encodeURIComponent(body);
                wa.target = '_blank';
                wa.rel = 'noopener';
                wa.textContent = 'שליחה בוואטסאפ';
                row.appendChild(wa);
            }

            if (email) {
                var mail = document.createElement('a');
                mail.className = 'btn btn--line btn--sm';
                mail.href = 'mailto:' + email +
                    '?subject=' + encodeURIComponent('פנייה מהאתר' + (data.subject ? ': ' + data.subject : '')) +
                    '&body=' + encodeURIComponent(body);
                mail.textContent = 'שליחה במייל';
                row.appendChild(mail);
            }

            if (phone) {
                var tel = document.createElement('a');
                tel.className = 'btn btn--line btn--sm';
                tel.href = 'tel:' + phone.replace(/[^0-9+]/g, '');
                tel.textContent = phone;
                row.appendChild(tel);
            }

            status.appendChild(row);
        };

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var original = submit ? submit.textContent : '';

            if (submit !== null) {
                submit.disabled = true;
                submit.textContent = 'שולח…';
            }

            say('', true);

            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            })
                .then(function (res) {
                    return res.json()
                        .catch(function () { return {}; })
                        .then(function (body) {
                            // Only a 2xx means the office actually received it. Anything
                            // else must surface as a failure, never as a silent success.
                            if (res.ok === false) {
                                var err = new Error('contact endpoint ' + res.status);
                                err.serverMessage = body.error;
                                throw err;
                            }
                            return body;
                        });
                })
                .then(function () {
                    form.reset();
                    say('תודה! ההודעה נשלחה. נחזור אליכם בהקדם.', true);
                })
                .catch(function () {
                    // The form keeps its contents, so nothing the visitor typed is lost.
                    offerFallback('לא הצלחנו לשלוח את הפנייה מהאתר. הפרטים שמילאתם שמורים כאן, אפשר לשלוח אותם בלחיצה אחת:');
                })
                .finally(function () {
                    if (submit !== null) {
                        submit.disabled = false;
                        submit.textContent = original;
                    }
                });
        });
    }
    /* ---------- accessibility panel ----------
       Each option is a class on <html>; style.css does the rest. A short inline script in
       <head> restores the same classes before first paint, so the page never flashes at
       the default size for someone who enlarged it. */

    var a11y = document.getElementById('a11y');

    if (a11y !== null) {
        var A11Y_KEY = 'robas-a11y';
        var A11Y_FLAGS = ['contrast', 'links', 'spacing', 'motion'];
        var A11Y_SIZES = [100, 120, 140, 160];

        var a11yToggle = document.getElementById('a11yToggle');
        var a11yPanel = document.getElementById('a11yPanel');
        var a11yValue = document.getElementById('a11yTextValue');
        var a11yDown = a11y.querySelector('[data-a11y="text-down"]');
        var a11yUp = a11y.querySelector('[data-a11y="text-up"]');
        var a11yFlags = Array.prototype.slice.call(a11y.querySelectorAll('[data-a11y-flag]'));

        var readPrefs = function () {
            try {
                var saved = JSON.parse(window.localStorage.getItem(A11Y_KEY) || 'null');
                return saved !== null && typeof saved === 'object' ? saved : {};
            } catch (e) {
                return {};
            }
        };

        var prefs = readPrefs();

        var savePrefs = function () {
            try {
                window.localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
            } catch (e) {
                // storage blocked (private mode, site data off): settings still apply to this page
            }
        };

        var textStep = function () {
            var step = Number(prefs.text) || 0;
            return step >= 0 && step < A11Y_SIZES.length ? step : 0;
        };

        /* aria-disabled rather than disabled: a disabled button drops keyboard focus, so a
           visitor pressing "larger" until the limit would be thrown back to the page top. */
        var setDisabled = function (btn, off) {
            btn.setAttribute('aria-disabled', String(off));
        };

        var applyPrefs = function () {
            var step = textStep();

            for (var i = 1; i < A11Y_SIZES.length; i++) {
                root.classList.toggle('a11y-text-' + i, step === i);
            }

            A11Y_FLAGS.forEach(function (flag) {
                root.classList.toggle('a11y-' + flag, prefs[flag] === true);
            });

            a11yValue.textContent = A11Y_SIZES[step] + '%';
            setDisabled(a11yDown, step === 0);
            setDisabled(a11yUp, step === A11Y_SIZES.length - 1);

            a11yFlags.forEach(function (btn) {
                btn.setAttribute('aria-pressed', String(prefs[btn.getAttribute('data-a11y-flag')] === true));
            });
        };

        var setOpen = function (open) {
            a11yPanel.hidden = open === false;
            a11yToggle.setAttribute('aria-expanded', String(open));

            // focus the dialog itself, so a screen reader announces its name before the controls
            if (open) a11yPanel.focus();
        };

        /* --- read aloud ---
           The browser's own speech engine: nothing leaves the device, nothing loads from a
           third party. Written around the engines' known traps, all of which hit Android:

           - cancel() followed immediately by speak() can swallow the new speech, because the
             cancel lands asynchronously. So cancel() runs only when something is playing.
           - Some devices return an EMPTY voice list even though the system engine speaks fine.
             An empty list is treated as "unknown", not "no Hebrew"; only a list that has
             voices but none in Hebrew disables the button.
           - Utterances with no live reference can be garbage-collected mid-queue, so their
             end events never fire. They are kept in `queue` until reading ends.
           - Failure must never be silent: every error, and a start that never comes, ends
             with a visible message saying why. */

        var speech = window.speechSynthesis;
        var speechBox = document.getElementById('a11ySpeech');
        var readBtn = document.getElementById('a11yRead');
        var readHint = document.getElementById('a11yReadHint');
        var READ_HINT = 'סימון טקסט בעמוד לפני הלחיצה יקריא רק אותו.';
        var NO_HEBREW = 'במכשיר זה לא מותקן קול בעברית. אפשר להוסיף אותו בהגדרות ההקראה (טקסט לדיבור) של המכשיר, או להיעזר בקורא המסך.';
        var voicesKnown = false;
        var reading = false;
        var queue = [];
        var startWatch = null;

        var isHebrew = function (voice) {
            return /^(he|iw)([-_]|$)/i.test(voice.lang);
        };

        /* Asked fresh at the moment of speaking: a voice object kept from an earlier list
           can go stale after `voiceschanged`, and some engines then drop it silently. */
        var pickVoice = function () {
            var voices = speech.getVoices();
            var local = null;
            var any = null;

            for (var i = 0; i < voices.length; i++) {
                if (isHebrew(voices[i]) === false) continue;
                if (any === null) any = voices[i];
                if (local === null && voices[i].localService === true) local = voices[i];
            }

            return { voice: local || any, listed: voices.length };
        };

        // the button is disabled only when the list is real, non-empty, and has no Hebrew
        var noHebrewVoice = function () {
            var found = pickVoice();
            return voicesKnown === true && found.listed > 0 && found.voice === null;
        };

        var syncReadButton = function (message) {
            var unavailable = reading === false && noHebrewVoice();

            setDisabled(readBtn, unavailable);
            readBtn.setAttribute('aria-pressed', String(reading));
            readBtn.textContent = reading ? 'עצירת ההקראה' : 'הקראת העמוד';
            readHint.textContent = message || (unavailable ? NO_HEBREW : READ_HINT);
        };

        var finishReading = function (message) {
            window.clearTimeout(startWatch);
            reading = false;
            queue = [];
            syncReadButton(message);
        };

        var stopReading = function () {
            if (speech === undefined) return;
            if (speech.speaking || speech.pending) speech.cancel();
            finishReading();
        };

        var failMessage = function (code) {
            if (code === 'language-unavailable' || code === 'voice-unavailable') return NO_HEBREW;
            if (code === 'not-allowed') return 'הדפדפן חסם את ההקראה. נסו ללחוץ שוב על הכפתור.';
            return 'ההקראה לא זמינה כרגע במכשיר הזה. אפשר להיעזר בקורא המסך של המכשיר.';
        };

        var pageText = function () {
            var selected = window.getSelection ? String(window.getSelection()).trim() : '';
            if (selected.length > 0) return selected;

            var main = document.getElementById('main');
            if (main === null) return '';

            // innerText already skips anything display:none; this hides the honeypot and breadcrumb
            root.classList.add('a11y-snapshot');
            var text = main.innerText;
            root.classList.remove('a11y-snapshot');
            return text;
        };

        /* Chrome drops a single utterance that runs past ~15 seconds, so the page is spoken
           a sentence or two at a time. */
        var toChunks = function (text) {
            var chunks = [];
            var buf = '';

            (text.match(/[^.!?;\n]+[.!?;]*/g) || []).forEach(function (part) {
                var piece = part.trim();
                if (piece === '') return;

                if (buf !== '' && (buf + ' ' + piece).length > 220) {
                    chunks.push(buf);
                    buf = piece;
                } else {
                    buf = buf === '' ? piece : buf + ' ' + piece;
                }
            });

            if (buf !== '') chunks.push(buf);
            return chunks;
        };

        var startReading = function () {
            var chunks = toChunks(pageText());
            if (chunks.length === 0) return;

            var voice = pickVoice().voice;
            var started = false;

            // only cancel something that is actually playing: see the note at the top
            if (speech.speaking || speech.pending) speech.cancel();

            // an engine left paused (tab was in the background) ignores new speech until resumed
            if (typeof speech.resume === 'function') speech.resume();

            reading = true;
            queue = [];
            syncReadButton();

            chunks.forEach(function (chunk, i) {
                var u = new SpeechSynthesisUtterance(chunk);
                u.lang = voice !== null ? voice.lang : 'he-IL';
                if (voice !== null) u.voice = voice;

                u.onstart = function () { started = true; window.clearTimeout(startWatch); };

                if (i === chunks.length - 1) {
                    u.onend = function () { if (reading) finishReading(); };
                }

                u.onerror = function (e) {
                    // our own cancel() reports itself as an error; that is not a failure
                    if (e.error === 'interrupted' || e.error === 'canceled') return;
                    if (window.console) window.console.warn('[a11y] speech error:', e.error);
                    if (speech.speaking || speech.pending) speech.cancel();
                    finishReading(failMessage(e.error));
                };

                queue.push(u);   // hold a reference until reading ends, or it can be collected
                speech.speak(u);
            });

            // the engine accepted the queue but never began: say so instead of sitting silent
            startWatch = window.setTimeout(function () {
                if (started === false && reading === true) {
                    if (window.console) window.console.warn('[a11y] speech never started');
                    if (speech.speaking || speech.pending) speech.cancel();
                    finishReading(failMessage(pickVoice().voice === null ? 'language-unavailable' : 'synthesis-failed'));
                }
            }, 6000);
        };

        if (speech === undefined || typeof window.SpeechSynthesisUtterance !== 'function') {
            speechBox.hidden = true;
        } else {
            var settleVoices = function () {
                if (pickVoice().listed > 0) voicesKnown = true;
                if (reading === false) syncReadButton();
            };

            settleVoices();

            if (typeof speech.addEventListener === 'function') {
                speech.addEventListener('voiceschanged', settleVoices);
            }

            // engines that never fire voiceschanged: look once more after a moment
            window.setTimeout(settleVoices, 1500);

            readBtn.addEventListener('click', function () {
                if (readBtn.getAttribute('aria-disabled') === 'true') return;
                if (reading) stopReading();
                else startReading();
            });

            window.addEventListener('pagehide', stopReading);
        }

        /* --- wiring --- */

        a11yToggle.addEventListener('click', function () {
            setOpen(a11yPanel.hidden === true);
        });

        a11y.querySelector('.a11y__close').addEventListener('click', function () {
            setOpen(false);
            a11yToggle.focus();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && a11yPanel.hidden === false) {
                setOpen(false);
                a11yToggle.focus();
            }
        });

        document.addEventListener('click', function (e) {
            if (a11yPanel.hidden === false && a11y.contains(e.target) === false) setOpen(false);
        });

        a11yPanel.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (btn === null || btn.getAttribute('aria-disabled') === 'true') return;

            var action = btn.getAttribute('data-a11y');
            var flag = btn.getAttribute('data-a11y-flag');

            if (action === 'text-up') {
                prefs.text = Math.min(textStep() + 1, A11Y_SIZES.length - 1);
            } else if (action === 'text-down') {
                prefs.text = Math.max(textStep() - 1, 0);
            } else if (action === 'reset') {
                prefs = {};
                stopReading();
            } else if (flag !== null) {
                prefs[flag] = prefs[flag] !== true;
            } else {
                return;
            }

            applyPrefs();
            savePrefs();
        });

        applyPrefs();
    }
})();
