// Цели Яндекс.Метрики (счётчик 759060).
// Разметка: data-goal="имя_цели" + data-place="..." у кнопок и ссылок,
// data-faq="номер" у <details class="faq">, data-prize="номер" у галереи.
export const COUNTER_ID = 759060;

export function reachGoal(name, params) {
  // ym может ещё не загрузиться (или быть заблокирован) — не падаем
  if (typeof window.ym !== 'function') return;
  try {
    window.ym(COUNTER_ID, 'reachGoal', name, params || {});
  } catch (e) {
    /* метрика не должна ломать страницу */
  }
}

// Клики по кнопкам/ссылкам с data-goal. Обработчик синхронный и не делает
// preventDefault: цель уходит до перехода, ссылки с target="_blank" открываются как обычно.
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-goal]');
  if (!el) return;
  reachGoal(el.dataset.goal, el.dataset.place ? { place: el.dataset.place } : undefined);
});

// Раскрытие вопроса FAQ: faq_open {q: номер вопроса}
document.querySelectorAll('details.faq[data-faq]').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) reachGoal('faq_open', { q: Number(d.dataset.faq) });
  });
});

// Открытие полноэкранной галереи: gallery_open {prize: 1 | 2 | 3}
export function trackGalleryOpen(galleryEl) {
  reachGoal('gallery_open', { prize: Number(galleryEl.dataset.prize) });
}
