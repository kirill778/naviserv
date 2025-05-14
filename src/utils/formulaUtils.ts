import { evaluate } from 'mathjs';

/**
 * Convert cell references to array indices
 * E.g., A1 => [0, 0], B3 => [2, 1]
 */
export const cellRefToIndices = (cellRef: string): [number, number] => {
  const match = cellRef.match(/([A-Z]+)(\d+)/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }
  
  const colStr = match[1];
  const rowStr = match[2];
  
  // Convert column letters to index (A=0, B=1, ..., Z=25, AA=26, ...)
  let colIndex = 0;
  for (let i = 0; i < colStr.length; i++) {
    colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
  }
  colIndex -= 1; // 0-based index
  
  const rowIndex = parseInt(rowStr, 10) - 1; // 0-based index
  
  return [rowIndex, colIndex];
};

/**
 * Convert array indices to cell reference
 * E.g., [0, 0] => A1, [2, 1] => B3
 */
export const indicesToCellRef = (rowIndex: number, colIndex: number): string => {
  // Convert column index to letter (0=A, 1=B, ..., 25=Z, 26=AA, ...)
  let colRef = '';
  let col = colIndex;
  
  do {
    const remainder = col % 26;
    colRef = String.fromCharCode(65 + remainder) + colRef;
    col = Math.floor(col / 26) - 1;
  } while (col >= 0);
  
  // Convert row index to number (0=1, 1=2, ...)
  const rowRef = rowIndex + 1;
  
  return `${colRef}${rowRef}`;
};

/**
 * Check if a string is a valid cell reference
 */
export const isValidCellRef = (cellRef: string): boolean => {
  const cellRefPattern = /^[A-Z]+\d+$/;
  return cellRefPattern.test(cellRef);
};

/**
 * Parse a cell range (e.g., A1:B3) and return all cell references in that range
 */
