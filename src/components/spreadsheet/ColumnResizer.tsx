import React, { useState, useCallback, useEffect } from 'react';
import useSpreadsheetStore from '../../stores/spreadsheetStore';

interface ColumnResizerProps {
  columnIndex: number;
  defaultWidth: number;
}

const ColumnResizer: React.FC<ColumnResizerProps> = ({ columnIndex, defaultWidth }) => {
  const { columnWidths, setColumnWidth } = useSpreadsheetStore();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [resizeGuidePosition, setResizeGuidePosition] = useState<number | null>(null);

  // Get current width from store or use default
  const width = columnWidths[columnIndex] || defaultWidth;

  // Handle mouse down to start resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
    setResizeGuidePosition(e.clientX);
  }, [width]);

  // Handle mouse move to calculate new width
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(145, startWidth + diff); // Минимальная ширина 145px
    
    setColumnWidth(columnIndex, newWidth);
    setResizeGuidePosition(e.clientX);
  }, [isResizing, startX, startWidth, columnIndex, setColumnWidth]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeGuidePosition(null);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <>
      <div
        className={`absolute top-0 right-0 h-full w-2 cursor-col-resize ${isResizing ? 'bg-gray-500 opacity-50' : 'hover:bg-gray-400 hover:opacity-25'}`}
        onMouseDown={handleMouseDown}
        style={{ height: '100%' }}
      >
      </div>
      
      {/* Вертикальная направляющая линия при изменении размера */}
      {isResizing && resizeGuidePosition !== null && (
        <div 
          className="fixed top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
          style={{ left: `${resizeGuidePosition}px`, height: '100vh' }}
        />
      )}
    </>
  );
};

export default ColumnResizer; 