import { create } from 'zustand';

interface Cell {
  row: number | null;
  col: number | null;
}

interface SpreadsheetState {
  data: any[][];
  headers: string[];
  activeCell: Cell;
  setData: (data: any[][], headers: string[]) => void;
  setActiveCell: (row: number, col: number) => void;
  updateCellValue: (row: number, col: number, value: string) => void;
  getCellValue: (row: number, col: number) => string | null;
  clearCell: (row: number, col: number) => void;
}

const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  data: [],
  headers: [],
  activeCell: { row: null, col: null },
  
  setData: (data, headers) => set({ data, headers }),
  
  setActiveCell: (row, col) => set({ activeCell: { row, col } }),
  
  updateCellValue: (row, col, value) => {
    set((state) => {
      // Создаем глубокую копию данных для предотвращения мутаций
      const newData = [...state.data.map(row => [...row])];
      
      // Убедимся, что строка существует
      if (!newData[row]) {
        // Если строки нет, создаем пустые строки до этого индекса
        for (let i = state.data.length; i <= row; i++) {
          newData[i] = [];
        }
      }
      
      // Убедимся, что столбец существует в этой строке
      const rowArray = newData[row];
      
      // Обновляем значение ячейки
      // Устанавливаем значение даже если оно пустое - это поможет сохранить ячейки видимыми
      rowArray[col] = value;
      
      return { data: newData };
    });
  },
  
  getCellValue: (row, col) => {
    const state = get();
    return state.data[row]?.[col] || null;
  },
  
  // Добавляем новый метод для очистки ячейки, который оставляет ее пустой, а не удаляет
  clearCell: (row, col) => {
    set((state) => {
      if (!state.data[row] || state.data[row][col] === undefined) {
        return state; // Ничего не меняем если ячейки нет
      }
      
      const newData = [...state.data.map(row => [...row])];
      newData[row][col] = ''; // Устанавливаем пустую строку вместо удаления
      
      return { data: newData };
    });
  },
}));

export default useSpreadsheetStore;