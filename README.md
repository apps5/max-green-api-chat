# MAX Chat · GREEN-API

Минимальный интерфейс чата на React + TypeScript для тестового задания: пользователь вводит свои `idInstance` и `apiTokenInstance`, создаёт чат по номеру телефона, отправляет текстовое сообщение в MAX и получает текстовый ответ через HTTP API GREEN-API.

## Что реализовано

1. Экран подключения по `idInstance` + `apiTokenInstance`.
2. Проверка инстанса методом `GetStateInstance`; в чат можно войти только при статусе `authorized`.
3. Создание нового чата по номеру телефона РФ/РБ.
4. Получение реального `chatId` через `CheckAccount`.
5. Отправка только текстовых сообщений через `SendMessage`.
6. Получение только входящих текстовых сообщений через `ReceiveNotification`.
7. Подтверждение каждого обработанного уведомления через `DeleteNotification`.
8. Responsive-интерфейс, стилизованный под web MAX: desktop и mobile layouts.
9. Docker-запуск с внешним портом `8087`.

Не реализованы файлы, изображения, звонки, голосовые сообщения, реакции и другие функции, отсутствующие в задании.

## Безопасность credentials

`idInstance` и `apiTokenInstance` **не задаются в `.env` и не сохраняются в localStorage**.

После ввода они передаются backend-прокси, проверяются через GREEN-API и сохраняются только в памяти Node.js процесса на время серверной сессии. Браузер получает только случайный `HttpOnly` session cookie. После рестарта контейнера активные сессии сбрасываются.

Это сделано специально, чтобы токен GREEN-API не использовался напрямую React-приложением и не хранился в браузерном JavaScript storage.

## Предварительное условие GREEN-API

До использования приложения MAX-аккаунт должен быть заранее авторизован в соответствующем GREEN-API instance (обычно через QR-код в личном кабинете GREEN-API). Приложение не выполняет QR-авторизацию, потому что она не входит в тестовое задание.

Для HTTP API получения уведомлений у instance должен быть пустой `webhookUrl`, а получение входящих уведомлений должно быть включено в настройках GREEN-API.

## Запуск

```bash
cp .env.example .env
docker compose up -d --build
```

Открыть:

```text
http://localhost:8087
```

В `.env` нет пользовательских credentials:

```env
GREEN_API_URL=https://api.green-api.com
PORT=3000
COOKIE_SECURE=false
```

Если приложение публикуется через HTTPS, установите:

```env
COOKIE_SECURE=true
```

## Пользовательский сценарий

1. Открыть `http://localhost:8087`.
2. Ввести `idInstance` и `apiTokenInstance`.
3. Нажать **Войти**.
4. Нажать **+**.
5. Ввести номер телефона, например `79991234567`.
6. Приложение выполнит `CheckAccount` и откроет чат по полученному `chatId`.
7. Написать текст и отправить.
8. Получатель отвечает в MAX.
9. Ответ появляется в открытом чате после получения `ReceiveNotification`.

## Структура

```text
src/
  app/
    App.tsx                 # composition/root state
  components/
    Avatar.tsx
    Icon.tsx
    MobileBottomNav.tsx
    NavigationRail.tsx
  features/
    auth/
      LoginPage.tsx         # GREEN-API credentials UI
    chat/
      ChatPanel.tsx
      ChatSidebar.tsx
      MessageBubble.tsx
      MessageComposer.tsx
      NewChatDialog.tsx
      useChatController.ts      # polling/state/chat orchestration
  services/
    api.ts                  # browser -> local backend API
  types/
    api.ts
    chat.ts
  styles/
    global.css

server/
  index.ts                  # HTTP routes + validation
  greenApiClient.ts         # GREEN-API transport adapter
  sessionStore.ts           # in-memory HttpOnly sessions
  types.ts
```

## API приложения

Frontend работает только с локальным backend:

- `POST /api/session` — проверить credentials и создать сессию;
- `GET /api/session` — проверить текущую сессию;
- `DELETE /api/session` — завершить сессию;
- `POST /api/chats` — проверить номер через `CheckAccount` и получить `chatId`;
- `POST /api/messages/send` — отправить текст;
- `GET /api/messages/poll` — получить входящие текстовые сообщения.

Backend уже формирует необходимые запросы GREEN-API.

## Ограничения демо

- Список чатов и история сообщений существуют только в текущей вкладке/сессии приложения; отдельная БД намеренно не добавлена, поскольку хранение истории не требуется заданием.
- HTTP API GREEN-API использует общую очередь уведомлений instance. Не следует одновременно запускать несколько потребителей `ReceiveNotification` для одного и того же instance.
- `CheckAccount` следует вызывать только при создании чата, а не циклически: GREEN-API ограничивает частые проверки номеров.
