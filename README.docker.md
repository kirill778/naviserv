# Docker Configuration

## Обновления (Май 2025)

Последние обновления Docker-конфигурации включают:

1. **Полный стек в одном файле** - Теперь все компоненты системы (база данных, API, front-end) запускаются через единый файл `docker-compose.python.yml`.

2. **Фронтенд в контейнере** - Добавлен контейнер для фронтенда с горячей перезагрузкой.

3. **Улучшена конфигурация томов** - Оптимизированы тома для более эффективной разработки.

4. **Переменные окружения** - Добавлен `VITE_API_URL` для более гибкой настройки API URL.

## Основные конфигурационные файлы

- `docker-compose.python.yml` - Основной файл для запуска полного стека (PostgreSQL, PgAdmin, API, Frontend)
- `Dockerfile.python` - Сборка Python бэкенда
- `Dockerfile.dev` - Сборка фронтенда с горячей перезагрузкой
- `Dockerfile` - Продакшн-версия фронтенда

## Запуск приложения

### Запуск полного стека

```bash
docker-compose -f docker-compose.python.yml up -d
```

После запуска:
- Фронтенд: http://localhost:5173
- API: http://localhost:3001
- pgAdmin: http://localhost:5050 (email: admin@example.com, password: admin)
- PostgreSQL: localhost:5432

### Запуск только базы данных

```bash
docker-compose -f docker-compose.db.yml up -d
```

### Запуск только фронтенда в режиме разработки

```bash
docker-compose -f docker-compose.yml up app-dev
```

### Остановка контейнеров

```bash
docker-compose -f docker-compose.python.yml down
```

## Полезные команды

### Проверка статуса контейнеров
```bash
docker ps
```

### Перезапуск контейнера API
```bash
docker restart csv-data-processor-api
```

### Копирование файлов в контейнер
```bash
docker cp server/routes/csv_files.py csv-data-processor-api:/app/server/routes/
```

### Просмотр логов контейнера
```bash
docker logs csv-data-processor-api
```

## Сборка Docker образов вручную

### Образ для разработки

```bash
docker build -t csv-data-processor-dev -f Dockerfile.dev .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules csv-data-processor-dev
```

### Продакшн образ

```bash
docker build -t csv-data-processor .
docker run -p 80:80 csv-data-processor
```

## Особенности и ограничения

- В режиме разработки директория проекта монтируется внутрь контейнера, что позволяет сразу видеть изменения в коде
- Node модули устанавливаются внутри контейнера и не влияют на локальную node_modules директорию
- В продакшн режиме приложение собирается внутри контейнера и обслуживается Nginx 