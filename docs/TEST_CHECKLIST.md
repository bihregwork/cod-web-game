# Stage 5. Testing / Тестирование

Дата старта: 2026-07-27

## Статус

- Stage 5 открыт после принятия Stage 4. Development / Разработка.
- Текущий статус: Accepted.
- Дата принятия: 2026-07-27.
- Основание принятия: заказчик принял Stage 5. Testing и разрешил переход к Stage 6. Deployment / Размещение.
- DOCX не обновляется: обновление `.docx` выполняется только по отдельной просьбе заказчика.

## Входные условия

- Основная функциональность v1 реализована.
- Development-блок 4: полировка игрового процесса и UX-состояний принят заказчиком.
- Production build собирается командой `npm.cmd run build`.
- Свежий production preview поднят для проверки:
  - основной режим: `http://127.0.0.1:4179/`;
  - high-level Car Mode: `http://127.0.0.1:4179/?mode=car&score=4000000&fuel=60`.

## Уже проверено перед входом в Testing

- Основной экран и Car Mode в production preview.
- Сценарии: старт, пауза, рестарт, рекорды, Game Over.
- Ловля, пропуски, штрафы, договор, бензин, сборка машины.
- High-level режим с `score=4000000` и Car Mode.
- Баг с визуальными артефактами пойманных предметов при одновременной ловле на высокой скорости исправлен.

## Основной чеклист Stage 5

| Блок | Проверка | Статус |
|---|---|---|
| Build | `npm.cmd run build` проходит без ошибок | Passed, 2026-07-27 |
| Unit tests | `npm.cmd run test` проходит без ошибок | Passed, 10 files / 48 tests |
| Desktop smoke | Старт, движение, ловля, пауза, рестарт, рекорды, Game Over | Passed smoke: main + Car Mode controls |
| Mobile smoke | Touch-drag, HUD, ловля, пауза, рестарт, рекорды, Game Over | Passed visual smoke after HUD fix |
| Gameplay | Очки, жизни, пропуски, договор, налог, штраф | Passed: ручной 3-5 минутный playtest положительный |
| Machine bonus | Сбор 4 колес, двигателя, корпуса, бензин, переход в Car Mode, расход топлива | Passed: ручной 3-5 минутный playtest положительный |
| High-level | Проверка режима `score=4000000` или выше | Passed: `mode=car&score=4000000&fuel=60` |
| Smoothness | Проверка плавности героя, Car Mode и падения предметов в production preview | Passed: ручной 3-5 минутный playtest положительный |
| Leaderboard | Имя игрока, локальный playerId, несколько имен на одном устройстве, top-10 | Passed: Game Over name flow, local player profiles, localScores и top-10 verified |
| API/fallback | Netlify API при наличии, localStorage fallback при локальном запуске | Passed for local fallback and function contract; live Netlify check остается на Deployment |
| Visual QA | HUD, title, restart modal, comic tooltip, ссылка с иконки авто, отсутствие наложений, скрытая runtime-зона кошелька | Passed smoke: desktop/mobile HUD, title, restart controls, car icon link, wallet hitbox hidden |
| Regression | Проверка, что последние UX-правки не сломали ранее принятые сценарии | Passed: smoke + ручной playtest |

## Критерий выхода из Testing

- Критические дефекты исправлены.
- Production build проходит.
- Основные desktop/mobile сценарии подтверждены.
- Таблица рекордов и fallback работают ожидаемо.
- Заказчик принимает Testing и разрешает переход к Stage 6. Deployment / Размещение.

## Результаты прогона 2026-07-27

- `npm.cmd run typecheck` - passed.
- `npm.cmd run test` - passed: 10 files / 48 tests.
- `npm.cmd run build` - passed.
- Ручной 3-5 минутный playtest заказчиком пройден положительно.
- Fresh production preview: `http://127.0.0.1:4179/`.
- High-level Car Mode preview: `http://127.0.0.1:4179/?mode=car&score=4000000&fuel=60`.
- Автоматизированный visual smoke выполнен через системный Edge:
  - desktop main;
  - desktop Car Mode high-level;
  - mobile main, viewport `390 x 844`.
