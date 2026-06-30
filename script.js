/* =================================================================
   PRIME AUTO CARE — script.js
   Vanilla JS. No frameworks.
   Handles: load sequence, navbar, mobile menu, scroll reveals,
   animated counters, smooth scroll, back-to-top, form handling.
   All motion respects prefers-reduced-motion and degrades safely.
================================================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* -----------------------------------------------------------
     1. PAGE LOAD SEQUENCE (navbar slide-down + hero fade-up)
  ----------------------------------------------------------- */
  function runLoad() {
    const navbar = $('#navbar');
    const hero = $('#hero');
    // tiny rAF so the initial transform state is registered first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (navbar) navbar.classList.add('nav-ready');
        if (hero) hero.classList.add('hero-loaded');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runLoad);
  } else {
    runLoad();
  }

  /* -----------------------------------------------------------
     2. STICKY NAVBAR — add shadow/glass once scrolled
  ----------------------------------------------------------- */
  const navbar = $('#navbar');
  function onScrollNav() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* -----------------------------------------------------------
     3. MOBILE MENU
  ----------------------------------------------------------- */
  const hamburger = $('#hamburger');
  const navLinks = $('#nav-links');

  function closeMenu() {
    if (!hamburger || !navLinks) return;
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
  }
  function toggleMenu() {
    if (!hamburger || !navLinks) return;
    const open = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (hamburger) hamburger.addEventListener('click', toggleMenu);

  // close menu when a link is tapped
  if (navLinks) {
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeMenu();
    });
  }
  // close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  // close if resized to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 940) closeMenu();
  });

  /* -----------------------------------------------------------
     4. SMOOTH INTERNAL SCROLL (with navbar offset)
  ----------------------------------------------------------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* -----------------------------------------------------------
     5. SCROLL REVEAL (IntersectionObserver) + stagger
        Safe fallback: if observer unsupported OR reduced motion,
        every element is shown immediately.
  ----------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');

  function showAll() {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    // stagger items that share a grid parent
    const staggerParents = $$(
      '.services-grid, .why-cards, .gallery-grid, .testi-cards, .process-grid, .stats-grid'
    );
    staggerParents.forEach((parent) => {
      $$('[data-reveal]', parent).forEach((el, i) => {
        el.style.setProperty('--stagger', (i % 4) * 90 + 'ms');
      });
    });

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Failsafe: if anything is still hidden after load, reveal it
    window.addEventListener('load', () => {
      setTimeout(() => {
        revealEls.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add('in');
        });
      }, 600);
    });
  }

  /* -----------------------------------------------------------
     6. ANIMATED COUNTERS
  ----------------------------------------------------------- */
  const counters = $$('.counter');

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const cObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((c) => cObs.observe(c));
    }
  }

  /* -----------------------------------------------------------
     7. BACK TO TOP
  ----------------------------------------------------------- */
  const toTop = $('#to-top');
  if (toTop) {
    const onScrollTop = () => toTop.classList.toggle('show', window.scrollY > 600);
    onScrollTop();
    window.addEventListener('scroll', onScrollTop, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* -----------------------------------------------------------
     8. BOOKING FORM
  ----------------------------------------------------------- */
  const form = $('#booking-form');
  const status = $('#form-status');

  if (form) {
    // prevent past dates
    const dateInput = $('#date', form);
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = $$('[required]', form);
      let valid = true;
      required.forEach((field) => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = 'var(--red)';
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) {
        if (status) {
          status.textContent = 'Please complete the highlighted fields.';
          status.className = 'form-status err';
        }
        return;
      }

      const name = ($('#name', form).value || 'there').split(' ')[0];
      if (status) {
        status.textContent =
          'Thanks, ' + name + ' — your request is in. We\'ll confirm your appointment shortly.';
        status.className = 'form-status ok';
      }
      form.reset();
    });

    // clear error styling as the user types
    form.addEventListener('input', (e) => {
      if (e.target.matches('[required]') && e.target.value.trim()) {
        e.target.style.borderColor = '';
      }
    });
  }

  /* -----------------------------------------------------------
     9. FOOTER YEAR
  ----------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
