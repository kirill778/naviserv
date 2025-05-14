# Docker для CSV Data Processor

Проект настроен для работы в Docker. Ниже приведены инструкции по использованию Docker для разработки и деплоя.

## Режим разработки

Для запуска приложения в режиме разработки с горячей перезагрузкой:

```bash
docker-compose up app-dev
```

Приложение будет доступно по адресу http://localhost:5173.

## Продакшн режим

Для сборки и запуска приложения в продакшн режиме:

```bash
docker-compose up app-prod
```

Приложение будет доступно по адресу http://localhost.

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

## Остановка контейнеров

```bash
docker-compose down
```

## Особенности и ограничения

- В режиме разработки директория проекта монтируется внутрь контейнера, что позволяет сразу видеть изменения в коде
- Node модули устанавливаются внутри контейнера и не влияют на локальную node_modules директорию
- В продакшн режиме приложение собирается внутри контейнера и обслуживается Nginx 