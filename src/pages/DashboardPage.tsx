import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Activity, 
  Plus, 
  Download,
  Trash2
} from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ChartWidget from '../components/dashboard/ChartWidget';
import MetricWidget from '../components/dashboard/MetricWidget';
import TableWidget from '../components/dashboard/TableWidget';
import { API_URL } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Интерфейс для элементов виджетов
interface Widget {
  i: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  data?: any; // Добавляем данные для виджета
  dataSource?: string; // Источник данных
  dataColumn?: string; // Столбец данных
}

// Интерфейс для CSV-файла
interface CsvFile {
  id: number;
  name: string;
  headers?: string[];
}

// Configure responsive grid
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardPage: React.FC = () => {
  // Пустой список виджетов
  const [widgets, setWidgets] = useState<Widget[]>([]);
  // Список загруженных CSV-файлов
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>([]);
  // Модальное окно для выбора таблицы и столбца
  const [showChartModal, setShowChartModal] = useState(false);
  // Тип создаваемого графика
  const [chartType, setChartType] = useState<string>('');
  // Выбранный файл
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  // Выбранный столбец
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  // Заголовки выбранного файла
  const [selectedFileHeaders, setSelectedFileHeaders] = useState<string[]>([]);
  const { token, user } = useAuthStore();

  // Загрузка списка CSV-файлов при монтировании компонента
  useEffect(() => {
    const fetchCsvFiles = async () => {
      if (user?.id && token) {
        try {
          const response = await fetch(`${API_URL}/csv-files`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCsvFiles(data);
          }
        } catch (error) {
          console.error('Error fetching CSV files:', error);
        }
      }
    };
    
    fetchCsvFiles();
  }, [user, token]);

  // Функция для загрузки заголовков файла
  const fetchFileHeaders = async (fileId: number) => {
    if (token) {
      try {
        // Используем эндпоинт content для получения содержимого файла с заголовками
        const response = await fetch(`${API_URL}/csv-files/content/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Получены данные файла:', data);
          if (data.headers && Array.isArray(data.headers)) {
            console.log('Заголовки файла:', data.headers);
            setSelectedFileHeaders(data.headers);
          } else {
            console.error('Заголовки отсутствуют или в неправильном формате:', data);
            // Если заголовки не получены, устанавливаем пустой массив
            setSelectedFileHeaders([]);
          }
        } else {
          console.error('Ошибка при получении файла:', await response.text());
        }
      } catch (error) {
        console.error('Ошибка при загрузке заголовков файла:', error);
      }
    }
  };

  // Add new widget
  const addWidget = (type: string) => {
    const newWidget = {
      i: `widget-${Date.now()}`,
      type,
      x: 0,
      y: Infinity, // Place at the bottom
      w: type === 'metric' ? 3 : 6,
      h: type === 'metric' ? 4 : 8,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`
    };
    setWidgets([...widgets, newWidget]);
  };

  // Функция для открытия модального окна выбора данных для диаграммы
  const openChartSelector = (type: string) => {
    setChartType(type);
    setShowChartModal(true);
  };

  // Функция для создания виджета диаграммы с выбранными данными
  const createChartWidgetWithData = () => {
    console.log('Создание виджета с данными:', { selectedFile, selectedColumn });
    
    if (selectedFile) {
      // Находим выбранный файл
      const fileInfo = csvFiles.find(f => f.id === selectedFile);
      console.log('Информация о файле:', fileInfo);
      
      // Если столбец не выбран, используем "Статус" или первый доступный столбец
      const columnToUse = selectedColumn || (selectedFileHeaders.length > 0 ? selectedFileHeaders[0] : 'Статус');
      console.log('Используемый столбец:', columnToUse);
      
      const newWidget = {
        i: `widget-${Date.now()}`,
        type: chartType,
        x: 0,
        y: Infinity,
        w: 6,
        h: 8,
        title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} - ${fileInfo?.name} (${columnToUse})`,
        dataSource: fileInfo?.name || '',
        dataColumn: columnToUse
      };
      
      console.log('Новый виджет:', newWidget);
      setWidgets([...widgets, newWidget]);
      
      // Закрываем модальное окно и сбрасываем выбранные значения
      setShowChartModal(false);
      setSelectedFile(null);
      setSelectedColumn(null);
      setSelectedFileHeaders([]);
    }
  };

  // Delete widget
  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.i !== id));
  };

  // Export dashboard as PDF
  const exportDashboard = () => {
    alert('Exporting dashboard to PDF...');
    // In a real implementation, we would use jspdf and html-to-image
  };

  // Render widget based on type
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'bar':
      case 'line':
      case 'pie':
        return (
          <ChartWidget 
            type={widget.type}
            title={widget.title}
            onDelete={() => deleteWidget(widget.i)}
            dataSource={widget.dataSource}
            dataColumn={widget.dataColumn}
          />
        );
      case 'metric':
        return (
          <MetricWidget 
            title={widget.title}
            onDelete={() => deleteWidget(widget.i)}
          />
        );
      case 'table':
        return (
          <TableWidget 
            title={widget.title}
            onDelete={() => deleteWidget(widget.i)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">My Dashboard</h2>
        <div className="flex gap-2">
          <button 
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={exportDashboard}
          >
            <Download size={16} className="mr-1" />
            Export to PDF
          </button>
          <div className="relative group">
            <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-1" />
              Add Widget
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <button 
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => addWidget('bar')}
              >
                <BarChart size={16} className="mr-2 text-blue-600" />
                Bar Chart
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => addWidget('line')}
              >
                <LineChart size={16} className="mr-2 text-green-600" />
                Line Chart
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => openChartSelector('pie')}
              >
                <PieChart size={16} className="mr-2 text-purple-600" />
                Pie Chart
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => addWidget('metric')}
              >
                <Activity size={16} className="mr-2 text-amber-600" />
                Metric Card
              </button>
              <button 
                className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => addWidget('table')}
              >
                <BarChart size={16} className="mr-2 text-teal-600" />
                Table Widget
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-4">
        <ResponsiveGridLayout
          className="layout"
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          isDraggable={true}
          isResizable={true}
        >
          {widgets.map(widget => (
            <div key={widget.i} data-grid={widget}>
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
        
        {widgets.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="mb-4">
              <BarChart size={48} strokeWidth={1} />
            </div>
            <p className="text-lg mb-4">Your dashboard is empty</p>
            <button 
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => addWidget('bar')}
            >
              <Plus size={16} className="mr-1" />
              Add Your First Widget
            </button>
          </div>
        )}
      </div>
      
      {/* Модальное окно выбора данных для диаграммы */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Выберите данные для диаграммы</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Выберите таблицу:</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedFile || ''}
                onChange={(e) => {
                  const fileId = parseInt(e.target.value);
                  setSelectedFile(fileId);
                  if (fileId) fetchFileHeaders(fileId);
                }}
              >
                <option value="">-- Выберите таблицу --</option>
                {csvFiles.map(file => (
                  <option key={file.id} value={file.id}>{file.name}</option>
                ))}
              </select>
            </div>
            
            {selectedFile && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Выберите столбец:</label>
                {selectedFileHeaders.length > 0 ? (
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedColumn || ''}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                  >
                    <option value="">-- Выберите столбец --</option>
                    {selectedFileHeaders.map((header, index) => (
                      <option key={index} value={header}>{header}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-orange-500 p-2 border border-orange-300 rounded bg-orange-50">
                    Загрузка заголовков или заголовки отсутствуют...
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => {
                  setShowChartModal(false);
                  setSelectedFile(null);
                  setSelectedColumn(null);
                  setSelectedFileHeaders([]);
                }}
              >
                Отмена
              </button>
              <button 
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  // Для отладки: если столбец не выбран, выбираем первый столбец
                  if (selectedFile && !selectedColumn && selectedFileHeaders.length > 0) {
                    setSelectedColumn(selectedFileHeaders[0]);
                  }
                  createChartWidgetWithData();
                }}
                disabled={!selectedFile}
              >
                Создать диаграмму
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;