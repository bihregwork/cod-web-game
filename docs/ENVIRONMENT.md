# Окружение проекта

Дата фиксации: 2026-07-20
Дата обновления Stage 3: 2026-07-22

## Рабочая папка

- Проектная папка: `C:\Users\Andrew\Documents\Cod_Web_Game`
- Текущее состояние проекта: создана папка `docs`, сохранен стартовый план проекта.

## Что уже имеется

| Компонент | Статус | Как используется |
|---|---|---|
| Windows + PowerShell | Есть | Основная локальная среда команд |
| Codex workspace | Есть | Общая рабочая папка Codex и заказчика |
| Git for Windows | Есть, `2.55.0.windows.3` | Git-репозиторий, история изменений, ветки, коммиты, GitHub и Netlify workflow |
| Git LFS | Есть, `3.7.1` | Хранение крупных визуальных ассетов при необходимости |
| Node.js LTS | Есть, `v24.18.0` | Локальная разработка Vite/React/TypeScript |
| npm | Есть, `11.16.0` | Установка проектных зависимостей и запуск scripts |
| npx | Есть, `11.16.0` | Запуск CLI-пакетов |
| Встроенный Node.js Codex | Есть, `v24.14.0` | Можно использовать внутри Codex для запуска JS-инструментов |
| Встроенный pnpm Codex | Есть, `11.7.0`, но не в PATH | Можно использовать внутри Codex через прямой запуск bundled Node и `pnpm.cjs` |
| Python runtime Codex | Есть | Используется для генерации и проверки документов |
| Microsoft Word | Есть, найден `WINWORD.EXE` | Можно вручную открывать и просматривать `.docx` |
| Browser-проверка Codex | Доступна в Codex | Можно проверять локальную веб-игру в браузере |

## Что сейчас не доступно в PATH

| Компонент | Статус проверки | Что это означает |
|---|---|---|
| `npm` / `npx` в старой Codex-сессии | Через `npm.ps1` / `npx.ps1` могут давать ошибку Execution Policy | В новой пользовательской PowerShell-сессии исправлено `RemoteSigned`; в старой Codex-сессии можно использовать `npm.cmd` / `npx.cmd` |
| `git` в текущей сессии Codex | Не найден через обычный PATH | Git установлен; текущий терминал был открыт до обновления PATH. Прямой запуск `C:\Program Files\Git\cmd\git.exe` работает |
| `netlify` | Не найден | Netlify CLI пока недоступен для локальной проверки и деплоя |
| `tsc` | Не найден | TypeScript CLI будет установлен как зависимость проекта |
| `pnpm` из системного PATH | Не найден | Можно использовать только bundled-вариант Codex через прямой путь |
| `soffice` / LibreOffice | Не найден | Автоматический рендер `.docx` в PNG через LibreOffice сейчас недоступен |

## Текущая проверка Stage 3

Дата проверки: 2026-07-22

| Компонент | Результат |
|---|---|
| Git for Windows | Установлен, `git version 2.55.0.windows.3` |
| Git LFS | Установлен, `git-lfs/3.7.1` |
| `git` в текущей сессии Codex | Через обычный PATH пока не найден; прямой путь работает |
| Git default branch | `main`, источник `C:\Users\Andrew\.gitconfig` |
| Git line endings | `core.autocrlf=true` |
| Git credential helper | `manager` |
| Git HTTPS backend | `schannel` |
| Node.js LTS | Установлен, `v24.18.0` |
| npm | Установлен, `11.16.0` |
| npx | Установлен, `11.16.0` |
| PowerShell Execution Policy | Для пользователя настроено `RemoteSigned`; `npm` и `npx` работают в новой PowerShell-сессии |
| bundled Node Codex | Доступен, версия `v24.14.0` |
| bundled `pnpm` Codex | Доступен через прямой путь, версия `11.7.0` |
| `netlify` | Не найден в PATH |
| `tsc` | Не найден в PATH |

## Что потребуется установить позже

| Что установить | Зачем нужно | Как проверить после установки |
|---|---|---|
| Netlify CLI | Локальная проверка Netlify Functions, привязка проекта к Netlify, деплой и логи | `netlify --version` |

## Что будет установлено внутри проекта

После этапов Discovery, Requirements и Design, на этапе Environment Setup будут добавлены проектные зависимости:

- `vite`
- `react`
- `react-dom`
- `typescript`
- `@vitejs/plugin-react`
- `@netlify/functions`
- `@netlify/blobs`
- `@netlify/vite-plugin`
- возможно `lucide-react` для иконок интерфейса

## Важные решения

- GitHub Desktop можно использовать как визуальный инструмент для просмотра изменений, коммитов и публикации, если он установлен и удобен заказчику.
- Основной ориентир для командной разработки: Git for Windows.
- Git for Windows установлен; после перезапуска терминала команда `git` должна быть доступна через PATH.
- Node.js LTS установлен; в старой Codex-сессии при ошибке Execution Policy можно использовать `npm.cmd` и `npx.cmd`.
- Netlify остается целевым веб-ресурсом для публикации игры по публичной ссылке.

## Команды bundled-окружения Codex

```powershell
& 'C:\Users\Andrew\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --version
& 'C:\Users\Andrew\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'C:\Users\Andrew\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs' --version
```

## DOCX

- Актуальная Word-версия: `docs/ENVIRONMENT.docx`.
- Генератор Word-версии: `scripts/build_environment_docx.py`.
- Визуальный рендер DOCX через LibreOffice недоступен, потому что `soffice` не найден в PATH.

## Контрольные команды после установки

```powershell
git --version
git lfs version
node --version
npm --version
netlify --version
```

Если все команды возвращают версии без ошибок, окружение готово к этапу Environment Setup.
