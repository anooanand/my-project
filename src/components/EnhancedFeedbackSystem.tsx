import React, { useState, useEffect } from 'react';
import { Star, Target, BookOpen, AlertCircle, CheckCircle, TrendingUp, Award, Lightbulb, MessageSquare, BarChart3, Sparkles, Heart, Zap, Eye, ThumbsUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface TextPosition {
  start: number;
  end: number;
}

interface FeedbackItem {
  exampleFromText: string;
  position: TextPosition;
  comment?: string;
  suggestionForImprovement?: string;
}

interface GrammarCorrection {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface VocabularyEnhancement {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface CriteriaFeedback {
  category: string;
  score: number;
  strengths: FeedbackItem[];
  areasForImprovement: FeedbackItem[];
}

interface DetailedFeedback {
  overallScore: number;
  criteriaScores: {
    ideasAndContent: number;
    textStructureAndOrganization: number;
    languageFeaturesAndVocabulary: number;
    spellingPunctuationAndGrammar: number;
  };
  feedbackCategories: CriteriaFeedback[];
  grammarCorrections: GrammarCorrection[];
  vocabularyEnhancements: VocabularyEnhancement[];
}

interface EnhancedFeedbackSystemProps {
  content: string;
  textType: string;
  onFeedbackGenerated: (feedback: DetailedFeedback) => void;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
}

export function EnhancedFeedbackSystem({
  content,
  textType,
  onFeedbackGenerated,
  assistanceLevel
}: EnhancedFeedbackSystemProps) {
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const generateDetailedFeedback = async () => {
    if (!content || content.trim().length < 20) return;
    
    setIsGenerating(true);
    
    try {
      // Call your backend API endpoint that uses get_nsw_selective_feedback
      const response = await fetch('/api/evaluate-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          textType,
          assistanceLevel
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }
      
      const detailedFeedback: DetailedFeedback = await response.json();
      
      setFeedback(detailedFeedback);
      onFeedbackGenerated(detailedFeedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Provide fallback feedback
      const fallbackFeedback = createFallbackFeedback(content);
      setFeedback(fallbackFeedback);
      onFeedbackGenerated(fallbackFeedback);
    } finally {
      setIsGenerating(false);
    }
  };

  const createFallbackFeedback = (text: string): DetailedFeedback => {
    return {
      overallScore: 75,
      criteriaScores: {
        ideasAndContent: 4,
        textStructureAndOrganization: 3,
        languageFeaturesAndVocabulary: 3,
        spellingPunctuationAndGrammar: 4
      },
      feedbackCategories: [
        {
          category: "Ideas and Content",
          score: 4,
          strengths: [
            {
              exampleFromText: text.substring(0, 50),
              position: { start: 0, end: 50 },
              comment: "Shows creative thinking and good understanding"
            }
          ],
          areasForImprovement: [
            {
              exampleFromText: text.substring(0, 30),
              position: { start: 0, end: 30 },
              suggestionForImprovement: "Add more specific details"
            }
          ]
        }
      ],
      grammarCorrections: [],
      vocabularyEnhancements: []
    };
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getScoreColor = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Ideas') || category.includes('Content')) return <Star className="w-5 h-5" />;
    if (category.includes('Structure') || category.includes('Organization')) return <Target className="w-5 h-5" />;
    if (category.includes('Language') || category.includes('Vocabulary')) return <BookOpen className="w-5 h-5" />;
    if (category.includes('Spelling') || category.includes('Grammar')) return <CheckCircle className="w-5 h-5" />;
    return <Lightbulb className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Generate Feedback Button */}
      <div className="text-center">
        <button
          onClick={generateDetailedFeedback}
          disabled={isGenerating || !content || content.trim().length < 20}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing Your Writing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Get NSW Feedback</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Display */}
      {feedback && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">NSW Selective Assessment</h3>
                <p className="text-gray-600">Comprehensive Writing Feedback</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.overallScore, 100)}`}>
                  {feedback.overallScore}/100
                </div>
                <div className="text-sm text-gray-600">
                  Overall Score
                </div>
              </div>
            </div>

            {/* Criteria Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(feedback.criteriaScores.ideasAndContent)}`}>
                  {feedback.criteriaScores.ideasAndContent}/5
                </div>
                <div className="text-xs text-gray-600">Ideas & Content</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(feedback.criteriaScores.textStructureAndOrganization)}`}>
                  {feedback.criteriaScores.textStructureAndOrganization}/5
                </div>
                <div className="text-xs text-gray-600">Structure</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(feedback.criteriaScores.languageFeaturesAndVocabulary)}`}>
                  {feedback.criteriaScores.languageFeaturesAndVocabulary}/5
                </div>
                <div className="text-xs text-gray-600">Language</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(feedback.criteriaScores.spellingPunctuationAndGrammar)}`}>
                  {feedback.criteriaScores.spellingPunctuationAndGrammar}/5
                </div>
                <div className="text-xs text-gray-600">Grammar</div>
              </div>
            </div>
          </div>

          {/* Detailed Category Feedback */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Detailed Feedback by Category</h4>
            {feedback.feedbackCategories.map((category, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category.category)}
                    <span className="font-medium">{category.category}</span>
                    <span className={`px-2 py-1 rounded text-sm ${getScoreBackground(category.score)} ${getScoreColor(category.score)}`}>
                      {category.score}/5
                    </span>
                  </div>
                  {expandedCategories.has(category.category) ? 
                    <ChevronUp className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                </button>
                
                {expandedCategories.has(category.category) && (
                  <div className="p-4 space-y-4">
                    {/* Strengths */}
                    <div>
                      <h5 className="font-medium text-green-800 mb-2 flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Strengths
                      </h5>
                      <div className="space-y-2">
                        {category.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-green-50 p-3 rounded">
                            <div className="text-sm text-green-800 font-medium mb-1">
                              "{strength.exampleFromText}"
                            </div>
                            <div className="text-sm text-green-700">
                              {strength.comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                      <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Areas for Improvement
                      </h5>
                      <div className="space-y-2">
                        {category.areasForImprovement.map((improvement, idx) => (
                          <div key={idx} className="bg-orange-50 p-3 rounded">
                            <div className="text-sm text-orange-800 font-medium mb-1">
                              "{improvement.exampleFromText}"
                            </div>
                            <div className="text-sm text-orange-700">
                              {improvement.suggestionForImprovement}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grammar Corrections */}
          {feedback.grammarCorrections.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Grammar & Spelling Corrections
              </h4>
              <div className="space-y-2">
                {feedback.grammarCorrections.map((correction, index) => (
                  <div key={index} className="bg-white p-3 rounded border-l-4 border-red-400">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-600 font-medium">"{correction.original}"</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-600 font-medium">"{correction.suggestion}"</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {correction.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary Enhancements */}
          {feedback.vocabularyEnhancements.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Vocabulary Enhancements
              </h4>
              <div className="space-y-2">
                {feedback.vocabularyEnhancements.map((enhancement, index) => (
                  <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-medium">"{enhancement.original}"</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-purple-600 font-medium">"{enhancement.suggestion}"</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {enhancement.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
