import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Loader2, Star, Target, Zap } from 'lucide-react';
import { TextHighlighter, useTextHighlights } from './TextHighlighter';
import { grammarSpellingChecker, GrammarError } from '../utils/grammarSpellingChecker'; // Added import

interface EnhancedWritingEditorWithHighlightingProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  textType?: string;
  onGetFeedback?: (content: string) => Promise<any>;
}

interface AIFeedback {
  feedbackItems?: Array<{
    type: 'praise' | 'suggestion' | 'improvement';
    text: string;
    exampleFromText?: string;
    suggestionForImprovement?: string;
    area?: string;
  }>;
  corrections?: Array<{
    original: string;
    suggestion: string;
    explanation?: string;
  }>;
  vocabularyEnhancements?: Array<{
    original: string;
    suggestion: string;
  }>;
  overallScore?: number;
  criteriaScores?: {
    ideas: number;
    structure: number;
    language: number;
    accuracy: number;
  };
  strengths?: string[];
  areasForImprovement?: string[];
}

export function EnhancedWritingEditorWithHighlighting({
  content,
  onChange,
  placeholder = "Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨",
  className = "",
  style = {},
  textType = "narrative",
  onGetFeedback
}: EnhancedWritingEditorWithHighlightingProps) {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedError, setSelectedError] = useState<GrammarError | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isGettingAIFeedback, setIsGettingAIFeedback] = useState(false);
  const [showAIHighlights, setShowAIHighlights] = useState(true);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate highlights from AI feedback using the existing hook
  const aiHighlights = useTextHighlights(content, aiFeedback);

  // AI-powered grammar and spelling checker (from latest EnhancedWritingEditor)
  const checkTextWithAI = async (text: string): Promise<GrammarError[]> => {
    if (!text.trim() || text.length < 10) return [];
    
    try {
      setIsChecking(true);
      
      // Try to use OpenAI API for contextual grammar and spelling checking
      const response = await fetch('/netlify/functions/ai-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'check-grammar',
          text: text
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.errors || [];
      } else {
        // Fallback to client-side checking if API fails
        return checkTextClientSide(text); // Modified to call the new client-side function
      }
    } catch (error) {
      console.error('Grammar check API error:', error);
      // Fallback to client-side checking
      return checkTextClientSide(text); // Modified to call the new client-side function
    } finally {
      setIsChecking(false);
    }
  };

  // Get AI feedback for highlighting
  const getAIFeedbackForHighlighting = async (text: string) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 50) return;
    
    try {
      setIsGettingAIFeedback(true);
      
      if (onGetFeedback) {
        const feedback = await onGetFeedback(text);
        setAiFeedback(feedback);
      } else {
        // Fallback to direct API call
        const response = await fetch('/netlify/functions/ai-operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'getNSWSelectiveFeedback',
            content: text,
            textType: textType,
            assistanceLevel: 'detailed',
            feedbackHistory: []
          }),
        });

        if (response.ok) {
          const feedback = await response.json();
          setAiFeedback(feedback);
        }
      }
    } catch (error) {
      console.error('AI feedback error:', error);
    } finally {
      setIsGettingAIFeedback(false);
    }
  };

  // Client-side fallback using the dedicated grammarSpellingChecker utility (Modified function)
  const checkTextClientSide = (text: string): GrammarError[] => {
    return grammarSpellingChecker.checkText(text);
  };

  // Update grammar errors when content changes (debounced)
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      if (content.trim() && showGrammarHighlights) {
        const newErrors = await checkTextWithAI(content);
        setErrors(newErrors);
      } else {
        setErrors([]);
      }
    }, 1000);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [content, showGrammarHighlights]);

  // Update AI feedback when content changes (debounced longer)
  useEffect(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(async () => {
      if (content.trim() && showAIHighlights) {
        await getAIFeedbackForHighlighting(content);
      } else {
        setAiFeedback(null);
      }
    }, 3000); // Longer debounce for AI feedback

    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [content, showAIHighlights, textType]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleHighlightClick = (highlight: any) => {
    console.log('AI Highlight clicked:', highlight);
  };

  const applySuggestion = (error: GrammarError, suggestion: string) => {
    const before = content.substring(0, error.start);
    const after = content.substring(error.end);
    const newContent = before + suggestion + after;
    onChange(newContent);
    setErrors(prevErrors => prevErrors.filter(err => err !== error));
    setSelectedError(null);
  };

  const dismissError = (error: GrammarError) => {
    setErrors(prevErrors => prevErrors.filter(err => err !== error));
    setSelectedError(null);
  };

  const handleTextareaScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Find if a highlight was clicked
    const target = e.target as HTMLElement;
    if (target.dataset.errorIndex) {
      const errorIndex = parseInt(target.dataset.errorIndex);
      setSelectedError(errors[errorIndex]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSelectedError(null);
    }
  };

  const getErrorHighlights = () => {
    return errors.map((error, index) => ({
      start: error.start,
      end: error.end,
      className: `highlight-${error.type} highlight-${error.severity}`,
      data: { errorIndex: index }, // Store index to retrieve error on click
      onClick: handleOverlayClick,
    }));
  };

  const allHighlights = [
    ...(showGrammarHighlights ? getErrorHighlights() : []),
    ...(showAIHighlights ? aiHighlights : []),
  ];

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <TextHighlighter
        text={content}
        highlights={allHighlights}
        textareaRef={textareaRef}
        overlayRef={overlayRef}
        onScroll={handleTextareaScroll}
      />
      <textarea
        ref={textareaRef}
        className="absolute inset-0 w-full h-full p-4 text-lg font-sans leading-relaxed resize-none outline-none bg-transparent z-10 custom-scrollbar"
        placeholder={placeholder}
        value={content}
        onChange={handleTextChange}
        onScroll={handleTextareaScroll}
        spellCheck={false} // Disable native spell check as we're implementing our own
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
      />

      {isChecking && (
        <div className="absolute bottom-4 left-4 flex items-center text-blue-500 z-20">
          <Loader2 className="animate-spin mr-2" size={18} />
          <span>Checking grammar and spelling...</span>
        </div>
      )}

      {isGettingAIFeedback && (
        <div className="absolute bottom-4 left-4 flex items-center text-purple-500 z-20">
          <Loader2 className="animate-spin mr-2" size={18} />
          <span>Getting AI feedback...</span>
        </div>
      )}

      {showSuggestions && selectedError && (
        <div className="absolute z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200"
          style={{
            top: `calc(${selectedError.start / content.length * 100}% + 20px)`,
            left: `calc(${selectedError.start / content.length * 100}% + 20px)`,
            transform: 'translateY(-100%)',
            minWidth: '250px',
          }}>
          <p className="font-bold text-red-600 mb-2">{selectedError.message}</p>
          {selectedError.suggestions && selectedError.suggestions.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">Suggestions:</p>
              {selectedError.suggestions.map((s, i) => (
                <button
                  key={i}
                  className="block w-full text-left px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
                  onClick={() => applySuggestion(selectedError, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <button
            className="block w-full text-left px-3 py-1 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => dismissError(selectedError)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <button
          className={`p-2 rounded-full ${showGrammarHighlights ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowGrammarHighlights(!showGrammarHighlights)}
          title="Toggle Grammar Highlights"
        >
          <CheckCircle size={20} />
        </button>
        <button
          className={`p-2 rounded-full ${showAIHighlights ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setShowAIHighlights(!showAIHighlights)}
          title="Toggle AI Feedback Highlights"
        >
          <Lightbulb size={20} />
        </button>
      </div>
    </div>
  );
}
