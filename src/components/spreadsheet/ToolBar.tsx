import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, PaintBucket, TextCursor as TextColor, Filter, SortAsc, SortDesc } from 'lucide-react';

const ToolBar: React.FC = () => {
  return (
    <div className="h-10 bg-white border border-gray-200 rounded-md mb-2 flex items-center px-2">
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Bold size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Italic size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Underline size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignLeft size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignCenter size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <AlignRight size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <TextColor size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <PaintBucket size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center space-x-1">
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Filter size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <SortAsc size={16} className="text-gray-600" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <SortDesc size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="ml-auto">
        <select className="border border-gray-300 rounded px-2 py-1 text-sm">
          <option>Format: Auto</option>
          <option>Text</option>
          <option>Number</option>
          <option>Currency</option>
          <option>Percentage</option>
          <option>Date</option>
        </select>
      </div>
    </div>
  );
};

export default ToolBar;