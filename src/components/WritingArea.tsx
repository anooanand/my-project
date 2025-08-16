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

  // ... (rest of existing logic like spellingPatterns, grammarPatterns, etc.)

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

  // ... (other handlers and logic)

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
            {renderHighlightedText()}
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
