import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Save, 
  Undo2, 
  Redo2, 
  Search, 
  HelpCircle, 
  User
} from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Home';
      case '/spreadsheet':
        return 'Spreadsheet';
      case '/dashboard':
        return 'Dashboard';
      case '/settings':
        return 'Settings';
      default:
        return 'CSV Processor';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
        {(location.pathname === '/spreadsheet' || location.pathname === '/dashboard') && (
          <div className="ml-4 flex space-x-2">
            <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors" title="Undo">
              <Undo2 size={18} />
            </button>
            <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors" title="Redo">
              <Redo2 size={18} />
            </button>
            <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors" title="Save">
              <Save size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors" title="Help">
          <HelpCircle size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer">
          <User size={18} />
        </div>
      </div>
    </header>
  );
};

export default Header;