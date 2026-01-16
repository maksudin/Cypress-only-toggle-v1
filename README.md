# Cypress Only Toggle

Мини‑расширение для VS Code: добавляет CodeLens над `it()` и `describe()`.

## Что делает

- `★ ONLY` — ставит/снимает `it.only()` или `describe.only()` (повторный клик снимает). Путь копируется только при установке `.only`.
- `⛔ OFF` — ставит/снимает `xit()` или `xdescribe()` (повторный клик снимает).
- `▶ RUN HL` — ставит `it.only()` (без снятия при повторном клике), снимает другие `.only`, запускает headless.
- `⚠ HIDE API` — добавляет/удаляет `before()` с CSS для скрытия request/xhr в логах.

## Установка

1. Открой палитру команд (Ctrl+Shift+P).
2. Выполни команду `Developer: Install Extension from Location...`.
3. Выбери папку `local-vscode-extensions/cypress-only-toggle`.
4. Перезагрузи окно при необходимости.

Если CodeLens не видно — включи `editor.codeLens: true`.
