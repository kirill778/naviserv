import { create } from 'zustand';

interface Cell {
  row: number;
  col: number;
}

interface SpreadsheetState {
  data: any[][];
  headers: string[];
  activeCell: Cell;
  setData: (data: any[][], headers: string[]) => void;
  setActiveCell: (row: number, col: number) => void;
  updateCellValue: (row: number, col: number, value: string) => void;
  getCellValue: (row: number, col: number) => string | null;
}

const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  data: [],
  headers: [],
  activeCell: { row: null, col: null },
  
  setData: (data, headers) => set({ data, headers }),
  
  setActiveCell: (row, col) => set({ activeCell: { row, col } }),
  
  updateCellValue: (row, col, value) => {
    set((state) => {
      // Create a deep copy of the data
      const newData = [...state.data];
      
      // Ensure the row exists
      if (!newData[row]) {
        // If the row doesn't exist, create empty rows up to this index
        for (let i = state.data.length; i <= row; i++) {
          newData[i] = [];
        }
      }
      
      // Ensure the column exists
      if (!newData[row][col]) {
        // If the cell doesn't exist, create empty cells up to this index
        for (let i = newData[row].length; i <= col; i++) {
          newData[row][i] = '';
        }
      }
      
      // Update the cell value
      newData[row][col] = value;
      
      return { data: newData };
    });
  },
  
  getCellValue: (row, col) => {
    const state = get();
    return state.data[row]?.[col] || null;
  },
}));

export default useSpreadsheetStore;