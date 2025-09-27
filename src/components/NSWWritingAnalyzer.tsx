import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Star,
  Users,
  Clock,
  FileText,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Layers,
  Compass,
  Sparkles
} from 'lucide-react';

interface NSWWritingAnalyzerProps {
  content: string;
  textType: string;
  onAnalysisUpdate?: (analysis: NSWAnalysis) => void;
  darkMode?: boolean;
}

interface NSWAnalysis {
  overallScore: number;
  narrativeStructure: {
    introduction: { present: boolean; score: number; feedback: string };
    risingAction: { present: boolean; score: number; feedback: string };
    climax: { present: boolean; score: number; feedback: string };
    resolution: { present: boolean; score: number; feedback: string };
  };
  creativeElements: {
    descriptiveLanguage: { score: number; examples: string[]; suggestions: string[] };
    characterDevelopment: { score: number; feedback: string; suggestions: string[] };
    dialogue: { present: boolean; score: number; feedback: string };
    sensoryDetails: { score: number; examples: string[]; suggestions: string[] };
  };
  vocabularyLevel: {
    appropriateForYear6: boolean;
    sophisticationScore: number;
    complexWords: string[];
    suggestions: string[];
  };
  coherenceFlow: {
    logicalFlow: { score: number; feedback: string };
    transitions: { score: number; examples: string[]; suggestions: string[] };
    paragraphStructure: { score: number; feedback: string };
  };
  nswSpecificCriteria: {
    creativityOriginality: { score: number; feedback: string };
    audienceAwareness: { score: number; feedback: string };
    textTypeConventions: { score: number; feedback: string };
  };
}

export const NSWWritingAnalyzer: React.FC<NSWWritingAnalyzerProps> = ({
  content,
  textType,
  onAnalysisUpdate,
  darkMode = false
}) => {
  const [analysis, setAnalysis] = useState<NSWAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze content for NSW-specific criteria
  const analyzeContent = useMemo(() => {
    if (!content || content.trim().length < 50) return null;

    const words = content.trim().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Narrative Structure Analysis
    const narrativeStructure = analyzeNarrativeStructure(content, paragraphs);
    
    // Creative Elements Analysis
    const creativeElements = analyzeCreativeElements(content, words, sentences);
    
    // Vocabulary Level Analysis
    const vocabularyLevel = analyzeVocabularyLevel(words);
    
    // Coherence and Flow Analysis
    const coherenceFlow = analyzeCoherenceFlow(content, paragraphs, sentences);
    
    // NSW-Specific Criteria
    const nswSpecificCriteria = analyzeNSWCriteria(content, textType);

    // Calculate overall score
    const overallScore = calculateOverallScore({
      narrativeStructure,
      creativeElements,
      vocabularyLevel,
      coherenceFlow,
      nswSpecificCriteria
    });

    return {
      overallScore,
      narrativeStructure,
      creativeElements,
      vocabularyLevel,
      coherenceFlow,
      nswSpecificCriteria
    };
  }, [content, textType]);

  useEffect(() => {
    if (analyzeContent) {
      setAnalysis(analyzeContent);
      onAnalysisUpdate?.(analyzeContent);
    }
  }, [analyzeContent, onAnalysisUpdate]);

  // Analysis functions
  function analyzeNarrativeStructure(content: string, paragraphs: string[]) {
    const hasIntroduction = paragraphs.length > 0 && paragraphs[0].length > 50;
    const hasRisingAction = paragraphs.length > 1;
    const hasClimaxIndicators = /suddenly|then|finally|at last|climax|peak|moment/i.test(content);
    const hasResolution = /end|finally|conclusion|resolved|finished/i.test(content);

    return {
      introduction: {
        present: hasIntroduction,
        score: hasIntroduction ? 4 : 2,
        feedback: hasIntroduction 
          ? "Good opening paragraph that sets the scene"
          : "Consider adding a stronger introduction to hook your reader"
      },
      risingAction: {
        present: hasRisingAction,
        score: hasRisingAction ? 4 : 2,
        feedback: hasRisingAction
          ? "Story develops well with multiple paragraphs"
          : "Add more development to build tension and interest"
      },
      climax: {
        present: hasClimaxIndicators,
        score: hasClimaxIndicators ? 4 : 3,
        feedback: hasClimaxIndicators
          ? "Clear climactic moment identified"
          : "Consider adding a more dramatic turning point or climax"
      },
      resolution: {
        present: hasResolution,
        score: hasResolution ? 4 : 2,
        feedback: hasResolution
          ? "Story has a satisfying conclusion"
          : "Add a stronger ending that wraps up your story"
      }
    };
  }

  function analyzeCreativeElements(content: string, words: string[], sentences: string[]) {
    const descriptiveWords = words.filter(word => 
      /beautiful|amazing|wonderful|terrible|enormous|tiny|brilliant|sparkling|mysterious|ancient|magical/i.test(word)
    );
    
    const hasDialogue = /"[^"]*"|'[^']*'/.test(content);
    const sensoryWords = words.filter(word =>
      /see|hear|smell|taste|feel|touch|sound|sight|scent|flavor|texture/i.test(word)
    );

    const characterWords = words.filter(word =>
      /character|person|friend|hero|villain|protagonist|she|he|they|name/i.test(word)
    );

    return {
      descriptiveLanguage: {
        score: Math.min(5, Math.floor(descriptiveWords.length / 2) + 2),
        examples: descriptiveWords.slice(0, 3),
        suggestions: [
          "Try using more vivid adjectives like 'gleaming', 'thunderous', or 'whispering'",
          "Add color words to paint a clearer picture",
          "Use comparison words like 'as bright as' or 'like a'"
        ]
      },
      characterDevelopment: {
        score: Math.min(5, Math.floor(characterWords.length / 3) + 2),
        feedback: characterWords.length > 5 
          ? "Good character presence in your story"
          : "Consider developing your characters more - what do they look like? How do they feel?",
        suggestions: [
          "Describe what your characters look like",
          "Show how your characters feel through their actions",
          "Give your characters unique ways of speaking"
        ]
      },
      dialogue: {
        present: hasDialogue,
        score: hasDialogue ? 4 : 2,
        feedback: hasDialogue
          ? "Great use of dialogue to bring characters to life"
          : "Consider adding dialogue to make your story more engaging"
      },
      sensoryDetails: {
        score: Math.min(5, Math.floor(sensoryWords.length / 2) + 2),
        examples: sensoryWords.slice(0, 3),
        suggestions: [
          "What can your character hear in this scene?",
          "Describe any smells or tastes",
          "How do things feel to touch?"
        ]
      }
    };
  }

  function analyzeVocabularyLevel(words: string[]) {
    const complexWords = words.filter(word => 
      word.length > 6 && !/ing$|ed$|er$|est$/.test(word)
    );
    
    const year6Words = words.filter(word =>
      /adventure|mysterious|character|beautiful|dangerous|exciting|incredible|magnificent|extraordinary/i.test(word)
    );

    const sophisticationScore = Math.min(5, Math.floor((complexWords.length / words.length) * 20) + 2);

    return {
      appropriateForYear6: year6Words.length > 0,
      sophisticationScore,
      complexWords: complexWords.slice(0, 5),
      suggestions: [
        "Try using words like 'magnificent' instead of 'big'",
        "Replace 'good' with 'excellent' or 'outstanding'",
        "Use 'whispered' or 'exclaimed' instead of 'said'"
      ]
    };
  }

  function analyzeCoherenceFlow(content: string, paragraphs: string[], sentences: string[]) {
    const transitionWords = content.match(/\b(then|next|after|before|meanwhile|suddenly|finally|first|second|later|soon)\b/gi) || [];
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    return {
      logicalFlow: {
        score: paragraphs.length > 1 ? 4 : 3,
        feedback: paragraphs.length > 1
          ? "Story flows logically from paragraph to paragraph"
          : "Consider breaking your story into more paragraphs for better flow"
      },
      transitions: {
        score: Math.min(5, transitionWords.length + 2),
        examples: transitionWords.slice(0, 3),
        suggestions: [
          "Use 'Meanwhile' to show something happening at the same time",
          "Try 'Suddenly' to add excitement",
          "Use 'Finally' to show the conclusion"
        ]
      },
      paragraphStructure: {
        score: paragraphs.length >= 3 ? 4 : 3,
        feedback: paragraphs.length >= 3
          ? "Good paragraph structure with clear breaks"
          : "Consider organizing your story into more paragraphs"
      }
    };
  }

  function analyzeNSWCriteria(content: string, textType: string) {
    const creativityIndicators = /imagine|creative|unique|original|magical|fantasy|dream|wonder/i.test(content);
    const audienceAwareness = content.length > 200 && content.length < 800; // Appropriate length for Year 6
    const textTypeConventions = textType === 'narrative' ? 
      /once|story|character|adventure/i.test(content) : true;

    return {
      creativityOriginality: {
        score: creativityIndicators ? 4 : 3,
        feedback: creativityIndicators
          ? "Shows creative and original thinking"
          : "Try adding more creative or imaginative elements"
      },
      audienceAwareness: {
        score: audienceAwareness ? 4 : 3,
        feedback: audienceAwareness
          ? "Appropriate length and complexity for Year 6 audience"
          : "Consider adjusting length and complexity for your audience"
      },
      textTypeConventions: {
        score: textTypeConventions ? 4 : 3,
        feedback: textTypeConventions
          ? "Follows narrative text type conventions well"
          : "Consider including more elements typical of this text type"
      }
    };
  }

  function calculateOverallScore(analysis: any) {
    const scores = [
      analysis.narrativeStructure.introduction.score,
      analysis.narrativeStructure.risingAction.score,
      analysis.narrativeStructure.climax.score,
      analysis.narrativeStructure.resolution.score,
      analysis.creativeElements.descriptiveLanguage.score,
      analysis.creativeElements.characterDevelopment.score,
      analysis.creativeElements.dialogue.score,
      analysis.creativeElements.sensoryDetails.score,
      analysis.vocabularyLevel.sophisticationScore,
      analysis.coherenceFlow.logicalFlow.score,
      analysis.coherenceFlow.transitions.score,
      analysis.coherenceFlow.paragraphStructure.score,
      analysis.nswSpecificCriteria.creativityOriginality.score,
      analysis.nswSpecificCriteria.audienceAwareness.score,
      analysis.nswSpecificCriteria.textTypeConventions.score
    ];

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round((average / 5) * 100);
  }

  if (!analysis) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
        <div className="text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Write at least 50 words to see NSW analysis</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-200';
    if (score >= 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className={`space-y-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      {/* Overall NSW Score */}
      <div className={`p-4 rounded-lg border-2 ${getScoreBg(analysis.overallScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center">
            <Target className="w-5 h-5 mr-2" />
            🎯 NSW Selective Test Score
          </h3>
          <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}%
          </span>
        </div>
        <div className="text-sm opacity-75">
          Based on NSW Department of Education writing criteria for Year 6 students
        </div>
      </div>

      {/* Narrative Structure Analysis */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center">
          <Layers className="w-4 h-4 mr-2 text-blue-500" />
          📖 Narrative Structure
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.narrativeStructure).map(([key, value]) => (
            <div key={key} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="flex items-center space-x-1">
                  {value.present ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs font-bold">{value.score}/5</span>
                </div>
              </div>
              <p className="text-xs opacity-75">{value.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Creative Elements */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
          ✨ Creative Elements
        </h4>
        
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">🎨 Descriptive Language</span>
              <span className="text-xs font-bold">{analysis.creativeElements.descriptiveLanguage.score}/5</span>
            </div>
            {analysis.creativeElements.descriptiveLanguage.examples.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium">Found: </span>
                <span className="text-xs">{analysis.creativeElements.descriptiveLanguage.examples.join(', ')}</span>
              </div>
            )}
            <div className="text-xs opacity-75">
              {analysis.creativeElements.descriptiveLanguage.suggestions[0]}
            </div>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">👥 Character Development</span>
              <span className="text-xs font-bold">{analysis.creativeElements.characterDevelopment.score}/5</span>
            </div>
            <div className="text-xs opacity-75">
              {analysis.creativeElements.characterDevelopment.feedback}
            </div>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">💬 Dialogue</span>
              <div className="flex items-center space-x-1">
                {analysis.creativeElements.dialogue.present ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-xs font-bold">{analysis.creativeElements.dialogue.score}/5</span>
              </div>
            </div>
            <div className="text-xs opacity-75">
              {analysis.creativeElements.dialogue.feedback}
            </div>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">👃 Sensory Details</span>
              <span className="text-xs font-bold">{analysis.creativeElements.sensoryDetails.score}/5</span>
            </div>
            {analysis.creativeElements.sensoryDetails.examples.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium">Found: </span>
                <span className="text-xs">{analysis.creativeElements.sensoryDetails.examples.join(', ')}</span>
              </div>
            )}
            <div className="text-xs opacity-75">
              {analysis.creativeElements.sensoryDetails.suggestions[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Level */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center">
          <BookOpen className="w-4 h-4 mr-2 text-green-500" />
          📚 Vocabulary Level
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Year 6 Appropriateness</span>
              {analysis.vocabularyLevel.appropriateForYear6 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <div className="text-xs opacity-75">
              {analysis.vocabularyLevel.appropriateForYear6 
                ? "Vocabulary is appropriate for Year 6 level"
                : "Consider using more age-appropriate vocabulary"
              }
            </div>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sophistication Score</span>
              <span className="text-xs font-bold">{analysis.vocabularyLevel.sophisticationScore}/5</span>
            </div>
            {analysis.vocabularyLevel.complexWords.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium">Complex words: </span>
                <span className="text-xs">{analysis.vocabularyLevel.complexWords.join(', ')}</span>
              </div>
            )}
            <div className="text-xs opacity-75">
              {analysis.vocabularyLevel.suggestions[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Coherence and Flow */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center">
          <Compass className="w-4 h-4 mr-2 text-indigo-500" />
          🧭 Coherence & Flow
        </h4>
        
        <div className="space-y-3">
          {Object.entries(analysis.coherenceFlow).map(([key, value]) => (
            <div key={key} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-xs font-bold">{value.score}/5</span>
              </div>
              {value.examples && value.examples.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium">Found: </span>
                  <span className="text-xs">{value.examples.join(', ')}</span>
                </div>
              )}
              <div className="text-xs opacity-75">
                {value.feedback || (value.suggestions && value.suggestions[0])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NSW-Specific Criteria */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center">
          <Award className="w-4 h-4 mr-2 text-yellow-500" />
          🏆 NSW Selective Test Criteria
        </h4>
        
        <div className="space-y-3">
          {Object.entries(analysis.nswSpecificCriteria).map(([key, value]) => (
            <div key={key} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-xs font-bold">{value.score}/5</span>
              </div>
              <div className="text-xs opacity-75">
                {value.feedback}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips for Improvement */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className="font-semibold mb-3 flex items-center text-blue-600">
          <Lightbulb className="w-4 h-4 mr-2" />
          💡 Quick Tips for NSW Success
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Use the 5-paragraph structure: Introduction, 3 body paragraphs, conclusion</span>
          </div>
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Include dialogue to bring characters to life</span>
          </div>
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Use descriptive language and sensory details</span>
          </div>
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Show character emotions through actions, not just words</span>
          </div>
          <div className="flex items-start space-x-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Use transition words to connect ideas smoothly</span>
          </div>
        </div>
      </div>
    </div>
  );
};