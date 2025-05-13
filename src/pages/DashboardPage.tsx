import React, { useState } from 'react';
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

// Configure responsive grid
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardPage: React.FC = () => {
  // Mock widgets config
  const [widgets, setWidgets] = useState([
    { i: 'chart1', type: 'bar', x: 0, y: 0, w: 6, h: 8, title: 'Sales by Quarter' },
    { i: 'chart2', type: 'line', x: 6, y: 0, w: 6, h: 8, title: 'Revenue Trends' },
    { i: 'metric1', type: 'metric', x: 0, y: 8, w: 3, h: 4, title: 'Total Revenue' },
    { i: 'metric2', type: 'metric', x: 3, y: 8, w: 3, h: 4, title: 'Avg. Order Value' },
    { i: 'table1', type: 'table', x: 6, y: 8, w: 6, h: 8, title: 'Top Products' },
  ]);

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
  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case 'bar':
      case 'line':
      case 'pie':
        return (
          <ChartWidget 
            type={widget.type}
            title={widget.title}
            onDelete={() => deleteWidget(widget.i)}
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
                onClick={() => addWidget('pie')}
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
    </div>
  );
};

export default DashboardPage;