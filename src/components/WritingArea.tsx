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
// NEW IMPORTS: NSW Analysis Components
import { TextTypeAnalysisComponent } from './TextTypeAnalysisComponent';
import { VocabularySophisticationComponent } from './VocabularySophisticationComponent';
import { ProgressTrackingComponent } from './ProgressTrackingComponent';
import { CoachingTipsComponent }s from './CoachingTipsComponent';
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
  
  // NEW STATE VARIABLE: NSW Analysis Tab Management
  const [activeTab, setActiveTab] = useState('textType');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Common spelling mistakes
  const spellingPatterns = {
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'begining': 'beginning'
  };

  // Grammar patterns
  const grammarPatterns = {
    'i ': 'I ',
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'shouldnt': "shouldn't"
  };

  // Vocabulary enhancement patterns
  const vocabularyPatterns = {
    'good': 'excellent, outstanding, remarkable, exceptional',
    'bad': 'terrible, awful, dreadful, appalling',
    'big': 'enormous, massive, gigantic, colossal',
    'small': 'tiny, minuscule, petite, compact',
    'nice': 'pleasant, delightful, charming, wonderful',
    'said': 'declared, announced, proclaimed, stated',
    'went': 'traveled, journeyed, ventured, proceeded',
    'got': 'obtained, acquired, received, secured'
  };

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
        // Pass the loaded prompt to parent
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

  // Persist content and selectedWritingType to localStorage
  useEffect(() => {
    localStorage.setItem('writingContent', content);
  }, [content]);

  useEffect(() => {
    localStorage.setItem('selectedWritingType', selectedWritingType);
  }, [selectedWritingType]);

  const analyzeText = useCallback((text: string) => {
    const newIssues: WritingIssue[] = [];

    // Check spelling
    Object.entries(spellingPatterns).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        newIssues.push({
          start: match.index,
          end: match.index + incorrect.length,
          type: 'spelling',
          message: `This word is misspelled. The correct spelling is "${correct}".`,
          suggestion: correct
        });
      }
    });

    // Check grammar
    Object.entries(grammarPatterns).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        newIssues.push({
          start: match.index,
          end: match.index + incorrect.length,
          type: 'grammar',
          message: `This needs proper capitalization.`,
          suggestion: correct
        });
      }
    });

    // Check vocabulary
    Object.entries(vocabularyPatterns).forEach(([basic, improvements]) => {
      const regex = new RegExp(`\\b${basic}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        newIssues.push({
          start: match.index,
          end: match.index + basic.length,
          type: 'vocabulary',
          message: `Consider using a more descriptive word instead of "${basic}".`,
          suggestion: improvements.split(', ')[0] // Use first suggestion as primary
        });
      }
    });

    setIssues(newIssues);
  }, []);

  useEffect(() => {
    if (content) {
      const timeoutId = setTimeout(() => {
        analyzeText(content);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [content, analyzeText]);

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

  const handleApplySuggestion = (suggestion: string, start: number, end: number) => {
    const newContent = content.slice(0, start) + suggestion + content.slice(end);
    onChange(newContent);
    setSelectedIssue(null);
    setSuggestions([]);
  };

  const handleParaphrase = async () => {
    if (selectedIssue) {
      setIsLoadingSuggestions(true);
      try {
        const text = content.slice(selectedIssue.start, selectedIssue.end);
        const alternatives = await rephraseSentence(text);
        setSuggestions(alternatives.split(',').map(s => s.trim()));
      } catch (error) {
        console.error('Error getting alternatives:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
  };

  const handleThesaurus = async () => {
    if (selectedIssue) {
      setIsLoadingSuggestions(true);
      try {
        const word = content.slice(selectedIssue.start, selectedIssue.end).toLowerCase();
        const synonyms = await getSynonyms(word);
        setSuggestions(synonyms);
      } catch (error) {
        console.error('Error getting synonyms:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
  };

  const renderHighlightedText = () => {
    if (!showHighlights || !content) return null;

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    // Sort issues by start position
    const sortedIssues = [...issues].sort((a, b) => a.start - b.start);

    sortedIssues.forEach((issue, index) => {
      // Add text before the issue
      if (issue.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, issue.start)}
          </span>
        );
      }

      // Add the highlighted issue
      const issueText = content.slice(issue.start, issue.end);
      elements.push(
        <span
          key={`issue-${index}`}
          className={`writing-highlight writing-highlight-${issue.type}`}
          data-issue-type={issue.type}
          data-message={issue.message}
          data-suggestion={issue.suggestion}
        >
          {issueText}
        </span>
      );

      lastIndex = issue.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return elements;
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
      setPrompt(newPrompt);
      
      // Save prompt to localStorage using the current text type
      if (currentTextType) {
        localStorage.setItem(`${currentTextType}_prompt`, newPrompt);
      }
      
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
    setShowCustomPromptModal(true);
  };

  // Handle custom prompt submission
  const handleCustomPromptSubmit = (customPrompt: string) => {
    setPrompt(customPrompt);
    
    // Use the current text type (either from props or local state)
    const currentTextType = textType || selectedWritingType;
    
    // Save prompt to localStorage using the current text type
    if (currentTextType) {
      localStorage.setItem(`${currentTextType}_prompt`, customPrompt);
    }
    setIsGenerating(false);
    setShowCustomPromptModal(false);
    setPopupFlowCompleted(true);
    if (onPopupCompleted) {
      onPopupCompleted();
    }
  };

  const handleEvaluationSubmit = () => {
    setShowEvaluationModal(true);
  };

  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
  };

  const wordCount = countWords(content);

  const renderWritingTemplate = () => {
    switch (textType || selectedWritingType) {
      case 'narrative':
        return <NarrativeWritingTemplateRedesigned />;
      case 'persuasive':
        return <PersuasiveWritingTemplate />;
      case 'expository':
        return <ExpositoryWritingTemplate />;
      case 'reflective':
        return <ReflectiveWritingTemplate />;
      case 'descriptive':
        return <DescriptiveWritingTemplate />;
      case 'recount':
        return <RecountWritingTemplate />;
      case 'discursive':
        return <DiscursiveWritingTemplate />;
      case 'news_report':
        return <NewsReportWritingTemplate />;
      case 'letter':
        return <LetterWritingTemplate />;
      case 'diary':
        return <DiaryWritingTemplate />;
      case 'speech':
        return <SpeechWritingTemplate />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="writing-area-container">
      <div className="writing-content-section">
        <div className="writing-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="writing-textarea"
            value={content}
            onChange={handleTextareaChange}
            onClick={handleTextareaClick}
            placeholder={isGenerating ? "Generating prompt..." : prompt || "Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."}
            disabled={isGenerating}
          />
          <div
            ref={highlightLayerRef}
            className="highlight-layer"
            dangerouslySetInnerHTML={{ __html: renderHighlightedText() as string }}
          />
        </div>
      </div>

      <WritingStatusBar
        wordCount={wordCount}
        characterCount={content.length}
        lastSaved={lastSaved}
        onSave={saveContent}
        isSaving={isSaving}
        onSubmit={handleEvaluationSubmit}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {selectedIssue && (
        <InlineSuggestionPopup
          issue={selectedIssue}
          position={popupPosition}
          onClose={() => setSelectedIssue(null)}
          onApply={handleApplySuggestion}
          onParaphrase={handleParaphrase}
          onThesaurus={handleThesaurus}
          isLoadingSuggestions={isLoadingSuggestions}
          suggestions={suggestions}
        />
      )}

      {showWritingTypeModal && (
        <WritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={() => setShowWritingTypeModal(false)}
          onSelectType={handleWritingTypeSelect}
        />
      )}

      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPromptOption}
        />
      )}

      {showCustomPromptModal && (
        <CustomPromptModal
          isOpen={showCustomPromptModal}
          onClose={() => setShowCustomPromptModal(false)}
          onSubmit={handleCustomPromptSubmit}
        />
      )}

      {showEvaluationModal && (
        <EssayEvaluationModal
          isOpen={showEvaluationModal}
          onClose={handleCloseEvaluationModal}
          essayContent={content}
          textType={textType || selectedWritingType}
        />
      )}

      {renderWritingTemplate()}

      {activeTab === 'textType' && <TextTypeAnalysisComponent content={content} />}
      {activeTab === 'vocabulary' && <VocabularySophisticationComponent content={content} />}
      {activeTab === 'progress' && <ProgressTrackingComponent content={content} />}
      {activeTab === 'coaching' && <CoachingTipsComponent content={content} />}
    </div>
  );
}
