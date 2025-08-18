import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { NarrativeWritingTemplateRedesigned } from './NarrativeWritingTemplateRedesigned';
import { PersuasiveWritingTemplate } from './PersuasiveWritingTemplate';
import { ExpositoryWritingTemplate } from './ExpositoryWritingTemplate';
import { ReflectiveWritingTemplate } from './ReflectiveWritingTemplate';
import { DescriptiveWritingTemplate } from './DescriptiveWritingTemplate';
import { RecountWritingTemplate } from './RecountWritingTemplate';
import { DiscursiveWritingTemplate } from './DiscursiveWritingTemplate';
import { NewsReportWritingTemplate } from './NewsReportWritingTemplate';
import { LetterWritingTemplate } from './LetterWritingTemplate';
import { DiaryWritingTemplate } from './DiaryWritingTemplate';
import { SpeechWritingTemplate } from './SpeechWritingTemplate';
// NSW Analysis Components
import { TextTypeAnalysisComponent } from './TextTypeAnalysisComponent';
import { VocabularySophisticationComponent } from './VocabularySophisticationComponent';
import { ProgressTrackingComponent } from './ProgressTrackingComponent';
import { CoachingTipsComponent } from './CoachingTipsComponent';
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

export function WritingArea({ content, onChange, textType, onTimerStart, onSubmit, onTextTypeChange, onPopupCompleted, onPromptGenerated }: WritingAreaProps) {
  const { state, addWriting } = useApp();
  const [prompt, setPrompt] = useState('');
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
  
  // NSW Analysis Tab Management
  const [activeTab, setActiveTab] = useState('textType');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setPopupFlowCompleted(true); // Mark as completed if we have both type and prompt
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
  }, []); // Remove textType and selectedWritingType from dependencies to prevent loops

  useEffect(() => {
    if (prompt) {
      onTimerStart(true);
    }
  }, [prompt, onTimerStart]);

  // Load saved prompt from localStorage
  useEffect(() => {
    if (selectedWritingType || textType) {
      const currentTextType = textType || selectedWritingType;
      const savedPrompt = localStorage.getItem(`${currentTextType}_prompt`);
      if (savedPrompt) {
        setPrompt(savedPrompt);
        if (onPromptGenerated) {
          onPromptGenerated(savedPrompt);
        }
      }
    }
  }, [selectedWritingType, textType, onPromptGenerated]);

  // Pass prompt to parent whenever it changes
  useEffect(() => {
    if (prompt && onPromptGenerated) {
      onPromptGenerated(prompt);
    }
  }, [prompt, onPromptGenerated]);

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
        prompt,
        wordCount: countWords(content),
        createdAt: new Date()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, textType, selectedWritingType, prompt, isSaving]);

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
    
    const currentTextType = textType || selectedWritingType;
    const newPrompt = await generatePrompt(currentTextType);
    
    if (newPrompt) {
      setPrompt(newPrompt);
      
      // Save prompt to localStorage
      localStorage.setItem(`${currentTextType}_prompt`, newPrompt);
      
      // Pass the generated prompt to parent immediately
      if (onPromptGenerated) {
        onPromptGenerated(newPrompt);
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
    
    // Add a small delay to ensure smooth transition
    setTimeout(() => {
      setShowCustomPromptModal(true);
    }, 100);
  };

  // Handle custom prompt submission
  const handleCustomPromptSubmit = (customPrompt: string) => {
    setPrompt(customPrompt);
    
    // Save custom prompt to localStorage
    const currentTextType = textType || selectedWritingType;
    localStorage.setItem(`${currentTextType}_prompt`, customPrompt);
    
    // Pass the custom prompt to parent
    if (onPromptGenerated) {
      onPromptGenerated(customPrompt);
    }
    
    setShowCustomPromptModal(false);
    
    // Mark popup flow as completed
    setPopupFlowCompleted(true);
    
    // Call the callback to indicate popup flow is completed
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  const handleEvaluateEssay = () => {
    setShowEvaluationModal(true);
  };

  // FIXED: Updated renderWritingTemplate to pass prompt to templates
  const renderWritingTemplate = () => {
    const currentTextType = textType || selectedWritingType;
    
    switch (currentTextType) {
      case 'narrative':
        return <NarrativeWritingTemplateRedesigned 
          content={content}
          onChange={onChange}
          prompt={prompt}  // FIXED: Pass prompt to template
          onPromptChange={setPrompt}  // Allow template to update prompt if needed
        />;
      case 'persuasive':
        return <PersuasiveWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'expository':
        return <ExpositoryWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'reflective':
        return <ReflectiveWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'descriptive':
        return <DescriptiveWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'recount':
        return <RecountWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'discursive':
        return <DiscursiveWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'news report':
        return <NewsReportWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'letter':
        return <LetterWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'diary entry':
        return <DiaryWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      case 'speech':
        return <SpeechWritingTemplate 
          content={content}
          onChange={onChange}
          prompt={prompt}
          onPromptChange={setPrompt}
        />;
      default:
        return null;
    }
  };

  const currentTextType = textType || selectedWritingType;

  return (
    <div ref={containerRef} className="writing-area-container h-full flex flex-col p-0 m-0">
      {/* Writing Template Section with Scrolling - Takes remaining space but allows submit button to be visible */}
      {currentTextType && (
        <div className="writing-template-section flex-1 overflow-y-auto min-h-0">
          {renderWritingTemplate()}
        </div>
      )}

      {/* NSW Analysis Tools Section - Add this before the status section */}
      {(textType || selectedWritingType) && content && content.trim().length > 50 && (
        <div className="nsw-analysis-tools">
          <h3>NSW Selective Writing Analysis</h3>
          
          {/* Tab Navigation */}
          <div className="tab-buttons">
            <button 
              onClick={() => setActiveTab('textType')}
              className={activeTab === 'textType' ? 'active' : ''}
            >
              Text Type Analysis
            </button>
            <button 
              onClick={() => setActiveTab('vocabulary')}
              className={activeTab === 'vocabulary' ? 'active' : ''}
            >
              Vocabulary Analysis
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className={activeTab === 'progress' ? 'active' : ''}
            >
              Progress Tracking
            </button>
            <button 
              onClick={() => setActiveTab('coaching')}
              className={activeTab === 'coaching' ? 'active' : ''}
            >
              Coaching Tips
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'textType' && (
              <TextTypeAnalysisComponent 
                content={content} 
                textType={textType || selectedWritingType} 
              />
            )}
            
            {activeTab === 'vocabulary' && (
              <VocabularySophisticationComponent 
                content={content} 
              />
            )}
            
            {activeTab === 'progress' && state.user && (
              <ProgressTrackingComponent 
                userId={state.user.id} 
                assessmentData={{
                  totalScore: 0, // Replace with actual assessment score
                  overallBand: 1, // Replace with actual band level
                  criteriaFeedback: {} // Replace with actual criteria feedback
                }} 
              />
            )}
            
            {activeTab === 'coaching' && (
              <CoachingTipsComponent 
                content={content}
                textType={textType || selectedWritingType}
                currentScore={0} // Replace with actual current score
                focusArea="vocabulary" // Can be dynamic: "vocabulary", "structure", "grammar", etc.
              />
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
