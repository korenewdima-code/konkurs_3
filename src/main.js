import './style.css';
import { trackGalleryOpen } from './goals.js';

/* ---------- Мобильное меню ---------- */
const menuBtn = document.querySelector('.mnav-btn');
const menu = document.getElementById('mnav');
if (menuBtn && menu) {
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.material-symbols-outlined').textContent = open ? 'close' : 'menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) setMenu(false);
  });
}

/* ---------- Свайп (общий помощник) ---------- */
function attachSwipe(area, track, { onPrev, onNext, getIndex }) {
  let x0 = null;
  let y0 = null;
  let dx = 0;
  let locked = null; // 'x' | 'y'
  area.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      dx = 0;
      locked = null;
    },
    { passive: true },
  );
  area.addEventListener(
    'touchmove',
    (e) => {
      if (x0 === null) return;
      const mx = e.touches[0].clientX - x0;
      const my = e.touches[0].clientY - y0;
      if (!locked) locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked !== 'x') return;
      dx = mx;
      track.classList.add('is-dragging');
      track.style.transform = `translateX(calc(${-getIndex() * 100}% + ${dx}px))`;
    },
    { passive: true },
  );
  const end = () => {
    if (x0 === null) return;
    track.classList.remove('is-dragging');
    const w = area.clientWidth || 1;
    if (locked === 'x' && Math.abs(dx) > Math.min(60, w * 0.15)) {
      dx < 0 ? onNext() : onPrev();
    } else {
      track.style.transform = `translateX(${-getIndex() * 100}%)`;
    }
    x0 = null;
  };
  area.addEventListener('touchend', end);
  area.addEventListener('touchcancel', end);
}

/* ---------- Галереи призов ---------- */
const galleries = [];

document.querySelectorAll('.gallery').forEach((root) => {
  const frame = root.querySelector('.g-frame');
  const track = root.querySelector('.g-track');
  const slides = [...root.querySelectorAll('.g-slide')];
  const imgs = slides.map((s) => s.querySelector('img'));
  const pills = [...root.querySelectorAll('.g-pill')];
  const thumbs = [...root.querySelectorAll('.g-thumb')];
  const dots = [...root.querySelectorAll('.g-dot')];
  const pillBar = root.querySelector('.g-pills');
  const thumbBar = root.querySelector('.g-thumbs');
  const count = root.querySelector('.g-count');
  const n = slides.length;
  let index = 0;

  const eager = (i) => {
    const img = imgs[(i + n) % n];
    if (img && img.loading === 'lazy') img.loading = 'eager';
  };

  // Прокрутка полосы внутри карточки — без прокрутки страницы
  const scrollIntoBar = (bar, el) => {
    if (!bar || !el) return;
    const left = el.offsetLeft - bar.offsetLeft;
    const target = left - (bar.clientWidth - el.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  };

  function go(i) {
    index = (i + n) % n;
    track.style.transform = `translateX(${-index * 100}%)`;
    eager(index);
    eager(index + 1);
    eager(index - 1);
    count.textContent = `${index + 1} / ${n}`;
    pills.forEach((p, k) => p.setAttribute('aria-pressed', String(k === index)));
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === index)));
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
    scrollIntoBar(thumbBar, thumbs[index]);
    scrollIntoBar(pillBar, pills[index]);
  }

  // Убираем затухание, когда полоса докручена до конца
  [pillBar, thumbBar].forEach((bar) => {
    const upd = () => bar.classList.toggle('at-end', bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 2);
    bar.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });

  root.querySelector('.g-prev').addEventListener('click', () => go(index - 1));
  root.querySelector('.g-next').addEventListener('click', () => go(index + 1));
  pills.forEach((p) => p.addEventListener('click', () => go(+p.dataset.i)));
  thumbs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.i)));

  frame.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });

  attachSwipe(frame, track, { onPrev: () => go(index - 1), onNext: () => go(index + 1), getIndex: () => index });

  const data = {
    el: root,
    id: root.dataset.gallery,
    title: root.dataset.title,
    items: imgs.map((img, k) => ({
      src: img.getAttribute('src'),
      w: img.getAttribute('width'),
      h: img.getAttribute('height'),
      alt: img.alt,
      caption: pills[k] ? pills[k].textContent : '',
    })),
    get index() { return index; },
    go,
  };
  galleries.push(data);

  root.querySelector('.g-open').addEventListener('click', () => openLightbox(data, index));

  // Подгружаем соседей, когда галерея подходит к экрану
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          eager(0);
          eager(1);
          eager(n - 1);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(frame);
  }
});

/* ---------- Лайтбокс ---------- */
const lb = document.getElementById('lightbox');
const lbTrack = lb.querySelector('.lb-track');
const lbStage = lb.querySelector('.lb-stage');
const lbTitle = lb.querySelector('.lb-title');
const lbCount = lb.querySelector('.lb-count');
const lbCaption = lb.querySelector('.lb-caption');
let lbData = null;
let lbIndex = 0;
let lastFocus = null;

function lbGo(i) {
  const n = lbData.items.length;
  lbIndex = (i + n) % n;
  lbTrack.style.transform = `translateX(${-lbIndex * 100}%)`;
  [lbIndex, lbIndex + 1, lbIndex - 1].forEach((k) => {
    const img = lbTrack.children[(k + n) % n].querySelector('img');
    if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
  });
  lbCount.textContent = `${lbIndex + 1} из ${n}`;
  lbCaption.textContent = lbData.items[lbIndex].caption;
  lbData.go(lbIndex); // синхронизируем карточку
}

function openLightbox(data, start) {
  lbData = data;
  lastFocus = document.activeElement;
  lbTitle.textContent = data.title;
  lbTrack.innerHTML = data.items
    .map(
      (it) =>
        `<div class="lb-slide p-2 md:px-20"><img data-src="${it.src}" width="${it.w}" height="${it.h}" alt="${it.alt.replace(/"/g, '&quot;')}" decoding="async" class="max-h-full max-w-full rounded-xl object-contain" style="width:auto;height:auto" /></div>`,
    )
    .join('');
  lbTrack.style.transition = 'none';
  lb.hidden = false;
  lb.classList.add('is-open');
  document.documentElement.classList.add('lb-lock');
  lbGo(start);
  requestAnimationFrame(() => { lbTrack.style.transition = ''; });
  lb.querySelector('.lb-close').focus();
  trackGalleryOpen(data.el);
}

function closeLightbox() {
  lb.classList.remove('is-open');
  lb.hidden = true;
  document.documentElement.classList.remove('lb-lock');
  lbTrack.innerHTML = '';
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
lb.querySelector('.lb-prev').addEventListener('click', () => lbGo(lbIndex - 1));
lb.querySelector('.lb-next').addEventListener('click', () => lbGo(lbIndex + 1));
lbStage.addEventListener('click', (e) => {
  if (e.target.classList.contains('lb-slide')) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') lbGo(lbIndex - 1);
  else if (e.key === 'ArrowRight') lbGo(lbIndex + 1);
  else if (e.key === 'Tab') {
    // держим фокус внутри диалога
    const f = [...lb.querySelectorAll('button')];
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});
attachSwipe(lbStage, lbTrack, { onPrev: () => lbGo(lbIndex - 1), onNext: () => lbGo(lbIndex + 1), getIndex: () => lbIndex });
