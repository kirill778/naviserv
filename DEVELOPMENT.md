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

#### Детали реализации (17.05.2024):

1. **Интерактивный выбор ячеек для формул:**
   - Добавлена функциональность выбора ячеек для формул, аналогично Excel:
     ```typescript
     const startCellSelection = () => {
       // Сохраняем текущую позицию курсора
       if (inputRef.current) {
         setCursorPosition(inputRef.current.selectionStart);
       }
       setIsSelectingCell(true);
       // Сохраняем текущее состояние в localStorage
       window.localStorage.setItem('formulaMode', JSON.stringify({
         active: true,
         sourceCell: { row: activeCell.row, col: activeCell.col },
         cursorPosition: inputRef.current?.selectionStart || 0,
         formulaValue: cellValue
       }));
     };
     ```
   
   - В компоненте Spreadsheet добавлен режим выбора ячеек:
     ```typescript
     // Обработчик клика по ячейке в режиме выбора формулы
     if (isFormulaSelectionMode) {
       // Получаем данные формулы
       const formulaData = window.localStorage.getItem('formulaMode');
       if (formulaData) {
         try {
           const data = JSON.parse(formulaData);
           // Обновляем данные с выбранной ячейкой
           const updatedData = {
             ...data,
             active: false,
             selectedCell: { row: rowIndex, col: colIndex }
           };
           // Сохраняем обновленные данные
           window.localStorage.setItem('formulaMode', JSON.stringify(updatedData));
           
           // Возвращаемся к редактированию формулы
           if (data.sourceCell) {
             setActiveCell(data.sourceCell.row, data.sourceCell.col);
             return;
           }
         } catch (e) {
           console.error("Error parsing formula mode data", e);
         }
       }
     }
     ```

   - Визуальные индикаторы режима выбора:
     ```typescript
     {isFormulaSelectionMode && (
       <div className="absolute top-0 left-0 right-0 bg-blue-100 text-blue-800 p-2 text-center z-20">
         Click on a cell to select it for your formula
       </div>
     )}
     ```

   - Обновлены утилиты для работы с формулами:
     ```typescript
     // Конвертация индексов в ссылки на ячейки (например, [0, 0] => A1)
     export const indicesToCellRef = (rowIndex: number, colIndex: number): string => {
       let colRef = '';
       let col = colIndex;
       
       do {
         const remainder = col % 26;
         colRef = String.fromCharCode(65 + remainder) + colRef;
         col = Math.floor(col / 26) - 1;
       } while (col >= 0);
       
       const rowRef = rowIndex + 1;
       
       return `${colRef}${rowRef}`;
     };
     
     // Проверка на валидность ссылки на ячейку
     export const isValidCellRef = (cellRef: string): boolean => {
       const cellRefPattern = /^[A-Z]+\d+$/;
       return cellRefPattern.test(cellRef);
     };
     
     // Извлечение всех ссылок на ячейки из формулы
     export const extractCellRefs = (formula: string): string[] => {
       const cellRefPattern = /([A-Z]+\d+)/g;
       const matches = formula.match(cellRefPattern);
       return matches || [];
     };
     ```

2. **Обмен данными между компонентами:**
   - Использован localStorage для коммуникации между компонентами:
     ```typescript
     // В FormulaBar.tsx (при выборе ячейки)
     React.useEffect(() => {
       const handleStorageChange = () => {
         const formulaData = window.localStorage.getItem('formulaMode');
         if (formulaData) {
           try {
             const data = JSON.parse(formulaData);
             if (!data.active && data.selectedCell) {
               // Режим формулы завершен
               setIsSelectingCell(false);
               
               // Получаем ссылку на выбранную ячейку
               const colLabel = String.fromCharCode(65 + data.selectedCell.col);
               const cellRef = `${colLabel}${data.selectedCell.row + 1}`;
               
               // Вставляем ссылку на ячейку в позицию курсора
               const formula = data.formulaValue || '';
               const pos = data.cursorPosition || formula.length;
               const newFormula = formula.substring(0, pos) + cellRef + formula.substring(pos);
               
               // Обновляем формулу
               updateCellValue(activeCell.row, activeCell.col, newFormula);
             }
           } catch (e) {
             console.error("Error parsing formula mode data", e);
           }
         }
       };

       window.addEventListener('storage', handleStorageChange);
       return () => {
         window.removeEventListener('storage', handleStorageChange);
       };
     }, [activeCell, updateCellValue]);
     ```

#### Детали реализации (21.05.2024):

1. **Поддержка диапазонов ячеек в формулах (A1:A3):**
   - Добавлена функция `expandCellRange` для преобразования диапазона в список ячеек:
     ```typescript
     export const expandCellRange = (range: string): string[] => {
       const parts = range.split(':');
       if (parts.length !== 2) {
         throw new Error(`Invalid range: ${range}`);
       }
       
       const [start, end] = parts;
       
       if (!isValidCellRef(start) || !isValidCellRef(end)) {
         throw new Error(`Invalid cell references in range: ${range}`);
       }
       
       const [startRow, startCol] = cellRefToIndices(start);
       const [endRow, endCol] = cellRefToIndices(end);
       
       const startRowIdx = Math.min(startRow, endRow);
       const endRowIdx = Math.max(startRow, endRow);
       const startColIdx = Math.min(startCol, endCol);
       const endColIdx = Math.max(startCol, endCol);
       
       const cellRefs: string[] = [];
       
       for (let row = startRowIdx; row <= endRowIdx; row++) {
         for (let col = startColIdx; col <= endColIdx; col++) {
           cellRefs.push(indicesToCellRef(row, col));
         }
       }
       
       return cellRefs;
     };
     ```

