import React, { useState, useEffect, useRef } from 'react';

interface CellProps {
  rowIndex: number;
  colIndex: number;
  value: string;
  displayValue: string | number;
  isActive: boolean;
  isEditing: boolean;
  onClick: () => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const Cell: React.FC<CellProps> = ({
  rowIndex,
  colIndex,
  value,
  displayValue,
  isActive,
  isEditing,
  onClick,
  onChange,
  onBlur
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when cell value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Focus input when cell is being edited
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(inputValue);
      onBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value);
      onBlur();
    }
  };

  // Handle blur
  const handleBlur = () => {
    onChange(inputValue);
    onBlur();
  };

  return (
    <div
      className={`min-w-[100px] w-[100px] h-10 border-b border-r border-gray-300 flex items-center overflow-hidden ${
        isActive ? 'bg-blue-50 outline outline-2 outline-blue-500 z-10' : 'bg-white'
      }`}
      onClick={onClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="w-full h-full px-2 py-1 outline-none border-none"
          value={inputValue}
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
          {displayValue}
        </div>
      )}
    </div>
  );
};

export default Cell;