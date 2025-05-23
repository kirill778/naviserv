import React, { useState } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';

interface MetricWidgetProps {
  title: string;
  onDelete: () => void;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({ title, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // В реальном приложении данные будут приходить извне
  const value = '0';
  const changePercent = 0;
  const isPositive = changePercent >= 0;
  
  return (
    <div 
      className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden"
      onClick={(e) => {
        // Stop event propagation to prevent the widget from moving when clicked
        e.stopPropagation();
      }}
    >
      <div className="px-4 py-2 border-b border-gray-200 flex items-center">
        <h3 className="text-gray-800 font-medium">{title}</h3>
        <div className="ml-auto flex items-center">
          {/* Кнопка удаления виджета */}
          <button 
            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Удалить виджет"
          >
            <Trash2 size={16} />
          </button>
          
          <button 
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal size={16} className="text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-36">
              <button 
                className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit size={14} className="mr-2 text-gray-600" />
                Edit Widget
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {value ? (
          <>
            <div className="text-3xl font-bold text-gray-800">{value}</div>
            <div className={`flex items-center mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp size={18} className="mr-1" />
              ) : (
                <TrendingDown size={18} className="mr-1" />
              )}
              <span className="font-medium">{changePercent}%</span>
              <span className="text-gray-500 ml-1 text-sm">from last month</span>
            </div>
          </>
        ) : (
          <div className="text-gray-400">No data available</div>
        )}
      </div>
    </div>
  );
};

export default MetricWidget;