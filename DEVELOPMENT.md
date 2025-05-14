# Журнал разработки CSV Data Processor

Этот документ содержит информацию о процессе разработки приложения CSV Data Processor, включая описание этапов, технические детали и принятые решения.

## Содержание

- [Архитектура проекта](#архитектура-проекта)
- [Технологический стек](#технологический-стек)
- [Этапы разработки](#этапы-разработки)
  - [Миграция с JavaScript на Python бэкенд](#миграция-с-javascript-на-python-бэкенд)
  - [Улучшение электронной таблицы](#улучшение-электронной-таблицы)
- [Решенные проблемы](#решенные-проблемы)
  - [Проблемы с аутентификацией](#проблемы-с-аутентификацией)
  - [Проблемы с CORS](#проблемы-с-cors)

## Архитектура проекта

Проект CSV Data Processor использует клиент-серверную архитектуру:

1. **Клиентская часть (Frontend)**: React-приложение с TypeScript, которое обеспечивает пользовательский интерфейс для работы с CSV-файлами и визуализации данных.
2. **Серверная часть (Backend)**: Python API на FastAPI, обеспечивающий аутентификацию, хранение и обработку данных.
3. **База данных**: PostgreSQL для хранения информации о пользователях, файлах и дашбордах.

## Технологический стек

### Frontend
- React + TypeScript
- Vite (сборка)
- React Router (маршрутизация)
- Zustand (управление состоянием)
- Tailwind CSS (стили)
- PapaParse (обработка CSV)
- Recharts (визуализация данных)

### Backend
- Python 3.11
- FastAPI (веб-фреймворк)
- SQLAlchemy (ORM)
- PostgreSQL (база данных)
- JWT (аутентификация)
- Docker (контейнеризация)

## Этапы разработки

### Миграция с JavaScript на Python бэкенд

Первоначально проект использовал JavaScript (Node.js) для серверной части. Впоследствии было принято решение мигрировать на Python-бэкенд.

#### Причины миграции:
- Более богатая экосистема библиотек для обработки данных в Python
- Удобство работы с математическими вычислениями
- Возможность интеграции с машинным обучением в будущем

#### Детали реализации:
1. Создан проект на FastAPI с модульной структурой
2. Реализована ORM-модель с использованием SQLAlchemy
3. Настроена аутентификация с JWT-токенами
4. Созданы эндпоинты для работы с пользователями, файлами и дашбордами
5. Настроена Docker-контейнеризация для удобства разработки и деплоя

#### Проблемы и решения:
- **Проблема**: Несовместимость форматов хэшей паролей между старой и новой системой
  **Решение**: Создан скрипт `fix_password.py` для обновления хэшей паролей в БД

- **Проблема**: Ошибки CORS при обращении к API
  **Решение**: Настроены CORS-заголовки в FastAPI для разрешения запросов с фронтенда

### Улучшение электронной таблицы

Электронная таблица — ключевой компонент приложения для работы с CSV-данными.

#### Требования:
- Бесконечная таблица, как в Excel
- Предотвращение исчезновения ячеек при взаимодействии с ними
- Поддержка формул и вычислений

#### Детали реализации (16.05.2024):

1. **Компонент Spreadsheet:**
   - Добавлены константы для размеров таблицы:
     ```typescript
     const DEFAULT_ROW_COUNT = 100;
     const DEFAULT_COL_COUNT = 26;
     const MIN_VISIBLE_ROWS = 100;
     const MIN_VISIBLE_COLS = 26;
     ```
   - Реализован механизм динамического добавления строк и столбцов при прокрутке:
     ```typescript
     useEffect(() => {
       const handleScroll = () => {
         if (tableRef.current) {
           // Добавляем строки при прокрутке вниз
           if (scrollTop + clientHeight > scrollHeight - 200) {
             setVisibleRows(prev => prev + 20);
           }
           
           // Добавляем столбцы при прокрутке вправо
           if (scrollLeft + clientWidth > scrollWidth - 200) {
             setVisibleCols(prev => prev + 5);
           }
         }
       };
       
       // Привязываем обработчик прокрутки
       tableElement.addEventListener('scroll', handleScroll);
     }, []);
     ```
   - Изменён подход к созданию данных для отображения бесконечной таблицы:
     ```typescript
     const displayData = data.length > 0 
       ? Array.from({ length: effectiveRows }, (_, rowIdx) => 
           Array.from({ length: effectiveCols }, (_, colIdx) => 
             data[rowIdx]?.[colIdx] || ''))
       : Array.from({ length: effectiveRows }, () => 
           Array.from({ length: effectiveCols }, () => ''));
     ```

2. **Компонент Cell:**
   - Улучшен обработчик потери фокуса, чтобы предотвратить исчезновение ячеек:
     ```typescript
     const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
       // Сохраняем значение
       onChange(inputValue);
       
       // Проверяем, не кликнули ли мы внутри той же ячейки
       if (e.currentTarget.contains(e.relatedTarget as Node)) {
         return;
       }
       
       onBlur();
     };
     ```

3. **Хранилище данных (SpreadsheetStore):**
   - Улучшено копирование данных для предотвращения мутаций:
     ```typescript
     const newData = [...state.data.map(row => [...row])];
     ```
   - Добавлен метод для очистки ячеек без их удаления:
     ```typescript
     clearCell: (row, col) => {
       set((state) => {
         if (!state.data[row] || state.data[row][col] === undefined) {
           return state;
         }
         
         const newData = [...state.data.map(row => [...row])];
         newData[row][col] = ''; // Пустая строка вместо удаления
         
         return { data: newData };
       });
     },
     ```

## Решенные проблемы

### Проблемы с аутентификацией

#### Проблема:
После миграции на Python бэкенд, появилась ошибка `UnknownHashError: hash could not be identified` при попытке аутентификации пользователя.

#### Причина:
Формат хэшей паролей в PostgreSQL не соответствовал ожидаемому формату библиотеки passlib (bcrypt).

#### Решение:
1. Создан скрипт `fix_password.py` для обновления хэшей паролей:
   ```python
   password = "1234"
   hashed_password = pwd_context.hash(password)
   
   with engine.connect() as conn:
       result = conn.execute(
           text("UPDATE users SET password = :password WHERE username = 'admin'"),
           {"password": hashed_password}
       )
   ```
2. Обновлен пароль администратора:
   ```bash
   docker cp fix_password.py csv-data-processor-api:/app/
   docker exec -it csv-data-processor-api python /app/fix_password.py
   ```

### Проблемы с CORS

#### Проблема:
Frontend не мог делать запросы к API из-за ошибок CORS-политики:
```
Access to fetch at 'http://localhost:3001/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

#### Решение:
Настроены CORS-заголовки в FastAPI для разрешения запросов с фронтенда:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Планы на будущее

- Добавление более сложных формул и функций в электронную таблицу
- Улучшение визуализации данных в дашбордах
- Добавление экспорта в различные форматы (PDF, Excel)
- Интеграция с внешними API для импорта данных 