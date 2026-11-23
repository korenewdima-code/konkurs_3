# Раскатаем! — конкурс рецептов Едим Дома × Marcato × Emile Henry

Vite + Tailwind. Вся разметка в `index.html`, стили в `src/style.css`, токены в `tailwind.config.js`, JS (галереи, лайтбокс, цели Метрики) в `src/main.js`.

- `npm run dev` / `npm run build`
- Галереи призов генерируются из списка фото: `node scripts/build-galleries.mjs` (перезаписывает блоки между маркерами `<!-- gallery:prizeN -->`).
- TODO перед запуском: маркировка рекламы (юрлицо и erid) — ищите `TODO` в `index.html`.
