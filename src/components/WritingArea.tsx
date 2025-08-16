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
import './writing-area-fix.css';
// NEW IMPORTS: NSW Analysis Components
import { TextTypeAnalysisComponent } from './TextTypeAnalysisComponent';
import { VocabularySophisticationComponent } from './VocabularySophisticationComponent';
import { ProgressTrackingComponent } from './ProgressTrackingComponent';
import { CoachingTipsComponent } from './CoachingTipsComponent';
import './responsive.css';
import './layout-fix.css';
import './full-width-fix.css';
// A) Add PlanningToolModal
import { PlanningToolModal } from './PlanningToolModal';

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

  // NEW STATE VARIABLE: NSW Analysis Tab Management
  const [activeTab, setActiveTab] = useState('textType');

  // B) Planning phase state variables
  const [showPlanningPhase, setShowPlanningPhase] = useState(false);
  const [planningData, setPlanningData] = useState<any>(null);
  const [planningCompleted, setPlanningCompleted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spelling and grammar patterns for issue detection
  const spellingPatterns = [
    { pattern: /\bteh\b/gi, suggestion: 'the' },
    { pattern: /\brecieve\b/gi, suggestion: 'receive' },
    { pattern: /\boccured\b/gi, suggestion: 'occurred' },
    { pattern: /\bseperate\b/gi, suggestion: 'separate' },
    { pattern: /\bdefinately\b/gi, suggestion: 'definitely' },
  ];

  const grammarPatterns = [
    { pattern: /\bi\b/g, suggestion: 'I' },
    { pattern: /\bits\s+a\s+/gi, suggestion: "it's a " },
    { pattern: /\byour\s+welcome\b/gi, suggestion: "you're welcome" },
  ];

  // Word count calculation
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Function to render highlighted text with issues
  const renderHighlightedText = useCallback(() => {
    if (!showHighlights || issues.length === 0) {
      return content;
    }

    let highlightedContent = content;
    let offset = 0;

    issues.forEach((issue) => {
      const start = issue.start + offset;
      const end = issue.end + offset;
      const originalText = highlightedContent.slice(start, end);
      
      const highlightClass = `highlight-${issue.type}`;
      const highlightedText = `<span class="${highlightClass}" data-issue="${JSON.stringify(issue).replace(/"/g, '&quot;')}">${originalText}</span>`;
      
      highlightedContent = highlightedContent.slice(0, start) + highlightedText + highlightedContent.slice(end);
      offset += highlightedText.length - originalText.length;
    });

    return highlightedContent;
  }, [content, issues, showHighlights]);

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

  // Auto-save functionality
  const handleAutoSave = async (content: string) => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('writingContent', content);
      localStorage.setItem('lastSaved', new Date().toISOString());
      setLastSaved(new Date());
      
      // Save to database if user is logged in
      if (state.user) {
        await dbOperations.saveWriting({
          content,
          textType: textType || selectedWritingType,
          userId: state.user.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load suggestions for an issue
  const loadSuggestions = async (issue: WritingIssue) => {
    setIsLoadingSuggestions(true);
    try {
      const text = content.slice(issue.start, issue.end);
      const suggestions = await getSynonyms(text);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([issue.suggestion]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Apply suggestion
  const handleApplySuggestion = (suggestion: string) => {
    if (!selectedIssue) return;
    
    const newContent = content.slice(0, selectedIssue.start) + 
                      suggestion + 
                      content.slice(selectedIssue.end);
    onChange(newContent);
    setSelectedIssue(null);
    setSuggestions([]);
  };

  // Handle paraphrase
  const handleParaphrase = async () => {
    if (!selectedIssue) return;
    
    setIsLoadingSuggestions(true);
    try {
      const text = content.slice(selectedIssue.start, selectedIssue.end);
      const paraphrased = await rephraseSentence(text);
      setSuggestions([paraphrased]);
    } catch (error) {
      console.error('Paraphrase failed:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle thesaurus
  const handleThesaurus = async () => {
    if (!selectedIssue) return;
    
    setIsLoadingSuggestions(true);
    try {
      const text = content.slice(selectedIssue.start, selectedIssue.end);
      const synonyms = await getSynonyms(text);
      setSuggestions(synonyms);
    } catch (error) {
      console.error('Thesaurus failed:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Writing type selection handlers
  const handleWritingTypeSelect = (type: string) => {
    setSelectedWritingType(type);
    setShowWritingTypeModal(false);
    setShowPromptOptionsModal(true);
    if (onTextTypeChange) {
      onTextTypeChange(type);
    }
  };

  // Prompt generation handlers
  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    try {
      const generatedPrompt = await generatePrompt(selectedWritingType);
      setPrompt(generatedPrompt);
      if (onPromptGenerated) {
        onPromptGenerated(generatedPrompt);
      }
      setShowPromptOptionsModal(false);
      setPopupFlowCompleted(true);
      if (onPopupCompleted) {
        onPopupCompleted();
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomPromptOption = () => {
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  const handleCustomPromptSubmit = (customPrompt: string) => {
    setPrompt(customPrompt);
    if (onPromptGenerated) {
      onPromptGenerated(customPrompt);
    }
    setShowCustomPromptModal(false);
    setPopupFlowCompleted(true);
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  // Evaluation handlers
  const handleEvaluationSubmit = () => {
    if (content.trim()) {
      setShowEvaluationModal(true);
    }
  };

  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
  };

  // Initialize popup flow
  useEffect(() => {
    if (!textType && !popupFlowCompleted) {
      setShowWritingTypeModal(true);
    }
  }, [textType, popupFlowCompleted]);

  // C) Planning phase handlers
  const handleShowPlanning = () => {
    setShowPlanningPhase(true);
  };

  const handleSavePlan = (plan: any) => {
    setPlanningData(plan);
    setPlanningCompleted(true);
    setShowPlanningPhase(false);

    // Save to localStorage
    const currentTextType = textType || selectedWritingType;
    if (currentTextType) {
      localStorage.setItem(`${currentTextType}_planning_data`, JSON.stringify(plan));
    }
  };

  return (
    <div className="writing-area" ref={containerRef}>
      {/* Modals */}
      {showWritingTypeModal && (
        <WritingTypeSelectionModal
          onSelect={handleWritingTypeSelect}
          onClose={() => setShowWritingTypeModal(false)}
        />
      )}

      {showPromptOptionsModal && (
        <PromptOptionsModal
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPromptOption}
          onClose={() => setShowPromptOptionsModal(false)}
          isGenerating={isGenerating}
        />
      )}

      {showCustomPromptModal && (
        <CustomPromptModal
          onSubmit={handleCustomPromptSubmit}
          onClose={() => setShowCustomPromptModal(false)}
        />
      )}

      {showEvaluationModal && (
        <EssayEvaluationModal
          content={content}
          textType={textType || selectedWritingType}
          onClose={handleCloseEvaluationModal}
        />
      )}

      {/* D) Planning Tool Modal */}
      {showPlanningPhase && (
        <PlanningToolModal
          isOpen={showPlanningPhase}
          onClose={() => setShowPlanningPhase(false)}
          onSavePlan={handleSavePlan}
          textType={textType || selectedWritingType}
        />
      )}

      {/* Inline suggestion popup */}
      {selectedIssue && (
        <InlineSuggestionPopup
          issue={selectedIssue}
          position={popupPosition}
          suggestions={suggestions}
          isLoading={isLoadingSuggestions}
          onApplySuggestion={handleApplySuggestion}
          onParaphrase={handleParaphrase}
          onThesaurus={handleThesaurus}
          onClose={() => {
            setSelectedIssue(null);
            setSuggestions([]);
          }}
        />
      )}

      {/* Main writing area */}
      <div className="writing-container">
        <div className="writing-input-container">
          <div className="highlight-layer" ref={highlightLayerRef}>
            <div dangerouslySetInnerHTML={{ __html: renderHighlightedText() }} />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onClick={handleTextareaClick}
            placeholder={prompt || "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."}
            className="writing-textarea"
            spellCheck={false}
          />
        </div>

        {/* E) Add onShowPlanning */}
        <WritingStatusBar
          wordCount={wordCount}
          lastSaved={lastSaved}
          isSaving={isSaving}
          showHighlights={showHighlights}
          onToggleHighlights={() => setShowHighlights(!showHighlights)}
          onEvaluate={handleEvaluationSubmit}
          onShowPlanning={handleShowPlanning}
          content={content}
          textType={textType}
        />
      </div>

      {/* NSW Analysis Tabs */}
      <div className="nsw-analysis-section">
        <div className="nsw-tab-navigation">
          <button
            className={`nsw-tab-button ${activeTab === 'textType' ? 'active' : ''}`}
            onClick={() => setActiveTab('textType')}
          >
            Text Type Analysis
          </button>
          <button
            className={`nsw-tab-button ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            Vocabulary Sophistication
          </button>
          <button
            className={`nsw-tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress Tracking
          </button>
          <button
            className={`nsw-tab-button ${activeTab === 'coaching' ? 'active' : ''}`}
            onClick={() => setActiveTab('coaching')}
          >
            Coaching Tips
          </button>
        </div>
        <div className="nsw-tab-content">
          {activeTab === 'textType' && <TextTypeAnalysisComponent content={content} />}
          {activeTab === 'vocabulary' && <VocabularySophisticationComponent content={content} />}
          {activeTab === 'progress' && <ProgressTrackingComponent userId={state.user?.id} />}
          {activeTab === 'coaching' && <CoachingTipsComponent content={content} />}
        </div>
      </div>

      <div className="writing-actions">
        <button onClick={onSubmit} className="submit-button" disabled={!content.trim()}>
          <Send size={20} /> Submit Writing
        </button>
      </div>
    </div>
  );
}