// Updated InteractiveTextEditor - now uses the enhanced version with grammar and spelling checking
import React from 'react';
import { EnhancedInteractiveTextEditor } from './EnhancedInteractiveTextEditor';
import './fixed-writing-area.css';

// Types for backward compatibility
interface TextPosition {
  start: number;
  end: number;
}

interface HighlightRange extends TextPosition {
  id: string;
  type: 'grammar' | 'spelling' | 'style' | 'vocabulary' | 'strength' | 'suggestion' | 'improvement';
  message: string;
  suggestions?: string[];
  category?: string;
  severity?: 'low' | 'medium' | 'high';
  context?: string;
}

interface AIFeedbackResponse {
  feedbackItems?: Array<{
    type: 'praise' | 'suggestion' | 'improvement';
    text: string;
    exampleFromText?: string;
    suggestionForImprovement?: string;
    area?: string;
    position?: TextPosition;
  }>;
  corrections?: Array<{
    original: string;
    suggestion: string;
    explanation?: string;
    position?: TextPosition;
  }>;
  vocabularyEnhancements?: Array<{
    original: string;
    suggestion: string;
    position?: TextPosition;
  }>;
  grammarErrors?: Array<{
    start: number;
    end: number;
    message: string;
    type: string;
    suggestions: string[];
  }>;
  overallScore?: number;
  criteriaScores?: {
    ideas: number;
    structure: number;
    language: number;
    accuracy: number;
  };
}

interface InteractiveTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  textType?: string;
  onGetFeedback?: (content: string) => Promise<AIFeedbackResponse>;
  enableRealTimeHighlighting?: boolean;
  enableGrammarCheck?: boolean;
  enableVocabularyEnhancement?: boolean;
}

// Main Interactive Text Editor Component - now using the enhanced version
export const InteractiveTextEditor: React.FC<InteractiveTextEditorProps> = (props) => {
  // Pass all props to the enhanced version with additional defaults
  return (
    <EnhancedInteractiveTextEditor
      {...props}
      enableSpellingCheck={true}
      enableClientSideChecking={true}
    />
  );
};

export default InteractiveTextEditor;

// Export types for backward compatibility
export type { TextPosition, HighlightRange, AIFeedbackResponse, InteractiveTextEditorProps };
