import React from 'react';
import { Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Application Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default CSV Delimiter
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Number Format
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="us">1,234.56</option>
                <option value="eu">1.234,56</option>
                <option value="in">1,23,456.78</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                id="headers" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="headers" className="ml-2 block text-sm text-gray-700">
                First row contains headers
              </label>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Charts and Visualizations</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Chart Type
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Theme
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="default">Default</option>
                <option value="pastel">Pastel</option>
                <option value="monochrome">Monochrome</option>
                <option value="vibrant">Vibrant</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                id="animations" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="animations" className="ml-2 block text-sm text-gray-700">
                Enable chart animations
              </label>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Export Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF Page Size
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF Orientation
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input 
                    id="portrait" 
                    type="radio" 
                    name="orientation" 
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    defaultChecked
                  />
                  <label htmlFor="portrait" className="ml-2 block text-sm text-gray-700">
                    Portrait
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    id="landscape" 
                    type="radio" 
                    name="orientation" 
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="landscape" className="ml-2 block text-sm text-gray-700">
                    Landscape
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input 
                id="include-headers" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="include-headers" className="ml-2 block text-sm text-gray-700">
                Include headers in export
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t border-gray-200 pt-6 flex justify-end">
        <button className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
          <Save size={16} className="mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;