/* ============================================
   ROBAS LAW — Main JavaScript (Multi-page)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ===== NAVIGATION SCROLL EFFECT =====
    const nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                nav.classList.add('nav--scrolled');
            } else {
                nav.classList.remove('nav--scrolled');
            }
        }, { passive: true });

        if (nav.classList.contains('nav--dark')) {
            nav.classList.add('nav--scrolled');
        }
    }

    // ===== MOBILE MENU =====
    const burger = document.getElementById('navBurger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = nav ? nav.offsetHeight : 0;
                const top = target.getBoundingClientRect().top + window.scrollY - offset - 20;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ===== INTERSECTION OBSERVER — REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll('.reveal, .reveal-slide');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    // ===== ACTIVE NAV LINK =====
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .nav__dropdown-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('nav__link--active');
        }
    });

    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'שולח...';
            btn.disabled = true;

            try {
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData);

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    contactForm.style.display = 'none';
                    const success = document.getElementById('formSuccess');
                    if (success) success.style.setProperty('display', 'block', 'important');
                } else {
                    throw new Error('Server error');
                }
            } catch (err) {
                btn.textContent = originalText;
                btn.disabled = false;
                alert('שגיאה בשליחת הטופס. אנא נסו שוב או צרו קשר בטלפון.');
            }
        });
    }
});
