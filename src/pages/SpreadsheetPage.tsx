import React, { useState } from 'react';
import { Upload, Plus, Save, Download } from 'lucide-react';
import Spreadsheet from '../components/spreadsheet/Spreadsheet';
import FormulaBar from '../components/spreadsheet/FormulaBar';
import ToolBar from '../components/spreadsheet/ToolBar';
import useSpreadsheetStore from '../stores/spreadsheetStore';
import { importCSV } from '../utils/csvUtils';

const SpreadsheetPage: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { setData } = useSpreadsheetStore();

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

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Save size={16} className="mr-1" />
            Save
          </button>
          <button className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-1" />
            Export
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
              Import CSV
            </label>
          </div>
        </div>
        <div>
          <button className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Plus size={16} className="mr-1" />
            Add Sheet
          </button>
        </div>
      </div>
      
      <ToolBar />
      <FormulaBar />
      
      <div className="flex-1 bg-white border border-gray-200 rounded-md overflow-hidden">
        {isImporting ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Importing CSV...</span>
          </div>
        ) : (
          <Spreadsheet />
        )}
      </div>
    </div>
  );
};

export default SpreadsheetPage;