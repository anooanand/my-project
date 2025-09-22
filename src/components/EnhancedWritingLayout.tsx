import React, { useState, useEffect, useRef } from 'react';
import { Clock, Eye, EyeOff } from 'lucide-react';

interface EnhancedWritingLayoutProps {
  content: string;
  onContentChange: (content: string) => void;
  prompt?: string;
  className?: string;
  onSubmit?: () => void;
  wordCount?: number;
  timeElapsed?: number;
}

export const EnhancedWritingLayout: React.FC<EnhancedWritingLayoutProps> = ({
  content,
  onContentChange,
  prompt = "The Mysterious Door: One rainy afternoon, while exploring your grandmother's attic, you stumble upon a dusty, old door that you've never seen before. It's covered in strange symbols and has a shimmering handle that feels warm to the touch. Curiosity gets the better of you, and you decide to open it. As you turn the handle, the door creaks open to reveal a world filled with vibrant colors, talking animals, and peculiar creatures that seem to be waiting for you. But there's a catch: you have one hour to complete a task that will help save this magical realm. What task do you complete? Who will help you along the way? What challenges will you face? Let your imagination run wild as you explore this enchanting world and discover your role in it!",
  className = "",
  onSubmit,
  wordCount = 0,
  timeElapsed = 0
}) => {
  // Font and display settings
  const [fontSize, setFontSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [fontFamily, setFontFamily] = useState('Serif (Georgia)');
  const [focusMode, setFocusMode] = useState(false);
  
  // Writing metrics
  const [wpm, setWpm] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  
  // Refs for tracking
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastWordCountRef = useRef(0);

  // Font size mapping
  const fontSizeMap = {
    'S': '14px',
    'M': '16px', 
    'L': '18px',
    'XL': '20px',
    'XXL': '24px'
  };

  // Font family mapping
  const fontFamilyMap: Record<string, string> = {
    'Serif (Georgia)': 'Georgia, serif',
    'Sans-serif (Arial)': 'Arial, sans-serif',
    'Monospace (Courier)': 'Courier New, monospace',
    'Times New Roman': 'Times New Roman, serif',
    'Helvetica': 'Helvetica, sans-serif'
  };

  // Start writing session if content is being added
  useEffect(() => {
    if (wordCount > lastWordCountRef.current && !isWriting) {
      setIsWriting(true);
      startTimeRef.current = Date.now();
    }
    lastWordCountRef.current = wordCount;
  }, [wordCount, isWriting]);

  // Calculate WPM
  useEffect(() => {
    if (isWriting && timeElapsed > 0) {
      const timeInMinutes = timeElapsed / 60;
      if (timeInMinutes > 0) {
        setWpm(Math.round(wordCount / timeInMinutes));
      }
    }
  }, [isWriting, timeElapsed, wordCount]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Prompt Section */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
          <h2 className="font-semibold text-blue-900">Your Writing Prompt</h2>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">{prompt}</p>
      </div>

      {/* Controls Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Font Size Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-lg">T</span>
              Font Size:
            </span>
            <div className="flex gap-1">
              {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    fontSize === size
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                focusMode
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {focusMode ? <EyeOff size={16} /> : <Eye size={16} />}
              Focus Mode
            </button>
          </div>
        </div>

        {/* Font Family and Stats Row */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-4">
          {/* Font Family */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Font Family:</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Serif (Georgia)">Serif (Georgia)</option>
              <option value="Sans-serif (Arial)">Sans-serif (Arial)</option>
              <option value="Monospace (Courier)">Monospace (Courier)</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
            </select>
            <span className="text-xs text-gray-500">Traditional & elegant</span>
          </div>

          {/* Writing Stats */}
          <div className="flex items-center gap-6">
            {/* Word Count */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">📝</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{wordCount} words</span>
            </div>

            {/* WPM */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-bold">⚡</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{wpm} WPM</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock size={16} className="text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
              📋 Planning
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
              ▶️ Exam
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors">
              🏗️ Structure
            </button>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
              💡 Tips
            </button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              👁️ Focus
            </button>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors">
              🌙 Dark
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Feedback given: 1 • Words: {wordCount} • Last: {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Writing Area */}
      <div className="flex-1 p-6 bg-white">
        <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="Start writing your story here..."
            className="w-full h-full p-6 border-none outline-none resize-none"
            style={{
              fontSize: fontSizeMap[fontSize],
              fontFamily: fontFamilyMap[fontFamily],
              lineHeight: '1.6',
              background: focusMode ? '#fafafa' : 'white'
            }}
          />
          
          {/* Focus Mode Overlay */}
          {focusMode && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100 opacity-50"></div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex justify-end">
            <button
              onClick={onSubmit}
              disabled={wordCount < 50}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                wordCount < 50
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              Get My Report ({wordCount} words)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWritingLayout;