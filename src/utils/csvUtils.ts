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
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Extract headers from results
          const fields = results.meta.fields || [];
          
          // Convert data to 2D array format
          const rows = results.data.map((row: any) => {
            return fields.map(field => row[field]);
          });
          
          resolve({
            data: rows,
            fields,
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