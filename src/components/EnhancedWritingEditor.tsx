import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Loader2, Star, Target, Zap, BookOpen, BarChart3, Eye, EyeOff } from 'lucide-react';
import { TextHighlighter, useTextHighlights } from './TextHighlighter';
import { EnhancedWritingAnalyzer } from '../utils/grammarSpellingChecker';

interface EnhancedWritingEditorWithHighlightingProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  textType?: string;
  onGetFeedback?: (content: string) => Promise<any>;
}

interface GrammarError {
  start: number;
  end: number;
  message: string;
  type: 'grammar' | 'spelling' | 'style' | 'punctuation';
  suggestions: string[];
  context?: string;
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

interface EnhancedAnalysisResults {
  grammarErrors: any[];
  showDontTell: { score: number; tellingSentences: string[] };
  literaryDevices: any[];
  sentenceVariety: any;
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
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysisResults | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedError, setSelectedError] = useState<GrammarError | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isGettingAIFeedback, setIsGettingAIFeedback] = useState(false);
  const [showAIHighlights, setShowAIHighlights] = useState(true);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [showEnhancedAnalysis, setShowEnhancedAnalysis] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();
  const enhancedAnalyzer = useRef(new EnhancedWritingAnalyzer());

  // Generate highlights from AI feedback using the existing hook
  const aiHighlights = useTextHighlights(content, aiFeedback);

  // Enhanced Writing Analysis - NEW FEATURE!
  const performEnhancedAnalysis = async (text: string) => {
    if (!text.trim() || text.length < 20) {
      setEnhancedAnalysis(null);
      return;
    }

    try {
      const results = enhancedAnalyzer.current.analyze(text);
      setEnhancedAnalysis(results);
    } catch (error) {
      console.error('Enhanced analysis error:', error);
    }
  };

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
        // Fallback to enhanced client-side checking
        return await checkTextClientSideEnhanced(text);
      }
    } catch (error) {
      console.error('Grammar check API error:', error);
      // Fallback to enhanced client-side checking
      return await checkTextClientSideEnhanced(text);
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

  // Enhanced client-side fallback using the new EnhancedWritingAnalyzer
  const checkTextClientSideEnhanced = async (text: string): Promise<GrammarError[]> => {
    const errors: GrammarError[] = [];
    
    try {
      // Use the enhanced analyzer for comprehensive analysis
      const analysis = enhancedAnalyzer.current.analyze(text);
      
      // Convert grammar errors to the expected format
      const grammarErrors = analysis.grammarErrors.map(error => ({
        start: error.start,
        end: error.end,
        message: error.message,
        type: error.type as 'grammar' | 'spelling' | 'style' | 'punctuation',
        suggestions: error.suggestions,
        context: `Rule: ${error.rule || 'unknown'}`
      }));
      
      errors.push(...grammarErrors);

      // Add show vs tell feedback as style suggestions
      if (analysis.showDontTell.tellingSentences.length > 0) {
        analysis.showDontTell.tellingSentences.forEach(sentence => {
          const sentenceIndex = text.indexOf(sentence);
          if (sentenceIndex !== -1) {
            errors.push({
              start: sentenceIndex,
              end: sentenceIndex + sentence.length,
              message: `Consider showing instead of telling. Show/Don't Tell Score: ${(analysis.showDontTell.score * 100).toFixed(0)}%`,
              type: 'style',
              suggestions: ['Try describing actions, sensations, or dialogue instead of stating emotions directly'],
              context: 'Show vs Tell Analysis'
            });
          }
        });
      }

      // Store the enhanced analysis for display
      setEnhancedAnalysis(analysis);

    } catch (error) {
      console.error('Enhanced analysis error:', error);
      // Fallback to basic grammar checking
      const basicErrors = await checkGrammarPatterns(text);
      errors.push(...basicErrors);
    }

    return errors;
  };

  // Basic grammar pattern checking (fallback)
  const checkGrammarPatterns = async (text: string): Promise<GrammarError[]> => {
    const errors: GrammarError[] = [];
    
    // Basic subject-verb agreement
    const subjectVerbPattern = /\b(he|she|it)\s+(are|were)\b/gi;
    let match;
    while ((match = subjectVerbPattern.exec(text)) !== null) {
      errors.push({
        start: match.index,
        end: match.index + match[0].length,
        message: "Subject-verb disagreement. Use 'is' or 'was' with singular subjects.",
        type: 'grammar',
        suggestions: [match[0].replace(/are/gi, 'is').replace(/were/gi, 'was')],
        context: 'Subject-verb agreement'
      });
    }

    // Common word confusions
    const yourPattern = /\byour\s+(going|coming|doing)\b/gi;
    while ((match = yourPattern.exec(text)) !== null) {
      errors.push({
        start: match.index,
        end: match.index + match[0].length,
        message: "Did you mean 'you're' (you are)?",
        type: 'grammar',
        suggestions: [match[0].replace('your', "you're")],
        context: 'Word choice'
      });
    }

    return errors;
  };

  // Debounced text checking
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      if (content.trim().length > 10) {
        const newErrors = await checkTextWithAI(content);
        setErrors(newErrors);
        
        // Perform enhanced analysis
        await performEnhancedAnalysis(content);
      } else {
        setErrors([]);
        setEnhancedAnalysis(null);
      }
    }, 1000);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [content]);

  // Debounced AI feedback
  useEffect(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      if (content.trim().length > 50) {
        getAIFeedbackForHighlighting(content);
      }
    }, 2000);

    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [content]);

  // Handle text selection and error clicking
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    const clickedError = errors.find(error => 
      clickPosition >= error.start && clickPosition <= error.end
    );
    
    if (clickedError) {
      setSelectedError(clickedError);
      setShowSuggestions(true);
    } else {
      setSelectedError(null);
      setShowSuggestions(false);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    if (selectedError) {
      const newContent = 
        content.substring(0, selectedError.start) + 
        suggestion + 
        content.substring(selectedError.end);
      onChange(newContent);
      setSelectedError(null);
      setShowSuggestions(false);
    }
  };

  // Enhanced Analysis Display Component
  const EnhancedAnalysisPanel = () => {
    if (!enhancedAnalysis || !showEnhancedAnalysis) return null;

    return (
      <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Enhanced Writing Analysis
          </h3>
          <button
            onClick={() => setShowEnhancedAnalysis(false)}
            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Show vs Tell Score */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show vs Tell</span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(enhancedAnalysis.showDontTell.score * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {enhancedAnalysis.showDontTell.tellingSentences.length} telling sentences
            </div>
          </div>

          {/* Literary Devices */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Literary Devices</span>
              <Star className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {enhancedAnalysis.literaryDevices.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {enhancedAnalysis.literaryDevices.map(d => d.type).join(', ') || 'None detected'}
            </div>
          </div>

          {/* Sentence Variety */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sentences</span>
              <BookOpen className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {enhancedAnalysis.sentenceVariety.totalSentences}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Avg: {enhancedAnalysis.sentenceVariety.averageSentenceLength.toFixed(1)} words
            </div>
          </div>

          {/* Grammar Errors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grammar</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {enhancedAnalysis.grammarErrors.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              errors found
            </div>
          </div>
        </div>

        {/* Detailed Literary Devices */}
        {enhancedAnalysis.literaryDevices.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Literary Devices Found:
            </h4>
            <div className="space-y-2">
              {enhancedAnalysis.literaryDevices.slice(0, 3).map((device, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-700 dark:text-purple-300">{device.type}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">"{device.example}"</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{device.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentence Type Distribution */}
        {enhancedAnalysis.sentenceVariety.sentenceTypeDistribution && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              Sentence Types:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(enhancedAnalysis.sentenceVariety.sentenceTypeDistribution).map(([type, count]) => (
                <div key={type} className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 capitalize">{type}</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Control Panel */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Highlights:</span>
            <button
              onClick={() => setShowGrammarHighlights(!showGrammarHighlights)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                showGrammarHighlights 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Grammar ({errors.length})
            </button>
            <button
              onClick={() => setShowAIHighlights(!showAIHighlights)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                showAIHighlights 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              AI Feedback
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!showEnhancedAnalysis && (
            <button
              onClick={() => setShowEnhancedAnalysis(true)}
              className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center"
            >
              <Eye className="w-3 h-3 mr-1" />
              Show Analysis
            </button>
          )}
          {isChecking && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span className="text-xs">Checking...</span>
            </div>
          )}
          {isGettingAIFeedback && (
            <div className="flex items-center text-purple-600 dark:text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span className="text-xs">AI Analysis...</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Editor with Highlighting */}
      <div className="relative">
        <TextHighlighter
          text={content}
          highlights={[
            ...(showGrammarHighlights ? errors.map(error => ({
              start: error.start,
              end: error.end,
              className: `bg-red-200 dark:bg-red-900/30 border-b-2 border-red-400 dark:border-red-600 ${
                selectedError === error ? 'bg-red-300 dark:bg-red-800/50' : ''
              }`
            })) : []),
            ...(showAIHighlights ? aiHighlights : [])
          ]}
          className="absolute inset-0 pointer-events-none z-10"
          ref={overlayRef}
        />
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleTextareaClick}
          placeholder={placeholder}
          className={`relative z-20 w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900 dark:text-gray-100 ${className}`}
          style={style}
        />
      </div>

      {/* Enhanced Analysis Panel */}
      <EnhancedAnalysisPanel />

      {/* Suggestions Panel */}
      {showSuggestions && selectedError && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                {selectedError.message}
              </h4>
              {selectedError.context && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {selectedError.context}
                </p>
              )}
              {selectedError.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">Suggestions:</p>
                  <div className="space-y-1">
                    {selectedError.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => applySuggestion(suggestion)}
                        className="block w-full text-left px-3 py-2 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 rounded text-sm text-yellow-800 dark:text-yellow-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              {errors.length} issue{errors.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="text-xs text-red-700 dark:text-red-300">
            Click on highlighted text to see suggestions
          </div>
        </div>
      )}
    </div>
  );
}
