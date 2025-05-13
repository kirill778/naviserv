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

// Sample data for charts
const chartData = [
  { name: 'Jan', value: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', value: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', value: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', value: 2780, pv: 3908, amt: 2000 },
  { name: 'May', value: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', value: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', value: 3490, pv: 4300, amt: 2100 },
];

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