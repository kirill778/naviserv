import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';

/**
 * Convert an HTML element to a JPEG image
 */
export const elementToImage = async (element: HTMLElement): Promise<string> => {
  try {
    return await toJpeg(element, { quality: 0.95 });
  } catch (error) {
    console.error('Error converting element to image:', error);
    throw error;
  }
};

/**
 * Export dashboard or spreadsheet to PDF
 */
export const exportToPDF = async (
  element: HTMLElement, 
  filename: string = 'export.pdf',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> => {
  try {
    // Convert element to image
    const imgData = await elementToImage(element);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
    });
    
    // Calculate dimensions
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Scale image to fit the page
    const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    
    // Center image on page
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Export spreadsheet data to PDF
 */
export const exportSpreadsheetToPDF = (
  data: any[][],
  headers: string[],
  filename: string = 'spreadsheet.pdf',
  orientation: 'portrait' | 'landscape' = 'portrait'
): void => {
  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
  });
  
  // Set up table
  const tableData = data.map(row => 
    row.map(cell => typeof cell === 'string' && cell.startsWith('=') ? '#FORMULA' : cell)
  );
  
  // Add headers
  const tableHeaders = headers.map(header => header || '');
  
  // Add table
  pdf.setFontSize(10);
  pdf.table(10, 10, tableData, tableHeaders, { 
    headerBackgroundColor: '#f8f9fa',
    overflow: 'linebreak', 
    cellWidth: 'auto' 
  });
  
  // Save PDF
  pdf.save(filename);
};