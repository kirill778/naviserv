import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  MoreHorizontal, 
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Тип данных для чартов
interface ChartDataItem {
  name: string;
  value: number;
  pv?: number;
  amt?: number;
}

// Пустой набор данных
const chartData: ChartDataItem[] = [];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartWidgetProps {
  type: string;
  title: string;
  onDelete: () => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ type, title, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Render chart based on type
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>No data available</p>
        </div>
      );
    }
    
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
              <Bar dataKey="pv" fill="#14B8A6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="pv" stroke="#14B8A6" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Get icon based on chart type
  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChartIcon size={16} className="text-blue-600" />;
      case 'line':
        return <LineChartIcon size={16} className="text-green-600" />;
      case 'pie':
        return <PieChartIcon size={16} className="text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center">
        <div className="flex items-center">
          {getChartIcon()}
          <h3 className="text-gray-800 font-medium ml-2">{title}</h3>
        </div>
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
      <div className="flex-1 p-1">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartWidget;