import { create } from 'zustand';

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

interface SpreadsheetState extends FormulaModeState {
  data: any[][];
  headers: string[];
  activeCell: Cell;
  editingCell: Cell | null; // Отслеживаем редактируемую ячейку
  setData: (data: any[][], headers: string[]) => void;
  setActiveCell: (row: number, col: number) => void;
  setEditingCell: (row: number | null, col: number | null) => void;
  updateCellValue: (row: number, col: number, value: string) => void;
  getCellValue: (row: number, col: number) => string | null;
  clearCell: (row: number, col: number) => void;

  // Formula mode actions
  startFormulaMode: (rowIndex: number, colIndex: number, initialValue?: string) => void;
  selectCellForFormula: (selectedRow: number, selectedCol: number) => void;
  updateCurrentFormulaValue: (value: string, cursorPosition: number | null) => void;
  cancelFormulaMode: () => void;
  // confirmFormula - будет частью updateCellValue или нового действия, если потребуется
}

const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  data: [],
  headers: [],
  activeCell: { row: null, col: null },
  editingCell: null,

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

  cancelFormulaMode: () => {
    set({
      isFormulaSelectionMode: false,
      formulaSourceCell: null,
      currentFormulaValue: '',
      formulaCursorPosition: null,
    });
  },
}));

export default useSpreadsheetStore;