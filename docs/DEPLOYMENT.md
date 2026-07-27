# Stage 6. Deployment / Размещение

Дата старта: 2026-07-27

## Статус

- Stage 6 открыт после принятия Stage 5. Testing / Тестирование.
- Текущий статус: In Progress.
- DOCX не обновляется: обновление `.docx` выполняется только по отдельной просьбе заказчика.

## Входные условия

- Stage 5. Testing принят заказчиком.
- Финальные проверки перед переходом пройдены:
  - `npm.cmd run typecheck` - passed;
  - `npm.cmd run test` - passed, 10 files / 48 tests;
  - `npm.cmd run build` - passed;
  - production smoke на `http://127.0.0.1:4179/` - passed.
- Runtime-механика ловли: пересечение прямоугольника предмета с прямоугольником кошелька.
- Debug-hitbox скрыт в обычной игре и доступен только через `debugHitbox=1`.

## Цель этапа

Разместить игру на Netlify, получить публичную ссылку, проверить работу игры и таблицы рекордов в production.

## Deployment Checklist

| Блок | Проверка | Статус |
|---|---|---|
| Git | Проверить рабочее дерево и подготовить изменения к публикации | Passed: initial commit `9283ab3` |
| Repository | Создать или подключить GitHub-репозиторий | Passed: `https://github.com/bihregwork/cod-web-game.git` |
| Netlify CLI | Установить или проверить доступность Netlify CLI | Skipped: deploy выполнен через Netlify GitHub integration |
| Netlify auth | Авторизоваться в Netlify | Passed: Netlify GitHub app installed for selected repository |
| Build config | Проверить `netlify.toml`, build command и publish directory | Passed |
| Functions | Проверить `/.netlify/functions/scores` в Netlify-среде | Passed: GET returns `200 {"scores":[]}` |
| Deploy | Выполнить первый production deploy | Passed |
| Public URL | Проверить публичную ссылку игры | Passed: `https://cod-web-game.netlify.app/` |
| Leaderboard | Проверить запись имени, `playerId`, top-10 и общий storage через Netlify Blobs | Pending: нужна запись тестового или реального результата |
| Final acceptance | Заказчик принимает production-релиз | Pending |

## Предварительные команды

```powershell
git --version
node --version
npm --version
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Открытые вопросы Stage 6

- Нужно ли использовать существующий GitHub-аккаунт/репозиторий или создать новый.
- Установлен ли Netlify CLI, либо устанавливаем его на этом этапе.
- Нужно ли деплоить сразу в production или сначала сделать draft/preview deploy.

## Выполнено

- Создан GitHub-репозиторий: `https://github.com/bihregwork/cod-web-game.git`.
- Локальный репозиторий инициализирован на ветке `main`.
- Remote `origin` подключен к GitHub.
- Первый commit создан: `9283ab3 Initial game release`.
- Push выполнен: `main -> origin/main`.
- Рабочее дерево после push чистое.
- Netlify подключен к GitHub-репозиторию через selected repository access.
- Публичная ссылка: `https://cod-web-game.netlify.app/`.
- Первичная проверка сайта: `200`, title `Cod Web Game`.
- Первичная проверка функции рекордов выявила `500`.
- Исправление функции отправлено в GitHub: `cd734ae Fix Netlify scores function storage`.
- После автодеплоя Netlify функция `/.netlify/functions/scores` отвечает `200 {"scores":[]}`.

## Условие завершения Stage 6

- Публичная Netlify-ссылка работает.
- Игра открывается на desktop и mobile.
- Таблица рекордов записывает и показывает результаты в production.
- Заказчик принимает релиз.
