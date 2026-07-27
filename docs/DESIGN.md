# Design / Проектирование

Дата старта: 2026-07-21
Дата принятия: 2026-07-22
Статус: Accepted

## Цель этапа

Преобразовать утвержденные Requirements в проектные решения: экраны, HUD, игровой цикл, состояния игры, визуальный бриф, prompts для ассетов и API-контракт таблицы рекордов.

## Источники

- `docs/REQUIREMENTS.md`
- `docs/SCORING_AND_HAZARDS.md`
- `docs/MACHINE_BONUS_SCENARIO.md`
- `docs/DIFFICULTY_BALANCE.md`
- `docs/ITEM_SPAWN_PROBABILITIES.md`
- `docs/DECISIONS.md`
- `docs/references/visual`

## Design-артефакты

- `docs/SCREEN_FLOW.md` - экраны, состояния интерфейса и переходы.
- `docs/GAME_LOOP_DESIGN.md` - игровой цикл, состояния игры, столкновения и баланс.
- `docs/VISUAL_BRIEF.md` - визуальное направление, герой, предметы, машина, HUD.
- `docs/ASSET_PROMPTS.md` - prompts для генерации или подготовки ассетов.
- `docs/ASSET_LIST.md` - полный набор ассетов v1, структура файлов и правила готовности.
- `docs/API_CONTRACT.md` - контракт API таблицы рекордов.
- `docs/PROJECT_STRUCTURE.md` - структура будущего проекта, папки frontend/backend/assets/tests.
- `docs/HUD_EFFECTS.md` - визуальная модель HUD, состояния машины и кодовые эффекты.

## Что нужно спроектировать

- Основной игровой экран.
- HUD: очки, жизни, уровень сложности, сборка машины, бензин, топ-10.
- Состояния игры: idle, playing, paused, car mode, game over.
- Поведение предметов: спавн, падение, столкновения, пропуски.
- Визуальный вид героини, кошелька, предметов и машины.
- API таблицы рекордов с `playerId`.
- Обработка ошибок API и локальные fallback-состояния.

## Согласованные решения текущего Design-блока