- Интерактивный smoke пройден:
  - main: click Start, Pause, Records, Close, Restart No, Restart Yes;
  - Car Mode: Pause сохраняет heroine-car, Records сохраняет heroine-car после закрытия, Restart No сохраняет heroine-car, Restart Yes сбрасывает в стартовый экран.
- Отдельная проверка рекордов и хранения данных пройдена:
  - targeted tests: `npm.cmd run test -- tests/game/leaderboard.test.ts tests/services/localLeaderboard.test.ts tests/services/leaderboardApi.test.ts tests/netlify/scoresFunction.test.ts` - passed, 4 files / 18 tests;
  - live UI chain: `Game Over -> ввод имени -> локальный playerId -> localScores -> top-10` - passed;
  - high-level URL для UI-проверки: `http://127.0.0.1:4179/?mode=car&score=7800000&fuel=60`;
  - Game Over достигнут за 62 секунды, результат сохранен под тестовым именем `QA Alpha`;
  - verified storage keys: `cod-web-game:playerProfiles`, `cod-web-game:playerName`, `cod-web-game:localScores`, `cod-web-game:pendingScore`;
  - проверка нескольких имен на одном устройстве подтверждена unit-тестами: разные имена получают разные `playerId`, одинаковое имя переиспользует прежний профиль;
  - локальный fallback подтвержден: при недоступном локальном API результат сохраняется в `localScores` и как `pendingScore` для последующей отправки.
- Скрыт debug-прямоугольник активной зоны кошелька:
  - визуальная рамка больше не показывается игроку;
  - DOM-элемент `.wallet-target` сохранен для измерения hitbox и столкновений;
  - проверка через браузер: `opacity: 0`, `display: block`, размеры зоны сохранены;
  - добавлен dev-переключатель `debugHitbox=1` для временного показа зоны при настройке размеров;
  - обычный режим: `opacity: 0`, debug-режим: `opacity: 1`, размеры hitbox совпадают;
  - `npm.cmd run test` - passed, 10 files / 48 tests;
  - `npm.cmd run build` - passed.
- Правило ловли предметов возвращено к прежней принятой модели:
  - у предмета есть прямоугольник;
  - у кошелька есть прямоугольник;
  - предмет считается пойманным, если эти два прямоугольника пересеклись;
  - временная проверка по центру предмета отменена после playtest;
  - `npm.cmd run test` - passed, 10 files / 48 tests;
  - `npm.cmd run build` - passed.
- Иконка героини в авто в окне `Рестарт?` сделана внешней ссылкой:
  - URL: `https://tomsk-mebel70.ru/`;
  - ссылка открывается в новой вкладке через `target="_blank"` и `rel="noopener noreferrer"`;
  - UI-проверка подтвердила `href`, `target` и `rel`;
  - сохранен эффект кликабельности ссылки: `cursor: pointer`, hover/focus-visible/active transform, без стандартного link underline;
  - после открытия ссылки focus сбрасывается, поэтому повторное наведение снова дает увеличение `scale(1.02)`;
  - `npm.cmd run test` - passed, 10 files / 48 tests;
  - `npm.cmd run build` - passed.
- Закрывающая проверка Stage 5 пройдена:
  - `npm.cmd run typecheck` - passed;
  - `npm.cmd run test` - passed, 10 files / 48 tests;
  - `npm.cmd run build` - passed;
  - production smoke через системный Edge - passed;
  - проверены: старт, пауза, рестарт, рекорды, ссылка с иконки авто, скрытый hitbox в обычном режиме, видимый hitbox при `debugHitbox=1`, сохранение `Car Mode` после паузы, рекордов и отмены рестарта;
  - Stage 5 готов к приемке заказчиком.

## Найденные и исправленные дефекты

| ID | Дефект | Статус | Проверка |
|---|---|---|---|
| T5-001 | На mobile viewport `390 x 844` верхние HUD-панели частично пересекались: кнопки левого меню заходили под правую панель машины | Fixed | Visual smoke на `4178` и последующий build passed |
| T5-002 | Click по кнопке `Старт` не запускал игру в production smoke; запуск через `Space` работал | Fixed | Interactive smoke на `4179` passed |

## Тестовые артефакты

- `assets/source-previews/testing/stage5-desktop-main-4178.png`
- `assets/source-previews/testing/stage5-desktop-car-high-4178.png`
- `assets/source-previews/testing/stage5-mobile-main-4178.png`
