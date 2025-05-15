import React from 'react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';

// Константы ширины столбцов
const DEFAULT_COLUMN_WIDTH = 200;
const NARROW_COLUMN_WIDTH = 145;
const WIDE_COLUMN_WIDTH = 300;

interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: Position;
  isVisible: boolean;
  onClose: () => void;
  type: 'row' | 'column' | 'cell';
  index: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, isVisible, onClose, type, index }) => {
  const {
    insertRowAbove,
    insertRowBelow,
    deleteRow,
    insertColumnLeft,
    insertColumnRight,
    deleteColumn,
    setColumnWidth,
  } = useSpreadsheetStore();

  if (!isVisible) return null;

  const handleRowAction = (action: 'insertAbove' | 'insertBelow' | 'delete') => {
    switch (action) {
      case 'insertAbove':
        insertRowAbove(index);
        break;
      case 'insertBelow':
        insertRowBelow(index);
        break;
      case 'delete':
        deleteRow(index);
        break;
    }
    onClose();
  };

  const handleColumnAction = (action: 'insertLeft' | 'insertRight' | 'delete') => {
    switch (action) {
      case 'insertLeft':
        insertColumnLeft(index);
        break;
      case 'insertRight':
        insertColumnRight(index);
        break;
      case 'delete':
        deleteColumn(index);
        break;
    }
    onClose();
  };

  const handleColumnWidthChange = (width: number) => {
    setColumnWidth(index, width);
    onClose();
  };

  // Close on click outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isVisible) {
        onClose();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isVisible, onClose]);

  return (
    <div
      className="absolute bg-white shadow-lg rounded-md border border-gray-200 z-50 overflow-hidden"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'row' && (
        <div className="min-w-[180px]">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleRowAction('insertAbove')}
          >
            Вставить строку выше
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleRowAction('insertBelow')}
          >
            Вставить строку ниже
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleRowAction('delete')}
          >
            Удалить строку
          </button>
        </div>
      )}
      
      {type === 'column' && (
        <div className="min-w-[180px]">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnAction('insertLeft')}
          >
            Вставить столбец слева
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnAction('insertRight')}
          >
            Вставить столбец справа
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(NARROW_COLUMN_WIDTH)}
          >
            Узкий столбец
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(DEFAULT_COLUMN_WIDTH)}
          >
            Стандартная ширина
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(WIDE_COLUMN_WIDTH)}
          >
            Широкий столбец
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleColumnAction('delete')}
          >
            Удалить столбец
          </button>
        </div>
      )}
      
      {type === 'cell' && (
        <div className="min-w-[180px]">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleRowAction('insertAbove')}
          >
            Вставить строку выше
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleRowAction('insertBelow')}
          >
            Вставить строку ниже
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnAction('insertLeft')}
          >
            Вставить столбец слева
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnAction('insertRight')}
          >
            Вставить столбец справа
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(NARROW_COLUMN_WIDTH)}
          >
            Узкий столбец
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(DEFAULT_COLUMN_WIDTH)}
          >
            Стандартная ширина
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={() => handleColumnWidthChange(WIDE_COLUMN_WIDTH)}
          >
            Широкий столбец
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleRowAction('delete')}
          >
            Удалить строку
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleColumnAction('delete')}
          >
            Удалить столбец
          </button>
        </div>
      )}
    </div>
  );
};

export default ContextMenu; 