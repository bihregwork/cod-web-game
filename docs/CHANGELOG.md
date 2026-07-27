# Changelog

## v1.0.0 - Pending Deployment

Дата: 2026-07-27

### Added

- Игровой экран с героиней, кошельком, падающими предметами, очками и жизнями.
- `Car Mode` с деталями автомобиля, бензином и отдельным HUD.
- Таблица рекордов с вводом имени, локальными профилями `name -> playerId`, top-10 и localStorage fallback.
- Netlify Function `/.netlify/functions/scores` для production-таблицы рекордов.
- Start, Pause, Restart, Records, Game Over и restart-modal с внешней ссылкой на `https://tomsk-mebel70.ru/`.
- Debug-режим `debugHitbox=1` для временного отображения зоны ловли кошелька.

### Changed

- Баланс сложности настроен на уровни `1-40`.
- Ловля предметов работает по принятой модели: пересечение прямоугольника предмета с прямоугольником кошелька.
- Debug-hitbox скрыт в обычной пользовательской игре.

### Verification

- `npm.cmd run typecheck` - passed.
- `npm.cmd run test` - passed, 10 files / 48 tests.
- `npm.cmd run build` - passed.
- Stage 5. Testing принят заказчиком.
