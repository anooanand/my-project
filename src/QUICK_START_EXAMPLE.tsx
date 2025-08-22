// Quick Start Example - NSW Grammar Checker Implementation
// Copy this code to get started quickly

import React, { useState } from 'react';
import EnhancedGrammarTextEditor from './EnhancedGrammarTextEditor';
import './grammarChecker.css';

function NSWWritingApp() {
  const [content, setContent] = useState('');
  const [selectedTextType, setSelectedTextType] = useState('narrative');

  const textTypes = [
    { id: 'narrative', label: 'Narrative' },
    { id: 'persuasive', label: 'Persuasive' },
    { id: 'expository', label: 'Expository' },
    { id: 'descriptive', label: 'Descriptive' },
    { id: 'recount', label: 'Recount' }
  ];

  const sampleText = "Once upon a time, there was a young girl who lived in a small village. She had a dream to become a great writer. Every day, she would sit by the window and write stories about magical creatures and far-away lands. Her stories were good, but she wanted to make them better.";

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">NSW Selective Test Writing Assistant</h1>
      
      {/* Text Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Text Type:</label>
        <div className="flex gap-2 flex-wrap">
          {textTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTextType(type.id)}
              className={`px-4 py-2 rounded-lg border ${
                selectedTextType === type.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Load Sample Button */}
      <div className="mb-4">
        <button
          onClick={() => setContent(sampleText)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Load Sample Text
        </button>
        <button
          onClick={() => setContent('')}
          className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Clear
        </button>
      </div>

      {/* Main Editor */}
      <EnhancedGrammarTextEditor
        content={content}
        onChange={setContent}
        textType={selectedTextType}
        showAnalyzer={true}
        enableRealTimeChecking={true}
        placeholder={`Write your ${selectedTextType} piece here. The system will provide real-time feedback on grammar, spelling, vocabulary, and structure.`}
        minHeight="400px"
        className="border rounded-lg shadow-lg"
      />

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to Use:</h3>
        <ul className="text-sm space-y-1">
          <li>• <span className="text-red-600">Red underlines</span>: Spelling and grammar errors</li>
          <li>• <span className="text-purple-600">Purple underlines</span>: Vocabulary enhancement suggestions</li>
          <li>• <span className="text-orange-600">Orange underlines</span>: Sentence structure issues</li>
          <li>• <span className="text-green-600">Green underlines</span>: Cohesion improvements</li>
          <li>• Click on any highlighted text to see detailed suggestions</li>
        </ul>
      </div>
    </div>
  );
}

export default NSWWritingApp;

// Usage in your main App.js/App.tsx:
/*
import NSWWritingApp from './NSWWritingApp';

function App() {
  return <NSWWritingApp />;
}

export default App;
*/
