import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Eye, EyeOff, CheckCircle, Lightbulb } from 'lucide-react';
import { InteractiveTextEditor } from './InteractiveTextEditor';
import { FeedbackChat } from './FeedbackChat';
import { detectNewParagraphs, isContentSuitableForFeedback, DetectedParagraph } from '../utils/paragraphDetection';

interface FeedbackMessage {
  id: string;
  paragraph: string;
  feedback: string;
  timestamp: Date;
  type: 'praise' | 'suggestion' | 'improvement';
  paragraphNumber: number;
}

interface EnhancedWritingAreaWithFeedbackProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  textType?: string;
  onGetFeedback?: (content: string, textType?: string) => Promise<any>;
  onNewParagraphForFeedback?: (paragraph: DetectedParagraph) => void;
}

export function EnhancedWritingAreaWithFeedback({
  content,
  onChange,
  placeholder = "Start writing your amazing story here! Let your creativity flow and bring your ideas to life... ✨",
  className = "",
  style = {},
  textType = "narrative",
  onGetFeedback,
  onNewParagraphForFeedback
}: EnhancedWritingAreaWithFeedbackProps) {
  // State for controlling writing assistance features
  const [showSettings, setShowSettings] = useState(false);
  const [enableRealTimeHighlighting, setEnableRealTimeHighlighting] = useState(true);
  const [enableGrammarCheck, setEnableGrammarCheck] = useState(true);
  const [enableVocabularyEnhancement, setEnableVocabularyEnhancement] = useState(true);
  const [enableRealTimeFeedback, setEnableRealTimeFeedback] = useState(true);
  
  // State for feedback system
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [previousContent, setPreviousContent] = useState(content);

  // Refs for tracking
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const paragraphCounterRef = useRef(0);

  // Generate AI feedback for a paragraph
  const generateParagraphFeedback = useCallback(async (paragraph: DetectedParagraph) => {
    if (!onGetFeedback || !enableRealTimeFeedback) return;

    setIsGeneratingFeedback(true);
    
    try {
      // Create age-appropriate prompt for paragraph feedback
      const prompt = `You are a friendly writing coach for children aged 8-11 preparing for NSW selective writing tests. 

Please provide encouraging, constructive feedback for this paragraph from a ${textType} text:

"${paragraph.content}"

Guidelines:
- Be positive and encouraging
- Use simple, child-friendly language
- Focus on one main point per feedback
- Suggest specific improvements
- Keep feedback to 1-2 sentences
- Choose ONE of these feedback types: praise (for something done well), suggestion (for improvement), or improvement (for specific techniques)

Respond with a JSON object containing:
{
  "feedback": "Your encouraging feedback message",
  "type": "praise" | "suggestion" | "improvement"
}`;

      const response = await onGetFeedback(prompt, textType);
      
      // Parse AI response
      let feedbackData;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\\{[^}]*\\}/);
        if (jsonMatch) {
          feedbackData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to simple text response
          feedbackData = {
            feedback: typeof response === 'string' ? response : "Great work on this paragraph! Keep writing!",
            type: 'praise'
          };
        }
      } catch (parseError) {
        feedbackData = {
          feedback: "Nice paragraph! You're doing great with your writing. Keep it up!",
          type: 'praise'
        };
      }

      // Create feedback message
      const feedbackMessage: FeedbackMessage = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        paragraph: paragraph.content,
        feedback: feedbackData.feedback,
        timestamp: new Date(),
        type: feedbackData.type || 'praise',
        paragraphNumber: paragraph.paragraphNumber
      };

      setFeedbackMessages(prev => [...prev, feedbackMessage]);
      
    } catch (error) {
      console.error('Error generating paragraph feedback:', error);
      
      // Provide fallback encouraging message
      const fallbackMessage: FeedbackMessage = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        paragraph: paragraph.content,
        feedback: "Great job writing this paragraph! You're making excellent progress. Keep up the wonderful work!",
        timestamp: new Date(),
        type: 'praise',
        paragraphNumber: paragraph.paragraphNumber
      };
      
      setFeedbackMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [onGetFeedback, textType, enableRealTimeFeedback]);

  // Handle content changes and detect new paragraphs
  const handleContentChange = useCallback((newContent: string) => {
    onChange(newContent);

    // Only process if real-time feedback is enabled
    if (!enableRealTimeFeedback) {
      setPreviousContent(newContent);
      return;
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce paragraph detection to avoid excessive API calls
    debounceTimeoutRef.current = setTimeout(() => {
      if (isContentSuitableForFeedback(newContent)) {
        const newParagraphs = detectNewParagraphs(previousContent, newContent);
        
        newParagraphs.forEach(paragraph => {
          // Trigger callback if provided
          if (onNewParagraphForFeedback) {
            onNewParagraphForFeedback(paragraph);
          }
          
          // Generate feedback for the paragraph
          generateParagraphFeedback(paragraph);
        });
      }
      
      setPreviousContent(newContent);
    }, 2000); // 2 second debounce to allow user to finish typing

  }, [onChange, previousContent, enableRealTimeFeedback, onNewParagraphForFeedback, generateParagraphFeedback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full">
      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Writing Controls Bar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-tl-lg">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-gray-700">Writing Assistant</h3>
            <div className="flex items-center space-x-3">
              {/* Grammar Check Toggle */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableGrammarCheck}
                  onChange={(e) => setEnableGrammarCheck(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Grammar Check</span>
              </label>

              {/* Vocabulary Enhancement Toggle */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableVocabularyEnhancement}
                  onChange={(e) => setEnableVocabularyEnhancement(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Vocabulary Help</span>
              </label>

              {/* Real-time Highlighting Toggle */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableRealTimeHighlighting}
                  onChange={(e) => setEnableRealTimeHighlighting(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {enableRealTimeHighlighting ? (
                  <Eye className="h-4 w-4 text-blue-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-gray-600">Live Feedback</span>
              </label>

              {/* Real-time Chat Feedback Toggle */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableRealTimeFeedback}
                  onChange={(e) => setEnableRealTimeFeedback(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Chat Feedback</span>
              </label>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Writing Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced Settings Panel (collapsible) */}
        {showSettings && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">Advanced Writing Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-blue-700 font-medium mb-1">Text Type</label>
                <p className="text-blue-600 capitalize">{textType || 'narrative'}</p>
              </div>
              <div>
                <label className="block text-blue-700 font-medium mb-1">Features Active</label>
                <div className="space-y-1">
                  {enableGrammarCheck && <div className="text-green-600">✓ Grammar Check</div>}
                  {enableVocabularyEnhancement && <div className="text-blue-600">✓ Vocabulary Help</div>}
                  {enableRealTimeHighlighting && <div className="text-purple-600">✓ Live Feedback</div>}
                  {enableRealTimeFeedback && <div className="text-orange-600">✓ Chat Feedback</div>}
                </div>
              </div>
              <div>
                <label className="block text-blue-700 font-medium mb-1">Tips</label>
                <p className="text-blue-600 text-xs">
                  Write complete paragraphs to get helpful feedback from your Writing Buddy!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Text Editor */}
        <div className="flex-1">
          <InteractiveTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className={className}
            textType={textType}
            onGetFeedback={onGetFeedback}
            enableRealTimeHighlighting={enableRealTimeHighlighting}
            enableGrammarCheck={enableGrammarCheck}
            enableVocabularyEnhancement={enableVocabularyEnhancement}
          />
        </div>
      </div>

      {/* Feedback Chat Sidebar */}
      {enableRealTimeFeedback && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <FeedbackChat 
            feedbackMessages={feedbackMessages}
            isLoading={isGeneratingFeedback}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}

