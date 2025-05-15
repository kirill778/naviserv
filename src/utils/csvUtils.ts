import Papa from 'papaparse';

interface CSVResult {
  data: any[][];
  fields: string[];
}

/**
 * Import and parse a CSV file
 */
export const importCSV = (file: File): Promise<CSVResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Define our column headers for the task format
          const taskFields = [
            'Порядковый номер',
            'Дата постановки',
            'Ответственный',
            'Наименование задачи', 
            'Срок выполнения задачи',
            'Статус'
          ];
          
          // Process data
          let processedData: any[][] = [];
          let currentStatus = 'Открытые'; // По умолчанию статус "Открытые"
          
          // Обработка строк
          results.data.forEach((row: any) => {
            // Проверяем, является ли строка разделом статуса
            const rowValue = row[0];
            
            if (rowValue === 'Текущие') {
              currentStatus = 'Открытые';
              return; // Пропускаем эту строку
            } else if (rowValue === 'Выполненные') {
              currentStatus = 'Выполненные';
              return; // Пропускаем эту строку
            }
            
            // Обрабатываем задачу, если строка содержит задачу (не является разделом)
            if (rowValue && typeof rowValue === 'string') {
              const parts = rowValue.split('_');
              // Если у нас есть как минимум 5 частей, обрабатываем как задачу
              if (parts.length >= 5) {
                processedData.push([
                  parts[0], // ПОРЯДКОВЫЙ НОМЕР
                  parts[1], // ДАТА ПОСТАНОВКИ
                  parts[2], // ОТВЕТАСТВЕННЫЙ
                  parts[3], // наименование задачи
                  parts[4], // срок выполнения задачи
                  currentStatus // Статус в зависимости от раздела
                ]);
              }
            }
          });
          
          // Сортировка данных по порядковому номеру
          processedData.sort((a, b) => {
            // Преобразуем порядковые номера в числа для корректного сравнения
            const numA = parseInt(a[0]);
            const numB = parseInt(b[0]);
            
            // Если оба значения являются числами, сравниваем их как числа
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            
            // Если одно из значений не число, используем строковое сравнение
            return String(a[0]).localeCompare(String(b[0]));
          });
            
          resolve({
            data: processedData,
            fields: taskFields
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Export data to CSV
 */
export const exportCSV = (data: any[][], headers: string[]): string => {
  // Convert data to the format expected by Papa.unparse
  const jsonData = data.map(row => {
    const rowObj: any = {};
    headers.forEach((header, index) => {
      rowObj[header || `Column${index + 1}`] = row[index] || '';
    });
    return rowObj;
  });
  
  return Papa.unparse(jsonData);
};