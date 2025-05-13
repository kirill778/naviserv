import React from 'react';
import { FunctionSquare as Function } from 'lucide-react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';

const FormulaBar: React.FC = () => {
  const { activeCell, getCellValue, updateCellValue } = useSpreadsheetStore();
  
  const cellLabel = activeCell.row !== null && activeCell.col !== null 
    ? `${String.fromCharCode(65 + activeCell.col)}${activeCell.row + 1}`
    : '';
    
  const cellValue = activeCell.row !== null && activeCell.col !== null
    ? getCellValue(activeCell.row, activeCell.col) || ''
    : '';
    
  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCell.row !== null && activeCell.col !== null) {
      updateCellValue(activeCell.row, activeCell.col, e.target.value);
    }
  };

  return (
    <div className="h-10 bg-white border border-gray-200 rounded-md mb-2 flex items-center px-2">
      <div className="flex items-center justify-center h-8 w-8 bg-gray-100 rounded mr-2">
        <Function size={18} className="text-gray-500" />
      </div>
      <div className="w-16 text-gray-600 font-medium">{cellLabel}</div>
      <input
        type="text"
        className="flex-1 h-8 px-2 outline-none border-none"
        value={cellValue}
        onChange={handleFormulaChange}
        placeholder="Enter value or formula..."
      />
    </div>
  );
};

export default FormulaBar;