import React, { useState, useEffect, useRef, useCallback } from 'react';
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
// NSW Analysis Components
import { TextTypeAnalysisComponent } from './TextTypeAnalysisComponent';
import { VocabularySophisticationComponent } from './VocabularySophisticationComponent';
import { ProgressTrackingComponent } from './ProgressTrackingComponent';
import { CoachingTipsComponent } from './CoachingTipsComponent';
import './responsive.css';
import './layout-fix.css';
import './full-width-fix.css';
// Planning Tool Modal
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

  // Modal states for popup management
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false);

  // NSW Analysis Tab Management
  const [activeTab, setActiveTab] = useState('textType');

  // Planning phase state variables
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

  // CRITICAL: Initialize popup flow when component mounts
  useEffect(() => {
    console.log('🔄 WritingArea: Component mounted, checking for prompt...');
    
    // Check for generated prompt from Dashboard
    const generatedPrompt = localStorage.getItem('generatedPrompt');
    const narrativePrompt = localStorage.getItem('narrative_prompt');
    const persuasivePrompt = localStorage.getItem('persuasive_prompt');
    const expositoryPrompt = localStorage.getItem('expository_prompt');
    const reflectivePrompt = localStorage.getItem('reflective_prompt');
    const descriptivePrompt = localStorage.getItem('descriptive_prompt');
    const recountPrompt = localStorage.getItem('recount_prompt');
    
    // Check for selected writing type
    const savedWritingType = localStorage.getItem('selectedWritingType');
    
    if (savedWritingType) {
      console.log('✅ WritingArea: Found saved writing type:', savedWritingType);
      setSelectedWritingType(savedWritingType);
    }
    
    // Set prompt from various sources
    let foundPrompt = '';
    if (generatedPrompt) {
      foundPrompt = generatedPrompt;
      console.log('✅ WritingArea: Found generated prompt');
    } else if (savedWritingType) {
      // Check for type-specific prompt
      const typePrompts = {
        narrative: narrativePrompt,
        persuasive: persuasivePrompt,
        expository: expositoryPrompt,
        reflective: reflectivePrompt,
        descriptive: descriptivePrompt,
        recount: recountPrompt
      };
      
      foundPrompt = typePrompts[savedWritingType as keyof typeof typePrompts] || '';
      if (foundPrompt) {
        console.log('✅ WritingArea: Found type-specific prompt for:', savedWritingType);
      }
    }
    
    if (foundPrompt) {
      setPrompt(foundPrompt);
      setPopupFlowCompleted(true);
      console.log('✅ WritingArea: Prompt set successfully');
      
      if (onPromptGenerated) {
        onPromptGenerated(foundPrompt);
      }
    } else {
      console.log('⚠️ WritingArea: No prompt found, will show selection modal');
      // Initialize popup flow when component mounts if no prompt exists
      const timer = setTimeout(() => {
        if (!popupFlowCompleted && !prompt) {
          console.log('🔄 WritingArea: Starting popup flow...');
          setShowWritingTypeModal(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Load saved content
    const savedContent = localStorage.getItem('writingContent');
    if (savedContent && savedContent !== content) {
      onChange(savedContent);
    }
    
    // Load saved planning data
    const savedPlanningData = localStorage.getItem('planningData');
    if (savedPlanningData) {
      try {
        setPlanningData(JSON.parse(savedPlanningData));
        setPlanningCompleted(true);
      } catch (error) {
        console.error('Error loading planning data:', error);
      }
    }
  }, []);

  // Function to render highlighted text with issues
  const renderHighlightedText = useCallback(() => {
    if (!showHighlights || issues.length === 0) {
      return content;
    }

    let highlightedContent = content;
    const sortedIssues = [...issues].sort((a, b) => b.start - a.start);

    sortedIssues.forEach((issue) => {
      const before = highlightedContent.slice(0, issue.start);
      const highlighted = highlightedContent.slice(issue.start, issue.end);
      const after = highlightedContent.slice(issue.end);
      
      const className = `highlight-${issue.type}`;
      highlightedContent = before + `<span class="${className}" data-issue="${issue.type}">${highlighted}</span>` + after;
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
          suggestion
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
          suggestion
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

  // Auto-save functionality
  useEffect(() => {
    if (!content.trim()) return;

    const saveTimer = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [content]);

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightLayerRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle textarea clicks for issue selection
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    // Find issue at click position
    const clickedIssue = issues.find(issue => 
      clickPosition >= issue.start && clickPosition <= issue.end
    );

    if (clickedIssue) {
      setSelectedIssue(clickedIssue);
      
      // Calculate popup position
      const rect = textarea.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + (clickPosition * 8), // Approximate character width
        y: rect.top - 10
      });
      
      loadSuggestions(clickedIssue);
    } else {
      setSelectedIssue(null);
      setSuggestions([]);
    }
  };

  // Auto-save function
  const autoSave = async () => {
    if (isSaving) return;
    
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
    console.log('📝 WritingArea: Writing type selected:', type);
    setSelectedWritingType(type);
    localStorage.setItem('selectedWritingType', type);
    setShowWritingTypeModal(false);
    setShowPromptOptionsModal(true);
    if (onTextTypeChange) {
      onTextTypeChange(type);
    }
  };

  // Prompt generation handlers
  const handleGeneratePrompt = async () => {
    console.log('🎯 WritingArea: Generating prompt for:', selectedWritingType);
    setIsGenerating(true);
    try {
      const generatedPrompt = await generatePrompt(selectedWritingType);
      setPrompt(generatedPrompt);
      localStorage.setItem('generatedPrompt', generatedPrompt);
      localStorage.setItem(`${selectedWritingType}_prompt`, generatedPrompt);
      
      if (onPromptGenerated) {
        onPromptGenerated(generatedPrompt);
      }
      
      setShowPromptOptionsModal(false);
      setPopupFlowCompleted(true);
      
      if (onPopupCompleted) {
        onPopupCompleted();
      }
      
      console.log('✅ WritingArea: Prompt generated and saved');
    } catch (error) {
      console.error('❌ WritingArea: Error generating prompt:', error);
      // Use fallback prompt
      const fallbackPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey.",
        persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence and logical reasoning.",
        expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations and relevant examples.",
        reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it.",
        descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader.",
        recount: "Write about an important event or experience in your life, telling what happened in the order it occurred."
      };
      
      const fallbackPrompt = fallbackPrompts[selectedWritingType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;
      setPrompt(fallbackPrompt);
      localStorage.setItem('generatedPrompt', fallbackPrompt);
      localStorage.setItem(`${selectedWritingType}_prompt`, fallbackPrompt);
      
      setShowPromptOptionsModal(false);
      setPopupFlowCompleted(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomPrompt = () => {
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  const handleCustomPromptSubmit = (customPrompt: string) => {
    setPrompt(customPrompt);
    localStorage.setItem('generatedPrompt', customPrompt);
    localStorage.setItem(`${selectedWritingType}_prompt`, customPrompt);
    
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
  const handleEvaluationSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      const evaluation = await evaluateEssay(content, textType || selectedWritingType);
      setShowEvaluationModal(true);
    } catch (error) {
      console.error('Evaluation failed:', error);
    }
  };

  // Planning handlers
  const handleShowPlanning = () => {
    setShowPlanningPhase(true);
  };

  const handleSavePlan = (planData: any) => {
    setPlanningData(planData);
    setPlanningCompleted(true);
    localStorage.setItem('planningData', JSON.stringify(planData));
    setShowPlanningPhase(false);
  };

  return (
    <div className="writing-area-container" ref={containerRef}>
      {/* Writing Type Selection Modal */}
      {showWritingTypeModal && (
        <WritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={() => setShowWritingTypeModal(false)}
          onSelect={handleWritingTypeSelect}
        />
      )}

      {/* Prompt Options Modal */}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPrompt}
          isGenerating={isGenerating}
          writingType={selectedWritingType}
        />
      )}

      {/* Custom Prompt Modal */}
      {showCustomPromptModal && (
        <CustomPromptModal
          isOpen={showCustomPromptModal}
          onClose={() => setShowCustomPromptModal(false)}
          onSubmit={handleCustomPromptSubmit}
          writingType={selectedWritingType}
        />
      )}

      {/* Essay Evaluation Modal */}
      {showEvaluationModal && (
        <EssayEvaluationModal
          isOpen={showEvaluationModal}
          onClose={() => setShowEvaluationModal(false)}
          content={content}
          textType={textType || selectedWritingType}
        />
      )}

      {/* Planning Tool Modal */}
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
        {/* CRITICAL: Prompt Display */}
        {prompt && (
          <div className="prompt-display bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="prompt-header flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-800">Your Writing Prompt</span>
            </div>
            <div className="prompt-content text-gray-700 text-base leading-relaxed bg-white rounded-lg p-4 border border-blue-100">
              {prompt}
            </div>
          </div>
        )}
        
        <div className="writing-input-container">
          <div className="highlight-layer" ref={highlightLayerRef} onScroll={handleScroll}>
            <div dangerouslySetInnerHTML={{ __html: renderHighlightedText() }} />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onClick={handleTextareaClick}
            onScroll={handleScroll}
            placeholder={prompt ? "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..." : "Click here to select a writing type and get your prompt!"}
            className="writing-textarea"
            spellCheck={false}
          />
        </div>

        <WritingStatusBar
          wordCount={wordCount}
          lastSaved={lastSaved}
          isSaving={isSaving}
          showHighlights={showHighlights}
          onToggleHighlights={() => setShowHighlights(!showHighlights)}
          onEvaluate={handleEvaluationSubmit}
          onShowPlanning={handleShowPlanning}
          content={content}
          textType={textType || selectedWritingType}
        />
      </div>

      {/* NSW Analysis Tabs */}
      <div className="nsw-analysis-section bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
        <div className="nsw-tab-navigation bg-gray-50 border-b border-gray-200">
          <button
            className={`nsw-tab-button px-6 py-3 font-medium transition-colors ${activeTab === 'textType' ? 'active bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('textType')}
          >
            Text Type Analysis
          </button>
          <button
            className={`nsw-tab-button px-6 py-3 font-medium transition-colors ${activeTab === 'vocabulary' ? 'active bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            Vocabulary Sophistication
          </button>
          <button
            className={`nsw-tab-button px-6 py-3 font-medium transition-colors ${activeTab === 'progress' ? 'active bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress Tracking
          </button>
          <button
            className={`nsw-tab-button px-6 py-3 font-medium transition-colors ${activeTab === 'coaching' ? 'active bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('coaching')}
          >
            Coaching Tips
          </button>
        </div>
        <div className="nsw-tab-content p-6">
          {activeTab === 'textType' && <TextTypeAnalysisComponent content={content} />}
          {activeTab === 'vocabulary' && <VocabularySophisticationComponent content={content} />}
          {activeTab === 'progress' && <ProgressTrackingComponent userId={state.user?.id} />}
          {activeTab === 'coaching' && <CoachingTipsComponent content={content} />}
        </div>
      </div>

      <div className="writing-actions mt-6">
        <button 
          onClick={onSubmit} 
          className="submit-button bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={!content.trim()}
        >
          <Send size={20} /> Submit Writing
        </button>
      </div>
    </div>
  );
}