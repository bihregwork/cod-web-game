# Environment Setup / Подготовка окружения

Дата старта: 2026-07-22
Дата принятия: 2026-07-22
Статус: Accepted

## Цель этапа

Подготовить локальный проект веб-игры к разработке: создать структуру приложения, зафиксировать зависимости, подготовить команды запуска и проверить, что проект можно собрать и открыть локально.

## Stage Gate

Этап `Design / Проектирование` принят заказчиком 2026-07-22. Разрешен переход к `Stage 3. Environment Setup / Подготовка окружения`.

## Фактический аудит окружения

| Компонент | Статус | Комментарий |
|---|---|---|
| Рабочая папка | Есть | `C:\Users\Andrew\Documents\Cod_Web_Game` |
| Git for Windows | Установлен, `2.55.0.windows.3` | Прямой запуск `C:\Program Files\Git\cmd\git.exe` работает |
| Git LFS | Установлен, `3.7.1` | Готово для крупных ассетов при необходимости |
| `git` в текущей сессии Codex | Через обычный PATH пока не найден | Нужен перезапуск терминала/Codex-сессии для подхвата обновленного PATH |
| Git default branch | `main` | Настроено в `C:\Users\Andrew\.gitconfig` |
| Git line endings | `core.autocrlf=true` | Согласовано с выбранным режимом Windows checkout / Unix commit |
| Git credential helper | `manager` | Подходит для GitHub HTTPS |
| Git HTTPS backend | `schannel` | Используется Windows Secure Channel |
| Node.js LTS | Установлен, `v24.18.0` | Готов для Vite/React/TypeScript |
| npm | Установлен, `11.16.0` | В новой PowerShell-сессии работает как `npm`; в старой Codex-сессии можно использовать `npm.cmd` |
| npx | Установлен, `11.16.0` | В новой PowerShell-сессии работает как `npx`; в старой Codex-сессии можно использовать `npx.cmd` |
| bundled Node Codex | Есть, `v24.14.0` | Можно использовать временно внутри Codex |
| bundled `pnpm` Codex | Есть, `11.7.0` | Доступен через прямой запуск `pnpm.cjs`, не как команда в PATH |
| `netlify` | Не найден в PATH | Netlify CLI потребуется позже для локальной проверки функций и деплоя |
| `tsc` | Не найден в PATH | Будет установлен как зависимость проекта |

## Что не устанавливаем автоматически

- Netlify CLI.

Эти системные инструменты устанавливаются только вручную заказчиком или после отдельного явного разрешения.

Статус: Git for Windows и Node.js LTS уже установлены вручную в рамках Stage 3. Автоматически дальше ничего не устанавливается.

## Следующий рабочий шаг Stage 3

Подготовить базовый каркас проекта Vite + React + TypeScript и Netlify Functions согласно `docs/PROJECT_STRUCTURE.md`.

Статус: выполнено.

## Созданный каркас проекта

| Блок | Статус |
|---|---|
| `package.json` / `package-lock.json` | Созданы |
| Vite config | `vite.config.ts` |
| TypeScript config | `tsconfig.json`, `src/vite-env.d.ts` |
| React entrypoint | `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/GameApp.tsx` |
| Игровая логика | Созданы базовые папки `src/game/engine`, `src/game/systems`, `src/game/data`, `src/game/render` |
| UI | Созданы `src/ui/Hud.tsx`, `GameOverlay`, `LeaderboardModal`, `GameOverModal`, `ConfirmRestartModal` |
| Services | Созданы `leaderboardApi`, `playerIdentity`, `pendingScore` |
| Netlify Functions | Создана `netlify/functions/scores.ts` |
| Tests | Созданы первые тесты scoring и machine bonus |
| Runtime assets | `public/assets/backgrounds` синхронизированы с утвержденными фонами |

## Установленные зависимости проекта

- Runtime: `react`, `react-dom`, `lucide-react`, `@netlify/functions`, `@netlify/blobs`.
- Dev: `vite`, `typescript`, `@vitejs/plugin-react`, `vitest`, `@types/react`, `@types/react-dom`, `@types/node`.

## Проверки

| Команда | Результат |
|---|---|
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run test` | Passed, 2 files / 6 tests |
| `npm.cmd run build` | Passed |
| `Invoke-WebRequest http://127.0.0.1:5173` | `200` |

## Принятие scaffold

- Заказчик принял технический scaffold.
- Текущий scaffold не обязан повторять финальные mockup-масштабы героини, машины и расположение кнопок.
- Финальная компоновка HUD, размеры героини/машины, положение кнопок и hitbox кошелька переносятся в этап Development на основе утвержденных Design mockups.

## Известные замечания

- `npm audit` показывает 6 moderate vulnerabilities в транзитивной цепочке `@netlify/blobs` -> `@netlify/otel` -> `@opentelemetry/*`.
- `npm audit fix --force` не выполнялся, потому что npm предупреждает о breaking change.
- Автоматический screenshot через Playwright не выполнен: bundled Playwright в текущей среде не нашел `playwright-core`.

## Следующий рабочий шаг Stage 3

Решить, устанавливаем ли Netlify CLI сейчас или переносим его ближе к Deployment. После этого можно запросить принятие всего Stage 3 и переход к Development.

Статус: принято решение перенести Netlify CLI ближе к Deployment или к моменту активной проверки Netlify Functions.

## Stage Gate Result

- Заказчик принял весь `Stage 3. Environment Setup / Подготовка окружения`.
- Заказчик разрешил перейти к `Stage 4. Development / Разработка`.
- Условие перехода выполнено: локальный проект создан, зависимости зафиксированы, scaffold принят, проверки проходят.
