// Генерирует разметку галерей призов и вставляет её в index.html
// между маркерами <!-- gallery:prizeN --> ... <!-- /gallery:prizeN -->.
// Запуск: node scripts/build-galleries.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

function webpSize(file) {
  const b = readFileSync(ROOT + 'public/img/' + file);
  const fmt = b.toString('ascii', 12, 16);
  if (fmt === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (fmt === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (fmt === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  throw new Error('unknown webp ' + file);
}

const prizes = {
  prize1: {
    name: 'Лапшерезка Marcato Atlas 150 Plus, красная',
    photos: [
      ['p1-01-v-dele', 'В деле'],
      ['p1-02-rakurs', 'Ракурс 3/4'],
      ['p1-03-razmery', 'Размеры'],
      ['p1-04-krupno', 'Крупно'],
      ['p1-05-na-stole', 'На столе'],
      ['p1-06-na-kuhne', 'На кухне'],
      ['p1-07-loft', 'Лофт-кухня'],
      ['p1-08-svetlaya-kuhnya', 'Светлая кухня'],
      ['p1-09-s-testom', 'С тестом'],
      ['p1-10-temnyi-stol', 'На тёмном столе'],
      ['p1-11-detali', 'Детали'],
      ['p1-12-tolshina', 'Регулировка толщины'],
    ],
  },
  prize2: {
    name: 'Лапшерезка Marcato Atlas 150, хром',
    photos: [
      ['p2-01-na-dereve', 'На дереве с мукой'],
      ['p2-02-v-dele', 'В деле'],
      ['p2-03-s-pastoy', 'С пастой'],
      ['p2-04-krupno', 'Крупно'],
      ['p2-05-sboku', 'Сбоку'],
      ['p2-06-speredi', 'Спереди'],
      ['p2-07-atlas150', 'Atlas 150'],
      ['p2-08-preimushestva', 'Преимущества'],
      ['p2-09-funkcii', 'Функции'],
      ['p2-10-vidy-pasty', 'Виды пасты'],
      ['p2-11-recept-testa', 'Рецепт теста'],
    ],
  },
  prize3: {
    name: 'Форма для кекса Emile Henry, гранат',
    photos: [
      ['p3-01-s-keksom', 'С кексом'],
      ['p3-02-s-hlebom', 'С хлебом'],
      ['p3-03-rezhem', 'Режем в форме'],
      ['p3-04-k-prazdniku', 'К празднику'],
      ['p3-05-v-duhovke', 'В духовке'],
      ['p3-06-rakurs', 'Ракурс 3/4'],
      ['p3-07-speredi', 'Спереди'],
      ['p3-08-sverhu', 'Сверху'],
      ['p3-09-razmery', 'Размеры'],
      ['p3-10-made-in-france', 'Made in France'],
      ['p3-11-s-1850', 'С 1850 года'],
      ['p3-12-ruchnaya-rabota', 'Ручная работа'],
    ],
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function gallery(id, { name, photos }) {
  const n = photos.length;
  const alt = (cap) => esc(`${name} — ${cap.toLowerCase().startsWith('made') ? cap : cap.charAt(0).toLowerCase() + cap.slice(1)}`);
  const pills = photos
    .map(
      ([, cap], i) =>
        `<button type="button" class="g-pill shrink-0 whitespace-nowrap rounded-full bg-surface-container-high px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-biscuit" data-i="${i}" aria-pressed="${i === 0}">${esc(cap)}</button>`,
    )
    .join('');
  const slides = photos
    .map(([f, cap], i) => {
      const [w, h] = webpSize(`${f}.webp`);
      return `<figure class="g-slide m-0" aria-label="${i + 1} из ${n}"><img src="/img/${f}.webp" width="${w}" height="${h}" alt="${alt(cap)}" loading="lazy" decoding="async" class="h-full w-full object-contain" /></figure>`;
    })
    .join('');
  const thumbs = photos
    .map(([f, cap], i) => {
      const [w, h] = webpSize(`thumb/${f}.webp`);
      return `<button type="button" class="g-thumb h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-transparent bg-surface-pure opacity-70 transition-opacity hover:opacity-100 md:h-[72px] md:w-[72px]" data-i="${i}" aria-label="Фото ${i + 1}: ${esc(cap)}" aria-current="${i === 0}"><img src="/img/thumb/${f}.webp" width="${w}" height="${h}" alt="" loading="lazy" decoding="async" class="h-full w-full object-cover" /></button>`;
    })
    .join('');
  const dots = photos.map((_, i) => `<span class="g-dot h-1.5 w-1.5 rounded-full bg-white/50 transition-all" aria-current="${i === 0}"></span>`).join('');

  return `<div class="gallery flex min-w-0 flex-col gap-3" data-gallery="${id}" data-prize="${id.slice(-1)}" data-title="${esc(name)}">
<div class="g-pills -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Ракурсы">${pills}</div>
<div class="g-frame relative aspect-square overflow-hidden rounded-[20px] border border-metallic-border/30 bg-surface-pure shadow-md" role="region" aria-roledescription="карусель" aria-label="Фото: ${esc(name)}" tabindex="0">
<div class="g-track">${slides}</div>
<button type="button" class="g-prev absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-pure/90 text-ink-dark shadow-lg transition-transform hover:bg-surface-pure active:scale-95" aria-label="Предыдущее фото"><span class="material-symbols-outlined text-[22px]" aria-hidden="true">chevron_left</span></button>
<button type="button" class="g-next absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-pure/90 text-ink-dark shadow-lg transition-transform hover:bg-surface-pure active:scale-95" aria-label="Следующее фото"><span class="material-symbols-outlined text-[22px]" aria-hidden="true">chevron_right</span></button>
<div class="absolute right-3 top-3 flex items-center gap-1 whitespace-nowrap rounded-full bg-ink-dark/75 px-3 py-1 text-xs font-medium tracking-wide text-white" aria-live="polite"><span class="material-symbols-outlined text-[14px]" aria-hidden="true">photo_camera</span><span class="g-count">1 / ${n}</span></div>
<button type="button" class="g-open absolute bottom-3 left-3 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-pure/90 px-3.5 py-2 text-xs font-semibold text-ink-dark shadow-md transition-all hover:bg-surface-pure"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">fullscreen</span><span>Все фото</span></button>
<div class="g-dots absolute bottom-4 right-3 flex max-w-[45%] items-center gap-1 overflow-hidden rounded-full bg-ink-dark/50 px-2 py-1.5" aria-hidden="true">${dots}</div>
</div>
<div class="g-thumbs -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="Превью">${thumbs}</div>
<p class="flex items-center gap-1.5 text-xs text-on-surface-variant"><span class="material-symbols-outlined text-[16px] text-ruby" aria-hidden="true">swipe</span><span>Листайте, чтобы рассмотреть приз со всех сторон</span></p>
</div>`;
}

let html = readFileSync(ROOT + 'index.html', 'utf8');
for (const [id, p] of Object.entries(prizes)) {
  const re = new RegExp(`(<!-- gallery:${id} -->)[\\s\\S]*?(<!-- /gallery:${id} -->)`);
  if (!re.test(html)) throw new Error('marker not found: ' + id);
  html = html.replace(re, `$1\n${gallery(id, p)}\n$2`);
}
writeFileSync(ROOT + 'index.html', html);
console.log('galleries:', Object.entries(prizes).map(([k, v]) => `${k}=${v.photos.length}`).join(', '));
