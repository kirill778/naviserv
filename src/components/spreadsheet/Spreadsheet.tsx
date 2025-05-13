import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import useSpreadsheetStore from '../../stores/spreadsheetStore';
import { evaluateFormula } from '../../utils/formulaUtils';

const Spreadsheet: React.FC = () => {
  const { data, headers, activeCell, setActiveCell, updateCellValue } = useSpreadsheetStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Generate column labels (A, B, C, ..., Z, AA, AB, ...)
  const generateColumnLabel = (index: number): string => {
    let label = '';
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  // Handle cell click
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    setActiveCell(rowIndex, colIndex);
    setEditingCell(cellId);
  };

  // Handle cell value change
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    updateCellValue(rowIndex, colIndex, value);
  };

  // Get displayed value (evaluate formula if needed)
  const getDisplayValue = (value: string) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      try {
        return evaluateFormula(value.substring(1), data);
      } catch (error) {
        return '#ERROR';
      }
    }
    return value;
  };

  // Generate empty rows if data is empty
  const displayData = data.length > 0 ? data : Array(15).fill(Array(10).fill(''));

  return (
    <div 
      ref={tableRef}
      className="relative overflow-auto h-full"
      tabIndex={0}
    >
      <div className="sticky top-0 z-10 flex">
        <div className="w-10 h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-500 font-medium"></div>
        {headers.length > 0 ? (
          headers.map((header, index) => (
            <div 
              key={index} 
              className="min-w-[100px] w-[100px] h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-700 font-medium"
            >
              {header || generateColumnLabel(index)}
            </div>
          ))
        ) : (
          Array(10).fill(0).map((_, index) => (
            <div 
              key={index} 
              className="min-w-[100px] w-[100px] h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-700 font-medium"
            >
              {generateColumnLabel(index)}
            </div>
          ))
        )}
      </div>
      
      {displayData.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          <div className="sticky left-0 w-10 min-w-[40px] h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-700 font-medium">
            {rowIndex + 1}
          </div>
          {row.map((cell: any, colIndex: number) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              rowIndex={rowIndex}
              colIndex={colIndex}
              value={cell || ''}
              displayValue={getDisplayValue(cell || '')}
              isActive={activeCell.row === rowIndex && activeCell.col === colIndex}
              isEditing={editingCell === `${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onChange={(value) => handleCellChange(rowIndex, colIndex, value)}
              onBlur={() => setEditingCell(null)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Spreadsheet;