import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TextTypeDebuggerProps {
  textType: string;
  onTextTypeChange?: (textType: string) => void;
}

export function TextTypeDebugger({ textType, onTextTypeChange }: TextTypeDebuggerProps) {
  const handleQuickSet = (type: string) => {
    if (onTextTypeChange) {
      onTextTypeChange(type);
    }
  };

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 m-4">
      <div className="flex items-center mb-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="font-semibold text-yellow-800">Text Type Debugger</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <p><strong>Current textType:</strong> "{textType}" (length: {textType?.length || 0})</p>
        <p><strong>Is empty:</strong> {!textType || textType.trim() === '' ? 'Yes' : 'No'}</p>
        <p><strong>Type of textType:</strong> {typeof textType}</p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-yellow-800 mb-2">Quick Test - Set Text Type:</p>
        <div className="flex flex-wrap gap-2">
          {['narrative', 'persuasive', 'expository', 'recount', 'descriptive'].map((type) => (
            <button
              key={type}
              onClick={() => handleQuickSet(type)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
