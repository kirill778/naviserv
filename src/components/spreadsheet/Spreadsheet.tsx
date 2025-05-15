import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import ContextMenu from './ContextMenu';
import ColumnResizer from './ColumnResizer';
import useSpreadsheetStore from '../../stores/spreadsheetStore';
import { evaluateFormula, extractCellRefs, cellRefToIndices } from '../../utils/formulaUtils';

// Константы для размеров таблицы
const DEFAULT_ROW_COUNT = 100;
const DEFAULT_COL_COUNT = 26;
const MIN_VISIBLE_ROWS = 100;
const MIN_VISIBLE_COLS = 26;
const DEFAULT_COLUMN_WIDTH = 200; // Стандартная ширина столбца в пикселях (увеличена с 100px)
const ROW_HEADER_WIDTH = 34;

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  type: 'row' | 'column' | 'cell';
  index: number;
}

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
    cancelFormulaMode,
    columnWidths,
  } = useSpreadsheetStore();
  
  const tableRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState(DEFAULT_ROW_COUNT);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_COL_COUNT);
  const [formulaReferencedCells, setFormulaReferencedCells] = useState<Array<[number, number]>>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    type: 'cell',
    index: 0
  });

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

  // Добавляем обработчик клика по таблице для завершения редактирования формулы
  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем контекстное меню при любом клике
    if (contextMenu.isVisible) {
      setContextMenu(prev => ({ ...prev, isVisible: false }));
    }
    
    // Проверяем, не является ли цель клика ячейкой или внутренним элементом ячейки
    const target = e.target as HTMLElement;
    const isCell = target.closest('.cell') !== null || target.classList.contains('cell');
    const isFormulaBar = target.closest('.formula-bar-controlled') !== null;
    
    // Если кликнули не по ячейке и не по панели формул, и при этом редактируется формула
    if (!isCell && !isFormulaBar && editingCell !== null && isFormulaSelectionMode) {
      // Завершаем редактирование формулы
      setEditingCell(null, null);
    }
  };

  // Обработчик контекстного меню для ячеек
  const handleCellContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      type: 'cell',
      index: rowIndex // We'll use rowIndex for both row and column operations
    });
    // Also set the active cell
    setActiveCell(rowIndex, colIndex);
  };

  // Обработчик контекстного меню для заголовков строк
  const handleRowHeaderContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      type: 'row',
      index: rowIndex
    });
  };

  // Обработчик контекстного меню для заголовков столбцов
  const handleColumnHeaderContextMenu = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      type: 'column',
      index: colIndex
    });
  };

  // Функция для получения ширины столбца
  const getColumnWidth = (columnIndex: number): number => {
    return columnWidths[columnIndex] || DEFAULT_COLUMN_WIDTH;
  };

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
      onClick={handleTableClick}
    >
      {contextMenu.isVisible && (
        <ContextMenu
          position={contextMenu.position}
          isVisible={contextMenu.isVisible}
          onClose={() => setContextMenu(prev => ({ ...prev, isVisible: false }))}
          type={contextMenu.type}
          index={contextMenu.index}
        />
      )}
      
      {isFormulaSelectionMode && (
        <div className="absolute top-0 left-0 right-0 bg-blue-100 text-blue-800 p-2 text-center z-20">
          Кликните на ячейку, чтобы добавить ее в формулу, или продолжите ввод.
        </div>
      )}
      
      <div className="table-wrapper">
        {/* Заголовок таблицы */}
      <div className="sticky top-0 z-10 flex">
          {/* Верхний левый угол таблицы, отображает символ "№" */}
          <div className="w-10 h-10 bg-gray-100 border-b border-r border-gray-400 flex items-center justify-center text-gray-500 font-medium"
          style={{
            minWidth: `${ROW_HEADER_WIDTH}px`, // Минимальная ширина столбца
            width: `${ROW_HEADER_WIDTH}px`, // Установленная ширина столбца
            height: '40px' // Высота заголовка столбца
          }}
          >№</div>
          
          {/* Генерация заголовков столбцов */}
        {Array(effectiveCols).fill(0).map((_, index) => (
          <div 
            key={index} 
            className="bg-gray-100 border-b border-r border-gray-400 flex items-center justify-center text-gray-700 font-medium cursor-pointer relative overflow-hidden"
            style={{ 
              minWidth: `${getColumnWidth(index)}px`, // Минимальная ширина столбца
              width: `${getColumnWidth(index)}px`, // Установленная ширина столбца
              height: '40px' // Высота заголовка столбца
            }}
            onContextMenu={(e) => handleColumnHeaderContextMenu(e, index)} // Обработчик контекстного меню для заголовка столбца
          >
            <span className="inline-block text-center">{headers[index] || generateColumnLabel(index)}</span> {/* Отображение заголовка столбца */}
            <div className="absolute top-0 right-0 h-full w-0.5 bg-gray-400"></div> {/* Вертикальная линия справа от заголовка */}
            <ColumnResizer columnIndex={index} defaultWidth={DEFAULT_COLUMN_WIDTH} /> {/* Компонент для изменения ширины столбца */}
          </div>
        ))}
      </div>
      
        {/* Содержимое таблицы */}
        <div className="table-content">
      {displayData.map((row, rowIndex) => (
        <div key={rowIndex} className="flex whitespace-nowrap">
              {/* Заголовок строки */}
              <div 
                className="sticky left-0 w-8 min-w-[34px] h-10 bg-gray-100 border-b border-r border-gray-400 flex items-center justify-center text-gray-700 font-medium cursor-pointer"
                onContextMenu={(e) => handleRowHeaderContextMenu(e, rowIndex)}
              >
                <span className="inline-block text-center">{rowIndex + 1}</span>
          </div>
              
              {/* Ячейки строки */}
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
                  onContextMenu={(e) => handleCellContextMenu(e, rowIndex, colIndex)}
                  width={getColumnWidth(colIndex)}
            />
          ))}
        </div>
      ))}
        </div>
      </div>
    </div>
  );
};

export default Spreadsheet;