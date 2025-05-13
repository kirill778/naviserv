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
 * Replace cell references with their values
 */
export const replaceCellRefs = (formula: string, data: any[][]): string => {
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
        return evaluateFormula(value.substring(1), data);
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
 * Evaluate a formula
 */
export const evaluateFormula = (formula: string, data: any[][]): string | number => {
  try {
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