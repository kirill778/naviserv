import { create } from 'zustand';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../services/api';

interface Cell {
  row: number | null;
  col: number | null;
}

interface FormulaModeState {
  isFormulaSelectionMode: boolean;
  formulaSourceCell: Cell | null;
  currentFormulaValue: string;
  formulaCursorPosition: number | null;
  // Нет необходимости в selectedCellForFormula, так как обновление будет происходить сразу
}

interface FileInfo {
  id: number | null;
  name: string | null;
}

interface SpreadsheetState extends FormulaModeState {
  data: any[][];
  headers: string[];
  activeCell: Cell;
  editingCell: Cell | null; // Отслеживаем редактируемую ячейку
  isSaving: boolean; // Флаг, указывающий, что идет сохранение
  isLoading: boolean; // Флаг, указывающий, что идет загрузка данных
  currentFile: FileInfo; // Информация о текущем файле
  errorMessage: string | null; // Сообщение об ошибке
  columnWidths: { [key: number]: number }; // Ширины столбцов

  setData: (data: any[][], headers: string[]) => void;
  setActiveCell: (row: number, col: number) => void;
  setEditingCell: (row: number | null, col: number | null) => void;
  updateCellValue: (row: number, col: number, value: string) => void;
  getCellValue: (row: number, col: number) => string | null;
  clearCell: (row: number, col: number) => void;
  setColumnWidth: (columnIndex: number, width: number) => void; // Установка ширины столбца

  // Excel-like functions for manipulating rows and columns
  insertRowAbove: (rowIndex: number) => void;
  insertRowBelow: (rowIndex: number) => void;
  deleteRow: (rowIndex: number) => void;
  insertColumnLeft: (colIndex: number) => void;
  insertColumnRight: (colIndex: number) => void;
  deleteColumn: (colIndex: number) => void;

  // Formula mode actions
  startFormulaMode: (rowIndex: number, colIndex: number, initialValue?: string) => void;
  selectCellForFormula: (selectedRow: number, selectedCol: number) => void;
  updateCurrentFormulaValue: (value: string, cursorPosition: number | null) => void;
  insertFunctionTemplate: (functionName: string) => void;
  cancelFormulaMode: () => void;
  
  // File operations
  saveSpreadsheet: (name?: string) => Promise<void>;
  loadSpreadsheet: (fileId: number) => Promise<void>;
  updateCurrentFile: (fileInfo: FileInfo) => void;
  resetCurrentFile: () => void;
}

