import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import useSpreadsheetStore from '../../stores/spreadsheetStore';
import { evaluateFormula } from '../../utils/formulaUtils';

// Константы для размеров таблицы
const DEFAULT_ROW_COUNT = 100; // Увеличиваем начальное количество строк
const DEFAULT_COL_COUNT = 26; // Увеличиваем начальное количество столбцов
const MIN_VISIBLE_ROWS = 100; // Минимальное количество видимых строк
const MIN_VISIBLE_COLS = 26; // Минимальное количество видимых столбцов

const Spreadsheet: React.FC = () => {
  const { data, headers, activeCell, setActiveCell, updateCellValue } = useSpreadsheetStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState(DEFAULT_ROW_COUNT);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COL_COUNT);

  // Обработчик прокрутки для динамического добавления строк/столбцов
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = tableRef.current;
        
        // Если прокрутили близко к концу по вертикали, добавляем еще строки
        if (scrollTop + clientHeight > scrollHeight - 200) {
          setVisibleRows(prev => prev + 20);
        }
        
        // Если прокрутили близко к концу по горизонтали, добавляем еще столбцы
        if (scrollLeft + clientWidth > scrollWidth - 200) {
          setVisibleCols(prev => prev + 5);
        }
      }
    };
    
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (tableElement) {
        tableElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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

  // Определяем количество отображаемых строк и столбцов
  // Учитываем имеющиеся данные и минимально необходимое количество
  const effectiveRows = Math.max(
    visibleRows,
    data.length > 0 ? data.length : MIN_VISIBLE_ROWS
  );
  
  const effectiveCols = Math.max(
    visibleCols,
    headers.length > 0 ? headers.length : MIN_VISIBLE_COLS
  );

  // Создаем "бесконечную" таблицу
  const displayData = data.length > 0 
    ? Array.from({ length: effectiveRows }, (_, rowIdx) => 
        Array.from({ length: effectiveCols }, (_, colIdx) => 
          data[rowIdx]?.[colIdx] || ''))
    : Array.from({ length: effectiveRows }, () => 
        Array.from({ length: effectiveCols }, () => ''));

  return (
    <div 
      ref={tableRef}
      className="relative overflow-auto h-full"
      tabIndex={0}
    >
      <div className="sticky top-0 z-10 flex">
        <div className="w-10 h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-500 font-medium"></div>
        {Array(effectiveCols).fill(0).map((_, index) => (
          <div 
            key={index} 
            className="min-w-[100px] w-[100px] h-10 bg-gray-100 border-b border-r border-gray-300 flex items-center justify-center text-gray-700 font-medium"
          >
            {headers[index] || generateColumnLabel(index)}
          </div>
        ))}
      </div>
      
      {displayData.map((row, rowIndex) => (
        <div key={rowIndex} className="flex whitespace-nowrap">
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