(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Loader → hero reveal ---------- */
  document.body.classList.add('is-loading');
  const loader = $('.loader');
  const startHero = () => {
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    setTimeout(() => {
      $('.hero__title').classList.add('is-in');
      $$('.hero .reveal-up').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 350 + i * 120));
    }, 250);
    setTimeout(() => loader.remove(), 1400);
  };
  window.addEventListener('load', () => setTimeout(startHero, reduce ? 0 : 1300));
  setTimeout(() => { if (document.body.contains(loader) && !loader.classList.contains('done')) startHero(); }, 4000);

  /* ---------- Split about text into words ---------- */
  $$('.reveal-words').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ---------- Scroll reveals ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .roster__item, .contact__title .line').forEach((el, i) => {
    if (el.classList.contains('roster__item')) el.style.transitionDelay = (i % 11) * 0.05 + 's';
    io.observe(el);
  });

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to, dur = reduce ? 1 : 1600, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(c => countIO.observe(c));

  /* ---------- Nav hide on scroll + scroll-driven effects ---------- */
  const nav = $('.nav');
  let lastY = 0, ticking = false;
  const words = $$('.reveal-words .w');
  const steps = $$('.step');
  const process = $('.process');
  const bar = $('.process__progress span');
  const blobs = $$('.hero__blob');

  const onScroll = () => {
    const y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;

    // word-by-word highlight
    words.forEach(w => {
      const r = w.getBoundingClientRect();
      w.classList.toggle('on', r.top < vh * 0.78);
    });

    // process progress + active step
    if (process) {
      const r = process.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.5 - r.top) / (r.height - vh * 0.3), 0), 1);
      bar.style.transform = `scaleX(${p})`;
      steps.forEach(s => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle('active', sr.top < vh * 0.7);
      });
    }

    // hero parallax
    if (!reduce && y < vh * 1.2) {
      blobs[0] && (blobs[0].style.translate = `0 ${y * 0.25}px`);
      blobs[1] && (blobs[1].style.translate = `0 ${y * -0.15}px`);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.nav__menu'), menu = $('.mobile-menu');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open);
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  if (!fine || reduce) return;

  /* ---------- Custom cursor ---------- */
  const cursor = $('.cursor'), label = $('.cursor__label');
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  const loop = () => {
    cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-hover'); });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });

  /* ---------- Magnetic buttons ---------- */
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .4s';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 600);
    });
  });

  /* ---------- Card spotlight + tilt ---------- */
  $$('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      const rx = ((y / r.height) - 0.5) * -6, ry = ((x / r.width) - 0.5) * 6;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = ''));
  });
})();
