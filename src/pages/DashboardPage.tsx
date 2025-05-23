import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Activity, 
  Plus, 
  Download,
  Save,
  Trash2,
  AlertCircle,
  File,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ChartWidget from '../components/dashboard/ChartWidget';
import MetricWidget from '../components/dashboard/MetricWidget';
import TableWidget from '../components/dashboard/TableWidget';
import { API_URL } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

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

// Интерфейс для дашборда
interface Dashboard {
  id: number;
  name: string;
  description?: string;
  layout: Widget[]; // layout теперь массив виджетов, а не объект
  is_public: boolean;
  last_edited: string;
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
  // Текущий дашборд
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false);
  // Состояние сохранения
  const [isSaving, setIsSaving] = useState(false);
  // Сообщение об ошибке
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Сообщение об успехе
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Модальное окно для сохранения дашборда
  const [showSaveModal, setShowSaveModal] = useState(false);
  // Имя дашборда
  const [dashboardName, setDashboardName] = useState('');
  // Описание дашборда
  const [dashboardDescription, setDashboardDescription] = useState('');
  // Публичность дашборда
  const [isPublic, setIsPublic] = useState(false);
  
  const { token, user } = useAuthStore();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'table' | 'widget' | null>(null);
  const [selectedExportWidget, setSelectedExportWidget] = useState<string | null>(null);
  const [selectedExportTable, setSelectedExportTable] = useState<string | null>(null);

  // Функция для нормализации виджетов (убедиться, что y - это число)
  const normalizeWidgets = (widgetsToNormalize: Widget[]): Widget[] => {
    return widgetsToNormalize.map(widget => ({
      ...widget,
      y: typeof widget.y === 'number' ? widget.y : 0, // Если y не число, используем 0
      x: typeof widget.x === 'number' ? widget.x : 0  // Если x не число, используем 0
    }));
  };

  // Загрузка списка дашбордов и выбор текущего дашборда
  useEffect(() => {
    const fetchDashboards = async () => {
      if (!user?.id || !token) return;
      
      try {
        setIsLoading(true);
        setErrorMessage(null);
        
        const response = await fetch(`${API_URL}/dashboards`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const dashboards = await response.json();
          console.log('Получены дашборды:', dashboards);
          
          // Выбираем последний измененный дашборд
          if (dashboards.length > 0) {
            const latestDashboard = dashboards.sort((a: Dashboard, b: Dashboard) => 
              new Date(b.last_edited).getTime() - new Date(a.last_edited).getTime()
            )[0];
            
            setCurrentDashboard(latestDashboard);
            
            // Загружаем виджеты из дашборда
            if (latestDashboard.layout && Array.isArray(latestDashboard.layout)) {
              console.log('Загружаем виджеты из дашборда:', latestDashboard.layout);
              // Нормализуем виджеты перед установкой в состояние
              setWidgets(normalizeWidgets(latestDashboard.layout));
            } else {
              console.warn('Дашборд не содержит корректный формат layout:', latestDashboard);
            }
          }
        } else {
          console.error('Ошибка при получении дашбордов:', await response.text());
          setErrorMessage('Не удалось загрузить дашборды');
        }
      } catch (error) {
        console.error('Ошибка при загрузке дашбордов:', error);
        setErrorMessage('Не удалось загрузить дашборды. Проверьте подключение к интернету.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboards();
  }, [user, token]);

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
      y: 0, // Используем 0 вместо Infinity
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
        y: 0, // Используем 0 вместо Infinity
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

  // Delete all widgets
  const deleteAllWidgets = () => {
    setWidgets([]);
  };

  // Функция для открытия модального окна экспорта
  const openExportModal = () => {
    setShowExportModal(true);
    setExportType(null);
    setSelectedExportWidget(null);
    setSelectedExportTable(null);
  };

  // Функция для экспорта таблицы в PDF
  const exportTableToPdf = async (tableId: string) => {
    try {
      setIsExporting(true);
      
      const tableFileInfo = csvFiles.find(f => f.id.toString() === tableId);
      if (!tableFileInfo) {
        setErrorMessage('Таблица не найдена');
        setIsExporting(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/csv-files/content/${tableId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        setErrorMessage('Не удалось получить данные таблицы');
        setIsExporting(false);
        return;
      }
      
      const tableData = await response.json();
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      pdf.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
      pdf.setFont('Roboto');
      
      const title = tableFileInfo.name || 'Таблица';
      const date = new Date().toLocaleDateString('ru-RU');
      
      pdf.setFontSize(22);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, 14, 20);
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Экспортировано: ${date}`, 14, 30);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(14, 35, 280, 35);
      
      if (tableData.headers && tableData.data) {
        const maxColumns = Math.min(tableData.headers.length, 10);
        const availableWidth = 270;
        const colWidths = Array(maxColumns).fill(availableWidth / maxColumns);
        
        tableData.headers.slice(0, maxColumns).forEach((header: string, i: number) => {
          const headerLength = String(header).length;
          if (headerLength > 15) {
            colWidths[i] = Math.min(availableWidth / 3, (headerLength / 15) * (availableWidth / maxColumns));
          }
        });
        
        const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
        if (totalWidth > availableWidth) {
          const ratio = availableWidth / totalWidth;
          colWidths.forEach((_, i) => { colWidths[i] *= ratio; });
        }
        
        const startY = 45;
        const rowHeight = 10;
        const padding = 3;
        
        const cleanText = (text: any): string => {
          if (text === null || text === undefined) return '';
          return String(text).replace(/[\u0080-\uFFFF]/g, char => String.fromCharCode(char.charCodeAt(0)));
        };
        
        let currentX = 14;
        pdf.setFillColor(240, 240, 240);
        pdf.setDrawColor(180, 180, 180);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        
        tableData.headers.slice(0, maxColumns).forEach((header: string, i: number) => {
          const columnWidth = colWidths[i];
          pdf.setFillColor(240, 240, 240); // Ensure header fill color
          pdf.rect(currentX, startY, columnWidth, rowHeight, 'FD');
          let headerText = cleanText(header);
          if (headerText.length > 20) headerText = headerText.substring(0, 17) + '...';
          pdf.setTextColor(0,0,0); // Ensure header text color
          pdf.text(headerText, currentX + padding, startY + rowHeight - padding);
          currentX += columnWidth;
        });
        
        const maxRows = Math.min(tableData.data.length, 30);
        
        for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
          const row = tableData.data[rowIndex];
          currentX = 14;
          const y = startY + (rowIndex + 1) * rowHeight;
          
          for (let colIndex = 0; colIndex < Math.min(row.length, maxColumns); colIndex++) {
            const columnWidth = colWidths[colIndex];
            
            // CRITICAL FIX: Explicitly set fill color for each data cell before drawing rect
            if (rowIndex % 2 === 0) {
              pdf.setFillColor(250, 250, 250); // Light grey for even rows
            } else {
              pdf.setFillColor(255, 255, 255); // White for odd rows
            }
            pdf.setDrawColor(220, 220, 220); // Border color
            pdf.rect(currentX, y, columnWidth, rowHeight, 'FD');
            
            let cellText = cleanText(row[colIndex]);
            if (cellText.length > 20) cellText = cellText.substring(0, 17) + '...';
            
            pdf.setTextColor(0, 0, 0); // Ensure text is black
            pdf.setFontSize(10); // Ensure font size for data cells

            const isNumeric = !isNaN(parseFloat(cellText)) && isFinite(Number(cellText));
            if (isNumeric) {
              pdf.text(cellText, currentX + columnWidth - padding - pdf.getTextWidth(cellText), y + rowHeight - padding);
            } else {
              pdf.text(cellText, currentX + padding, y + rowHeight - padding);
            }
            currentX += columnWidth;
          }
        }
        
        if (tableData.data.length > maxRows) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`* Показаны первые ${maxRows} из ${tableData.data.length} строк.`, 14, startY + (maxRows + 1) * rowHeight + 5);
        }
        
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Всего столбцов: ${tableData.headers.length}, Всего строк: ${tableData.data.length}`, 14, 190);
        pdf.text(`Дашборд: ${currentDashboard?.name || 'Не указан'}`, 14, 195);
      }
      
      pdf.save(`${title}_${date.replace(/\./g, '-')}.pdf`);
      setSuccessMessage('Таблица успешно экспортирована в PDF!');
    } catch (error) {
      console.error('Ошибка при экспорте таблицы:', error);
      setErrorMessage('Не удалось экспортировать таблицу в PDF');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Запуск экспорта в зависимости от выбранного типа
  const handleExport = () => {
    if (exportType === 'widget' && selectedExportWidget) {
      // Находим виджет по ID
      const widget = widgets.find(w => w.i === selectedExportWidget);
      if (widget) {
        exportDashboard(widget);
      } else {
        setErrorMessage('Выбранный виджет не найден');
      }
    } else if (exportType === 'table' && selectedExportTable) {
      exportTableToPdf(selectedExportTable);
    } else {
      setErrorMessage('Пожалуйста, выберите элемент для экспорта');
    }
  };
  
  // Export dashboard as PDF - обновляем, чтобы принимать конкретный виджет
  const exportDashboard = async (specificWidget?: Widget) => {
    try {
      // Включаем режим экспорта
      setIsExporting(true);
      
      // Даем время на рендеринг виджетов
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем, есть ли виджеты для экспорта
      if (widgets.length === 0 && !specificWidget) {
        setErrorMessage('Нет виджетов для экспорта. Добавьте хотя бы один виджет.');
        setIsExporting(false);
        return;
      }
      
      // ID виджета, который мы ищем (если указан конкретный)
      const widgetId = specificWidget?.i;
      
      // Находим элемент виджета, если указан конкретный
      let elementToSearch: Element | Document = document;
      if (widgetId) {
        const widgetElem = document.querySelector(`[data-grid-id="${widgetId}"]`) || 
                         document.querySelector(`[data-grid*="${widgetId}"]`);
        if (widgetElem) {
          elementToSearch = widgetElem;
        }
      }
      
      // Находим непосредственно элемент графика (SVG в Recharts)
      // Ищем его внутри виджета
      const chartSvg = elementToSearch.querySelector('.recharts-wrapper svg');
      const chartCanvas = elementToSearch.querySelector('.recharts-surface');
      const pieChart = elementToSearch.querySelector('.recharts-pie');
      
      // Какой элемент использовать для экспорта
      let elementToCapture = null;
      
      // Определяем, что мы нашли из графиков
      if (chartSvg) {
        console.log("Найден SVG график");
        elementToCapture = chartSvg.closest('.recharts-wrapper') || chartSvg;
      } else if (chartCanvas) {
        console.log("Найден Canvas график");
        elementToCapture = chartCanvas.closest('.recharts-wrapper') || chartCanvas;
      } else if (pieChart) {
        console.log("Найден Pie график");
        elementToCapture = pieChart.closest('.recharts-wrapper') || pieChart;
      } else {
        // Пробуем найти контейнер виджета как запасной вариант
        const widgetSelector = widgetId ? 
          `[data-grid-id="${widgetId}"] .flex-1, [data-grid*="${widgetId}"] .flex-1` : 
          '.react-grid-item .flex-1';
        elementToCapture = document.querySelector(widgetSelector);
        console.log("Используется запасной контейнер");
      }
      
      if (!elementToCapture) {
        setErrorMessage('Не удалось найти график для экспорта.');
        setIsExporting(false);
        return;
      }
      
      // Создаем заголовок для PDF файла
      const widgetTitle = specificWidget?.title || widgets[0]?.title || 'Виджет';
      const date = new Date().toLocaleDateString('ru-RU');
      
      // Получаем размеры элемента для сохранения пропорций
      const { width, height } = (elementToCapture as HTMLElement).getBoundingClientRect();
      
      // Увеличиваем размер для лучшего качества (если размер слишком мал)
      const captureWidth = Math.max(width, 500);
      const captureHeight = Math.max(height, 400);
      const aspectRatio = width / height;
      
      console.log(`Размеры оригинала: ${width}x${height}, пропорция: ${aspectRatio}`);
      
      try {
        // Получаем изображение графика
        const dataUrl = await toPng(elementToCapture as HTMLElement, { 
          quality: 0.95,
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: 'white',
          width: captureWidth,
          height: captureHeight
        });
        
        // Создаем PDF документ
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Создаем заголовок PDF с названием виджета
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'black';
          ctx.font = 'bold 40px Arial';
          ctx.fillText(widgetTitle, 10, 50);
          ctx.font = '24px Arial';
          ctx.fillText(`Экспортировано: ${date}`, 10, 80);
          
          const headerDataUrl = canvas.toDataURL('image/png');
          pdf.addImage(headerDataUrl, 'PNG', 10, 10, 270, 25);
        }
        
        // Рассчитываем размеры для вставки изображения на всю страницу
        // Размер A4 в альбомной ориентации: 297×210 мм
        // Оставляем минимальные поля и место для заголовка
        const pageWidth = 297;
        const pageHeight = 210;
        const marginLeft = 5;
        const marginTop = 35; // место под заголовок
        const marginRight = 5;
        const marginBottom = 5;
        
        // Используем максимальную доступную ширину и высоту
        const availableWidth = pageWidth - marginLeft - marginRight;
        const availableHeight = pageHeight - marginTop - marginBottom;
        
        // Определяем, что ограничивает больше - ширина или высота
        let finalWidth, finalHeight;
        
        if (availableWidth / availableHeight > aspectRatio) {
          // Высота ограничивает, используем всю доступную высоту
          finalHeight = availableHeight;
          finalWidth = availableHeight * aspectRatio;
        } else {
          // Ширина ограничивает, используем всю доступную ширину
          finalWidth = availableWidth;
          finalHeight = availableWidth / aspectRatio;
        }
        
        // Центрируем изображение по горизонтали
        const leftPosition = marginLeft + (availableWidth - finalWidth) / 2;
        
        // Добавляем изображение виджета
        pdf.addImage(dataUrl, 'PNG', leftPosition, marginTop, finalWidth, finalHeight);
        
        // Сохраняем документ
        pdf.save(`Widget_export_${date.replace(/\./g, '-')}.pdf`);
        
        setSuccessMessage('Виджет успешно экспортирован в PDF!');
      } catch (exportError) {
        console.error('Ошибка при создании изображения:', exportError);
        setErrorMessage('Не удалось создать изображение графика');
      }
    } catch (error) {
      console.error('Ошибка при экспорте виджета:', error);
      setErrorMessage('Не удалось экспортировать виджет в PDF');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Функция сохранения дашборда
  const saveDashboard = async () => {
    if (!token || !user) {
      setErrorMessage('Необходимо войти в систему');
      return;
    }
    
    // Открываем модальное окно для ввода имени и описания, если дашборд ещё не создан
    if (!currentDashboard) {
      setShowSaveModal(true);
      return;
    }
    
    await performSave();
  };
  
  // Функция для выполнения сохранения дашборда
  const performSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Нормализуем виджеты перед сохранением
      const normalizedWidgets = normalizeWidgets(widgets);
      
      const dashboardData = {
        name: currentDashboard ? currentDashboard.name : dashboardName,
        description: currentDashboard ? currentDashboard.description : dashboardDescription,
        layout: normalizedWidgets, // Используем нормализованные виджеты
        is_public: currentDashboard ? currentDashboard.is_public : isPublic
      };
      
      console.log('Данные для сохранения:', dashboardData);
      
      let url = `${API_URL}/dashboards`;
      let method = 'POST';
      
      if (currentDashboard) {
        url = `${API_URL}/dashboards/${currentDashboard.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dashboardData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Дашборд сохранен:', result);
        
        setCurrentDashboard(result);
        setSuccessMessage('Дашборд успешно сохранен!');
        
        // Если было открыто модальное окно сохранения, закрываем его
        setShowSaveModal(false);
        
        // Сбрасываем поля формы
        setDashboardName('');
        setDashboardDescription('');
        setIsPublic(false);
      } else {
        const errorText = await response.text();
        console.error('Ошибка при сохранении дашборда:', errorText);
        setErrorMessage(`Не удалось сохранить дашборд: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка при сохранении дашборда:', error);
      setErrorMessage('Не удалось сохранить дашборд. Проверьте подключение к интернету.');
    } finally {
      setIsSaving(false);
    }
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

  // Обработчик создания нового дашборда
  const handleSaveNew = () => {
    setCurrentDashboard(null);
    setDashboardName('');
    setDashboardDescription('');
    setIsPublic(false);
    setShowSaveModal(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {currentDashboard ? currentDashboard.name : 'Мой Дашборд'}
        </h2>
        <div className="flex gap-2">
          <button 
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-red-500 hover:text-red-600 hover:border-red-300"
            onClick={deleteAllWidgets}
          >
            <Trash2 size={16} className="mr-1" />
            Удалить все виджеты
          </button>
          <button 
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={openExportModal}
          >
            <Download size={16} className="mr-1" />
            Экспорт в PDF
          </button>
          <button 
            className={`flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            onClick={saveDashboard}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                {currentDashboard ? 'Сохранить изменения' : 'Сохранить дашборд'}
              </>
            )}
          </button>
          <div className="relative group">
            <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-1" />
              Добавить виджет
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

      {/* Сообщения об успехе и ошибках */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded flex items-center">
          <div className="mr-2 text-green-500">✓</div>
          <span>{successMessage}</span>
          <button 
            className="ml-auto text-green-500 hover:text-green-700"
            onClick={() => setSuccessMessage(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button 
            className="ml-auto text-red-500 hover:text-red-700"
            onClick={() => setErrorMessage(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      <div 
        ref={dashboardRef}
        className="flex-1 overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-4"
      >
        {isLoading && !isExporting ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Загрузка...</span>
          </div>
        ) : (
          <div className="dashboard-content" ref={contentRef}>
            <ResponsiveGridLayout
              className="layout"
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={40}
              isDraggable={!isExporting}
              isResizable={!isExporting}
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
                <p className="text-lg mb-4">Ваш дашборд пуст</p>
                <button 
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => addWidget('bar')}
                >
                  <Plus size={16} className="mr-1" />
                  Добавить первый виджет
                </button>
              </div>
            )}
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
      
      {/* Модальное окно для сохранения дашборда */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Сохранить дашборд</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Название дашборда:</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Введите название дашборда"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Описание (необязательно):</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Введите описание дашборда"
                rows={3}
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  className="h-4 w-4 mr-2"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="text-gray-700">Публичный дашборд (доступен всем пользователям)</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowSaveModal(false)}
              >
                Отмена
              </button>
              <button 
                className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
                  !dashboardName.trim() || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={performSave}
                disabled={!dashboardName.trim() || isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора для экспорта */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Экспорт в PDF</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Что экспортировать?</h3>
              <div className="flex space-x-3">
                <button 
                  className={`px-4 py-2 flex-1 border rounded-md flex items-center justify-center ${
                    exportType === 'widget' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => setExportType('widget')}
                >
                  <PieChartIcon size={16} className="mr-2" />
                  Виджет
                </button>
                <button 
                  className={`px-4 py-2 flex-1 border rounded-md flex items-center justify-center ${
                    exportType === 'table' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => setExportType('table')}
                >
                  <File size={16} className="mr-2" />
                  Таблицу
                </button>
              </div>
            </div>
            
            {exportType === 'widget' && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Выберите виджет:</h3>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedExportWidget || ''}
                  onChange={(e) => setSelectedExportWidget(e.target.value)}
                >
                  <option value="">-- Выберите виджет --</option>
                  {widgets.map(widget => (
                    <option key={widget.i} value={widget.i}>{widget.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            {exportType === 'table' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Выберите таблицу:</h3>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedExportTable || ''}
                    onChange={(e) => setSelectedExportTable(e.target.value)}
                  >
                    <option value="">-- Выберите таблицу --</option>
                    {csvFiles.map(file => (
                      <option key={file.id} value={file.id}>{file.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <h4 className="text-xs font-medium mb-2 text-gray-700">Настройки экспорта таблицы:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <input 
                        id="show-headers" 
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        defaultChecked={true}
                      />
                      <label htmlFor="show-headers" className="ml-2 block text-xs text-gray-700">
                        Показывать заголовки
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        id="alt-row-colors" 
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        defaultChecked={true}
                      />
                      <label htmlFor="alt-row-colors" className="ml-2 block text-xs text-gray-700">
                        Чередовать цвета строк
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowExportModal(false)}
              >
                Отмена
              </button>
              <button 
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  (exportType === 'widget' && !selectedExportWidget) || 
                  (exportType === 'table' && !selectedExportTable) || 
                  !exportType || isExporting
                    ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleExport}
                disabled={
                  (exportType === 'widget' && !selectedExportWidget) || 
                  (exportType === 'table' && !selectedExportTable) || 
                  !exportType || isExporting
                }
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1 inline-block"></div>
                    Экспортирую...
                  </>
                ) : (
                  'Экспортировать'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;