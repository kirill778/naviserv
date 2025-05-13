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
  
  // Mock data - in a real app, this would come from the data source
  const value = '$45,231';
  const changePercent = 13.2;
  const isPositive = changePercent > 0;
  
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
      <div className="flex-1 flex flex-col items-center justify-center p-4">
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
      </div>
    </div>
  );
};

export default MetricWidget;