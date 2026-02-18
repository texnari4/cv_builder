# Resume Constructor — локально и через Google Apps Script

Коротко: интерактивный конструктор резюме на чистом HTML/CSS/JS. Можно запускать локально (как статический сайт) или развернуть как веб-приложение в Google Apps Script (облачно, с сохранением данных в PropertiesService и загрузкой аватаров в Drive).

## Содержание репозитория

- `cv_constructor.html` — основной файл конструктора (frontend, standalone)
- `index.html` — адаптация для Google Apps Script (frontend, использует `google.script.run`)
- `code.gs` — backend для Google Apps Script (сохранение, шэринг, экспорт, версии)
- `README.md` — этот файл

## Быстрый запуск локально

1. Скопируйте репозиторий или файл `cv_constructor.html`.
2. Откройте `cv_constructor.html` в браузере двойным кликом (для простого теста).

Рекомендуется использовать статический сервер:

```bash
python3 -m http.server 8000
# затем открой http://localhost:8000/cv_constructor.html
```

Или с Node:

```bash
npx http-server -c-1 . -p 8000
# затем открой http://localhost:8000/cv_constructor.html
```

Примечания:
- Изменения сохраняются в `localStorage` браузера.
- Чтобы перенести данные между браузерами — экспортируйте JSON или скачайте HTML.
- Рекомендуется использовать Google Chrome, Chromium или Safari

## Развёртывание в Google Apps Script (GAS)

### Что делает GAS-версия
- `code.gs` предоставляет серверные функции: сохранение/загрузка, загрузка аватара в Drive, экспорт PDF/HTML/JSON, история версий, генерация публичных ссылок.
- `index.html` использует `google.script.run` для общения с сервером.

### Шаги развёртывания
1. Откройте https://script.google.com и создайте новый проект.
2. Создайте файл `Code.gs` и вставьте содержимое `code.gs` из репозитория.
3. Добавьте HTML-файл `index` и вставьте `index.html`.
4. (Опционально) добавьте `public_features_ui.js` либо вставьте его в `index.html`.
5. Сохраните проект.
6. Разверните: Deploy → New deployment → Web app.
   - Выполнять от имени: ваш аккаунт
   - Доступ: по необходимости (Only me / Anyone)
7. При первом запуске скрипт запросит разрешения (Drive, ScriptApp и т.д.).

При таком варианте использования, вы сможете делиться своим резюме по ссылке

### Примечания по настройке
- `PropertiesService.getUserProperties()` хранит данные отдельно для каждого Google-аккаунта (изолированно).
- Для общего хранилища используйте Google Sheets или Firestore и измените `code.gs` соответственно.

## Основные серверные функции (коротко)

- `saveAllData(obj)` — сохранить данные резюме
- `loadAllData()` — вернуть все данные (объект)
- `uploadAvatar(blob)` — сохранить аватар в Drive
- `exportToPDF()` / `exportToHTML()` / `exportToJSON()` — экспорт
- `generateShareLink()` — получить view-only ссылку
- `saveVersion(name)` / `getVersionHistory()` / `restoreVersion(idx)` — версии

## Подключение публичных функций в UI

В `index.html` добавьте перед `</body>`:

```html
<script src="public_features_ui.js"></script>
```

Это добавит диалоги для шеринга, экспорта, сохранения/восстановления версий.

## Отладка и распространённые проблемы

- Ошибка OAuth / отсутствуют разрешения: откройте Project Settings → Scopes и предоставьте необходимые права.
- Аватар не загружается: проверьте квоты Drive и права доступа проекта.
- Экспорт в PDF даёт неверную верстку: подкорректируйте CSS в `buildHTMLFromData()` внутри `code.gs`.

## Рекомендации для репозитория

- Храните пользовательские шаблоны в `templates/`.
- Для деплоя из CLI используйте `clasp` (официальный инструмент для Apps Script).

Пример базовых команд `clasp` (опционально):

```bash
# Установить clasp (если ещё не установлен)
npm i -g @google/clasp

# Инициализировать проект в локальной папке
clasp create --type webapp --title "Resume Editor"

# Загружать файлы в проект
clasp push

# Получить URL развернутого веб-приложения
clasp deployments
```

## Лицензия

По умолчанию предлагаем MIT — добавьте `LICENSE` в репозиторий, если согласны.