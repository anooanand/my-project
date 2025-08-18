import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generatePrompt, getSynonyms, rephraseSentence, evaluateEssay } from '../lib/openai';
import { dbOperations } from '../lib/database';
import { useApp } from '../contexts/AppContext';
import { AlertCircle, Send, Sparkles, Lightbulb, Type, Save, Settings, Users, Target, Star, CheckCircle } from 'lucide-react';
import { InlineSuggestionPopup } from './InlineSuggestionPopup';
import { WritingStatusBar } from './WritingStatusBar';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { EssayEvaluationModal } from './EssayEvaluationModal';
import { InteractiveTextEditor } from './InteractiveTextEditor';
import { getNSWSelectiveFeedback } from '../lib/openai';
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
}

interface WritingIssue {
  start: number;
  end: number;
  type: 'spelling' | 'grammar' | 'vocabulary' | 'structure' | 'style';
  message: string;
  suggestion: string;
}

interface TemplateData {
  setting: string;
  characters: string;
  plot: string;
  theme: string;
}

export function WritingArea({ content, onChange, textType, onTimerStart, onSubmit, onTextTypeChange, onPopupCompleted, onPromptGenerated }: WritingAreaProps) {
  const { state, addWriting } = useApp();
  const [prompt, setPrompt] = useState('');
  const [displayPrompt, setDisplayPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [issues, setIssues] = useState<WritingIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<WritingIssue | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHighlights, setShowHighlights] = useState(true);
  
  // New state for popup management
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false);
  
  // Template state
  const [templateData, setTemplateData] = useState<TemplateData>({
    setting: '',
    characters: '',
    plot: '',
    theme: ''
  });
  const [showPlanning, setShowPlanning] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // FIXED: Check for prompts from multiple sources
  useEffect(() => {
    const checkForPrompt = () => {
      // Check multiple sources for the prompt
      const savedPrompt = localStorage.getItem(`${textType}_prompt`) || 
                          localStorage.getItem('generatedPrompt');
      
      if (savedPrompt && savedPrompt !== displayPrompt) {
        console.log('✅ Found saved prompt:', savedPrompt);
        setDisplayPrompt(savedPrompt);
        setPrompt(savedPrompt);
        
        if (onPromptGenerated) {
          onPromptGenerated(savedPrompt);
        }
      }
    };

    if (textType) {
      checkForPrompt();
      
      // Check periodically in case prompt loads after component
      const interval = setInterval(checkForPrompt, 500);
      
      return () => clearInterval(interval);
    }
  }, [textType, displayPrompt, onPromptGenerated]);

  // Initialize popup flow when component mounts or when textType is empty
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
        setPrompt(savedPrompt);
        setDisplayPrompt(savedPrompt);
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

  useEffect(() => {
    if (prompt) {
      onTimerStart(true);
    }
  }, [prompt, onTimerStart]);

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
  }, [content]);

  // Auto-save content
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content) {
        localStorage.setItem('writingContent', content);
        setIsSaving(false);
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content]);

  const saveContent = useCallback(async () => {
    if (!content.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await dbOperations.saveWriting({
        content,
        textType: textType || selectedWritingType,
        prompt: displayPrompt,
        wordCount: countWords(content),
        createdAt: new Date()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, textType, selectedWritingType, displayPrompt, isSaving]);

  useEffect(() => {
    const interval = setInterval(saveContent, 30000);
    return () => clearInterval(interval);
  }, [saveContent]);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const rect = textarea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedIssue = issues.find(issue => {
      const start = getTextPosition(textarea, issue.start);
      const end = getTextPosition(textarea, issue.end);
      return x >= start.x && x <= end.x && y >= start.y && y <= end.y;
    });
    
    if (clickedIssue) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        let popupX = x;
        let popupY = y + 20;
        const maxX = containerRect.width - 300;
        if (popupX > maxX) popupX = maxX;
        if (popupX < 0) popupX = 0;
        const maxY = containerRect.height - 200;
        if (popupY > maxY) popupY = y - 220;
        setPopupPosition({ x: popupX, y: popupY });
        setSelectedIssue(clickedIssue);
        setSuggestions([]);
      }
    }
  };

  const getTextPosition = (textarea: HTMLTextAreaElement, index: number) => {
    const text = textarea.value;
    const lines = text.substring(0, index).split('\n');
    const lineHeight = 24;
    const charWidth = 8;
    
    return {
      x: lines[lines.length - 1].length * charWidth,
      y: (lines.length - 1) * lineHeight
    };
  };

  // Handle writing type selection
  const handleWritingTypeSelect = (type: string) => {
    setSelectedWritingType(type);
    localStorage.setItem('selectedWritingType', type);
    
    setShowWritingTypeModal(false);
    
    setTimeout(() => {
      setShowPromptOptionsModal(true);
    }, 100);
    
    if (onTextTypeChange) {
      onTextTypeChange(type);
    }
  };

  // Handle prompt generation
  const handleGeneratePrompt = async () => {
    setShowPromptOptionsModal(false);
    setIsGenerating(true);
    
    const currentTextType = textType || selectedWritingType;
    const newPrompt = await generatePrompt(currentTextType);
    
    if (newPrompt) {
      setPrompt(newPrompt);
      setDisplayPrompt(newPrompt);
      
      localStorage.setItem(`${currentTextType}_prompt`, newPrompt);
      
      if (onPromptGenerated) {
        onPromptGenerated(newPrompt);
      }
    }
    setIsGenerating(false);
    
    setPopupFlowCompleted(true);
    
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  // Handle custom prompt option
  const handleCustomPromptOption = () => {
    setShowPromptOptionsModal(false);
    
    setTimeout(() => {
      setShowCustomPromptModal(true);
    }, 100);
  };

  // Handle custom prompt submission
  const handleCustomPromptSubmit = (customPrompt: string) => {
    setPrompt(customPrompt);
    setDisplayPrompt(customPrompt);
    
    const currentTextType = textType || selectedWritingType;
    localStorage.setItem(`${currentTextType}_prompt`, customPrompt);
    
    if (onPromptGenerated) {
      onPromptGenerated(customPrompt);
    }
    
    setShowCustomPromptModal(false);
    
    setPopupFlowCompleted(true);
    
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  const handleEvaluateEssay = () => {
    setShowEvaluationModal(true);
  };

  // Template functions
  const writingSteps = [
    { id: 1, title: "Setting", icon: Settings, description: "Where and when your story unfolds", field: 'setting' as keyof TemplateData },
    { id: 2, title: "Characters", icon: Users, description: "The people who bring your story to life", field: 'characters' as keyof TemplateData },
    { id: 3, title: "Plot", icon: Target, description: "The sequence of events in your story", field: 'plot' as keyof TemplateData },
    { id: 4, title: "Theme", icon: Star, description: "The deeper meaning or message", field: 'theme' as keyof TemplateData }
  ];

  const updateCompletedSteps = (data: TemplateData) => {
    const completed: number[] = [];
    if (data.setting.trim()) completed.push(1);
    if (data.characters.trim()) completed.push(2);
    if (data.plot.trim()) completed.push(3);
    if (data.theme.trim()) completed.push(4);
    setCompletedSteps(completed);
  };

  const handleTemplateChange = (field: keyof TemplateData, value: string) => {
    const newData = {
      ...templateData,
      [field]: value
    };
    setTemplateData(newData);
    updateCompletedSteps(newData);
  };

  const getProgressPercentage = () => {
    return Math.round((completedSteps.length / writingSteps.length) * 100);
  };

  const togglePlanning = () => {
    setShowPlanning(!showPlanning);
  };

  // AI Feedback function for the enhanced editor
  const handleGetFeedback = async (content: string) => {
    try {
      return await getNSWSelectiveFeedback(content, 'narrative', 'detailed', []);
    } catch (error) {
      console.error('Error getting NSW Selective feedback:', error);
      return null;
    }
  };

  const currentTextType = textType || selectedWritingType;

  return (
    <div ref={containerRef} className="writing-area-container h-full flex flex-col p-0 m-0">
      {/* FIXED: Prominent prompt display at the top */}
      {displayPrompt && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Writing Prompt</h3>
              <p className="text-blue-800 leading-relaxed text-base">{displayPrompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Writing Template Section */}
      {currentTextType && (
        <div className="writing-template-section flex-1 overflow-y-auto min-h-0">
          <div className="h-full flex flex-col bg-gray-50">
            {/* Planning Section - Only show if toggled */}
            {showPlanning && (
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Story Planning</h3>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600">
                        Progress: {getProgressPercentage()}%
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {writingSteps.map((step) => (
                      <div key={step.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {completedSteps.includes(step.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <step.icon className="w-5 h-5 text-gray-400" />
                          )}
                          <label className="font-medium text-gray-700">{step.title}</label>
                        </div>
                        <textarea
                          value={templateData[step.field]}
                          onChange={(e) => handleTemplateChange(step.field, e.target.value)}
                          placeholder={step.description}
                          className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Writing Area */}
            <div className="flex-1 p-6 bg-white">
              <div className="max-w-4xl mx-auto h-full">
                <InteractiveTextEditor
                  content={content}
                  onChange={onChange}
                  placeholder={displayPrompt ? "Start writing your story here..." : "Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨"}
                  className="w-full h-full"
                  textType={currentTextType}
                  onGetFeedback={handleGetFeedback}
                />
              </div>
            </div>

            {/* Writing Tips (Bottom) */}
            {wordCount < 50 && (
              <div className="bg-blue-50 border-t border-blue-200 p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Lightbulb className="w-4 h-4" />
                    <span className="font-medium">Writing Tip:</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Start with a strong opening that grabs your reader's attention. Don't worry about making it perfect - you can always revise it later!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Bar - Always visible at bottom */}
      <div className="status-section py-1 px-2 flex-shrink-0 bg-white border-t border-gray-200">
        <WritingStatusBar
          content={content}
          textType={currentTextType}
        />
      </div>

      {/* Submit Button - Always visible at bottom */}
      <div className="submit-section pt-2 px-2 pb-2 flex-shrink-0 bg-white">
        <div className="flex justify-center">
          <button
            onClick={handleEvaluateEssay}
            disabled={countWords(content) < 50}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-2"
            title={countWords(content) < 50 ? 'Write at least 50 words to submit for evaluation' : 'Submit your essay for detailed evaluation'}
          >
            <Send className="w-4 h-4" />
            Submit for Evaluation
            <span className="text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
              {countWords(content)} words
            </span>
          </button>
        </div>
      </div>

      {/* Popup Modals */}
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
        textType={selectedWritingType}
      />

      <CustomPromptModal
        isOpen={showCustomPromptModal}
        onClose={() => setShowCustomPromptModal(false)}
        onSubmit={handleCustomPromptSubmit}
        textType={selectedWritingType}
      />

      <EssayEvaluationModal
        isOpen={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        content={content}
        textType={currentTextType}
      />
    </div>
  );
}