# MAX Chat · GREEN-API

Минимальный интерфейс чата на React + TypeScript для тестового задания. Пользователь вводит свои `idInstance` и `apiTokenInstance`, видит реальные чаты подключенного MAX-аккаунта, может создать диалог по номеру телефона, отправить текстовое сообщение и получить ответ.

## Архитектура

```text
React + TypeScript
       |
       | /api/*
       v
Node.js / Express BFF
       |
       | GREEN-API HTTP API
       v
GREEN-API <-> MAX
```

Node.js здесь не является отдельным backend мессенджера и не хранит чаты/историю в БД. Это тонкий BFF (Backend for Frontend): он держит пользовательский `apiTokenInstance` только в серверной сессии, валидирует входные данные и проксирует вызовы GREEN-API.

Источником данных для чатов и сообщений остается GREEN-API/MAX.

## Что реализовано

1. Вход по пользовательским `idInstance` + `apiTokenInstance`.
2. Проверка инстанса через `GetStateInstance`; работа разрешена только при статусе `authorized`.
3. Загрузка реального списка чатов через `GetChats`.
4. Загрузка последних 100 сообщений выбранного чата через `GetChatHistory`.
5. В интерфейсе отображаются только текстовые сообщения.
6. Создание/открытие личного чата по номеру телефона РФ/РБ через `CheckAccount`.
7. Отправка текста через `SendMessage`.
8. Оперативное получение новых входящих сообщений через `ReceiveNotification`.
9. Подтверждение обработанных уведомлений через `DeleteNotification`.
10. Responsive UI, стилизованный под web MAX: desktop и mobile layouts.
11. Docker-запуск с внешним портом `8087`.

Файлы, изображения, звонки, голосовые сообщения, реакции и другие функции, отсутствующие в задании, намеренно не реализованы.

## Почему используется небольшой backend

GREEN-API передает `apiTokenInstance` как часть URL запроса. Пользователь вводит токен в приложении, однако после авторизации frontend больше не отправляет его в каждом GREEN-API запросе и не хранит его в `localStorage`.

Backend хранит credentials только в памяти процесса на время сессии. Браузер получает случайный `HttpOnly` cookie. После рестарта контейнера пользователю потребуется войти повторно.

Таким образом разделение ответственности остается простым:

- React — интерфейс и состояние экрана;
- Express BFF — credentials, валидация и proxy;
- GREEN-API/MAX — чаты, история и доставка сообщений.

## Предварительное условие

MAX-аккаунт должен быть заранее авторизован в соответствующем GREEN-API instance. QR-авторизация MAX не входит в тестовое задание и выполняется в GREEN-API до входа в приложение.

Для HTTP API уведомлений у instance должен быть настроен режим получения уведомлений через HTTP API. Не следует одновременно запускать несколько consumers `ReceiveNotification` для одного instance.

## Локальный запуск

Требуется Docker + Docker Compose.

```bash
cp .env.example .env
docker compose up -d --build
```

Открыть:

```text
http://localhost:8087
```

Пользовательские `idInstance` и `apiTokenInstance` в `.env` не указываются.

`.env`:

```env
GREEN_API_URL=https://api.green-api.com
PORT=3000
COOKIE_SECURE=false
```

Для публикации приложения через HTTPS:

```env
COOKIE_SECURE=true
```

Остановка:

```bash
docker compose down
```

## Пользовательский сценарий

1. Открыть приложение.
2. Ввести `idInstance` и `apiTokenInstance` из GREEN-API.
3. После проверки credentials приложение загружает реальные чаты MAX.
4. Выбрать существующий чат — приложение загрузит его текстовую историю.
5. Либо нажать `+` и ввести номер телефона, например `79991234567`.
6. `CheckAccount` вернет реальный `chatId`, после чего откроется диалог.
7. Ввести текст и отправить — используется `SendMessage`.
8. Получатель отвечает в MAX.
9. Ответ приходит через `ReceiveNotification` и появляется в интерфейсе.

## Структура проекта

```text
src/
  app/
    App.tsx
  components/
    Avatar.tsx
    Icon.tsx
    MobileBottomNav.tsx
    NavigationRail.tsx
  features/
    auth/
      LoginPage.tsx
    chat/
      ChatPanel.tsx
      ChatSidebar.tsx
      MessageBubble.tsx
      MessageComposer.tsx
      NewChatDialog.tsx
      useChatController.ts
  services/
    api.ts
  types/
    api.ts
    chat.ts
  styles/
    global.css

server/
  index.ts
  greenApiClient.ts
  sessionStore.ts
  types.ts
```

### Разделение ответственности

- `LoginPage` — только форма подключения.
- `ChatSidebar`, `ChatPanel`, `MessageBubble`, `MessageComposer` — UI-компоненты.
- `useChatController` — orchestration frontend-состояния: загрузка чатов/истории, polling и optimistic send.
- `services/api.ts` — единая точка HTTP-вызовов frontend → BFF.
- `server/index.ts` — HTTP routes и валидация входных параметров.
- `server/greenApiClient.ts` — единственное место, которое знает URL/контракты GREEN-API.
- `server/sessionStore.ts` — минимальная in-memory сессия для credentials.

## Внутренний API BFF

Frontend обращается только к этим endpoints:

- `POST /api/session` — проверить GREEN-API credentials и создать сессию;
- `GET /api/session` — получить состояние текущей сессии;
- `DELETE /api/session` — завершить сессию;
- `GET /api/chats` — получить реальные чаты через `GetChats`;
- `POST /api/chats/history` — получить историю выбранного чата через `GetChatHistory`;
- `POST /api/chats/resolve` — получить `chatId` по номеру через `CheckAccount`;
- `POST /api/messages/send` — отправить текст через `SendMessage`;
- `GET /api/messages/poll` — получить новые входящие текстовые сообщения через notification queue.

## Ограничения тестового проекта

- Постоянная БД не используется: чаты и история загружаются из GREEN-API/MAX.
- В серверной памяти хранится только временная сессия с credentials.
- История загружается при открытии чата; новые сообщения поступают через notifications.
- UI сознательно ограничен текстовыми сообщениями согласно заданию.
- В бесплатном hosting-контейнере после sleep/restart серверная сессия очищается — достаточно повторно ввести GREEN-API credentials.

## Настройка уведомлений GREEN-API

Для работы получения сообщений через HTTP API (ReceiveNotification + DeleteNotification) необходимо настроить инстанс в личном кабинете GREEN-API:

- Адрес отправки уведомлений (URL) — оставить пустым (webhookUrl = "")
- Получать уведомления о входящих сообщениях и файлах — включить (incomingWebhook = "yes")

Остальные переключатели уведомлений для данного тестового задания можно оставить выключенными.