const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  data: [],
  headers: [],
  activeCell: { row: null, col: null },
  editingCell: null,
  isSaving: false,
  isLoading: false,
  currentFile: { id: null, name: null },
  errorMessage: null,
  columnWidths: {}, // Пустой объект для хранения ширин столбцов

  // Formula mode initial state
  isFormulaSelectionMode: false,
  formulaSourceCell: null,
  currentFormulaValue: '',
  formulaCursorPosition: null,
  
  setData: (data, headers) => set({ data, headers }),
  
  setActiveCell: (row, col) => set({ activeCell: { row, col } }),

  setEditingCell: (row, col) => {
    if (row === null || col === null) {
      get().cancelFormulaMode(); // Отменяем режим формулы, если редактирование завершено
      set({ editingCell: null });
    } else {
      set({ editingCell: { row, col } });
    }
  },
  
  updateCellValue: (row, col, value) => {
    set((state) => {
      const newData = [...state.data.map(r => [...r])];
      if (!newData[row]) {
        for (let i = state.data.length; i <= row; i++) {
          newData[i] = [];
        }
      }
      newData[row][col] = value;
      return { data: newData };
    });
    // Если это была ячейка с формулой, и мы закончили ее редактирование,
    // отменяем режим формулы (если он был активен для ЭТОЙ ячейки)
    const { formulaSourceCell, isFormulaSelectionMode } = get();
    if (isFormulaSelectionMode && formulaSourceCell && formulaSourceCell.row === row && formulaSourceCell.col === col) {
      // Только если значение не начинается с =, или если оно изменилось не через updateCurrentFormulaValue
      if (!value.startsWith('=') || get().currentFormulaValue !== value) {
        get().cancelFormulaMode();
      }
    }
  },
  
  getCellValue: (row, col) => {
    const state = get();
    return state.data[row]?.[col] || null;
  },
  
  clearCell: (row, col) => {
    set((state) => {
      if (!state.data[row] || state.data[row][col] === undefined) {
        return state;
      }
      const newData = [...state.data.map(r => [...r])];
      newData[row][col] = '';
      return { data: newData };
    });
  },

  // Excel-like functions for manipulating rows and columns
  insertRowAbove: (rowIndex: number) => {
    set((state) => {
      const newData = [...state.data.map(r => [...r])];
      // Create empty row
      const emptyRow: any[] = Array(Math.max(state.headers.length, newData[0]?.length || 0)).fill('');
      
      // Insert the empty row at the specified index
      newData.splice(rowIndex, 0, emptyRow);
      
      return { data: newData };
    });
  },
  
  insertRowBelow: (rowIndex: number) => {
    set((state) => {
      const newData = [...state.data.map(r => [...r])];
      // Create empty row
      const emptyRow: any[] = Array(Math.max(state.headers.length, newData[0]?.length || 0)).fill('');
      
      // Insert the empty row after the specified index
      newData.splice(rowIndex + 1, 0, emptyRow);
      
      return { data: newData };
    });
  },
  
  deleteRow: (rowIndex: number) => {
    set((state) => {
      // Don't delete the last row to prevent having an empty dataset
      if (state.data.length <= 1) {
        return state;
      }
      
      const newData = [...state.data.map(r => [...r])];
      // Remove the specified row
      newData.splice(rowIndex, 1);
      
      return { data: newData };
    });
  },
  
  insertColumnLeft: (colIndex: number) => {
    set((state) => {
      const newData = state.data.map(row => {
        const newRow = [...row];
        // Insert empty cell at specified column index
        newRow.splice(colIndex, 0, '');
        return newRow;
      });
      
      // Also update headers
      const newHeaders = [...state.headers];
      newHeaders.splice(colIndex, 0, '');
      
      return { 
        data: newData,
        headers: newHeaders
      };
    });
  },
  
  insertColumnRight: (colIndex: number) => {
    set((state) => {
      const newData = state.data.map(row => {
        const newRow = [...row];
        // Insert empty cell after specified column index
        newRow.splice(colIndex + 1, 0, '');
        return newRow;
      });
      
      // Also update headers
      const newHeaders = [...state.headers];
      newHeaders.splice(colIndex + 1, 0, '');
      
      return { 
        data: newData,
        headers: newHeaders
      };
    });
  },
  
  deleteColumn: (colIndex: number) => {
    set((state) => {
      // Don't delete the last column
      if (state.headers.length <= 1) {
        return state;
      }
      
      const newData = state.data.map(row => {
        const newRow = [...row];
        // Remove the specified column
        newRow.splice(colIndex, 1);
        return newRow;
      });
      
      // Also update headers
      const newHeaders = [...state.headers];
      newHeaders.splice(colIndex, 1);
      
      return { 
        data: newData,
        headers: newHeaders
      };
    });
  },

  // Formula mode actions implementation
  startFormulaMode: (rowIndex, colIndex, initialValue = '=') => {
    set({
      isFormulaSelectionMode: true,
      formulaSourceCell: { row: rowIndex, col: colIndex },
      currentFormulaValue: initialValue,
      formulaCursorPosition: initialValue.length,
      activeCell: { row: rowIndex, col: colIndex }, // Устанавливаем активную ячейку
      editingCell: { row: rowIndex, col: colIndex }, // И редактируемую
    });
    // Также обновляем значение в ячейке, если оно отличается
    if (get().data[rowIndex]?.[colIndex] !== initialValue) {
      get().updateCellValue(rowIndex, colIndex, initialValue);
    }
  },

  selectCellForFormula: (selectedRow, selectedCol) => {
    const { formulaSourceCell, currentFormulaValue, formulaCursorPosition } = get();
    if (!formulaSourceCell || formulaSourceCell.row === null || formulaSourceCell.col === null) return;

    let colRef = '';
    let col = selectedCol;
    do {
      colRef = String.fromCharCode(65 + (col % 26)) + colRef;
      col = Math.floor(col / 26) - 1;
    } while (col >= 0);
    const cellRef = `${colRef}${selectedRow + 1}`;

    const pos = formulaCursorPosition !== null ? formulaCursorPosition : currentFormulaValue.length;
    const newValue = 
      currentFormulaValue.substring(0, pos) + 
      cellRef + 
      currentFormulaValue.substring(pos);

    set({
      currentFormulaValue: newValue,
      formulaCursorPosition: pos + cellRef.length,
    });
    // Сразу обновляем значение в основной ячейке
    get().updateCellValue(formulaSourceCell.row, formulaSourceCell.col, newValue);
  },

  updateCurrentFormulaValue: (value, cursorPosition) => {
    set({
      currentFormulaValue: value,
      formulaCursorPosition: cursorPosition,
    });
    // Также обновляем значение в основной ячейке
    const { formulaSourceCell } = get();
    if (formulaSourceCell && formulaSourceCell.row !== null && formulaSourceCell.col !== null) {
      get().updateCellValue(formulaSourceCell.row, formulaSourceCell.col, value);
    }
  },

  insertFunctionTemplate: (functionName) => {
    const { formulaSourceCell, currentFormulaValue, formulaCursorPosition, activeCell, editingCell } = get();
    let targetRow: number | null = null;
    let targetCol: number | null = null;
    let currentVal = '';
    let cursorPos = 0;

    if (formulaSourceCell && editingCell && formulaSourceCell.row === editingCell.row && formulaSourceCell.col === editingCell.col) {
      // Мы уже в режиме редактирования формулы
      targetRow = formulaSourceCell.row;
      targetCol = formulaSourceCell.col;
      currentVal = currentFormulaValue;
      cursorPos = formulaCursorPosition !== null ? formulaCursorPosition : currentVal.length;
    } else if (activeCell.row !== null && activeCell.col !== null) {
      // Режим формулы не активен, или активен для другой ячейки.
      // Начинаем новую формулу в активной ячейке.
      targetRow = activeCell.row;
      targetCol = activeCell.col;
      const existingValue = get().getCellValue(targetRow, targetCol) || '';
      if (existingValue.startsWith('=')) {
        currentVal = existingValue;
      } else {
        currentVal = '=' + existingValue; // Добавляем = если его не было
      }
      cursorPos = currentVal.length;
      // Активируем режим формулы для этой ячейки
      get().startFormulaMode(targetRow, targetCol, currentVal);
       // Обновляем currentVal и cursorPos после startFormulaMode, т.к. они могли измениться
      currentVal = get().currentFormulaValue;
      cursorPos = get().formulaCursorPosition !== null ? get().formulaCursorPosition! : currentVal.length;
    }

    if (targetRow === null || targetCol === null) return; // Некуда вставлять

    const functionText = functionName + '()'; // Вставляем NAME()
    const newValue = 
      currentVal.substring(0, cursorPos) + 
      functionText + 
      currentVal.substring(cursorPos);
    
    const newCursorPos = cursorPos + functionName.length + 1; // Ставим курсор внутрь скобок NAME( | )

    set({
      currentFormulaValue: newValue,
      formulaCursorPosition: newCursorPos,
      isFormulaSelectionMode: true, // Убеждаемся, что режим активен
      formulaSourceCell: {row: targetRow, col: targetCol }, // Устанавливаем/подтверждаем ячейку-источник
      activeCell: {row: targetRow, col: targetCol },
      editingCell: {row: targetRow, col: targetCol },
    });
    get().updateCellValue(targetRow, targetCol, newValue);
  },

  cancelFormulaMode: () => {
    set({
      isFormulaSelectionMode: false,
      formulaSourceCell: null,
      currentFormulaValue: '',
      formulaCursorPosition: null,
    });
  },

  // File operations implementation
  saveSpreadsheet: async (name?: string) => {
    const { data, headers, currentFile } = get();
    set({ isSaving: true, errorMessage: null });

    try {
      // Вместо получения токена из localStorage, используем authStore
      const { token, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !token) {
        throw new Error('Необходимо авторизоваться');
      }

      // Создаем имя файла
      const fileNameToUse = name || `spreadsheet_${new Date().toISOString().replace(/[:.]/g, '_')}`;
      // Добавляем расширение .csv, если его нет
      const fileName = fileNameToUse.endsWith('.csv') 
        ? fileNameToUse 
        : fileNameToUse + '.csv';
      
      // Вместо создания CSV и FormData, просто отправляем данные напрямую в JSON формате
      console.log('Saving spreadsheet data to database');
      
      // Подготавливаем запрос на сохранение данных
      const requestData = {
        headers: headers,
        data: data,
        name: fileName
      };

      console.log('Request data:', requestData);
      
      // Определяем эндпоинт - /save для нового файла, или /file_id для обновления
      const endpoint = currentFile.id 
        ? `${API_URL}/csv-files/${currentFile.id}` 
        : `${API_URL}/csv-files/save`;
      
      const method = currentFile.id ? 'PUT' : 'POST';
      console.log(`Sending ${method} request to ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        console.error('Error from server:', response.status, response.statusText);
        let errorMessage = 'Ошибка сохранения файла';
        try {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          try {
            // Попробуем просто получить текст ответа
            const errorText = await response.text();
            console.error('Error response text:', errorText.substring(0, 500));
          } catch (textError) {
            console.error('Could not get response text:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      const fileData = await response.json();
      console.log('File saved successfully:', fileData);
      set({
        currentFile: {
          id: fileData.id,
          name: fileData.name
        }
      });
    } catch (error) {
      console.error('Ошибка сохранения электронной таблицы:', error);
      set({
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка при сохранении'
      });
    } finally {
      set({ isSaving: false });
    }
  },

  loadSpreadsheet: async (fileId: number) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const { token, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !token) {
        throw new Error('Необходимо авторизоваться');
      }

      console.log(`Загрузка файла с ID ${fileId}`);
      
      const fileInfoResponse = await fetch(`${API_URL}/csv-files/${fileId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!fileInfoResponse.ok) {
        console.error('Ошибка получения информации о файле:', 
                      fileInfoResponse.status, fileInfoResponse.statusText);
        throw new Error('Ошибка получения информации о файле');
      }

      const fileInfo = await fileInfoResponse.json();
      console.log('Информация о файле:', fileInfo);
      
      const headers = fileInfo.column_headers || ['A']; // Заголовки по умолчанию, если нет

      // Получаем содержимое файла
      const contentResponse = await fetch(`${API_URL}/csv-files/content/${fileId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!contentResponse.ok) {
        console.error('Ошибка получения содержимого файла (HTTP статус):', 
                    contentResponse.status, contentResponse.statusText);
        // Не удалось загрузить содержимое, отображаем пустую таблицу с заголовками
        set({
          data: [Array(headers.length).fill('')], // Один пустой ряд для инициализации
          headers: headers,
          currentFile: { id: fileInfo.id, name: fileInfo.name },
          errorMessage: 'Не удалось загрузить содержимое файла, показана пустая таблица.'
        });
        return;
      }

      const contentData = await contentResponse.json();
      console.log('Содержимое файла загружено, количество строк:', contentData.data?.length || 0);
      
      set({
        data: contentData.data || [Array(headers.length).fill('')],
        headers: contentData.headers || headers,
        currentFile: { id: fileInfo.id, name: fileInfo.name },
        errorMessage: null
      });
    } catch (error) {
      console.error('Общая ошибка загрузки электронной таблицы:', error);
      set({
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке',
        isLoading: false // Убедимся, что isLoading сброшен
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateCurrentFile: (fileInfo: FileInfo) => {
    set({ currentFile: fileInfo });
  },

  resetCurrentFile: () => {
    set({ currentFile: { id: null, name: null } });
  },

  // Функция для установки ширины столбца
  setColumnWidth: (columnIndex, width) => {
    set((state) => ({
      columnWidths: {
        ...state.columnWidths,
        [columnIndex]: width,
      }
    }));
  },
}));

export default useSpreadsheetStore;