export const expandCellRange = (range: string): string[] => {
  const parts = range.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid range: ${range}`);
  }
  
  const [start, end] = parts;
  
  if (!isValidCellRef(start) || !isValidCellRef(end)) {
    throw new Error(`Invalid cell references in range: ${range}`);
  }
  
  const [startRow, startCol] = cellRefToIndices(start);
  const [endRow, endCol] = cellRefToIndices(end);
  
  const startRowIdx = Math.min(startRow, endRow);
  const endRowIdx = Math.max(startRow, endRow);
  const startColIdx = Math.min(startCol, endCol);
  const endColIdx = Math.max(startCol, endCol);
  
  const cellRefs: string[] = [];
  
  for (let row = startRowIdx; row <= endRowIdx; row++) {
    for (let col = startColIdx; col <= endColIdx; col++) {
      cellRefs.push(indicesToCellRef(row, col));
    }
  }
  
  return cellRefs;
};

/**
 * Process built-in functions like SUM and AVERAGE
 */
export const processBuiltInFunctions = (formula: string, data: any[][]): string => {
  // Handle SUM function
  const sumRegex = /SUM\s*\(\s*([^)]+)\s*\)/i;
  let match = formula.match(sumRegex);
  
  if (match) {
    const args = match[1].split(/[;,]/);
    let sum = 0;
    
    for (const arg of args) {
      const trimmedArg = arg.trim();
      
      // Check if it's a range (contains :)
      if (trimmedArg.includes(':')) {
        try {
          const cellRefs = expandCellRange(trimmedArg);
          for (const cellRef of cellRefs) {
            const [row, col] = cellRefToIndices(cellRef);
            const value = data[row]?.[col];
            
            // If the value is a formula, recursively evaluate it
            if (typeof value === 'string' && value.startsWith('=')) {
              const result = evaluateFormula(value.substring(1), data);
              if (typeof result === 'number') {
                sum += result;
              } else if (typeof result === 'string') {
                const num = parseFloat(result);
                if (!isNaN(num)) {
                  sum += num;
                }
              }
            } else if (value !== undefined && value !== null && value !== '') {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                sum += num;
              }
            }
          }
        } catch (error) {
          console.error('Error processing range:', error);
          return '#ERROR';
        }
      } else if (isValidCellRef(trimmedArg)) {
        // It's a single cell reference
        try {
          const [row, col] = cellRefToIndices(trimmedArg);
          const value = data[row]?.[col];
          
          // If the value is a formula, recursively evaluate it
          if (typeof value === 'string' && value.startsWith('=')) {
            const result = evaluateFormula(value.substring(1), data);
            if (typeof result === 'number') {
              sum += result;
            } else if (typeof result === 'string') {
              const num = parseFloat(result);
              if (!isNaN(num)) {
                sum += num;
              }
            }
          } else if (value !== undefined && value !== null && value !== '') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              sum += num;
            }
          }
        } catch (error) {
          console.error('Error processing cell reference:', error);
          return '#ERROR';
        }
      } else {
        // It might be a number
        const num = parseFloat(trimmedArg);
        if (!isNaN(num)) {
          sum += num;
        }
      }
    }
    
    return sum.toString();
  }
  
  // Handle AVERAGE function (similar to SUM but divide by count)
  // Add other functions as needed
  
  return formula; // Return unchanged if no functions matched
};

/**
 * Replace cell references with their values
 */
export const replaceCellRefs = (formula: string, data: any[][]): string => {
  // First, check for and process built-in functions
  const processedFormula = processBuiltInFunctions(formula, data);
  if (processedFormula !== formula) {
    return processedFormula;
  }
  
  // Match cell references (e.g., A1, B2, AA34)
  const cellRefPattern = /([A-Z]+\d+)/g;
  
  return formula.replace(cellRefPattern, (match) => {
    try {
      const [rowIndex, colIndex] = cellRefToIndices(match);
      const value = data[rowIndex]?.[colIndex];
      
      if (value === undefined || value === null || value === '') {
        return '0';
      }
      
      // If the value is a formula, recursively evaluate it
      if (typeof value === 'string' && value.startsWith('=')) {
        const result = evaluateFormula(value.substring(1), data);
        return typeof result === 'number' ? result.toString() : result;
      }
      
      // Check if the value is numeric
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue.toString();
      }
      
      // Return the string value wrapped in quotes for the evaluator
      return `"${value}"`;
      
    } catch (error) {
      return '0';
    }
  });
};

/**
 * Extract all cell references from a formula
 */
export const extractCellRefs = (formula: string): string[] => {
  const cellRefPattern = /([A-Z]+\d+)/g;
  const matches = formula.match(cellRefPattern) || [];
  
  // Check for potential range expressions (A1:B3)
  const ranges: string[] = [];
  const singleCellRefs = [...matches];
  
  // Look for cell ranges using regex
  for (let i = 0; i < singleCellRefs.length - 1; i++) {
    const current = singleCellRefs[i];
    const next = singleCellRefs[i + 1];
    
    // Check if they appear as a range in the formula (with a colon between them)
    if (formula.includes(`${current}:${next}`)) {
      try {
        ranges.push(`${current}:${next}`);
      } catch (error) {
        console.error('Error identifying range:', error);
      }
    }
  }
  
  // Expand the ranges and add them to the result
  const result = [...matches]; // Start with individual cell references
  
  for (const range of ranges) {
    try {
      const expandedRefs = expandCellRange(range);
      result.push(...expandedRefs);
    } catch (error) {
      console.error('Error expanding range:', error);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(result)];
};

/**
 * Evaluate a formula
 */
export const evaluateFormula = (formula: string, data: any[][]): string | number => {
  try {
    // Check for built-in functions first
    if (formula.toUpperCase().includes('SUM(')) {
      const result = processBuiltInFunctions(formula, data);
      if (result !== formula) {
        // If the result is a number string, convert it to number
        const numResult = parseFloat(result);
        if (!isNaN(numResult) && result !== '#ERROR') {
          return numResult;
        }
        return result;
      }
    }
    
    // Проверка, есть ли операторы в формуле
    if (!/[\+\-\*\/\(\)]/.test(formula)) {
      // Формула без операторов, может быть просто ссылка на ячейку
      const cellRefPattern = /^[A-Z]+\d+$/;
      if (cellRefPattern.test(formula)) {
        try {
          const [rowIndex, colIndex] = cellRefToIndices(formula);
          const value = data[rowIndex]?.[colIndex];
          
          if (value === undefined || value === null || value === '') {
            return 0;
          }
          
          // Если значение - формула, рекурсивно вычисляем
          if (typeof value === 'string' && value.startsWith('=')) {
            return evaluateFormula(value.substring(1), data);
          }
          
          // Проверяем, является ли значение числом
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            return numValue;
          }
          
          return value;
        } catch (error) {
          return '#ERROR';
        }
      }
    }
    
    // Обычная формула с операторами
    // Replace cell references with their values
    const processedFormula = replaceCellRefs(formula, data);
    
    // Evaluate the formula using mathjs
    const result = evaluate(processedFormula);
    
    // Format the result
    if (typeof result === 'number') {
      // Round to 2 decimal places if it's a decimal
      return Number.isInteger(result) ? result : Math.round(result * 100) / 100;
    }
    
    return result.toString();
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR';
  }
};