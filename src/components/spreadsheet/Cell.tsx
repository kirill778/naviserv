import React, { useState, useEffect, useRef } from 'react';
import useSpreadsheetStore from '../../stores/spreadsheetStore'; // Импортируем хранилище

interface CellProps {
  rowIndex: number;
  colIndex: number;
  value: string; // Это значение из data, оно не всегда совпадает с currentFormulaValue
  displayValue: string | number;
  isActive: boolean;
  isEditing: boolean; // Управляется из Spreadsheet на основе editingCell из store
  isFormulaSelectionMode: boolean; // Общий флаг режима выбора формулы
  isCellReferencedInFormula?: boolean;
  isCellFormulaSource?: boolean;
  onClick: () => void;
  // onChange и onBlur больше не нужны как props, Cell будет использовать store напрямую
}

const Cell: React.FC<CellProps> = ({
  rowIndex,
  colIndex,
  value,
  displayValue,
  isActive,
  isEditing,
  isFormulaSelectionMode,
  isCellReferencedInFormula = false,
  isCellFormulaSource = false,
  onClick,
}) => {
  // Получаем необходимые функции из хранилища
  const {
    startFormulaMode,
    updateCurrentFormulaValue,
    updateCellValue, // Для сохранения не-формульных значений и финальной формулы
    setEditingCell,
    cancelFormulaMode,
    currentFormulaValue, // Используем для отображения в input, если это ячейка с формулой
    formulaSourceCell,
  } = useSpreadsheetStore();

  const [inputValue, setInputValue] = useState(value); // Локальное состояние для input
  const inputRef = useRef<HTMLInputElement>(null);

  // Синхронизация inputValue с value из props ИЛИ с currentFormulaValue из store
  useEffect(() => {
    if (isEditing && isCellFormulaSource) {
      setInputValue(currentFormulaValue);
    } else {
      setInputValue(value);
    }
  }, [value, isEditing, isCellFormulaSource, currentFormulaValue]);

  // Focus input when cell is being edited
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Если редактируем ячейку-источник формулы, ставим курсор или выделяем
      if (isCellFormulaSource) {
        const cursorPos = useSpreadsheetStore.getState().formulaCursorPosition;
        if (typeof cursorPos === 'number') {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing, isCellFormulaSource]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue); // Обновляем локальное состояние input

    if (isCellFormulaSource) {
      // Если это ячейка с формулой, обновляем currentFormulaValue в store
      updateCurrentFormulaValue(newValue, e.target.selectionStart);
    } 
    // Если это обычная ячейка, значение сохранится при onBlur или Enter
    // Автоматический старт режима формулы, если введено "="
    if (!isFormulaSelectionMode && newValue.startsWith('=') && !isCellFormulaSource) {
       startFormulaMode(rowIndex, colIndex, newValue);
    } else if (isFormulaSelectionMode && isCellFormulaSource && newValue.startsWith('=') === false) {
      // Если из ячейки с формулой удалили знак "=", отменяем режим формулы
      cancelFormulaMode();
      // И сохраняем как обычное значение
      updateCellValue(rowIndex, colIndex, newValue);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Предотвращаем стандартное поведение (переход на новую строку)
      
      if (isCellFormulaSource) {
        // Фиксируем формулу, режим формулы отменится в updateCellValue в store, если нужно
        updateCellValue(rowIndex, colIndex, inputValue);
      } else {
        updateCellValue(rowIndex, colIndex, inputValue);
      }
      setEditingCell(null, null); // Завершаем редактирование
    } else if (e.key === 'Escape') {
      if (isCellFormulaSource) {
        cancelFormulaMode();
      }
      setInputValue(value); // Возвращаем исходное значение ячейки
      updateCellValue(rowIndex, colIndex, value); // Отменяем изменения и в store
      setEditingCell(null, null); // Завершаем редактирование
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Проверяем, не переходит ли фокус на другой элемент внутри приложения, который этого требует (например, FormulaBar)
    // Это очень сложная часть, и для простоты пока будем считать, что blur всегда завершает редактирование,
    // если это не ячейка-источник в режиме формулы.
    if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.formula-bar-controlled')) {
        // Если фокус ушел на элемент, который контролирует FormulaBar (например, сама FormulaBar или кнопка плюса)
        // то не завершаем редактирование и не отменяем режим формулы
        return;
    }

    if (isCellFormulaSource && isFormulaSelectionMode) {
      // Если это ячейка-источник в активном режиме формулы, то blur НЕ должен отменять режим или сохранять.
      // Сохранение происходит по Enter или при изменении currentFormulaValue.
      // Отмена - по Escape.
      // Здесь мы просто обновляем inputValue, если он изменился, на случай если фокус ушел случайно
      if (inputValue !== currentFormulaValue) {
         updateCurrentFormulaValue(inputValue, inputRef.current?.selectionStart || null);
      }
      return; 
    }

    // Для всех остальных случаев - обычное сохранение при blur
    if (inputValue !== value) {
      updateCellValue(rowIndex, colIndex, inputValue);
    }
    setEditingCell(null, null);
  };

  // Обработчик клика, который учитывает режим выбора формулы
  const handleCellClick = () => {
    onClick(); // Передаем управление Spreadsheet для setEditingCell / selectCellForFormula
  };

  // Generate classes based on state
  const getCellClasses = () => {
    let classes = "cell min-w-[100px] w-[100px] h-10 border-b border-r border-gray-300 flex items-center overflow-hidden ";
    if (isActive) {
      classes += "bg-blue-50 outline outline-2 outline-blue-500 z-10 ";
    } else if (isCellReferencedInFormula && isFormulaSelectionMode && !isCellFormulaSource) {
      // Подсветка ячеек, которые используются в текущей формуле
      classes += "bg-blue-200 outline outline-1 outline-blue-500 z-10 ";
    } else {
      classes += "bg-white ";
    }
    
    if (isFormulaSelectionMode) {
      if (isCellFormulaSource) {
        // Ячейка, в которой редактируется формула
        classes += "bg-green-50 ";
      } else if (!isActive) { // Не подсвечивать как hover, если это активная/выбранная ячейка
        classes += "hover:bg-blue-100 hover:outline hover:outline-1 hover:outline-blue-400 cursor-pointer ";
      }
    }
    return classes;
  };
  
  const displayedContent = isEditing && isCellFormulaSource ? currentFormulaValue : displayValue;

  return (
    <div
      className={getCellClasses()}
      onClick={handleCellClick} // onClick из Spreadsheet теперь решит, что делать
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="w-full h-full px-2 py-1 outline-none border-none bg-transparent"
          value={inputValue} // Локальное состояние для input, синхронизированное
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div 
          className={`w-full h-full px-2 py-1 truncate ${
            typeof value === 'string' && value.startsWith('=') ? 'text-black' : ''
          } ${
            typeof displayValue === 'number' ? 'text-right' : ''
          }`}
        >
          {displayedContent}
        </div>
      )}
    </div>
  );
};

export default Cell;