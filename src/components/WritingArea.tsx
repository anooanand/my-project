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
  
  // NEW STATE VARIABLE: NSW Analysis Tab Management
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
    
    // Common spelling mistakes (only incorrect spellings)
    const spellingPatterns = {
      'softley': 'softly',
      'recieve': 'receive',
      'seperate': 'separate',
      'occured': 'occurred',
      'accomodate': 'accommodate',
      'alot': 'a lot',
      'cant': "can't",
      'dont': "don't",
      'wont': "won't",
      'im': "I'm",
      'ive': "I've",
      'id': "I'd",
      'youre': "you're",
      'theyre': "they're"
    };

    // Grammar patterns (only incorrect grammar)
    const grammarPatterns = {
      'i am': 'I am',
      'i have': 'I have',
      'i will': 'I will',
      'i was': 'I was'
    };

    // Vocabulary improvements with multiple suggestions
    const vocabularyPatterns = {
      'good': 'excellent, outstanding, remarkable',
      'bad': 'poor, inadequate, unsatisfactory',
      'said': 'exclaimed, declared, announced',
      'nice': 'pleasant, delightful, charming',
      'big': 'enormous, massive, substantial',
      'small': 'tiny, minute, compact',
      'happy': 'joyful, delighted, cheerful',
      'sad': 'unhappy, gloomy, melancholy',
      'walk': 'stroll, amble, wander',
      'run': 'dash, sprint, race',
      'look': 'gaze, stare, observe',
      'went': 'traveled, journeyed, ventured',
      'saw': 'noticed, observed, spotted',
      'got': 'received, obtained, acquired',
      'make': 'create, produce, construct',
      'think': 'believe, consider, ponder',
      'started': 'began, commenced, initiated'
    };

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
    <div className="writing-area-container" ref={containerRef}>
      <div className="writing-prompt-section">
        <div className="writing-prompt-header">
          <Sparkles className="writing-prompt-icon" />
          <h3>Your Writing Prompt</h3>
        </div>
        <div className="writing-prompt-content">
          {prompt ? (
            <p>{prompt}</p>
          ) : (
            <p>Select a writing type to generate a prompt, or enter your own.</p>
          )}
          {isGenerating && <p>Generating prompt...</p>}
        </div>
      </div>

      <div className="writing-controls">
        <button className="control-button new-button" onClick={() => setShowWritingTypeModal(true)}>
          + New
        </button>
        <button className="control-button save-button" onClick={saveContent} disabled={isSaving}>
          Save {isSaving && '...'}
        </button>
        <button className="control-button export-button">Export</button>
        <button className="control-button help-button">Help</button>
      </div>

      <div className="writing-content-section">
        <div className="writing-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="writing-textarea"
            value={content}
            onChange={handleTextareaChange}
            onClick={handleTextareaClick}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨"
          />
          {showHighlights && (
            <div className="highlight-layer" ref={highlightLayerRef}>
              {renderHighlightedText()}
            </div>
          )}
        </div>
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
      </div>

      <WritingStatusBar
        wordCount={wordCount}
        characterCount={content.length}
        lastSaved={lastSaved}
        onShowPlanning={() => { /* Implement show planning logic */ }}
        onToggleHighlights={() => setShowHighlights(!showHighlights)}
      />

      <div className="nsw-analysis-section">
        <div className="nsw-analysis-tabs">
          <button
            className={`nsw-analysis-tab ${activeTab === 'textType' ? 'active' : ''}`}
            onClick={() => setActiveTab('textType')}
          >
            Text Type Analysis
          </button>
          <button
            className={`nsw-analysis-tab ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setActiveTab('vocabulary')}
          >
            Vocabulary Sophistication
          </button>
          <button
            className={`nsw-analysis-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress Tracking
          </button>
          <button
            className={`nsw-analysis-tab ${activeTab === 'coaching' ? 'active' : ''}`}
            onClick={() => setActiveTab('coaching')}
          >
            Coaching Tips
          </button>
        </div>
        <div className="nsw-analysis-content">
          {activeTab === 'textType' && <TextTypeAnalysisComponent content={content} textType={textType || selectedWritingType} />}
          {activeTab === 'vocabulary' && <VocabularySophisticationComponent content={content} textType={textType || selectedWritingType} />}
          {activeTab === 'progress' && <ProgressTrackingComponent content={content} textType={textType || selectedWritingType} />}
          {activeTab === 'coaching' && <CoachingTipsComponent content={content} textType={textType || selectedWritingType} />}
        </div>
      </div>

      <button className="submit-for-evaluation-button" onClick={handleEvaluationSubmit}>
        Submit for Evaluation {wordCount} words
      </button>

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
      />

      <CustomPromptModal
        isOpen={showCustomPromptModal}
        onClose={() => setShowCustomPromptModal(false)}
        onSubmit={handleCustomPromptSubmit}
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