- Основной экран остается единым игровым полотном; отдельные страницы для меню, паузы и рекордов не создаются.
- Приняты состояния интерфейса: `Idle`, `Countdown`, `Playing`, `Car Mode`, `Paused`, `Leaderboard`, `Game Over`.
- `Idle` показывает будущую игру, фон, героиню, HUD и кнопку `Старт`.
- `Leaderboard`, `Paused` и `Game Over` открываются поверх игрового поля.
- `Car Mode` является визуальным состоянием основного игрового поля: меняется персонаж на car-mode asset, подсвечивается HUD машины и расходуется бензин.
- При открытии рекордов во время игры все таймеры и движение останавливаются.
- Во время активной игры `Рестарт` требует короткого подтверждения.
- Подробная модель экранов и переходов записана в `docs/SCREEN_FLOW.md`.
- Принят полный набор ассетов v1 и правила их подготовки.
- Ассеты будут готовиться партиями: персонаж и car mode, полезные предметы, вредные предметы, запчасти и бензин, HUD/effects.
- Финальные игровые ассеты должны иметь прозрачный фон, соответствовать visual baseline и хорошо читаться на desktop/mobile.
- Подробный список ассетов записан в `docs/ASSET_LIST.md`.
- Принят API-контракт таблицы рекордов: `GET`/`POST` `/.netlify/functions/scores`, анонимный `playerId`, top-10, лучший результат одного игрока и frontend fallback.
- Для v1 выбрана связка Netlify Functions + Netlify Blobs.
- После API-контракта и структуры проекта запланирован Design-блок `asset production preview`, где ассеты генерируются партиями до Setup.
- Подробный API-контракт записан в `docs/API_CONTRACT.md`.
- Принята структура проекта: Vite/React frontend, отдельная игровая логика в `src/game`, сервисы в `src/services`, backend в `netlify/functions`, ассеты в `assets` и `public/assets`.
- Подробная структура записана в `docs/PROJECT_STRUCTURE.md`.
- Принята первая preview-партия полезных предметов: купюры 500/1000/5000, договор, зеркало, прихожая и кухня.
- Принятые preview-файлы сохранены в `assets/items`; техническая подготовка прозрачного фона выполняется перед подключением в игру.
- Принята вторая preview-партия вредных предметов: `tax.png` и `fine.png`.
- `tax.png` содержит крупные буквы `ФНС`; `fine.png` выполнен как прямоугольный светлый документ с буквами `ДПС` и красной линией по периметру.
- Принята третья preview-партия машинного бонуса: `wheel.png`, `engine.png`, `car-body.png`, `fuel-can-20l.png`.
- `car-body.png` выполнен как желтый кузов седана 2002 года в стиле Mazda Atenza, без логотипов; `fuel-can-20l.png` содержит обозначение `20 L`.
- Принята модель HUD/effects: HUD машины, бензин `0/60 л`, статусы `Собери машину`, `Нужен бензин`, `Car Mode`, pop-up очков, вспышки, pulse и текстовые плашки.
- Отдельные картинки для HUD/effects в v1 не генерируются; слоты, шкала бензина, подсветка, pop-up, вспышки, shake, кнопки и плашки реализуются кодом/CSS/canvas.
- Мини-иконки деталей в HUD используют принятые ассеты `wheel.png`, `engine.png`, `car-body.png` и `fuel-can-20l.png`.
- Выполнена техническая подготовка ассетов: исходные preview сохранены в `assets/source-previews`, игровые предметы и персонажи подготовлены как RGBA PNG с прозрачным фоном и обрезкой, runtime-копии созданы в `public/assets`.
- Проверочный контактный лист сохранен как `assets/technical-preview/prepared-assets-contact-sheet.png`.
- Подготовка ассетов воспроизводится скриптом `scripts/prepare_assets.py`.
- Принят desktop mockup основного игрового экрана: `assets/technical-preview/screen-mockup-desktop-v27-hearts-more-left.png`.
- Основной текущий preview экрана обновляется в `assets/technical-preview/screen-mockup-desktop.png`.
- Принят финальный desktop mockup режима `Car Mode`: `assets/technical-preview/screen-mockup-car-mode-desktop-v7-scale-matched-wallet.png`.
- В финальном `Car Mode` весь блок машины с героиней масштабирован так, чтобы ширина кошелька соответствовала обычному desktop-экрану.
- Текущий preview режима `Car Mode` обновляется в `assets/technical-preview/screen-mockup-car-mode-desktop.png`.
- Создана папка `assets/approved/` для утвержденных изображений: финальные экраны, персонажи, предметы, фоны, UI-значки и концепты.
- Все будущие явно согласованные изображения копируются в `assets/approved/` по категориям.
- Принят mobile mockup основного игрового экрана: `assets/technical-preview/screen-mockup-mobile-v11-menu-final-widths.png`.
- Принят mobile mockup режима `Car Mode`: `assets/technical-preview/screen-mockup-car-mode-mobile-v11-menu-final-widths.png`.
- Mobile HUD зафиксирован в верхней строке двумя блоками: слева `Очки/Жизни` шириной 350 px с отступом 10 px, справа `Машина/Собери машину` шириной 335 px с отступом 10 px; расстояние между блоками 15 px, высота обоих блоков 102 px.

## Правило фиксации

Предложения Codex по открытым вопросам Design сначала выводятся в чат. В документы они записываются только после явного принятия заказчиком.

## Условие перехода к Environment Setup

Переход к Environment Setup возможен после того, как заказчик утвердит экраны, игровой цикл, визуальное направление, prompts, API-контракт, структуру будущего проекта и результаты `asset production preview`.

Статус условия: выполнено. Заказчик принял весь этап `Design / Проектирование` и разрешил перейти к `Stage 3. Environment Setup / Подготовка окружения`.
