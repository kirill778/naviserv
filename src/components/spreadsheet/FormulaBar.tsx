import React, { useEffect, useRef, useState } from 'react';
import { FunctionSquare as FunctionIcon, Plus } from 'lucide-react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';
import FunctionHelperModal from './FunctionHelperModal';

const FormulaBar: React.FC = () => {
  const {
    activeCell,
    getCellValue,
    isFormulaSelectionMode,
    formulaSourceCell,
    currentFormulaValue,
    formulaCursorPosition,
    updateCurrentFormulaValue,
    startFormulaMode,
    insertFunctionTemplate,
  } = useSpreadsheetStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFunctionModalOpen, setIsFunctionModalOpen] = useState(false);
  
  const cellLabel = activeCell.row !== null && activeCell.col !== null 
    ? `${String.fromCharCode(65 + activeCell.col)}${activeCell.row + 1}`
    : '';
    
  let displayInputValue = '';
  if (isFormulaSelectionMode && formulaSourceCell && formulaSourceCell.row === activeCell.row && formulaSourceCell.col === activeCell.col) {
    displayInputValue = currentFormulaValue;
  } else if (activeCell.row !== null && activeCell.col !== null) {
    displayInputValue = getCellValue(activeCell.row, activeCell.col) || '';
  }
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    if (isFormulaSelectionMode && formulaSourceCell && formulaSourceCell.row === activeCell.row && formulaSourceCell.col === activeCell.col) {
      updateCurrentFormulaValue(newValue, cursor);
    } else if (activeCell.row !== null && activeCell.col !== null) {
      if (newValue.startsWith('=')) {
        startFormulaMode(activeCell.row, activeCell.col, newValue);
      } else {
        useSpreadsheetStore.getState().updateCellValue(activeCell.row, activeCell.col, newValue);
      }
    }
  };

  const handlePlusButtonClick = () => {
    if (activeCell.row !== null && activeCell.col !== null) {
      const currentVal = getCellValue(activeCell.row, activeCell.col) || '';
      let formulaStartValue = currentVal;
      if (!currentVal.startsWith('=')) {
        formulaStartValue = `=${currentVal}`;
      }
      startFormulaMode(activeCell.row, activeCell.col, formulaStartValue);
      inputRef.current?.focus();
      const pos = formulaStartValue.length;
      setTimeout(() => inputRef.current?.setSelectionRange(pos,pos), 0);
    }
  };

  const handleInsertFunction = (functionName: string) => {
    const nameOnly = functionName.slice(0, -1);
    insertFunctionTemplate(nameOnly);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (inputRef.current && 
        isFormulaSelectionMode && 
        formulaSourceCell && 
        formulaSourceCell.row === activeCell.row && 
        formulaSourceCell.col === activeCell.col &&
        formulaCursorPosition !== null) {
          setTimeout(() => {
            if(inputRef.current) {
                 inputRef.current.setSelectionRange(formulaCursorPosition, formulaCursorPosition);
            }
          }, 0);
    }
  }, [formulaCursorPosition, isFormulaSelectionMode, formulaSourceCell, activeCell, displayInputValue]);

  return (
    <>
      <div className="formula-bar-controlled h-10 bg-white border border-gray-200 rounded-md mb-2 flex items-center px-2">
        <button 
          onClick={() => setIsFunctionModalOpen(true)} 
          className="flex items-center justify-center h-8 w-8 bg-gray-100 rounded mr-2 hover:bg-gray-200 formula-bar-controlled"
          title="Вставить функцию"
        >
          <FunctionIcon size={18} className="text-gray-600" />
        </button>
        <div className="w-16 text-gray-600 font-medium">{cellLabel}</div>
        <div className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-8 px-2 outline-none border-none"
            value={displayInputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (inputRef.current && isFormulaSelectionMode && formulaSourceCell && 
                  formulaSourceCell.row === activeCell.row && formulaSourceCell.col === activeCell.col) {
                    const pos = formulaCursorPosition !== null ? formulaCursorPosition : displayInputValue.length;
                    inputRef.current.setSelectionRange(pos, pos);
              }
            }}
            placeholder="Введите значение или формулу, начиная со знака ="
          />
          <button 
            className={`formula-bar-controlled flex items-center justify-center h-8 w-8 ml-2 rounded ${isFormulaSelectionMode && formulaSourceCell?.row === activeCell.row && formulaSourceCell?.col === activeCell.col ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            onClick={handlePlusButtonClick}
            title="Начать формулу или выбрать ссылку на ячейку"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <FunctionHelperModal 
        isOpen={isFunctionModalOpen} 
        onClose={() => setIsFunctionModalOpen(false)} 
        onInsertFunction={handleInsertFunction} 
      />
    </>
  );
};

export default FormulaBar;