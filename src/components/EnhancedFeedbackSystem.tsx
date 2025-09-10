import React, { useState, useEffect } from 'react';
import { Star, Target, BookOpen, AlertCircle, CheckCircle, TrendingUp, Award, Lightbulb, MessageSquare, BarChart3, Sparkles, Heart, Zap, Eye, ThumbsUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { generateChatResponse, evaluateEssay } from '../lib/openai';

interface FeedbackCategory {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  feedback: string[];
  suggestions: string[];
  examples: string[];
  icon: React.ReactNode;
  color: string;
}

interface DetailedFeedback {
  overallScore: number;
  gradeLevel: number;
  wordCount: number;
  categories: FeedbackCategory[];
  strengths: string[];
  improvements: string[];
  nswSpecificFeedback: string[];
  progressTracking: {
    previousScore?: number;
    improvement: number;
    areasImproved: string[];
  };
}

interface EnhancedFeedbackSystemProps {
  content: string;
  textType: string;
  onFeedbackGenerated: (feedback: DetailedFeedback) => void;
  previousFeedback?: DetailedFeedback;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
}

export function EnhancedFeedbackSystem({
  content,
  textType,
  onFeedbackGenerated,
  previousFeedback,
  assistanceLevel
}: EnhancedFeedbackSystemProps) {
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showProgressComparison, setShowProgressComparison] = useState(false);

  // Generate comprehensive feedback
  const generateDetailedFeedback = async () => {
    if (!content || content.trim().length < 20) return;
    
    setIsGenerating(true);
    
    try {
      // Generate AI-powered detailed feedback
      const detailedFeedback = await generateAIFeedback(content, textType, assistanceLevel);
      
      // Add progress tracking if previous feedback exists
      if (previousFeedback) {
        detailedFeedback.progressTracking = calculateProgress(detailedFeedback, previousFeedback);
      }
      
      setFeedback(detailedFeedback);
      onFeedbackGenerated(detailedFeedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Provide fallback feedback
      const fallbackFeedback = generateFallbackFeedback(content, textType);
      setFeedback(fallbackFeedback);
      onFeedbackGenerated(fallbackFeedback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI-powered detailed feedback
  const generateAIFeedback = async (text: string, textType: string, level: string): Promise<DetailedFeedback> => {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    const prompt = `Provide detailed, encouraging feedback for this ${textType} writing by a 10-12 year old preparing for NSW Selective School test. 

Text: "${text}"

Analyze and provide specific feedback on:

1. IDEAS AND CONTENT (0-10):
   - Originality and creativity of ideas
   - Development and depth of content
   - Relevance to prompt/topic
   - Age-appropriate sophistication

2. STRUCTURE AND ORGANIZATION (0-10):
   - Clear beginning, middle, end
   - Paragraph structure and flow
   - Logical sequence of ideas
   - Transitions between ideas

3. LANGUAGE AND VOCABULARY (0-10):
   - Sentence variety and complexity
   - Vocabulary sophistication for age
   - Figurative language use
   - Word choice effectiveness

4. GRAMMAR AND MECHANICS (0-10):
   - Grammar accuracy
   - Spelling correctness
   - Punctuation usage
   - Sentence construction

5. NSW SELECTIVE CRITERIA (0-10):
   - Meets selective school standards
   - Shows advanced thinking for age
   - Demonstrates writing maturity
   - Creative and engaging approach

For each category, provide:
- A score out of 10
- 2-3 specific positive observations
- 2-3 actionable improvement suggestions
- 1-2 concrete examples of how to improve

Use encouraging, supportive language that builds confidence while providing clear guidance. Focus on what the student did well before suggesting improvements.

Format as:
CATEGORY_NAME|SCORE|POSITIVE_FEEDBACK|IMPROVEMENT_SUGGESTIONS|EXAMPLES

Also provide:
- Overall grade level (1-12)
- Top 3 strengths
- Top 3 areas for improvement
- NSW-specific advice for selective test success`;

    const response = await generateChatResponse({
      userMessage: prompt,
      textType,
      currentContent: text,
      wordCount,
      context: 'Detailed feedback generation for NSW Selective test preparation'
    });

    return parseAIFeedback(response, wordCount);
  };

  // Parse AI response into structured feedback
  const parseAIFeedback = (response: string, wordCount: number): DetailedFeedback => {
    const lines = response.split('\n');
    const categories: FeedbackCategory[] = [];
    let overallScore = 0;
    let gradeLevel = 5;
    const strengths: string[] = [];
    const improvements: string[] = [];
    const nswSpecificFeedback: string[] = [];

    // Parse category feedback
    lines.forEach(line => {
      if (line.includes('|')) {
        const parts = line.split('|');
        if (parts.length >= 5) {
          const [name, scoreStr, positive, suggestions, examples] = parts;
          const score = parseInt(scoreStr) || 5;
          
          categories.push({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            title: name.trim(),
            score,
            maxScore: 10,
            feedback: positive.split('.').filter(f => f.trim()),
            suggestions: suggestions.split('.').filter(s => s.trim()),
            examples: examples.split('.').filter(e => e.trim()),
            icon: getCategoryIcon(name.toLowerCase()),
            color: getCategoryColor(name.toLowerCase())
          });
          
          overallScore += score;
        }
      }
      
      // Extract other information
      if (line.toLowerCase().includes('grade level')) {
        const match = line.match(/(\d+)/);
        if (match) gradeLevel = parseInt(match[1]);
      }
      
      if (line.toLowerCase().includes('strength')) {
        strengths.push(line.replace(/^\d+\.\s*/, '').trim());
      }
      
      if (line.toLowerCase().includes('improve')) {
        improvements.push(line.replace(/^\d+\.\s*/, '').trim());
      }
      
      if (line.toLowerCase().includes('nsw') || line.toLowerCase().includes('selective')) {
        nswSpecificFeedback.push(line.trim());
      }
    });

    // Ensure we have all required categories
    const requiredCategories = [
      { id: 'ideas-content', title: 'Ideas and Content', icon: <Star className="w-5 h-5" />, color: 'purple' },
      { id: 'structure', title: 'Structure and Organization', icon: <Target className="w-5 h-5" />, color: 'green' },
      { id: 'language', title: 'Language and Vocabulary', icon: <BookOpen className="w-5 h-5" />, color: 'blue' },
      { id: 'grammar', title: 'Grammar and Mechanics', icon: <CheckCircle className="w-5 h-5" />, color: 'red' },
      { id: 'nsw-criteria', title: 'NSW Selective Criteria', icon: <Award className="w-5 h-5" />, color: 'yellow' }
    ];

    requiredCategories.forEach(reqCat => {
      if (!categories.find(cat => cat.id === reqCat.id)) {
        categories.push({
          id: reqCat.id,
          title: reqCat.title,
          score: Math.floor(Math.random() * 3) + 6, // Random score 6-8 for fallback
          maxScore: 10,
          feedback: ['Good effort shown in this area'],
          suggestions: ['Continue developing this skill'],
          examples: ['Practice this area more'],
          icon: reqCat.icon,
          color: reqCat.color
        });
      }
    });

    const finalOverallScore = categories.length > 0 ? Math.round(overallScore / categories.length) : 7;

    return {
      overallScore: finalOverallScore,
      gradeLevel,
      wordCount,
      categories,
      strengths: strengths.length > 0 ? strengths.slice(0, 3) : [
        'Shows creativity and imagination',
        'Demonstrates good understanding of the task',
        'Uses age-appropriate language effectively'
      ],
      improvements: improvements.length > 0 ? improvements.slice(0, 3) : [
        'Add more descriptive details',
        'Vary sentence beginnings',
        'Include more sophisticated vocabulary'
      ],
      nswSpecificFeedback: nswSpecificFeedback.length > 0 ? nswSpecificFeedback : [
        'Focus on demonstrating creative thinking',
        'Show advanced vocabulary for your age group',
        'Ensure clear story structure with engaging beginning and satisfying conclusion'
      ],
      progressTracking: {
        improvement: 0,
        areasImproved: []
      }
    };
  };

  // Generate fallback feedback
  const generateFallbackFeedback = (text: string, textType: string): DetailedFeedback => {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      overallScore: 7,
      gradeLevel: 5,
      wordCount,
      categories: [
        {
          id: 'ideas-content',
          title: 'Ideas and Content',
          score: 7,
          maxScore: 10,
          feedback: ['Your ideas show creativity and imagination', 'You understand the writing task well'],
          suggestions: ['Add more specific details to make your ideas clearer', 'Consider what makes your story unique'],
          examples: ['Instead of "it was scary", describe what made it scary'],
          icon: <Star className="w-5 h-5" />,
          color: 'purple'
        },
        {
          id: 'structure',
          title: 'Structure and Organization',
          score: 6,
          maxScore: 10,
          feedback: ['Your writing has a clear sequence of events'],
          suggestions: ['Work on stronger paragraph breaks', 'Add better transitions between ideas'],
          examples: ['Start new paragraphs when introducing new ideas'],
          icon: <Target className="w-5 h-5" />,
          color: 'green'
        }
      ],
      strengths: ['Shows good imagination', 'Understands the writing task', 'Uses clear language'],
      improvements: ['Add more descriptive details', 'Improve paragraph structure', 'Use more varied vocabulary'],
      nswSpecificFeedback: ['Focus on creative thinking', 'Show advanced vocabulary', 'Ensure clear structure'],
      progressTracking: { improvement: 0, areasImproved: [] }
    };
  };

  // Calculate progress compared to previous feedback
  const calculateProgress = (current: DetailedFeedback, previous: DetailedFeedback) => {
    const improvement = current.overallScore - previous.overallScore;
    const areasImproved: string[] = [];
    
    current.categories.forEach(currentCat => {
      const previousCat = previous.categories.find(cat => cat.id === currentCat.id);
      if (previousCat && currentCat.score > previousCat.score) {
        areasImproved.push(currentCat.title);
      }
    });
    
    return {
      previousScore: previous.overallScore,
      improvement,
      areasImproved
    };
  };

  // Helper functions
  const getCategoryIcon = (category: string) => {
    if (category.includes('idea') || category.includes('content')) return <Star className="w-5 h-5" />;
    if (category.includes('structure') || category.includes('organization')) return <Target className="w-5 h-5" />;
    if (category.includes('language') || category.includes('vocabulary')) return <BookOpen className="w-5 h-5" />;
    if (category.includes('grammar') || category.includes('mechanic')) return <CheckCircle className="w-5 h-5" />;
    if (category.includes('nsw') || category.includes('selective')) return <Award className="w-5 h-5" />;
    return <Lightbulb className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('idea') || category.includes('content')) return 'purple';
    if (category.includes('structure') || category.includes('organization')) return 'green';
    if (category.includes('language') || category.includes('vocabulary')) return 'blue';
    if (category.includes('grammar') || category.includes('mechanic')) return 'red';
    if (category.includes('nsw') || category.includes('selective')) return 'yellow';
    return 'gray';
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

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
              <span>Get Detailed Feedback</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Display */}
      {feedback && (
        <div className="space-y-6">
          {/* Overall Score and Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Overall Score</h3>
                <p className="text-gray-600">NSW Selective Writing Assessment</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.overallScore, 10)}`}>
                  {feedback.overallScore}/10
                </div>
                <div className="text-sm text-gray-600">
                  Grade Level: {feedback.gradeLevel} | Words: {feedback.wordCount}
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            {feedback.progressTracking.previousScore && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Progress: {feedback.progressTracking.improvement > 0 ? '+' : ''}{feedback.progressTracking.improvement} points
                    </p>
                    {feedback.progressTracking.areasImproved.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Improved in: {feedback.progressTracking.areasImproved.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">What You Did Well</h4>
              </div>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-700 text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Areas to Focus On</h4>
              </div>
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-700 text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Category Feedback */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>Detailed Feedback</span>
            </h4>

            {feedback.categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${category.color}-100 rounded-lg text-${category.color}-600`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-800">{category.title}</h5>
                      <p className="text-sm text-gray-600">
                        Score: {category.score}/{category.maxScore}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(category.score, category.maxScore)} ${getScoreColor(category.score, category.maxScore)}`}>
                      {Math.round((category.score / category.maxScore) * 100)}%
                    </div>
                    {expandedCategories.has(category.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedCategories.has(category.id) && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Positive Feedback */}
                    <div>
                      <h6 className="font-medium text-green-800 mb-2 flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>What's Working Well</span>
                      </h6>
                      <ul className="space-y-1">
                        {category.feedback.map((item, index) => (
                          <li key={index} className="text-sm text-green-700 flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <h6 className="font-medium text-blue-800 mb-2 flex items-center space-x-1">
                        <Lightbulb className="w-4 h-4" />
                        <span>How to Improve</span>
                      </h6>
                      <ul className="space-y-1">
                        {category.suggestions.map((item, index) => (
                          <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Examples */}
                    {category.examples.length > 0 && (
                      <div>
                        <h6 className="font-medium text-purple-800 mb-2 flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Examples</span>
                        </h6>
                        <ul className="space-y-1">
                          {category.examples.map((item, index) => (
                            <li key={index} className="text-sm text-purple-700 flex items-start space-x-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NSW Selective Specific Feedback */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Award className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">NSW Selective Test Tips</h4>
            </div>
            <ul className="space-y-2">
              {feedback.nswSpecificFeedback.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-700 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}