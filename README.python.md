# CSV Data Processor - Python Backend

Современный веб-инструмент для обработки, анализа и визуализации CSV данных с бэкендом на Python.

## Технологии бэкенда

- **FastAPI** - Быстрый веб-фреймворк для создания API с Python 3.7+
- **SQLAlchemy** - ORM для работы с базой данных
- **PostgreSQL** - Реляционная база данных
- **JWT Authentication** - Аутентификация на основе токенов
- **Docker** - Контейнеризация приложения

## Начало работы

### Предварительные требования

- Docker и docker-compose
- Python 3.11+ (для локальной разработки)

### Запуск с использованием Docker

Для быстрого запуска всего стека (база данных, API, фронтенд):

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/csv-data-processor.git
cd csv-data-processor

# Запустить приложение с помощью Docker Compose
docker-compose -f docker-compose.python.yml up -d
```

После запуска:
- Фронтенд: http://localhost:5173
- API: http://localhost:3001
- pgAdmin (для управления БД): http://localhost:5050
  - Email: admin@example.com
  - Пароль: admin

### Локальная разработка (без Docker)

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/csv-data-processor.git
cd csv-data-processor

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # В Windows: venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Настройка переменных окружения
# Создайте файл .env со следующими переменными:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=csv_processor
# DB_USER=postgres
# DB_PASSWORD=postgres
# JWT_SECRET=your-secret-key-for-jwt-tokens

# Запустить сервер
uvicorn app:app --reload --port 3001
```

## Структура проекта

```
server/
├── auth/            # Аутентификация, JWT, хеширование паролей
├── config/          # Настройки приложения
├── models/          # Модели данных для SQLAlchemy
├── routes/          # API эндпоинты
│   ├── auth.py      # Аутентификация и управление пользователями
│   ├── csv_files.py # Работа с CSV файлами
│   └── dashboards.py # Работа с дашбордами
├── database.py      # Настройка подключения к базе данных
app.py               # Основной файл приложения
```

## API эндпоинты

### Аутентификация

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/login-json` - Альтернативный метод входа (JSON)
- `POST /api/auth/register` - Регистрация нового пользователя
- `GET /api/auth/me` - Получение информации о текущем пользователе

### Файлы

- `POST /api/files/upload` - Загрузка CSV файла
- `GET /api/files/user/{user_id}` - Получение файлов пользователя
- `GET /api/files/{file_id}` - Получение данных конкретного файла
- `DELETE /api/files/{file_id}` - Удаление файла

### Дашборды

- `POST /api/dashboards` - Создание дашборда
- `GET /api/dashboards/user/{user_id}` - Получение дашбордов пользователя
- `GET /api/dashboards/{dashboard_id}` - Получение данных конкретного дашборда
- `PUT /api/dashboards/{dashboard_id}` - Обновление дашборда
- `DELETE /api/dashboards/{dashboard_id}` - Удаление дашборда

## Учетные данные по умолчанию

После первого запуска создается администратор со следующими данными:
- Пользователь: `admin`
- Пароль: `1234`

## Возможные проблемы и их решения

### Ошибка аутентификации

Если возникают проблемы при входе пользователя `admin` с паролем `1234`, возможно нужно обновить хеш пароля в базе данных:

```bash
# Выполните в терминале
docker cp fix_password.py csv-data-processor-api:/app/
docker exec -it csv-data-processor-api python /app/fix_password.py
docker restart csv-data-processor-api
```

### Проблемы с CORS

Если возникают ошибки CORS при запросах с фронтенда, проверьте настройки CORS в файле `app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Дополнительная информация

### Управление базой данных через pgAdmin

1. Откройте http://localhost:5050
2. Войдите с учетными данными:
   - Email: admin@example.com
   - Пароль: admin
3. Добавьте новый сервер:
   - Имя: CSV Processor
   - Хост: postgres
   - Порт: 5432
   - База данных: csv_processor
   - Пользователь: postgres
   - Пароль: postgres

### Рестарт контейнеров

```bash
# Перезапуск всех контейнеров
docker-compose -f docker-compose.python.yml restart

# Перезапуск только API
docker restart csv-data-processor-api
```

### Просмотр логов

```bash
# Логи API
docker logs csv-data-processor-api

# Логи базы данных
docker logs csv-data-processor-db
``` 