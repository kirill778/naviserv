import React, { useState, useEffect } from 'react';
import { Upload, Plus, Save, Download, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Spreadsheet from '../components/spreadsheet/Spreadsheet';
import FormulaBar from '../components/spreadsheet/FormulaBar';
import ToolBar from '../components/spreadsheet/ToolBar';
import useSpreadsheetStore from '../stores/spreadsheetStore';
import { importCSV } from '../utils/csvUtils';

const SpreadsheetPage: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();
  const { fileId } = useParams();

  const { 
    setData, 
    saveSpreadsheet, 
    loadSpreadsheet, 
    isSaving, 
    isLoading, 
    currentFile,
    errorMessage 
  } = useSpreadsheetStore();

  // Загружаем файл, если передан fileId
  useEffect(() => {
    if (fileId) {
      const id = parseInt(fileId);
      if (!isNaN(id)) {
        loadSpreadsheet(id);
      }
    }
  }, [fileId, loadSpreadsheet]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      try {
        const result = await importCSV(file);
        setData(result.data, result.fields);
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV file. Please try another file.');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleSave = async () => {
    if (currentFile.id) {
      // Если файл уже существует в БД, просто обновляем его
      await saveSpreadsheet();
    } else {
      // Если это новый файл, показываем диалог для ввода имени
      setShowSaveDialog(true);
    }
  };

  const handleSaveConfirm = async () => {
    if (!fileName.trim()) {
      alert('Пожалуйста, введите имя файла');
      return;
    }

    await saveSpreadsheet(fileName);
    setShowSaveDialog(false);
    setFileName('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            className={`flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                {currentFile.id ? 'Сохранить' : 'Сохранить как...'}
              </>
            )}
          </button>
          <button className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-1" />
            Экспорт
          </button>
          <div className="relative">
            <input
              type="file"
              id="csv-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="csv-upload" 
              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Upload size={16} className="mr-1" />
              Импорт CSV
            </label>
          </div>
        </div>
        <div className="flex items-center">
          {currentFile.name && (
            <span className="mr-4 text-gray-600">
              {currentFile.name}
            </span>
          )}
          <button className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Plus size={16} className="mr-1" />
            Добавить лист
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <ToolBar />
      <FormulaBar />
      
      <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden">
        {isImporting || isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              {isImporting ? 'Импортирование CSV...' : 'Загрузка данных...'}
            </span>
          </div>
        ) : (
          <Spreadsheet />
        )}
      </div>
      
      {/* Диалог сохранения */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Сохранить таблицу</h2>
            <p className="mb-4 text-gray-600">Введите имя для сохранения таблицы:</p>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              placeholder="Название таблицы"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
            />
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowSaveDialog(false)}
              >
                Отмена
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleSaveConfirm}
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetPage;