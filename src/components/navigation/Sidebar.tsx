import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  BarChart4, 
  Settings, 
  Home,
  FileUp,
  Download
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <Home size={20} />, label: 'Home' },
    { to: '/spreadsheet', icon: <FileSpreadsheet size={20} />, label: 'Spreadsheet' },
    { to: '/dashboard', icon: <BarChart4 size={20} />, label: 'Dashboard' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-blue-600">CSV Processor</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <NavLink 
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center p-2 text-base font-normal rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center p-2 mb-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <FileUp size={16} className="mr-2" />
          <span>Import CSV</span>
        </button>
        <button className="w-full flex items-center justify-center p-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <Download size={16} className="mr-2" />
          <span>Export PDF</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;