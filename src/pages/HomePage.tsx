import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, BarChart4, FileUp, Clock } from 'lucide-react';

// Определяем интерфейс для файлов
interface RecentFile {
  id: number;
  name: string;
  modified: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Пустой массив недавних файлов
  const recentFiles: RecentFile[] = [];

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
            onClick={() => navigate('/spreadsheet')}
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FileSpreadsheet size={28} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Open Spreadsheet</h3>
            <p className="text-gray-600">Edit, calculate, and analyze your CSV data</p>
          </div>
          
          <div 
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
              <BarChart4 size={28} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Create Dashboard</h3>
            <p className="text-gray-600">Visualize your data with charts and widgets</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <FileUp size={28} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Import New CSV</h3>
            <p className="text-gray-600">Upload and process a new CSV file</p>
            <label className="mt-4 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors cursor-pointer">
              <input type="file" className="hidden" accept=".csv" />
              Choose File
            </label>
          </div>
        </div>
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Recent Files</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="col-span-6 font-medium text-gray-700">File Name</div>
            <div className="col-span-4 font-medium text-gray-700">Last Modified</div>
            <div className="col-span-2 font-medium text-gray-700">Actions</div>
          </div>
          
          {recentFiles.map((file) => (
            <div key={file.id} className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="col-span-6 flex items-center">
                <FileSpreadsheet size={18} className="text-gray-500 mr-3" />
                <span className="text-gray-800">{file.name}</span>
              </div>
              <div className="col-span-4 flex items-center text-gray-600">
                <Clock size={16} className="mr-2" />
                {file.modified}
              </div>
              <div className="col-span-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">Open</button>
                <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">Delete</button>
              </div>
            </div>
          ))}
          
          {recentFiles.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No recent files found
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;