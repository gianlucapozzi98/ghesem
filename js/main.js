/* Ghe sem · Concorezzo — comportamento del sito
   Nessuna dipendenza. Gli orari si cambiano qui sotto (e nella tabella in HTML). */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  /* Con "Riduci movimento" (iPhone) o "Rimuovi animazioni" (Android) le animazioni
     restano tutte: si spegne solo il parallax. Lo zoom lento delle foto si spegne nel CSS. */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     DATI DEL LOCALE
     Orari in minuti dalla mezzanotte, per giorno (0 = domenica).
     ------------------------------------------------------------------ */
  const HOURS = {
    0: null,
    1: [7 * 60, 17 * 60 + 30],
    2: [7 * 60, 17 * 60 + 30],
    3: [7 * 60, 17 * 60 + 30],
    4: [7 * 60, 17 * 60],
    5: [7 * 60, 17 * 60 + 30],
    6: [11 * 60, 15 * 60],
  };
  const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  /* ------------------------------------------------------------------
     Ora corrente a Roma, qualunque sia il fuso del visitatore
     ------------------------------------------------------------------ */
  function romeNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
    return { dow, mins: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function openStatus() {
    const { dow, mins } = romeNow();
    const today = HOURS[dow];
    if (today && mins >= today[0] && mins < today[1]) {
      const left = today[1] - mins;
      return {
        open: true,
        text: left <= 30
          ? `Ultimo giro di caffè · chiudiamo alle ${fmt(today[1])}`
          : `Aperto ora · fino alle ${fmt(today[1])}`,
      };
    }
    if (today && mins < today[0]) return { open: false, text: `Chiuso · apriamo alle ${fmt(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (dow + i) % 7;
      if (HOURS[d]) return { open: false, text: `Chiuso · riapriamo ${i === 1 ? 'domani' : DAY_NAMES[d]} alle ${fmt(HOURS[d][0])}` };
    }
    return { open: false, text: 'Chiuso' };
  }

  function paintStatus() {
    const s = openStatus();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      $('[data-status-text]', el).textContent = s.text;
    });
    const { dow } = romeNow();
    $$('.hours tr').forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.dow) === dow));
  }
  paintStatus();
  setInterval(paintStatus, 60 * 1000);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Nav, progress bar, barra mobile
     ------------------------------------------------------------------ */
  const nav = $('[data-nav]');
  const bar = $('#progress');
  const mbar = $('.mbar');
  let ticking = false;
  let heroObserved = false;

  /* ------------------------------------------------------------------
     Il logo grande dell'hero: scorrendo sale insieme alla pagina e si
     rimpicciolisce fino al posto del logo nella barra. Arrivato lì, il logo
     della barra prende il suo posto e la barra diventa piena.
     ------------------------------------------------------------------ */
  const heroLogo = $('.hero-logo');
  const navLogo = $('.nav .logo');
  let logoHome = null; /* dov'è il logo grande a pagina ferma, e quanto è alto */
  let flyEnd = 40;     /* da qui in giù il logo è nella barra */

  function measureLogo() {
    if (!heroLogo) return;
    heroLogo.style.transform = '';
    const r = heroLogo.getBoundingClientRect();
    const t = navLogo.getBoundingClientRect();
    logoHome = { x: r.left, y: r.top + window.scrollY, h: r.height };
    flyEnd = Math.max(80, logoHome.y - t.top);
  }

  function flyLogo(y) {
    if (!logoHome) return;
    const docked = y >= flyEnd;
    const p = Math.min(1, Math.max(0, y) / flyEnd);
    document.body.classList.toggle('logo-docked', docked);
    heroLogo.classList.toggle('is-docked', docked);
    if (docked || reduceMotion) { heroLogo.style.transform = ''; return; }
    const t = navLogo.getBoundingClientRect();
    const s = 1 + (t.height / logoHome.h - 1) * p;
    const dx = (t.left - logoHome.x) * p;
    const dy = (t.top - logoHome.y + flyEnd) * p; /* quasi zero: il logo sale con la pagina */
    heroLogo.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }

  function onScroll() {
    const y = window.scrollY;
    flyLogo(y);
    nav.classList.toggle('is-solid', y >= flyEnd);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!heroObserved) mbar.classList.toggle('is-on', y > innerHeight * 0.55);
    parallax();
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { measureLogo(); onScroll(); });
  /* i font cambiano di poco l'altezza dei testi dell'hero: si rimisura quando sono pronti */
  measureLogo();
  if (document.fonts) document.fonts.ready.then(() => { measureLogo(); onScroll(); });
  addEventListener('load', () => { measureLogo(); onScroll(); });

  /* menu mobile */
  const burger = $('.burger');
  const mnav = $('#mnav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    mnav.setAttribute('aria-hidden', String(!open));
  }
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ------------------------------------------------------------------
     Link interni (#eventi, #lavoro, #top...): la pagina scorre alla sezione
     ma l'indirizzo resta pulito, senza il # in fondo
     ------------------------------------------------------------------ */
  const cleanUrl = () => location.pathname + location.search;
  function goTo(target, smooth) {
    const root = document.documentElement;
    if (!smooth) root.style.scrollBehavior = 'auto';
    if (target.id === 'top') window.scrollTo(0, 0); else target.scrollIntoView();
    if (!smooth) root.style.scrollBehavior = '';
    /* chi usa la tastiera riparte da lì, come con un link normale */
    if (!target.matches('a, button, input, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    const target = a && a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    goTo(target, true);
  });
  /* chi arriva da un link con il # (es. ghesem.../#eventi) finisce comunque sulla sezione */
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    history.replaceState(null, '', cleanUrl());
    if (target) {
      goTo(target, false);
      /* foto e font possono spostare la pagina mentre arrivano: a caricamento finito si
         riallinea, a meno che il visitatore non abbia già iniziato a scorrere da solo */
      let moved = false;
      ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, () => { moved = true; }, { once: true, passive: true }));
      addEventListener('load', () => { if (!moved) goTo(target, false); }, { once: true });
    }
  }

  /* ------------------------------------------------------------------
     Reveal allo scroll
     ------------------------------------------------------------------ */
  const reveals = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Hero: stories (tre momenti della giornata)
     ------------------------------------------------------------------ */
  /* Il cambio di slide è guidato da un timer, non dall'animazione CSS della barra:
     se un browser accorcia le animazioni a 0 ms le slide si rincorrerebbero a
     raffica (sfarfallio). Con "riduci movimento" resta la dissolvenza, lo zoom no.
     Con ?statico lo slideshow resta fermo. */
  const hero = $('.hero');
  const slides = $$('.slide');
  const stories = $$('.story');
  const SLIDE_MS = 6000;
  const autoplay = !/[?&]statico\b/.test(location.search);
  let cur = 0;
  let timer = 0;
  let heroVisible = true;

  if (!autoplay) hero.classList.add('is-still');

  function schedule(delay = SLIDE_MS) {
    clearTimeout(timer);
    if (!(autoplay && heroVisible && !document.hidden)) return;
    timer = setTimeout(() => {
      const next = slides[(cur + 1) % slides.length];
      /* rete lenta: la foto successiva non è ancora arrivata, si aspetta */
      if (!next.complete || !next.naturalWidth) { schedule(400); return; }
      /* la foto viene decodificata prima della dissolvenza: farlo a metà blocca il telefono */
      const go = () => showSlide(cur + 1);
      if (next.decode) next.decode().then(go, go); else go();
    }, delay);
  }

  function showSlide(i) {
    cur = (i + slides.length) % slides.length;
    /* le foto sotto restano opache: quella nuova sfuma sopra, senza buchi scuri */
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === cur);
      s.classList.toggle('is-on', k <= cur);
    });
    stories.forEach((s, k) => {
      s.classList.remove('is-active');
      s.classList.toggle('is-done', k < cur);
      if (k === cur) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current');
    });
    void stories[cur].offsetWidth; /* riavvia l'animazione della barra */
    stories[cur].classList.add('is-active');
    schedule();
  }
  stories.forEach((s, i) => s.addEventListener('click', () => showSlide(i)));

  /* parte subito: il timer di 6 secondi e la barra iniziano insieme, e intanto si
     "scaldano" le altre due foto così sono già decodificate al primo cambio */
  if (autoplay) hero.classList.add('is-playing');
  slides.forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  showSlide(0);

  /* lo slideshow si ferma quando l'hero non si vede o la scheda è in background */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const was = heroVisible;
      heroVisible = e.isIntersecting;
      if (heroVisible && !was) showSlide(cur); else schedule();
    }, { threshold: 0.15 }).observe(hero);
    /* la barra mobile compare quando l'hero esce: niente soglie sullo scroll, che
       con la barra del browser che appare e scompare farebbero lampeggiare */
    new IntersectionObserver(([e]) => mbar.classList.toggle('is-on', !e.isIntersecting), { threshold: 0.45 }).observe(hero);
    heroObserved = true;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && heroVisible) showSlide(cur); else schedule();
  });

  /* ------------------------------------------------------------------
     Animazioni infinite: partono solo quando il blocco è a schermo
     ------------------------------------------------------------------ */
  const liveEls = $$('[data-live]');
  if ('IntersectionObserver' in window) {
    const lo = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '80px' });
    liveEls.forEach((el) => lo.observe(el));
  } else {
    liveEls.forEach((el) => el.classList.add('is-live'));
  }

  /* ------------------------------------------------------------------
     Manifesto: le parole si accendono mentre scorri
     ------------------------------------------------------------------ */
  const mText = $('#manifestoText');
  let words = [];
  if (mText) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = tok; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(mText);
    words = $$('.w', mText);
  }
  let lastWords = -1;
  function paintWords() {
    if (!words.length) return;
    const r = mText.getBoundingClientRect();
    const start = innerHeight * 0.85;
    const end = innerHeight * 0.35;
    const p = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height * 0.6)));
    const n = Math.round(p * words.length);
    if (n === lastWords) return; /* tocca il DOM solo quando cambia qualcosa */
    lastWords = n;
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* ------------------------------------------------------------------
     Parallax leggero
     ------------------------------------------------------------------ */
  const pxEls = $$('[data-parallax]');
  function parallax() {
    paintWords();
    if (reduceMotion) return;
    const vh = innerHeight;
    pxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-c * parseFloat(el.dataset.parallax) * 120).toFixed(1)}px, 0) scale(1.12)`;
    });
  }

  /* ------------------------------------------------------------------
     Contatori
     ------------------------------------------------------------------ */
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target; const to = Number(el.dataset.count); const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / 1400);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* ------------------------------------------------------------------
     Una giornata: foto e orologio cambiano con lo scroll
     ------------------------------------------------------------------ */
  const steps = $$('.day-step');
  const dayImgs = $$('.day-img');
  const clocks = $$('.clock span');
  if (steps.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = Number(e.target.dataset.i);
        steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
        dayImgs.forEach((s, k) => s.classList.toggle('is-active', k === i));
        clocks.forEach((s, k) => s.classList.toggle('is-active', k === i));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => so.observe(s));
  }

  /* ------------------------------------------------------------------
     Galleria + lightbox
     ------------------------------------------------------------------ */
  const tiles = $$('.tile');
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  let lbIndex = 0;
  let lastFocus = null;

  function openLb(i) {
    lbIndex = (i + tiles.length) % tiles.length;
    const img = $('img', tiles[lbIndex]);
    lbImg.src = tiles[lbIndex].dataset.full;
    lbImg.alt = img.alt;
    if (lb.hidden) { lastFocus = document.activeElement; lb.hidden = false; document.body.classList.add('no-scroll'); $('.lb-close', lb).focus(); }
  }
  function closeLb() {
    lb.hidden = true; document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }
  tiles.forEach((t, i) => t.addEventListener('click', () => openLb(i)));
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', () => openLb(lbIndex - 1));
  $('.lb-next', lb).addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });

  /* ------------------------------------------------------------------
     Mappa: si carica solo al click (nessun cookie di terze parti prima)
     ------------------------------------------------------------------ */
  const mapBtn = $('#mapBtn');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const box = $('.mapbox');
      const f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=Via%20Remo%20Brambilla%2023%2C%2020863%20Concorezzo%20MB%2C%20Italia&z=16&hl=it&output=embed';
      f.title = 'Mappa: Ghe sem, Via Remo Brambilla 23, Concorezzo';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      box.classList.add('is-loaded');
    });
  }

  onScroll();
})();
