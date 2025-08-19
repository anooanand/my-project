import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { dbOperations } from '../lib/database';
import { useApp } from '../contexts/AppContext';
import { AlertCircle, Send, Sparkles } from 'lucide-react';
import { InlineSuggestionPopup } from './InlineSuggestionPopup';
import { WritingStatusBar } from './WritingStatusBar';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { EssayEvaluationModal } from './EssayEvaluationModal';
import './writing-area-fix.css';
import './responsive.css';
import './layout-fix.css';
import './full-width-fix.css';

interface WritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTimerStart: (shouldStart: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt: string;
}

interface WritingIssue {
  start: number;
  end: number;
  type: 'spelling' | 'grammar' | 'vocabulary' | 'structure' | 'style';
  message: string;
  suggestion: string;
}

export function WritingArea({
  content,
  onChange,
  textType,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onPromptGenerated,
  prompt
}: WritingAreaProps) {
  // Modal states
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  
  // Writing states
  const [selectedWritingType, setSelectedWritingType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false);
  
  // Writing analysis states
  const [issues, setIssues] = useState<WritingIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<WritingIssue | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Spelling and grammar patterns
  const spellingPatterns = [
    { pattern: /\bteh\b/gi, suggestion: 'the' },
    { pattern: /\brecieve\b/gi, suggestion: 'receive' },
    { pattern: /\boccur\b/gi, suggestion: 'occur' },
    { pattern: /\bseperate\b/gi, suggestion: 'separate' },
    { pattern: /\bdefinately\b/gi, suggestion: 'definitely' },
    { pattern: /\bverry\b/gi, suggestion: 'very' },
    { pattern: /\bi has\b/gi, suggestion: 'I have' }
  ];

  const grammarPatterns = [
    { pattern: /\bi are\b/gi, suggestion: 'I am' },
    { pattern: /\byou was\b/gi, suggestion: 'you were' },
    { pattern: /\bhe don't\b/gi, suggestion: "he doesn't" },
    { pattern: /\bshe don't\b/gi, suggestion: "she doesn't" }
  ];

  // Initialize popup flow when component mounts
  useEffect(() => {
    const savedContent = localStorage.getItem('writingContent');
    const savedWritingType = localStorage.getItem('selectedWritingType');

    if (savedContent) {
      onChange(savedContent);
    }
    
    if (savedWritingType) {
      setSelectedWritingType(savedWritingType);
      if (onTextTypeChange) {
        onTextTypeChange(savedWritingType);
      }
      
      // Check if there's already a saved prompt for this writing type
      const savedPrompt = localStorage.getItem(`${savedWritingType}_prompt`);
      if (savedPrompt) {
        setPopupFlowCompleted(true);
        if (onPromptGenerated) {
          onPromptGenerated(savedPrompt);
        }
      }
    }
    
    // Only initialize the writing type selection flow if no textType is set and no saved writing type
    // AND we haven't already completed the popup flow
    if (!textType && !savedWritingType && !popupFlowCompleted) {
      setShowWritingTypeModal(true);
    }
  }, []);

  // Persist content to localStorage
  useEffect(() => {
    localStorage.setItem('writingContent', content);
  }, [content]);

  // Persist selectedWritingType to localStorage
  useEffect(() => {
    localStorage.setItem('selectedWritingType', selectedWritingType);
  }, [selectedWritingType]);

  // Detect writing issues
  const detectIssues = useCallback((text: string): WritingIssue[] => {
    const detectedIssues: WritingIssue[] = [];

    // Check spelling
    spellingPatterns.forEach(({ pattern, suggestion }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detectedIssues.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'spelling',
          message: `Possible spelling error: "${match[0]}"`,
          suggestion: suggestion
        });
      }
    });

    // Check grammar
    grammarPatterns.forEach(({ pattern, suggestion }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detectedIssues.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'grammar',
          message: `Grammar suggestion: "${match[0]}"`,
          suggestion: suggestion
        });
      }
    });

    return detectedIssues;
  }, []);

  // Update issues when content changes
  useEffect(() => {
    const newIssues = detectIssues(content);
    setIssues(newIssues);
  }, [content, detectIssues]);

  // Render content with highlights
  const renderContentWithHighlights = useCallback(() => {
    if (!showHighlights || !content) {
      return content;
    }

    let highlightedContent = '';
    let lastIndex = 0;

    // Sort issues by start position to handle overlaps correctly
    const sortedIssues = [...issues].sort((a, b) => a.start - b.start);

    sortedIssues.forEach(issue => {
      // Add text before the issue
      highlightedContent += content.substring(lastIndex, issue.start);
      // Add highlighted text with visible background
      highlightedContent += `<span class="highlight highlight-${issue.type}" style="background-color: ${getHighlightColor(issue.type)}; color: transparent;" data-message="${issue.message}" data-suggestion="${issue.suggestion}">${content.substring(issue.start, issue.end)}</span>`;
      lastIndex = issue.end;
    });

    highlightedContent += content.substring(lastIndex);
    return highlightedContent;
  }, [content, issues, showHighlights]);

  // Get highlight color based on issue type
  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'spelling': return 'rgba(255, 204, 0, 0.3)'; // Yellow
      case 'grammar': return 'rgba(255, 102, 102, 0.3)'; // Red
      case 'vocabulary': return 'rgba(102, 204, 255, 0.3)'; // Blue
      case 'structure': return 'rgba(153, 102, 255, 0.3)'; // Purple
      case 'style': return 'rgba(0, 204, 153, 0.3)'; // Green
      default: return 'rgba(255, 204, 0, 0.3)';
    }
  };

  // Handle textarea clicks for issue selection
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    
    // Find if cursor is on an issue
    const clickedIssue = issues.find(issue => 
      cursorPosition >= issue.start && cursorPosition <= issue.end
    );

    if (clickedIssue) {
      const rect = textarea.getBoundingClientRect();
      setPopupPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setSelectedIssue(clickedIssue);
      loadSuggestions(clickedIssue);
    } else {
      setSelectedIssue(null);
      setSuggestions([]);
    }
  };

  // Handle writing type selection
  const handleWritingTypeSelect = (type: string) => {
    setSelectedWritingType(type);
    localStorage.setItem('selectedWritingType', type);
    
    // Close the writing type modal and show prompt options modal
    setShowWritingTypeModal(false);
    
    // Add a small delay to ensure smooth transition
    setTimeout(() => {
      setShowPromptOptionsModal(true);
    }, 100);
    
    // Call the callback to update parent component
    if (onTextTypeChange) {
      onTextTypeChange(type);
    }
  };

  // Handle prompt generation
  const handleGeneratePrompt = async () => {
    setShowPromptOptionsModal(false);
    setIsGenerating(true);
    
    // Use the current text type (either from props or local state)
    const currentTextType = textType || selectedWritingType;
    const newPrompt = await generatePrompt(currentTextType);
    
    if (newPrompt) {
      // Pass the generated prompt to parent immediately
      if (onPromptGenerated) {
        onPromptGenerated(newPrompt);
      }
      // Save prompt to localStorage using the current text type
      if (currentTextType) {
        localStorage.setItem(`${currentTextType}_prompt`, newPrompt);
      }
    }
    setIsGenerating(false);
    // Mark popup flow as completed
    setPopupFlowCompleted(true);
    // Call the callback to indicate popup flow is completed
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  // Handle custom prompt option
  const handleCustomPromptOption = () => {
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  // Handle custom prompt submission
  const handleCustomPromptSubmit = (customPrompt: string) => {
    // Use the current text type (either from props or local state)
    const currentTextType = textType || selectedWritingType;
    
    // Save prompt to localStorage using the current text type
    if (currentTextType) {
      localStorage.setItem(`${currentTextType}_prompt`, customPrompt);
    }
    
    // Pass the custom prompt to parent
    if (onPromptGenerated) {
      onPromptGenerated(customPrompt);
    }
    
    setIsGenerating(false);
    setShowCustomPromptModal(false);
    setPopupFlowCompleted(true);
    
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  // Handle textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    
    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(() => {
      handleAutoSave(newContent);
    }, 2000);

    return () => clearTimeout(timeoutId);
  };

  // Auto-save functionality
  const handleAutoSave = async (content: string) => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('writingContent', content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load suggestions for an issue
  const loadSuggestions = (issue: WritingIssue) => {
    setSuggestions([issue.suggestion]);
  };

  // Handle applying a suggestion
  const handleApplySuggestion = (suggestion: string, start: number, end: number) => {
    const newContent = content.slice(0, start) + suggestion + content.slice(end);
    onChange(newContent);
    setSelectedIssue(null);
    setSuggestions([]);
  };

  // Handle evaluation
  const handleEvaluationSubmit = () => {
    setShowEvaluationModal(true);
  };

  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
  };

  // Toggle highlights
  const handleToggleHighlights = () => {
    setShowHighlights(!showHighlights);
  };

  // Handle planning toggle (pass through to parent)
  const handleShowPlanning = () => {
    // This will be handled by the parent component
    console.log('Planning toggle clicked');
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="writing-area-container h-full flex flex-col">
      {/* Main Writing Area */}
      <div className="flex-1 relative">
        {/* Highlight overlay */}
        {showHighlights && issues.length > 0 && (
          <div 
            className="absolute inset-0 p-6 pointer-events-none z-10 text-lg leading-relaxed"
            style={{ 
              fontFamily: 'Georgia, serif',
              lineHeight: '1.8',
              color: 'transparent',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: renderContentWithHighlights() }}
          />
        )}
        
        <textarea
          value={content}
          onChange={handleTextareaChange}
          onClick={handleTextareaClick}
          placeholder={
            prompt 
              ? "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
              : "Please select a text type and generate a prompt to begin writing..."
          }
          className="w-full h-full p-6 text-lg leading-relaxed border-none outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 relative z-20"
          style={{ 
            fontFamily: 'Georgia, serif',
            lineHeight: '1.8',
            backgroundColor: showHighlights && issues.length > 0 ? 'transparent' : undefined
          }}
          disabled={!prompt}
        />

        {/* Inline Suggestion Popup */}
        {selectedIssue && (
          <InlineSuggestionPopup
            issue={selectedIssue}
            suggestions={suggestions}
            position={popupPosition}
            onApplySuggestion={handleApplySuggestion}
            onClose={() => setSelectedIssue(null)}
            isLoading={isLoadingSuggestions}
          />
        )}

        {/* Loading overlay when generating prompt */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Generating your writing prompt...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <WritingStatusBar
        wordCount={wordCount}
        lastSaved={lastSaved}
        isSaving={isSaving}
        showHighlights={showHighlights}
        onToggleHighlights={handleToggleHighlights}
        onEvaluate={handleEvaluationSubmit}
        onShowPlanning={handleShowPlanning}
        content={content}
        textType={textType || selectedWritingType}
        onRestore={(content, textType) => {
          onChange(content);
          setSelectedWritingType(textType);
          if (onTextTypeChange) {
            onTextTypeChange(textType);
          }
        }}
      />

      {/* Submit Button Section */}
      {content.trim() && prompt && (
        <div className="writing-actions bg-white border-t border-gray-200 p-4 flex justify-center">
          <button 
            onClick={handleEvaluationSubmit} 
            className="submit-button flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={!content.trim()}
          >
            <Send size={20} />
            <span>Submit Writing for Evaluation</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <WritingTypeSelectionModal
        isOpen={showWritingTypeModal}
        onClose={() => setShowWritingTypeModal(false)}
        onSelectType={handleWritingTypeSelect}
      />

      <PromptOptionsModal
        isOpen={showPromptOptionsModal}
        onClose={() => setShowPromptOptionsModal(false)}
        onGeneratePrompt={handleGeneratePrompt}
        onCustomPrompt={handleCustomPromptOption}
        textType={textType || selectedWritingType}
      />

      <CustomPromptModal
        isOpen={showCustomPromptModal}
        onClose={() => setShowCustomPromptModal(false)}
        onSubmit={handleCustomPromptSubmit}
        textType={textType || selectedWritingType}
      />

      <EssayEvaluationModal
        isOpen={showEvaluationModal}
        onClose={handleCloseEvaluationModal}
        content={content}
        textType={textType || selectedWritingType}
      />
    </div>
  );
}