/* ============================================================
   ROBAS LAW — site behaviour
   ============================================================ */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
                }, reduced ? 0 : 350);
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

        if (slides.length > 1 && reduced === false) {
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
                if (document.hidden === false) {
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

    if (bands.length > 0 && reduced === false) {
        var ticking = false;

        var positionBands = function () {
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

    if (reduced === true || 'IntersectionObserver' in window === false) {
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
                    if (res.ok === false) throw new Error('bad status ' + res.status);
                    return res.json().catch(function () { return {}; });
                })
                .then(function () {
                    form.reset();
                    say('תודה! ההודעה נשלחה. נחזור אליכם בהקדם.', true);
                })
                .catch(function () {
                    say('אירעה תקלה בשליחה. אפשר להתקשר אלינו ל-09-8612894 או לכתוב ל-office@robas-law.co.il', false);
                })
                .finally(function () {
                    if (submit !== null) {
                        submit.disabled = false;
                        submit.textContent = original;
                    }
                });
        });
    }
})();
