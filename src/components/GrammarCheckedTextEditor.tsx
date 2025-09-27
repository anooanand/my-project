import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Check, 
  AlertCircle, 
  Lightbulb, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Settings,
  Award,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Target,
  Zap
} from 'lucide-react';
import { GrammarCheckerEngine } from '../lib/grammarCheckerEngine';
import { 
  GrammarError, 
  GrammarCheckResult, 
  ErrorHighlight,
  GrammarCheckerSettings,
  ContextMenuAction 
} from '../types/grammarChecker';
import { ERROR_LEGEND, DEFAULT_SETTINGS } from '../lib/grammarCheckerConfig';

interface GrammarCheckedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAnalyze?: (result: GrammarCheckResult) => void;
  darkMode?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export const GrammarCheckedTextEditor: React.FC<GrammarCheckedTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your story...",
  className = "",
  onAnalyze,
  darkMode = false,
  fontSize = 16,
  fontFamily = 'serif'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Grammar checker state
  const [grammarEngine] = useState(() => new GrammarCheckerEngine(DEFAULT_SETTINGS));
  const [checkResult, setCheckResult] = useState<GrammarCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [settings, setSettings] = useState<GrammarCheckerSettings>(DEFAULT_SETTINGS);
  
  // UI state
  const [showErrorLegend, setShowErrorLegend] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    error: GrammarError;
    actions: ContextMenuAction[];
  } | null>(null);
  
  // Error highlighting state
  const [hoveredError, setHoveredError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [ignoredErrors, setIgnoredErrors] = useState<Set<string>>(new Set());

  // Scroll synchronization
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Memoized error highlights for performance
  const errorHighlights = useMemo(() => {
    if (!checkResult) return [];
    
    return checkResult.errors
      .filter(error => !ignoredErrors.has(error.id))
      .map(error => ({
        errorId: error.id,
        startPos: error.startPos,
        endPos: error.endPos,
        type: error.type,
        color: error.color,
        underlineStyle: error.underlineStyle,
        message: error.message,
        suggestions: error.suggestions
      }));
  }, [checkResult, ignoredErrors]);

  // Debounced grammar checking
  const performGrammarCheck = useCallback(async (text: string) => {
    if (text.trim().length === 0) {
      setCheckResult(null);
      return;
    }

    setIsChecking(true);
    try {
      const result = await grammarEngine.checkText(text);
      setCheckResult(result);
      onAnalyze?.(result);
    } catch (error) {
      console.error('Grammar check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [grammarEngine, onAnalyze]);

  // Trigger grammar check with debouncing
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      performGrammarCheck(value);
    }, settings.realTimeDelay);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [value, performGrammarCheck, settings.realTimeDelay]);

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
    
    // Sync highlight layer scroll
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = target.scrollTop;
      highlightLayerRef.current.scrollLeft = target.scrollLeft;
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  // Handle error clicks on highlight layer
  const handleHighlightClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const errorElement = target.closest('[data-error-id]') as HTMLElement;
    
    if (errorElement) {
      const errorId = errorElement.getAttribute('data-error-id');
      const error = checkResult?.errors.find(err => err.id === errorId);
      if (error) {
        handleErrorClick(error, e);
      }
    }
  };

  // Handle error clicks
  const handleErrorClick = (error: GrammarError, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedError(error.id);
    
    const actions: ContextMenuAction[] = [
      ...error.suggestions.slice(0, 3).map((suggestion, index) => ({
        id: `fix-${index}`,
        label: suggestion,
        icon: '✓',
        action: 'fix' as const,
        data: { suggestion, error }
      })),
      {
        id: 'ignore',
        label: 'Ignore this error',
        icon: '👁️',
        action: 'ignore' as const,
        data: { error }
      },
      {
        id: 'learn-more',
        label: 'Learn more',
        icon: 'ℹ️',
        action: 'learn-more' as const,
        data: { error }
      }
    ];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      error,
      actions
    });
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: ContextMenuAction) => {
    const { error } = action.data;
    
    switch (action.action) {
      case 'fix':
        const { suggestion } = action.data;
        const newValue = value.substring(0, error.startPos) + 
                         suggestion + 
                         value.substring(error.endPos);
        onChange(newValue);
        break;
        
      case 'ignore':
        setIgnoredErrors(prev => new Set([...prev, error.id]));
        break;
        
      case 'learn-more':
        // Could open a modal with detailed explanation
        console.log('Learn more about:', error.rule);
        break;
    }
    
    setContextMenu(null);
    setSelectedError(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setSelectedError(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Update grammar engine settings
  const updateSettings = (newSettings: Partial<GrammarCheckerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    grammarEngine.updateSettings(updatedSettings);
    
    // Re-run check with new settings
    performGrammarCheck(value);
  };

  // Get font family CSS
  const getFontFamilyCSS = () => {
    const families = {
      'serif': "'Georgia', 'Times New Roman', serif",
      'sans': "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
      'mono': "'Fira Code', 'Monaco', 'Consolas', monospace"
    };
    return families[fontFamily as keyof typeof families] || families.serif;
  };

  // Create highlighted text overlay with proper positioning
  const createHighlightedOverlay = () => {
    if (!value || errorHighlights.length === 0) return null;

    const lines = value.split('\n');
    let currentPos = 0;
    
    return lines.map((line, lineIndex) => {
      const lineStart = currentPos;
      const lineEnd = currentPos + line.length;
      
      // Find highlights that intersect with this line
      const lineHighlights = errorHighlights.filter(highlight => 
        highlight.startPos < lineEnd && highlight.endPos > lineStart
      );

      let highlightedLine = '';
      let lastIndex = lineStart;

      // Sort highlights by position within the line
      const sortedHighlights = lineHighlights.sort((a, b) => a.startPos - b.startPos);

      sortedHighlights.forEach(highlight => {
        const highlightStart = Math.max(highlight.startPos, lineStart);
        const highlightEnd = Math.min(highlight.endPos, lineEnd);
        
        // Add text before highlight
        if (highlightStart > lastIndex) {
          highlightedLine += escapeHtml(value.substring(lastIndex, highlightStart));
        }
        
        // Add highlighted text
        const errorText = value.substring(highlightStart, highlightEnd);
        const isHovered = hoveredError === highlight.errorId;
        const isSelected = selectedError === highlight.errorId;
        
        highlightedLine += `<span 
          class="grammar-error" 
          data-error-id="${highlight.errorId}"
          style="
            position: relative;
            background: ${isHovered || isSelected ? `${highlight.color}15` : 'transparent'};
            border-bottom: 2px ${highlight.underlineStyle} ${highlight.color};
            cursor: pointer;
            transition: background-color 0.2s ease;
          "
          onmouseenter="this.style.background='${highlight.color}20'"
          onmouseleave="this.style.background='${isHovered || isSelected ? `${highlight.color}15` : 'transparent'}'"
        >${escapeHtml(errorText)}</span>`;
        
        lastIndex = highlightEnd;
      });

      // Add remaining text in the line
      if (lastIndex < lineEnd) {
        highlightedLine += escapeHtml(value.substring(lastIndex, lineEnd));
      }

      currentPos = lineEnd + 1; // +1 for the newline character
      
      return (
        <div key={lineIndex} style={{ minHeight: `${fontSize * 1.5}px` }}>
          <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
        </div>
      );
    });
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const errorCount = checkResult ? checkResult.errors.filter(e => !ignoredErrors.has(e.id)).length : 0;

  // Common text styles for both textarea and highlight layer
  const textStyles = {
    fontFamily: getFontFamilyCSS(),
    fontSize: `${fontSize}px`,
    lineHeight: '1.5',
    padding: '16px',
    margin: 0,
    border: 'none',
    outline: 'none',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    overflow: 'auto',
    resize: 'none' as const
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header with stats and controls */}
      <div className={`border rounded-t-lg px-4 py-3 flex items-center justify-between transition-colors ${
        darkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-200' 
          : 'bg-gray-50 border-gray-300 text-gray-700'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">{wordCount} words</span>
          </div>
          
          {isChecking && (
            <div className="flex items-center space-x-2 text-blue-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">Checking...</span>
            </div>
          )}
          
          {checkResult && (
            <>
              <div className={`flex items-center space-x-2 ${
                errorCount === 0 ? 'text-green-500' : 'text-orange-500'
              }`}>
                {errorCount === 0 ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {errorCount === 0 ? 'No errors!' : `${errorCount} issues`}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-purple-500">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Score: {checkResult.overallScore}%</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {checkResult?.achievements && checkResult.achievements.length > 0 && (
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="flex items-center space-x-1 px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              <Award className="w-4 h-4" />
              <span>{checkResult.achievements.length}</span>
            </button>
          )}
          
          <button
            onClick={() => setShowErrorLegend(!showErrorLegend)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors text-sm ${
              showErrorLegend
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Legend</span>
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors text-sm ${
              showSettings
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Error Legend Panel */}
      {showErrorLegend && (
        <div className={`border-x border-b px-4 py-3 transition-colors ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-gray-300'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 flex items-center ${
            darkMode ? 'text-blue-300' : 'text-blue-800'
          }`}>
            <Info className="w-4 h-4 mr-2" />
            🔍 Error Types Guide
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ERROR_LEGEND.map(item => (
              <div key={item.type} className="flex items-center space-x-2">
                <span className="text-lg">{item.icon}</span>
                <div 
                  className="w-4 h-0.5 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-x border-b px-4 py-3 transition-colors ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 flex items-center ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <Settings className="w-4 h-4 mr-2" />
            Grammar Checker Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium block mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Sensitivity Level
              </label>
              <select
                value={settings.sensitivity}
                onChange={(e) => updateSettings({ 
                  sensitivity: e.target.value as 'low' | 'medium' | 'high' 
                })}
                className={`w-full px-3 py-1 text-sm border rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="low">Low - Basic errors only</option>
                <option value="medium">Medium - Balanced checking</option>
                <option value="high">High - Detailed analysis</option>
              </select>
            </div>
            
            <div>
              <label className={`text-sm font-medium block mb-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Check Delay (ms)
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={settings.realTimeDelay}
                onChange={(e) => updateSettings({ 
                  realTimeDelay: parseInt(e.target.value) 
                })}
                className="w-full"
              />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {settings.realTimeDelay}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Container with Layered Approach */}
      <div 
        ref={containerRef}
        className={`relative border-x border-b rounded-b-lg overflow-hidden ${
          darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}
        style={{ height: '400px' }}
      >
        {/* Background Textarea - Handles all text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`absolute inset-0 w-full h-full z-10 bg-transparent ${
            darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
          }`}
          style={{
            ...textStyles,
            background: 'transparent',
            color: darkMode ? '#f3f4f6' : '#111827',
            caretColor: darkMode ? '#60a5fa' : '#3b82f6'
          }}
        />

        {/* Highlight Layer - Shows error highlights */}
        <div
          ref={highlightLayerRef}
          className={`absolute inset-0 w-full h-full z-5 pointer-events-none ${
            darkMode ? 'bg-gray-900' : 'bg-white'
          }`}
          style={{
            ...textStyles,
            color: 'transparent',
            pointerEvents: errorHighlights.length > 0 ? 'auto' : 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onClick={handleHighlightClick}
        >
          <div style={{ 
            position: 'relative',
            minHeight: '100%',
            pointerEvents: errorHighlights.length > 0 ? 'auto' : 'none'
          }}>
            {createHighlightedOverlay()}
          </div>
        </div>

        {/* Hide scrollbar on highlight layer */}
        <style jsx>{`
          div[ref="highlightLayerRef"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={`fixed z-50 min-w-48 rounded-lg shadow-lg border py-1 ${
            darkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={`px-3 py-2 text-xs font-medium border-b ${
            darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-600'
          }`}>
            {contextMenu.error.message}
          </div>
          
          {contextMenu.actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleContextMenuAction(action)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-10 flex items-center space-x-2 ${
                darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
              }`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};