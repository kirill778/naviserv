import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, PaintBucket, TextCursor as TextColor, Filter, SortAsc, SortDesc, Plus, Rows, Columns, X, ArrowLeftRight } from 'lucide-react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';

const DEFAULT_COLUMN_WIDTH = 200; // Стандартная ширина столбца в пикселях (увеличена с 100px)
const NARROW_COLUMN_WIDTH = 145; // Узкая ширина столбца (изменено с 100px)
const WIDE_COLUMN_WIDTH = 300; // Широкая ширина столбца (увеличена с 200px)

const ToolBar: React.FC = () => {
  const {
    activeCell,
    insertRowAbove,
    insertRowBelow,
    deleteRow,
    insertColumnLeft,
    insertColumnRight,
    deleteColumn,
    setColumnWidth,
    columnWidths,
  } = useSpreadsheetStore();

  // Helper functions for row/column operations
  const handleInsertRowAbove = () => {
    if (activeCell.row !== null) {
      insertRowAbove(activeCell.row);
    }
  };

  const handleInsertRowBelow = () => {
    if (activeCell.row !== null) {
      insertRowBelow(activeCell.row);
    }
  };

  const handleDeleteRow = () => {
    if (activeCell.row !== null) {
      deleteRow(activeCell.row);
    }
  };

  const handleInsertColumnLeft = () => {
    if (activeCell.col !== null) {
      insertColumnLeft(activeCell.col);
    }
  };

  const handleInsertColumnRight = () => {
    if (activeCell.col !== null) {
      insertColumnRight(activeCell.col);
    }
  };

  const handleDeleteColumn = () => {
    if (activeCell.col !== null) {
      deleteColumn(activeCell.col);
    }
  };

  // Новые функции для изменения ширины столбцов
  const handleNarrowColumn = () => {
    if (activeCell.col !== null) {
      setColumnWidth(activeCell.col, NARROW_COLUMN_WIDTH);
    }
  };

  const handleDefaultWidthColumn = () => {
    if (activeCell.col !== null) {
      setColumnWidth(activeCell.col, DEFAULT_COLUMN_WIDTH);
    }
  };

  const handleWideColumn = () => {
    if (activeCell.col !== null) {
      setColumnWidth(activeCell.col, WIDE_COLUMN_WIDTH);
    }
  };

  return (
    <div className="h-auto bg-white border border-gray-200 rounded-md mb-2 flex flex-wrap items-center px-2 py-1">
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Bold size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Italic size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Underline size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignLeft size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignCenter size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignRight size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <TextColor size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <PaintBucket size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Строки</span>
          <div className="flex space-x-1">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Вставить строку выше"
              onClick={handleInsertRowAbove}
            >
              <Rows size={16} className="text-gray-600 mr-1" />
              <Plus size={14} className="text-gray-600" />
              <span className="ml-1 text-xs">↑</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Вставить строку ниже"
              onClick={handleInsertRowBelow}
            >
              <Rows size={16} className="text-gray-600 mr-1" />
              <Plus size={14} className="text-gray-600" />
              <span className="ml-1 text-xs">↓</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Удалить строку"
              onClick={handleDeleteRow}
            >
              <Rows size={16} className="text-gray-600 mr-1" />
              <X size={14} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Столбцы</span>
          <div className="flex space-x-1">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Вставить столбец слева"
              onClick={handleInsertColumnLeft}
            >
              <Columns size={16} className="text-gray-600 mr-1" />
              <Plus size={14} className="text-gray-600" />
              <span className="ml-1 text-xs">←</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Вставить столбец справа"
              onClick={handleInsertColumnRight}
            >
              <Columns size={16} className="text-gray-600 mr-1" />
              <Plus size={14} className="text-gray-600" />
              <span className="ml-1 text-xs">→</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Удалить столбец"
              onClick={handleDeleteColumn}
            >
              <Columns size={16} className="text-gray-600 mr-1" />
              <X size={14} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Ширина столбца</span>
          <div className="flex space-x-1">
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Узкий столбец"
              onClick={handleNarrowColumn}
            >
              <ArrowLeftRight size={16} className="text-gray-600 mr-1" />
              <span className="ml-1 text-xs">Узкий</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Стандартная ширина"
              onClick={handleDefaultWidthColumn}
            >
              <ArrowLeftRight size={16} className="text-gray-600 mr-1" />
              <span className="ml-1 text-xs">Сброс</span>
            </button>
            <button 
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center" 
              title="Широкий столбец"
              onClick={handleWideColumn}
            >
              <ArrowLeftRight size={16} className="text-gray-600 mr-1" />
              <span className="ml-1 text-xs">Широкий</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Filter size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <SortAsc size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <SortDesc size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="ml-auto">
        <select className="border border-gray-300 rounded px-2 py-1 text-sm">
          <option>Format: Auto</option>
          <option>Text</option>
          <option>Number</option>
          <option>Currency</option>
          <option>Percentage</option>
          <option>Date</option>
        </select>
      </div>
    </div>
  );
};

export default ToolBar;