2. **Реализация функции SUM и поддержки диапазонов:**
   - Добавлена функция `processBuiltInFunctions` для обработки встроенных функций:
     ```typescript
     export const processBuiltInFunctions = (formula: string, data: any[][]): string => {
       // Handle SUM function
       const sumRegex = /SUM\s*\(\s*([^)]+)\s*\)/i;
       let match = formula.match(sumRegex);
       
       if (match) {
         const args = match[1].split(/[;,]/);
         let sum = 0;
         
         for (const arg of args) {
           const trimmedArg = arg.trim();
           
           // Check if it's a range (contains :)
           if (trimmedArg.includes(':')) {
             try {
               const cellRefs = expandCellRange(trimmedArg);
               for (const cellRef of cellRefs) {
                 const [row, col] = cellRefToIndices(cellRef);
                 const value = data[row]?.[col];
                 
                 if (value !== undefined && value !== null && value !== '') {
                   const num = parseFloat(value);
                   if (!isNaN(num)) {
                     sum += num;
                   }
                 }
               }
             } catch (error) {
               console.error('Error processing range:', error);
               return '#ERROR';
             }
           } else if (isValidCellRef(trimmedArg)) {
             // It's a single cell reference
             try {
               const [row, col] = cellRefToIndices(trimmedArg);
               const value = data[row]?.[col];
               
               if (value !== undefined && value !== null && value !== '') {
                 const num = parseFloat(value);
                 if (!isNaN(num)) {
                   sum += num;
                 }
               }
             } catch (error) {
               console.error('Error processing cell reference:', error);
               return '#ERROR';
             }
           } else {
             // It might be a number
             const num = parseFloat(trimmedArg);
             if (!isNaN(num)) {
               sum += num;
             }
           }
         }
         
         return sum.toString();
       }
       
       return formula; // Return unchanged if no functions matched
     };
     ```

3. **Обновление механизма извлечения ссылок на ячейки:**
   - Расширена функция `extractCellRefs` для распознавания диапазонов:
     ```typescript
     export const extractCellRefs = (formula: string): string[] => {
       const cellRefPattern = /([A-Z]+\d+)/g;
       const matches = formula.match(cellRefPattern) || [];
       
       // Check for potential range expressions (A1:B3)
       const ranges: string[] = [];
       const singleCellRefs = [...matches];
       
       // Look for cell ranges using regex
       for (let i = 0; i < singleCellRefs.length - 1; i++) {
         const current = singleCellRefs[i];
         const next = singleCellRefs[i + 1];
         
         // Check if they appear as a range in the formula (with a colon between them)
         if (formula.includes(`${current}:${next}`)) {
           try {
             ranges.push(`${current}:${next}`);
           } catch (error) {
             console.error('Error identifying range:', error);
           }
         }
       }
       
       // Expand the ranges and add them to the result
       const result = [...matches]; // Start with individual cell references
       
       for (const range of ranges) {
         try {
           const expandedRefs = expandCellRange(range);
           result.push(...expandedRefs);
         } catch (error) {
           console.error('Error expanding range:', error);
         }
       }
       
       // Remove duplicates and return
       return [...new Set(result)];
     };
     ```

4. **Создание отдельной документации по формулам:**
   - Создан файл `FORMULAS.md` с подробным описанием работы с формулами
   - Добавлены примеры использования функций и диапазонов ячеек
   - Описаны все поддерживаемые операции и функции

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

## Последние исправления

### Исправления в компоненте FunctionHelperModal (26.05.2024)

1. **Проблема**: При нажатии на кнопку добавления функции ("fx") появлялся белый пустой экран вместо модального окна выбора функции.
   
   **Причина**: Неправильная структура компонента, где условие раннего возврата (`if (!isOpen) return null`) было размещено после определения состояний, но перед вычислением зависимых значений и хуков.
   
   **Решение**: 
   - Перенос определений функций `resetState` и `handleClose` перед условие раннего возврата
   - Реструктуризация компонента для логичного потока выполнения

2. **Проблема**: Нарушение Правил Хуков React - ошибка "React has detected a change in the order of Hooks called by FunctionHelperModal".
   
   **Причина**: Условное использование хука useEffect, которое нарушает правило, что хуки должны вызываться в одинаковом порядке при каждом рендеринге.
   
   **Решение**:
   - Перенос вычисления `filteredFunctions` перед хуком useEffect
   - Добавление условия `isOpen` внутрь тела useEffect вместо условного вызова самого хука
   - Добавление параметра `isOpen` в массив зависимостей useEffect для корректного отслеживания изменений

Внесенные изменения обеспечивают стабильную работу модального окна выбора функций и соблюдение правил React Hooks, что исключает появление белого экрана и ошибок в консоли. 