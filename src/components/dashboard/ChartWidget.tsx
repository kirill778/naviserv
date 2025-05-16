import React, { useState, useEffect } from 'react';
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
import { API_URL } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

// Тип данных для чартов
interface ChartDataItem {
  name: string;
  value: number;
  pv?: number;
  amt?: number;
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartWidgetProps {
  type: string;
  title: string;
  onDelete: () => void;
  dataSource?: string; // Источник данных (имя файла)
  dataColumn?: string; // Столбец данных для отображения
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ type, title, onDelete, dataSource, dataColumn }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  // Получение данных для диаграммы при загрузке компонента
  useEffect(() => {
    const fetchChartData = async () => {
      // Если не указаны источник данных или столбец, не загружаем данные
      if (!dataSource || !dataColumn) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Получаем все файлы, чтобы найти ID нужного файла
        const filesResponse = await fetch(`${API_URL}/csv-files`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!filesResponse.ok) {
          throw new Error('Не удалось получить список файлов');
        }
        
        const files = await filesResponse.json();
        const selectedFile = files.find((file: any) => file.name === dataSource);
        
        if (!selectedFile) {
          throw new Error(`Файл "${dataSource}" не найден`);
        }
        
        // Получаем содержимое файла
        const contentResponse = await fetch(`${API_URL}/csv-files/content/${selectedFile.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!contentResponse.ok) {
          throw new Error('Не удалось получить содержимое файла');
        }
        
        const fileContent = await contentResponse.json();
        
        // Подготовка данных для диаграммы
        const processedData: ChartDataItem[] = [];
        
        // Находим индекс нужного столбца
        const headers = fileContent.headers || [];
        const columnIndex = headers.findIndex((header: string) => header === dataColumn);
        
        if (columnIndex === -1) {
          throw new Error(`Столбец "${dataColumn}" не найден в файле`);
        }
        
        // Обрабатываем данные для диаграммы
        // Для круговых диаграмм используем данные из выбранного столбца и обрабатываем их по типу
        if (type === 'pie') {
          // Группируем данные по значениям для подсчета количества
          const valueCount: Record<string, number> = {};
          
          fileContent.data.forEach((row: any[]) => {
            const value = row[columnIndex];
            if (value) {
              valueCount[value] = (valueCount[value] || 0) + 1;
            }
          });
          
          // Преобразуем сгруппированные данные в формат для диаграммы
          Object.entries(valueCount).forEach(([name, value]) => {
            processedData.push({ name, value: value as number });
          });
        } else {
          // Для линейных и столбчатых диаграмм берем небольшую выборку
          const sampleSize = Math.min(fileContent.data.length, 10);
          
          for (let i = 0; i < sampleSize; i++) {
            const row = fileContent.data[i];
            if (row && row[columnIndex]) {
              const value = isNaN(Number(row[columnIndex])) ? 0 : Number(row[columnIndex]);
              processedData.push({
                name: `Item ${i + 1}`,
                value
              });
            }
          }
        }
        
        setChartData(processedData);
      } catch (error) {
        console.error('Ошибка при загрузке данных для диаграммы:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [dataSource, dataColumn, token, type]);

  // Render chart based on type
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Загрузка данных...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="h-full flex items-center justify-center text-red-500">
          <p>{error}</p>
        </div>
      );
    }
    
    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>Нет данных для отображения</p>
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
    <div 
      className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden"
      onClick={(e) => {
        // Stop event propagation to prevent the widget from moving when clicked
        e.stopPropagation();
      }}
    >
      <div className="px-4 py-2 border-b border-gray-200 flex items-center">
        <div className="flex items-center">
          {getChartIcon()}
          <h3 className="text-gray-800 font-medium ml-2">{title}</h3>
        </div>
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
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit size={14} className="mr-2 text-gray-600" />
                Edit Widget
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} className="mr-2 text-gray-600" />
                Export
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
      <div className="flex-1 p-1">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartWidget;