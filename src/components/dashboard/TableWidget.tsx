import React, { useState } from 'react';
import { 
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Edit,
  Download,
  Trash2
} from 'lucide-react';

// Определяем интерфейс для данных таблицы
interface TableRow {
  id: number;
  product: string;
  sales: number;
  revenue: string;
}

interface TableWidgetProps {
  title: string;
  onDelete: () => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({ title, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // Пустой набор данных
  const tableData: TableRow[] = [];
  
  const columns = [
    { key: 'product', label: 'Product' },
    { key: 'sales', label: 'Sales', numeric: true },
    { key: 'revenue', label: 'Revenue', numeric: true },
  ];
  
  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center">
        <h3 className="text-gray-800 font-medium">{title}</h3>
        <div className="ml-auto relative">
          <button 
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={16} className="text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-36">
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors">
                <Edit size={14} className="mr-2 text-gray-600" />
                Edit Widget
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors">
                <Download size={14} className="mr-2 text-gray-600" />
                Export
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 transition-colors"
                onClick={onDelete}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={`py-2 px-3 text-xs font-medium text-gray-600 border-b border-gray-200 text-left ${
                    column.numeric ? 'text-right' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    <div className="flex flex-col">
                      <ArrowUp size={10} className="text-gray-400" />
                      <ArrowDown size={10} className="text-gray-400 -mt-1" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="py-2 px-3 border-b border-gray-100">{row.product}</td>
                <td className="py-2 px-3 border-b border-gray-100 text-right">{row.sales}</td>
                <td className="py-2 px-3 border-b border-gray-100 text-right">{row.revenue}</td>
              </tr>
            ))}
            {tableData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWidget;