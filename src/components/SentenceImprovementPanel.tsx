import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, ArrowRight, RefreshCcw, Loader, AlertCircle } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface SentenceImprovementPanelProps {
  content: string;
  textType: string;
  onApplyImprovement?: (original: string, improved: string) => void;
  className?: string;
}

interface SentenceExample {
  original: string;
  improved: string;
  explanation: string;
  type: 'clarity' | 'conciseness' | 'vocabulary' | 'structure';
  isContextual: boolean;
}

// Fallback examples for when content is too short or AI is unavailable
const FALLBACK_EXAMPLES: SentenceExample[] = [
  {
    original: 'The student wrote a good essay.',
    improved: 'The diligent student crafted a compelling essay.',
    explanation: 'Replaced \'good\' with \'compelling\' and added \'diligent\' to describe the student, enhancing vocabulary and impact.',
    type: 'vocabulary',
    isContextual: false,
  },
  {
    original: 'Because of the fact that it was raining, we stayed inside.',
    improved: 'As it was raining, we stayed inside.',
    explanation: 'Simplified the phrase \'Because of the fact that\' to \'As\', making the sentence more concise.',
    type: 'conciseness',
    isContextual: false,
  },
  {
    original: 'He was very sad when his pet died.',
    improved: 'A profound sorrow enveloped him upon the demise of his beloved pet.',
    explanation: 'Used more sophisticated vocabulary (profound sorrow, enveloped, demise) and a more formal structure.',
    type: 'vocabulary',
    isContextual: false,
  },
];

export const SentenceImprovementPanel: React.FC<SentenceImprovementPanelProps> = ({
  content,
  textType,
  onApplyImprovement,
  className = ""
}) => {
  const [examples, setExamples] = useState<SentenceExample[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Analyze content and generate contextual suggestions
  const analyzeContentForSuggestions = async (text: string) => {
    if (!text || text.trim().length < 50) {
      // Content too short, use fallback examples
      setExamples(FALLBACK_EXAMPLES);
      return;
    }

    if (text === lastAnalyzedContent) {
      // Already analyzed this content
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `Analyze this ${textType} writing and identify 3 specific sentences that could be improved. For each sentence, provide:
1. The exact original sentence from the text
2. An improved version with better vocabulary, structure, or clarity
3. A brief explanation of the improvement

Text to analyze:
"${text}"

Format your response as JSON:
{
  "suggestions": [
    {
      "original": "exact sentence from text",
      "improved": "enhanced version",
      "explanation": "why this is better",
      "type": "vocabulary|structure|clarity|conciseness"
    }
  ]
}

Focus on sentences that would benefit from:
- More sophisticated vocabulary
- Better sentence structure
- Clearer expression
- More engaging language`;

      const response = await generateChatResponse({
        userMessage: prompt,
        textType: textType,
        currentContent: text,
        wordCount: text.split(' ').filter(w => w.length > 0).length,
        context: JSON.stringify({ type: 'sentence_analysis' })
      });

      try {
        const parsed = JSON.parse(response);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          const contextualExamples: SentenceExample[] = parsed.suggestions.map((suggestion: any, index: number) => ({
            original: suggestion.original || `Sentence ${index + 1}`,
            improved: suggestion.improved || 'Improved version',
            explanation: suggestion.explanation || 'Enhancement explanation',
            type: suggestion.type || 'vocabulary',
            isContextual: true
          }));

          setExamples(contextualExamples.length > 0 ? contextualExamples : FALLBACK_EXAMPLES);
          setLastAnalyzedContent(text);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Try to extract suggestions from unstructured response
        const contextualExamples = extractSuggestionsFromText(response, text);
        setExamples(contextualExamples.length > 0 ? contextualExamples : FALLBACK_EXAMPLES);
        setLastAnalyzedContent(text);
      }

    } catch (error) {
      console.error('Error analyzing content:', error);
      setError('Unable to analyze your writing right now. Showing general examples.');
      setExamples(FALLBACK_EXAMPLES);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Extract suggestions from unstructured AI response
  const extractSuggestionsFromText = (response: string, originalText: string): SentenceExample[] => {
    const examples: SentenceExample[] = [];
    
    // Look for patterns like "Original:" and "Improved:" in the response
    const lines = response.split('\n');
    let currentExample: Partial<SentenceExample> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('original:')) {
        if (currentExample.original && currentExample.improved) {
          examples.push({
            original: currentExample.original,
            improved: currentExample.improved,
            explanation: currentExample.explanation || 'AI-suggested improvement',
            type: 'vocabulary',
            isContextual: true
          });
        }
        currentExample = {};
        currentExample.original = trimmed.replace(/original:/i, '').replace(/["""]/g, '').trim();
      } else if (trimmed.toLowerCase().includes('improved:')) {
        currentExample.improved = trimmed.replace(/improved:/i, '').replace(/["""]/g, '').trim();
      } else if (trimmed.toLowerCase().includes('explanation:')) {
        currentExample.explanation = trimmed.replace(/explanation:/i, '').trim();
      }
    }
    
    // Add the last example if complete
    if (currentExample.original && currentExample.improved) {
      examples.push({
        original: currentExample.original,
        improved: currentExample.improved,
        explanation: currentExample.explanation || 'AI-suggested improvement',
        type: 'vocabulary',
        isContextual: true
      });
    }
    
    return examples;
  };

  // Trigger analysis when content changes significantly
  useEffect(() => {
    const wordCount = content.split(' ').filter(w => w.length > 0).length;
    
    if (wordCount >= 50 && content !== lastAnalyzedContent) {
      // Debounce the analysis
      const timeoutId = setTimeout(() => {
        analyzeContentForSuggestions(content);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    } else if (wordCount < 50) {
      setExamples(FALLBACK_EXAMPLES);
    }
  }, [content, textType]);

  // Initialize with fallback examples
  useEffect(() => {
    setExamples(FALLBACK_EXAMPLES);
  }, []);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800 text-xl">
              Sentence Improvement Lab
            </h3>
          </div>
          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-sm text-orange-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Analyzing your writing...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        )}

        <p className="text-gray-700 text-sm">
          {examples.length > 0 && examples[0].isContextual 
            ? "Here are specific sentences from your writing that could be enhanced:"
            : "See how you can transform simple sentences into more impactful and sophisticated ones."
          }
          {content.split(' ').filter(w => w.length > 0).length < 50 && (
            <span className="text-orange-600 ml-2">
              (Write more to get personalized suggestions!)
            </span>
          )}
        </p>

        {examples.map((example, index) => (
          <div key={index} className={`border rounded-lg p-3 ${
            example.isContextual ? 'bg-green-50 border-green-200' : 'bg-gray-50'
          }`}>
            {example.isContextual && (
              <div className="mb-2 flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">From your writing</span>
              </div>
            )}
            
            <div className="mb-2">
              <p className="font-medium text-gray-700 text-sm">Original:</p>
              <p className="text-red-600 italic text-sm">"{example.original}"</p>
            </div>
            
            <div className="mb-2 flex items-center space-x-2">
              <p className="font-medium text-gray-700 text-sm">Improved:</p>
              <ArrowRight className="h-4 w-4 text-green-600" />
              <p className="text-green-600 italic text-sm">"{example.improved}"</p>
            </div>
            
            <div className="mb-2">
              <p className="font-medium text-gray-700 text-sm">Explanation:</p>
              <p className="text-gray-600 text-xs">{example.explanation}</p>
            </div>
            
            {onApplyImprovement && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onApplyImprovement(example.original, example.improved)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Apply Suggestion</span>
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Lightbulb className="flex-shrink-0 h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Pro Tip:</strong> {examples.length > 0 && examples[0].isContextual 
                ? "These suggestions are based on your actual writing. Keep writing to get more personalized feedback!"
                : "Write at least 50 words to get personalized suggestions based on your actual content!"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceImprovementPanel;