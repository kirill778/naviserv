import React, { useState, useEffect } from 'react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';

interface FunctionDefinition {
  name: string;
  description: string;
  category: string;
  template: string; // e.g., "SUM(число1; [число2]; ...)"
}

const commonFunctions: FunctionDefinition[] = [
  { name: 'SUM', description: 'Суммирует все числа в диапазоне ячеек.', category: 'Математические', template: 'SUM(число1; [число2]; ...)' },
  { name: 'AVERAGE', description: 'Возвращает среднее арифметическое аргументов.', category: 'Статистические', template: 'AVERAGE(число1; [число2]; ...)' },
  { name: 'IF', description: 'Проверяет, выполняется ли условие, и возвращает одно значение, если оно выполняется, и другое значение, если нет.', category: 'Логические', template: 'IF(логическое_выражение; значение_если_истина; значение_если_ложь)' },
  { name: 'MAX', description: 'Возвращает наибольшее значение из набора значений.', category: 'Статистические', template: 'MAX(число1; [число2]; ...)' },
  { name: 'MIN', description: 'Возвращает наименьшее значение из набора значений.', category: 'Статистические', template: 'MIN(число1; [число2]; ...)' },
  { name: 'COUNT', description: 'Подсчитывает количество ячеек, содержащих числа.', category: 'Статистические', template: 'COUNT(значение1; [значение2]; ...)' },
  { name: 'CONCATENATE', description: 'Объединяет несколько текстовых строк в одну.', category: 'Текстовые', template: 'CONCATENATE(текст1; [текст2]; ...)' },
  { name: 'VLOOKUP', description: 'Ищет значение в первом столбце таблицы и возвращает значение из той же строки указанного столбца.', category: 'Ссылки и массивы', template: 'VLOOKUP(искомое_значение; таблица_массив; номер_столбца; [интервальный_просмотр])' },
  { name: 'TODAY', description: 'Возвращает текущую дату.', category: 'Дата и время', template: 'TODAY()' },
  { name: 'NOW', description: 'Возвращает текущую дату и время.', category: 'Дата и время', template: 'NOW()' },
];

const categories = ['Все', ...new Set(commonFunctions.map(f => f.category))];

interface FunctionHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFunction: (functionTemplate: string) => void;
}

const FunctionHelperModal: React.FC<FunctionHelperModalProps> = ({ isOpen, onClose, onInsertFunction }) => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<FunctionDefinition | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Define filteredFunctions here, so it's available for useEffect
  const filteredFunctions = isOpen 
    ? commonFunctions.filter(func => 
        (selectedCategory === 'Все' || func.category === selectedCategory) &&
        (func.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         func.description.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  // All hooks must be called unconditionally at the top level
  useEffect(() => {
    if (isOpen && filteredFunctions.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
      setSelectedFunction(filteredFunctions[0]);
    }
  }, [filteredFunctions, selectedIndex, isOpen]);

  const resetState = () => {
    setSelectedCategory('Все');
    setSearchTerm('');
    setSelectedFunction(null);
    setSelectedIndex(-1);
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  // Early return after all hooks are called
  if (!isOpen) return null;

  const handleInsert = () => {
    if (selectedFunction) {
      // Вставляем имя функции и открывающую скобку, курсор будет после нее
      onInsertFunction(selectedFunction.name + '('); 
      onClose();
      resetState();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedFunction) {
        handleInsert();
      } else if (selectedIndex >= 0 && selectedIndex < filteredFunctions.length) {
        setSelectedFunction(filteredFunctions[selectedIndex]);
        setTimeout(handleInsert, 0);
      }
    } else if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, filteredFunctions.length - 1);
      setSelectedIndex(newIndex);
      setSelectedFunction(filteredFunctions[newIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(newIndex);
      setSelectedFunction(filteredFunctions[newIndex]);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Вставка функции</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        <div className="mb-4">
          <label htmlFor="search-function" className="block text-sm font-medium text-gray-700 mb-1">Поиск функции:</label>
          <input 
            type="text" 
            id="search-function"
            placeholder="Введите имя или описание..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">Категория:</label>
          <select 
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="mb-4 flex-grow overflow-y-auto border border-gray-200 rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 p-2 sticky top-0 bg-gray-50 border-b">Выберите функцию:</label>
          <ul className="divide-y divide-gray-200">
            {filteredFunctions.length > 0 ? (
              filteredFunctions.map((func, index) => (
                <li 
                  key={func.name}
                  onClick={() => {
                    setSelectedFunction(func);
                    setSelectedIndex(index);
                  }}
                  className={`p-3 cursor-pointer hover:bg-blue-50 ${
                    index === selectedIndex ? 'bg-blue-100 ring-1 ring-blue-500' : ''
                  }`}
                >
                  <div className="font-semibold text-blue-600">{func.name}</div>
                  <div className="text-xs text-gray-600">{func.template}</div>
                </li>
              ))
            ) : (
              <li className="p-3 text-sm text-gray-500 italic">Функции не найдены.</li>
            )}
          </ul>
        </div>

        {selectedFunction && (
          <div className="mb-4 p-3 border border-gray-200 rounded-md bg-yellow-50 text-sm">
            <div className="font-bold text-yellow-800">{selectedFunction.template}</div>
            <p className="text-yellow-700 mt-1">{selectedFunction.description}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button 
            onClick={handleClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Отмена
          </button>
          <button 
            onClick={handleInsert} 
            disabled={!selectedFunction}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunctionHelperModal; 