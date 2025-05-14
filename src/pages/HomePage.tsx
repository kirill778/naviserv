import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, BarChart4, FileUp, Clock, Loader2, Search, AlertCircle, Trash2 } from 'lucide-react';
import useSpreadsheetStore from '../stores/spreadsheetStore';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../services/api';

// Определяем интерфейс для файлов
interface RecentFile {
  id: number;
  name: string;
  original_name: string;
  created_at: string;
  processed_at: string;
  row_count: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { resetCurrentFile } = useSpreadsheetStore();
  const { token, isAuthenticated } = useAuthStore();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecentFiles();
  }, [token]); // Перезагружаем данные при изменении токена

  const fetchRecentFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isAuthenticated || !token) {
        setError('Необходимо авторизоваться');
        return;
      }

      const apiUrl = `${API_URL}/csv-files?limit=10`;
      console.log('Using API URL:', apiUrl);
      console.log('Token:', token);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        if (response.status === 401) {
          // Если ошибка авторизации, то возможно токен устарел
          setError('Сессия устарела. Пожалуйста, войдите заново.');
          return;
        }
        throw new Error('Ошибка получения списка файлов');
      }

      // Безопасный парсинг JSON
      let data;
      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 200));
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        setError('Ошибка парсинга ответа от сервера');
        return;
      }
      
      setRecentFiles(data);
    } catch (error) {
      console.error('Ошибка загрузки списка файлов:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFile = (fileId: number) => {
    resetCurrentFile(); // Сбрасываем текущий файл перед загрузкой нового
    navigate(`/spreadsheet/${fileId}`);
  };

  const handleDeleteFile = async (fileId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем открытие файла
    
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      if (!token) {
        setError('Необходимо авторизоваться');
        return;
      }

      const response = await fetch(`${API_URL}/csv-files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Сессия устарела. Пожалуйста, войдите заново.');
          return;
        }
        throw new Error('Ошибка удаления файла');
      }

      // Обновляем список файлов
      fetchRecentFiles();
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Сразу переходим на страницу таблицы, где будет обрабатываться файл
      resetCurrentFile();
      navigate('/spreadsheet');
    }
  };
  
  const filteredFiles = recentFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Начать работу</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
            onClick={() => {
              resetCurrentFile();
              navigate('/spreadsheet');
            }}
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FileSpreadsheet size={28} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Создать таблицу</h3>
            <p className="text-gray-600">Редактирование, расчеты и анализ данных</p>
          </div>
          
          <div 
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
              <BarChart4 size={28} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Создать дашборд</h3>
            <p className="text-gray-600">Визуализация данных с помощью графиков и виджетов</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <FileUp size={28} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Импортировать CSV</h3>
            <p className="text-gray-600">Загрузка и обработка нового CSV файла</p>
            <label className="mt-4 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileUpload}
              />
              Выбрать файл
            </label>
          </div>
        </div>
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Недавние файлы</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              onClick={fetchRecentFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : (
                <span>Обновить</span>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded p-4 mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="col-span-5 font-medium text-gray-700">Имя файла</div>
            <div className="col-span-3 font-medium text-gray-700">Последнее изменение</div>
            <div className="col-span-2 font-medium text-gray-700">Строк</div>
            <div className="col-span-2 font-medium text-gray-700">Действия</div>
          </div>
          
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-600" />
              <span className="text-gray-500">Загрузка файлов...</span>
            </div>
          ) : (
            <>
              {filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleOpenFile(file.id)}
                >
                  <div className="col-span-5 flex items-center">
                    <FileSpreadsheet size={18} className="text-gray-500 mr-3 flex-shrink-0" />
                    <div>
                      <span className="text-gray-800 font-medium block">{file.name}</span>
                      {file.original_name !== file.name && (
                        <span className="text-gray-500 text-xs block">{file.original_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center text-gray-600">
                    <Clock size={16} className="mr-2 flex-shrink-0" />
                    {formatDate(file.processed_at || file.created_at)}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-600">
                    {file.row_count}
                  </div>
                  <div className="col-span-2">
                    <button 
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFile(file.id);
                      }}
                    >
                      Открыть
                    </button>
                    <button 
                      className="text-gray-600 hover:text-red-700 text-sm font-medium"
                      onClick={(e) => handleDeleteFile(file.id, e)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredFiles.length === 0 && !isLoading && (
                <div className="py-12 text-center text-gray-500">
                  {searchTerm ? 'Нет файлов, соответствующих запросу' : 'Нет сохраненных файлов'}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;