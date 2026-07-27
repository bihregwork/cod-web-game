# Project Structure / Структура проекта

Дата создания: 2026-07-21
Статус: Accepted for current Design block

## Цель

Зафиксировать будущую структуру проекта для разработки веб-игры, хранения ассетов и размещения на Netlify с таблицей рекордов.

## Принцип

Игровая механика отделяется от React-интерфейса:

- `src/game/` отвечает за игровой цикл, состояние, баланс, столкновения, спавн, scoring и машинный бонус;
- `src/ui/` отвечает за HUD, модальные окна и пользовательские состояния;
- `src/services/` отвечает за API таблицы рекордов, `playerId`, `localStorage` и pending-result;
- `netlify/functions/` отвечает за backend API;
- `assets/` хранит утвержденные проектные ассеты;
- `assets/source-previews/` хранит исходные утвержденные preview до технической обработки;
- `assets/technical-preview/` хранит проверочные изображения технической подготовки;
- `public/assets/` хранит runtime-копию ассетов, которые игра загружает в браузере.

## Структура

```text
Cod_Web_Game/
  docs/
    DISCOVERY.md
    REQUIREMENTS.md
    DESIGN.md
    SCREEN_FLOW.md
    GAME_LOOP_DESIGN.md
    VISUAL_BRIEF.md
    ASSET_PROMPTS.md
    ASSET_LIST.md
    API_CONTRACT.md
    PROJECT_STRUCTURE.md
    DECISIONS.md
    PROJECT_LOG.md

  assets/
    concepts/
      heroine-concept.png
      car-mode-concept.png
    backgrounds/
      tomsk-collage-desktop.png
      tomsk-collage-mobile.png
    characters/
      heroine.png
      heroine-car.png
    items/
      bill-500.png
      bill-1000.png
      bill-5000.png
      contract.png
      mirror.png
      hallway.png
      kitchen.png
      tax.png
      fine.png
      wheel.png
      engine.png
      car-body.png
      fuel-can-20l.png
    source-previews/
      concepts/
      items/
    technical-preview/
      prepared-assets-contact-sheet.png

  public/
    assets/
      backgrounds/
      characters/
      items/

  src/
    app/
      App.tsx
      GameApp.tsx

    game/
      engine/
        loop.ts
        collision.ts
        input.ts
        state.ts
      systems/
        scoring.ts
        difficulty.ts
        spawning.ts
        machineBonus.ts
        leaderboard.ts
      data/
        items.ts
        balance.ts
        assets.ts
      render/
        canvasRenderer.ts
        hudRenderer.ts
        effectsRenderer.ts
      types.ts

    ui/
      Hud.tsx
      GameOverlay.tsx
      LeaderboardModal.tsx
      GameOverModal.tsx
      ConfirmRestartModal.tsx

    services/
      leaderboardApi.ts
      playerIdentity.ts
      pendingScore.ts

    styles/
      globals.css

  netlify/
    functions/
      scores.ts

  tests/
    game/
      scoring.test.ts
      difficulty.test.ts
      machineBonus.test.ts
      leaderboard.test.ts

  package.json
  vite.config.ts
  tsconfig.json
  netlify.toml
  README.md
```

## Назначение ключевых папок

| Путь | Назначение |
|---|---|
| `docs/` | проектная документация SDLC, решения, требования, дизайн |
| `assets/approved/` | единая папка утвержденных изображений: финальные экраны, персонажи, предметы, фоны, UI-значки и концепты |
| `assets/concepts/` | утвержденные визуальные концепты |
| `assets/source-previews/` | исходные утвержденные preview до обработки |
| `assets/technical-preview/` | проверочные изображения и контактные листы |
| `assets/backgrounds/` | исходные и утвержденные фоновые изображения |
| `assets/characters/` | финальные игровые изображения персонажа |
| `assets/items/` | финальные изображения падающих предметов |
| `public/assets/` | ассеты, доступные браузеру во время игры |
| `src/app/` | корневые компоненты приложения |
| `src/game/engine/` | игровой цикл, ввод, состояние и столкновения |
| `src/game/systems/` | scoring, difficulty, spawning, machine bonus и leaderboard logic |
| `src/game/data/` | статические игровые данные, баланс, пути ассетов |
| `src/game/render/` | отрисовка canvas, HUD и эффектов |
| `src/ui/` | React-компоненты интерфейса |
| `src/services/` | API, `playerId`, `localStorage`, pending-result |
| `netlify/functions/` | backend-функции Netlify |
| `tests/game/` | тесты игровой логики |

## Правила структуры

- Игровая логика не должна зависеть от React-компонентов.
- React-компоненты могут читать состояние игры, но не должны содержать баланс и расчеты правил.
- Таблица рекордов вызывается через `src/services/leaderboardApi.ts`.
- Работа с `playerId` изолируется в `src/services/playerIdentity.ts`.
- Pending-result хранится и повторно отправляется через `src/services/pendingScore.ts`.
- Баланс игры хранится в `src/game/data/balance.ts`.
- Описание предметов и их типов хранится в `src/game/data/items.ts`.
- Пути к runtime-ассетам хранятся в `src/game/data/assets.ts`.
- `assets/` и `public/assets/` не должны расходиться по финальным файлам, которые используются в игре.
- Техническая подготовка ассетов воспроизводится через `scripts/prepare_assets.py`.

## Текущее состояние

На момент фиксации уже существуют:

- `docs/`;
- `assets/concepts/`;
- `assets/approved/`;
- `assets/backgrounds/`;
- `assets/source-previews/`;
- `assets/technical-preview/`;
- `assets/characters/`;
- `assets/items/`;
- `public/assets/`;
- утвержденные концепты `assets/concepts/heroine-concept.png` и `assets/concepts/car-mode-concept.png`;
- фоновые изображения в `assets/backgrounds/`.
- подготовленные персонажи `assets/characters/heroine.png` и `assets/characters/heroine-car.png`;
- подготовленные игровые предметы в `assets/items/`;
- runtime-копии в `public/assets/`.

Остальные папки создаются на этапах `asset production preview`, `Environment Setup` и `Implementation`.

## Обновление Stage 3

Дата обновления: 2026-07-22

Создан базовый каркас Vite + React + TypeScript:

- `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `netlify.toml`;
- `src/main.tsx`, `src/app/App.tsx`, `src/app/GameApp.tsx`, `src/styles/globals.css`, `src/vite-env.d.ts`;
- базовые папки и модули `src/game/engine`, `src/game/systems`, `src/game/data`, `src/game/render`;
- базовые UI-компоненты в `src/ui`;
- сервисы `src/services/leaderboardApi.ts`, `src/services/playerIdentity.ts`, `src/services/pendingScore.ts`;
- Netlify Function scaffold `netlify/functions/scores.ts`;
- первые тесты игровой логики в `tests/game`.

Проверки scaffold:

- `npm.cmd run typecheck` - passed;
- `npm.cmd run test` - passed;
- `npm.cmd run build` - passed.

## Правило фиксации

Изменения структуры сначала обсуждаются в чате и записываются сюда только после согласования.
