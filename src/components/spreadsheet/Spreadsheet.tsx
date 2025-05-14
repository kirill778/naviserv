import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import useSpreadsheetStore from '../../stores/spreadsheetStore';
import { evaluateFormula, extractCellRefs, cellRefToIndices } from '../../utils/formulaUtils';

// Константы для размеров таблицы
const DEFAULT_ROW_COUNT = 100;
const DEFAULT_COL_COUNT = 26;
const MIN_VISIBLE_ROWS = 100;
const MIN_VISIBLE_COLS = 26;

const Spreadsheet: React.FC = () => {
  const {
    data,
    headers,
    activeCell,
    setActiveCell,
    editingCell,
    setEditingCell,
    isFormulaSelectionMode,
    formulaSourceCell,
    selectCellForFormula,
  } = useSpreadsheetStore();
  
  const tableRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState(DEFAULT_ROW_COUNT);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COL_COUNT);
  const [formulaReferencedCells, setFormulaReferencedCells] = useState<Array<[number, number]>>([]);

  useEffect(() => {
    const state = useSpreadsheetStore.getState();
    if (state.isFormulaSelectionMode && state.formulaSourceCell) {
      const cellValue = state.currentFormulaValue;
      if (cellValue && cellValue.startsWith('=')) {
        const refs = extractCellRefs(cellValue.substring(1));
        const indices = refs.map(ref => {
          try {
            return cellRefToIndices(ref);
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as Array<[number, number]>;
        setFormulaReferencedCells(indices);
      } else {
        setFormulaReferencedCells([]);
      }
    } else {
      setFormulaReferencedCells([]);
    }
    const unsubscribe = useSpreadsheetStore.subscribe(
      (currentState) => {
        if (currentState.isFormulaSelectionMode && currentState.formulaSourceCell) {
          const val = currentState.currentFormulaValue;
          if (val && val.startsWith('=')) {
            const refs = extractCellRefs(val.substring(1));
            const indices = refs.map(ref => {
              try { return cellRefToIndices(ref); } catch (e) { return null; }
            }).filter(Boolean) as Array<[number, number]>;
            setFormulaReferencedCells(indices);
          } else {
            setFormulaReferencedCells([]);
          }
        } else {
          setFormulaReferencedCells([]);
        }
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = tableRef.current;
        if (scrollTop + clientHeight > scrollHeight - 200) {
          setVisibleRows(prev => prev + 20);
        }
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

  const generateColumnLabel = (index: number): string => {
    let label = '';
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  const isCellReferencedInFormula = (rowIndex: number, colIndex: number): boolean => {
    return formulaReferencedCells.some(([row, col]) => row === rowIndex && col === colIndex);
  };

  const isCellFormulaSource = (rowIndex: number, colIndex: number): boolean => {
    return formulaSourceCell?.row === rowIndex && formulaSourceCell?.col === colIndex;
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const currentStoreState = useSpreadsheetStore.getState();
    if (currentStoreState.isFormulaSelectionMode) {
      if (!(currentStoreState.formulaSourceCell?.row === rowIndex && currentStoreState.formulaSourceCell?.col === colIndex)) {
        selectCellForFormula(rowIndex, colIndex); 
        return; 
      }
    }
    
    setActiveCell(rowIndex, colIndex);
    setEditingCell(rowIndex, colIndex);
  };

  const getDisplayValue = (value: string) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      try {
        return evaluateFormula(value.substring(1), useSpreadsheetStore.getState().data);
      } catch (error) {
        return '#ERROR';
      }
    }
    return value;
  };

  const effectiveRows = Math.max(
    visibleRows,
    data.length > 0 ? data.length : MIN_VISIBLE_ROWS
  );
  
  const effectiveCols = Math.max(
    visibleCols,
    headers.length > 0 ? headers.length : MIN_VISIBLE_COLS
  );

  const displayData = data.length > 0 
    ? Array.from({ length: effectiveRows }, (_, rowIdx) => 
        Array.from({ length: effectiveCols }, (_, colIdx) => 
          data[rowIdx]?.[colIdx] || ''))
    : Array.from({ length: effectiveRows }, () => 
        Array.from({ length: effectiveCols }, () => ''));

  return (
    <div 
      ref={tableRef}
      className={`relative overflow-auto h-full ${isFormulaSelectionMode ? 'cursor-crosshair' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && isFormulaSelectionMode) {
          e.preventDefault();
          useSpreadsheetStore.getState().cancelFormulaMode();
          const currentEditingCell = useSpreadsheetStore.getState().editingCell;
          if (currentEditingCell) {
            setEditingCell(null,null);
          }
        }
      }}
    >
      {isFormulaSelectionMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-100 text-blue-800 p-2 text-center z-20">
          Кликните на ячейку, чтобы добавить ее в формулу, или продолжите ввод.
        </div>
      )}
      
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
              isEditing={editingCell?.row === rowIndex && editingCell?.col === colIndex}
              isFormulaSelectionMode={isFormulaSelectionMode}
              isCellReferencedInFormula={isCellReferencedInFormula(rowIndex, colIndex)}
              isCellFormulaSource={isCellFormulaSource(rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Spreadsheet;