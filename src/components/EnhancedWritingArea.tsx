import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Eye, EyeOff, CheckCircle, Lightbulb } from 'lucide-react';
import { InteractiveTextEditor } from './InteractiveTextEditor'; // Updated import

interface EnhancedWritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  textType?: string;
  onGetFeedback?: (content: string) => Promise<any>;
}

export function EnhancedWritingArea({
  content,
  onChange,
  placeholder = "Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨",
  className = "",
  style = {},
  textType = "narrative",
  onGetFeedback
}: EnhancedWritingAreaProps) {
  // State for controlling writing assistance features
  const [showSettings, setShowSettings] = useState(false);
  const [enableRealTimeHighlighting, setEnableRealTimeHighlighting] = useState(true);
  const [enableGrammarCheck, setEnableGrammarCheck] = useState(true);
  const [enableVocabularyEnhancement, setEnableVocabularyEnhancement] = useState(true);

  return (
    <div className="relative">
      {/* Writing Controls Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-700">Writing Assistant</h3>
          <div className="flex items-center space-x-3">
            {/* Grammar Check Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={enableGrammarCheck}
                onChange={(e) => setEnableGrammarCheck(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Grammar Check</span>
            </label>

            {/* Vocabulary Enhancement Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={enableVocabularyEnhancement}
                onChange={(e) => setEnableVocabularyEnhancement(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Vocabulary Help</span>
            </label>

            {/* Real-time Highlighting Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={enableRealTimeHighlighting}
                onChange={(e) => setEnableRealTimeHighlighting(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {enableRealTimeHighlighting ? (
                <Eye className="h-4 w-4 text-blue-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-gray-600">Live Feedback</span>
            </label>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Writing Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Advanced Settings Panel (collapsible) */}
      {showSettings && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Advanced Writing Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-blue-700 font-medium mb-1">Text Type</label>
              <p className="text-blue-600 capitalize">{textType || 'narrative'}</p>
            </div>
            <div>
              <label className="block text-blue-700 font-medium mb-1">Features Active</label>
              <div className="space-y-1">
                {enableGrammarCheck && <div className="text-green-600">✓ Grammar Check</div>}
                {enableVocabularyEnhancement && <div className="text-blue-600">✓ Vocabulary Help</div>}
                {enableRealTimeHighlighting && <div className="text-purple-600">✓ Live Feedback</div>}
              </div>
            </div>
            <div>
              <label className="block text-blue-700 font-medium mb-1">Tips</label>
              <p className="text-blue-600 text-xs">
                Click on highlighted text to see suggestions and improvements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Text Editor */}
      <InteractiveTextEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        textType={textType}
        onGetFeedback={onGetFeedback}
        enableRealTimeHighlighting={enableRealTimeHighlighting}
        enableGrammarCheck={enableGrammarCheck}
        enableVocabularyEnhancement={enableVocabularyEnhancement}
      />
    </div>
  );
}