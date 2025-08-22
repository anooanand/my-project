// Enhanced Grammar Text Editor with Real-time Feedback

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, X, RefreshCw, Zap } from 'lucide-react';
import { useGrammarSpellChecker } from '../hooks/useGrammarSpellChecker';
import { NSWWritingAnalyzer } from './NSWWritingAnalyzer';
import { 
  GrammarError, 
  VocabularyEnhancement, 
  SentenceStructureIssue, 
  CohesionIssue,
  TextHighlight,
  SuggestionTooltip 
} from './grammarTypes';

interface EnhancedGrammarTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  textType?: string;
  showAnalyzer?: boolean;
  enableRealTimeChecking?: boolean;
  minHeight?: string;
}

export const EnhancedGrammarTextEditor: React.FC<EnhancedGrammarTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your essay...",
  className = "",
  textType = "general",
  showAnalyzer = true,
  enableRealTimeChecking = true,
  minHeight = "300px"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<SuggestionTooltip | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const {
    analysis,
    highlights,
    metrics,
    isChecking,
    error,
    checkText,
    clearAnalysis,
    getErrorById
  } = useGrammarSpellChecker({
    debounceMs: 500,
    enableVocabularyEnhancement: true,
    enableStructureAnalysis: true,
    enableCohesionCheck: true,
    textType,
    language: 'en-US'
  });

  // Auto-check text when content changes
  useEffect(() => {
    if (enableRealTimeChecking && content) {
      checkText(content);
    } else if (!content) {
      clearAnalysis();
    }
  }, [content, enableRealTimeChecking, checkText, clearAnalysis]);

  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    setCursorPosition(e.target.selectionStart);
  }, [onChange]);

  // Handle cursor position changes
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // Apply suggestion to text
  const applySuggestion = useCallback((errorId: string, suggestion: string) => {
    const error = getErrorById(errorId);
    if (!error || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const beforeError = content.substring(0, error.start);
    const afterError = content.substring(error.end);
    const newContent = beforeError + suggestion + afterError;
    
    onChange(newContent);
    setTooltip(null);
    
    // Set cursor position after the applied suggestion
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = error.start + suggestion.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  }, [content, onChange, getErrorById]);

  // Handle click on highlighted text
  const handleHighlightClick = useCallback((e: React.MouseEvent, highlight: TextHighlight) => {
    e.preventDefault();
    const error = getErrorById(highlight.id);
    if (!error) return;

    const rect = textareaRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate tooltip position
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const suggestions = 'suggestions' in error ? error.suggestions : [];
    
    setTooltip({
      id: highlight.id,
      x: Math.min(x, rect.width - 300), // Ensure tooltip doesn't overflow
      y: Math.max(y - 100, 10), // Position above click, with minimum top margin
      visible: true,
      error,
      suggestions,
      explanation: 'explanation' in error ? error.explanation : 'message' in error ? error.message : ''
    });
  }, [getErrorById]);

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setTooltip(null);
    setSelectedSuggestion(null);
  }, []);

  // Generate highlighted text overlay
  const generateHighlightedText = useCallback(() => {
    if (!content || highlights.length === 0) {
      return <span className="whitespace-pre-wrap">{content || placeholder}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {content.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      const highlightedText = content.substring(highlight.start, highlight.end);
      parts.push(
        <span
          key={`highlight-${highlight.id}`}
          className={`relative cursor-pointer transition-all duration-200 hover:bg-opacity-20 ${getHighlightClasses(highlight)}`}
          onClick={(e) => handleHighlightClick(e, highlight)}
          title={getHighlightTitle(highlight)}
        >
          {highlightedText}
          <span
            className={`absolute bottom-0 left-0 right-0 h-0.5 ${getUnderlineClasses(highlight)}`}
            style={{
              backgroundImage: highlight.underlineStyle === 'wavy' 
                ? `url("data:image/svg+xml,%3csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m0 15c5 0 5-10 10-10s5 10 10 10 5-10 10-10 5 10 10 10 5-10 10-10 5 10 10 10 5-10 10-10 5 10 10 10 5-10 10-10 5 10 10 10' stroke='${encodeURIComponent(highlight.color)}' fill='none'/%3e%3c/svg%3e")`
                : undefined
            }}
          />
        </span>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  }, [content, highlights, placeholder, handleHighlightClick]);

  const getHighlightClasses = (highlight: TextHighlight): string => {
    const baseClasses = "rounded-sm px-0.5";
    switch (highlight.type) {
      case 'error':
        return `${baseClasses} bg-red-100 hover:bg-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 hover:bg-yellow-200`;
      case 'suggestion':
        return `${baseClasses} bg-blue-100 hover:bg-blue-200`;
      case 'enhancement':
        return `${baseClasses} bg-purple-100 hover:bg-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 hover:bg-gray-200`;
    }
  };

  const getUnderlineClasses = (highlight: TextHighlight): string => {
    switch (highlight.underlineStyle) {
      case 'wavy':
        return 'bg-repeat-x';
      case 'dashed':
        return 'border-b-2 border-dashed';
      case 'dotted':
        return 'border-b-2 border-dotted';
      default:
        return 'border-b-2 border-solid';
    }
  };

  const getHighlightTitle = (highlight: TextHighlight): string => {
    const error = getErrorById(highlight.id);
    if (!error) return '';
    
    if ('message' in error) return error.message;
    if ('reason' in error) return error.reason;
    return 'Click for suggestions';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Editor Container */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isChecking ? (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-sm text-gray-600">
                {isChecking ? 'Checking...' : 'Ready'}
              </span>
            </div>
            
            {error && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Check failed</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{metrics.wordCount} words</span>
            <span>{metrics.sentenceCount} sentences</span>
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>{metrics.sophisticationScore}% sophistication</span>
            </span>
          </div>
        </div>

        {/* Text Editor */}
        <div className="relative">
          {/* Hidden textarea for input */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onClick={handleSelectionChange}
            placeholder={placeholder}
            className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none outline-none caret-black z-10"
            style={{ minHeight }}
          />

          {/* Visible overlay with highlights */}
          <div
            ref={overlayRef}
            className="absolute inset-0 w-full h-full p-4 pointer-events-none z-0 overflow-hidden"
            style={{ minHeight }}
          >
            <div className="font-mono text-base leading-relaxed whitespace-pre-wrap break-words">
              {generateHighlightedText()}
            </div>
          </div>

          {/* Make highlights clickable */}
           <div className="absolute inset-0 w-full h-full p-4 z-5 pointer-events-auto">
             <div className="font-mono text-base leading-relaxed whitespace-pre-wrap break-words">
            {generateHighlightedText()}
         </div>
        </div>          
        </div>

        {/* Suggestion Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getErrorTypeColor(tooltip.error)}`} />
                <span className="font-medium text-sm text-gray-800">
                  {getErrorTypeLabel(tooltip.error)}
                </span>
              </div>
              <button
                onClick={closeTooltip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tooltip.explanation && (
              <p className="text-sm text-gray-600 mb-3">{tooltip.explanation}</p>
            )}

            {tooltip.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" />
                  Suggestions:
                </h4>
                <div className="space-y-1">
                  {tooltip.suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion(tooltip.id, suggestion)}
                      className="block w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary enhancement specific content */}
            {'sophisticationLevel' in tooltip.error && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Sophistication Level</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= tooltip.error.sophisticationLevel
                            ? 'bg-purple-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NSW Writing Analyzer */}
      {showAnalyzer && (
        <div className="mt-6">
          <NSWWritingAnalyzer
            analysis={analysis}
            metrics={metrics}
            textType={textType}
          />
        </div>
      )}
    </div>
  );
};

// Helper functions
function getErrorTypeColor(error: any): string {
  if ('type' in error) {
    switch (error.type) {
      case 'spelling': return 'bg-red-500';
      case 'grammar': return 'bg-red-600';
      case 'style': return 'bg-blue-500';
      case 'punctuation': return 'bg-orange-500';
      case 'vocabulary': return 'bg-purple-500';
      case 'structure': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }
  return 'bg-gray-500';
}

function getErrorTypeLabel(error: any): string {
  if ('type' in error) {
    switch (error.type) {
      case 'spelling': return 'Spelling';
      case 'grammar': return 'Grammar';
      case 'style': return 'Style';
      case 'punctuation': return 'Punctuation';
      case 'vocabulary': return 'Vocabulary';
      case 'structure': return 'Structure';
      default: return 'Suggestion';
    }
  }
  if ('sophisticationLevel' in error) return 'Vocabulary Enhancement';
  if ('reason' in error) return 'Enhancement';
  return 'Suggestion';
}

export default EnhancedGrammarTextEditor;
