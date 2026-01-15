# Cypress Only Toggle

Мини‑расширение для VS Code: добавляет CodeLens `★ ONLY` над `it()` и выполняет:

- переключение `it()` ↔ `it.only()` для выбранного теста;
- снятие `.only` с других тестов в файле;
- копирование относительного пути файла в буфер;
- сохранение файла после изменения.

## Установка

1. Открой палитру команд (Ctrl+Shift+P).
2. Выполни команду `Developer: Install Extension from Location...`.
3. Выбери папку `local-vscode-extensions/cypress-only-toggle`.
4. Перезагрузи окно при необходимости.

Если CodeLens не виден — включи `editor.codeLens: true`.
