import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  BookOpen, 
  Target, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  MessageCircle
} from 'lucide-react';

// NSW Criteria Dashboard Types
export interface CriterionCard {
  name: string;
  icon: string;
  currentScore: 1 | 2 | 3 | 4 | 5;
  maxScore: 5;
  feedback: string;
  improvementTip: string;
  colorTheme: string;
  isExpandable: boolean;
  expanded: boolean;
}

export interface NSWCriteriaDashboard {
  ideas: CriterionCard;
  language: CriterionCard;
  structure: CriterionCard;
  grammar: CriterionCard;
  overallScore: number; // Sum of all criteria (4-20)
  estimatedGrade: 'Minimal' | 'Basic' | 'Sound' | 'High' | 'Excellent';
}

interface NSWCriteriaDashboardProps {
  content: string;
  textType: string;
  onCriterionTipRequest: (criterion: string) => void;
  className?: string;
  darkMode?: boolean;
}

// NSW Criteria Analysis Engine
class NSWCriteriaAnalyzer {
  static analyzeContent(content: string, textType: string): NSWCriteriaDashboard {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    // Analyze each criterion
    const ideas = this.analyzeIdeasAndContent(content, textType, wordCount);
    const language = this.analyzeLanguageAndVocabulary(content);
    const structure = this.analyzeStructureAndOrganization(content, textType);
    const grammar = this.analyzeSpellingAndGrammar(content);
    
    const overallScore = ideas.currentScore + language.currentScore + structure.currentScore + grammar.currentScore;
    const estimatedGrade = this.calculateGrade(overallScore);
    
    return {
      ideas,
      language,
      structure,
      grammar,
      overallScore,
      estimatedGrade
    };
  }
  
  static analyzeIdeasAndContent(content: string, textType: string, wordCount: number): CriterionCard {
    let score: 1 | 2 | 3 | 4 | 5 = 1;
    let feedback = "Start developing your ideas with more details.";
    let improvementTip = "Add sensory descriptions (what you see, hear, smell, feel) to bring your writing to life.";
    
    if (wordCount === 0) {
      score = 1;
      feedback = "Begin writing to develop your ideas.";
      improvementTip = "Start with a creative opening that grabs the reader's attention.";
    } else if (wordCount < 50) {
      score = 2;
      feedback = "You've started! Now add more details to develop your ideas.";
      improvementTip = "Describe your characters' emotions and the setting in more detail.";
    } else if (wordCount < 150) {
      score = 3;
      feedback = "Good progress! Your ideas are developing well.";
      improvementTip = "Add dialogue or show what your character is thinking to make it more engaging.";
    } else if (wordCount < 250) {
      score = 4;
      feedback = "Excellent idea development with good supporting details.";
      improvementTip = "Consider adding a surprising twist or deeper character development.";
    } else {
      score = 5;
      feedback = "Outstanding creative ideas with rich, relevant details!";
      improvementTip = "Your ideas are well-developed. Focus on polishing your language and structure.";
    }
    
    // Check for creativity indicators
    const creativityWords = ['suddenly', 'mysterious', 'magical', 'amazing', 'incredible', 'whispered', 'discovered'];
    const hasCreativity = creativityWords.some(word => content.toLowerCase().includes(word));
    
    if (hasCreativity && score < 5) {
      score = Math.min(5, score + 1) as 1 | 2 | 3 | 4 | 5;
      feedback = "Great creative elements! " + feedback;
    }
    
    return {
      name: "Ideas & Content",
      icon: "💡",
      currentScore: score,
      maxScore: 5,
      feedback,
      improvementTip,
      colorTheme: "ideas",
      isExpandable: true,
      expanded: false
    };
  }
  
  static analyzeLanguageAndVocabulary(content: string): CriterionCard {
    let score: 1 | 2 | 3 | 4 | 5 = 1;
    let feedback = "Use more varied and interesting vocabulary.";
    let improvementTip = "Replace simple words like 'said', 'went', 'good' with more specific alternatives.";
    
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyDiversity = words.length > 0 ? uniqueWords.size / words.length : 0;
    
    // Check for overused words
    const overusedWords = ['said', 'went', 'good', 'nice', 'big', 'small'];
    const overusedCount = overusedWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    // Check for sophisticated vocabulary
    const sophisticatedWords = ['magnificent', 'extraordinary', 'whispered', 'exclaimed', 'tremendous', 'fascinating'];
    const sophisticatedCount = sophisticatedWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    if (vocabularyDiversity > 0.8 && sophisticatedCount > 2) {
      score = 5;
      feedback = "Excellent vocabulary with sophisticated word choices!";
      improvementTip = "Your vocabulary is strong. Focus on varying your sentence structures.";
    } else if (vocabularyDiversity > 0.7 && sophisticatedCount > 1) {
      score = 4;
      feedback = "Good vocabulary variety with some sophisticated words.";
      improvementTip = "Try using more descriptive adjectives and powerful verbs.";
    } else if (vocabularyDiversity > 0.6) {
      score = 3;
      feedback = "Reasonable vocabulary with room for improvement.";
      improvementTip = "Replace repeated words with synonyms to add variety.";
    } else if (overusedCount < 3) {
      score = 2;
      feedback = "Basic vocabulary that could be more varied.";
      improvementTip = "Use a thesaurus to find more interesting word choices.";
    }
    
    return {
      name: "Language & Vocabulary",
      icon: "📚",
      currentScore: score,
      maxScore: 5,
      feedback,
      improvementTip,
      colorTheme: "language",
      isExpandable: true,
      expanded: false
    };
  }
  
  static analyzeStructureAndOrganization(content: string, textType: string): CriterionCard {
    let score: 1 | 2 | 3 | 4 | 5 = 1;
    let feedback = "Work on organizing your writing with clear beginning, middle, and end.";
    let improvementTip = "Start with an engaging opening, develop your story in the middle, and end with a satisfying conclusion.";
    
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for narrative structure elements
    const hasOpening = content.length > 50;
    const hasMiddle = paragraphs.length > 1 || sentences.length > 3;
    const hasEnding = content.toLowerCase().includes('finally') || 
                     content.toLowerCase().includes('in the end') ||
                     content.toLowerCase().includes('conclusion');
    
    // Check for transition words
    const transitionWords = ['first', 'then', 'next', 'after', 'finally', 'however', 'meanwhile', 'suddenly'];
    const transitionCount = transitionWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    if (hasOpening && hasMiddle && hasEnding && transitionCount > 2) {
      score = 5;
      feedback = "Excellent structure with clear beginning, middle, and end!";
      improvementTip = "Your structure is strong. Focus on smooth transitions between ideas.";
    } else if (hasOpening && hasMiddle && transitionCount > 1) {
      score = 4;
      feedback = "Good organization with logical sequence.";
      improvementTip = "Add a stronger conclusion to wrap up your story.";
    } else if (hasOpening && hasMiddle) {
      score = 3;
      feedback = "Basic structure present with some organization.";
      improvementTip = "Use more transition words to connect your ideas smoothly.";
    } else if (hasOpening) {
      score = 2;
      feedback = "Some structure but needs better organization.";
      improvementTip = "Develop your middle section with more details and events.";
    }
    
    return {
      name: "Structure & Organization",
      icon: "🎯",
      currentScore: score,
      maxScore: 5,
      feedback,
      improvementTip,
      colorTheme: "structure",
      isExpandable: true,
      expanded: false
    };
  }
  
  static analyzeSpellingAndGrammar(content: string): CriterionCard {
    let score: 1 | 2 | 3 | 4 | 5 = 5; // Start optimistic
    let feedback = "Great spelling and grammar!";
    let improvementTip = "Keep up the excellent technical accuracy.";
    
    // Simple error detection (in production, use more sophisticated analysis)
    const commonErrors = [
      { pattern: /\bthere\b.*\bis\b/gi, error: "their/there/they're confusion" },
      { pattern: /\byour\b.*\bare\b/gi, error: "your/you're confusion" },
      { pattern: /\bto\b.*\bmuch\b/gi, error: "to/too confusion" },
      { pattern: /[a-z]\.[A-Z]/g, error: "missing space after period" },
      { pattern: /\s{2,}/g, error: "extra spaces" }
    ];
    
    let errorCount = 0;
    const detectedErrors: string[] = [];
    
    commonErrors.forEach(({ pattern, error }) => {
      const matches = content.match(pattern);
      if (matches) {
        errorCount += matches.length;
        detectedErrors.push(error);
      }
    });
    
    // Check for sentence variety
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length || 0;
    
    if (errorCount === 0 && avgSentenceLength > 8) {
      score = 5;
      feedback = "Excellent spelling and grammar with varied sentences!";
      improvementTip = "Your technical skills are strong. Focus on creative expression.";
    } else if (errorCount <= 1 && avgSentenceLength > 6) {
      score = 4;
      feedback = "Good technical accuracy with minor areas to improve.";
      improvementTip = "Check for common homophones like their/there/they're.";
    } else if (errorCount <= 3) {
      score = 3;
      feedback = "Generally accurate with some errors to fix.";
      improvementTip = "Proofread carefully for spelling and punctuation errors.";
    } else if (errorCount <= 5) {
      score = 2;
      feedback = "Several errors that need attention.";
      improvementTip = "Focus on capital letters, apostrophes, and sentence endings.";
    } else {
      score = 1;
      feedback = "Many errors that interfere with understanding.";
      improvementTip = "Take time to check each sentence for spelling and grammar.";
    }
    
    return {
      name: "Spelling & Grammar",
      icon: "✅",
      currentScore: score,
      maxScore: 5,
      feedback,
      improvementTip,
      colorTheme: "grammar",
      isExpandable: true,
      expanded: false
    };
  }
  
  static calculateGrade(overallScore: number): 'Minimal' | 'Basic' | 'Sound' | 'High' | 'Excellent' {
    if (overallScore >= 18) return 'Excellent';
    if (overallScore >= 15) return 'High';
    if (overallScore >= 12) return 'Sound';
    if (overallScore >= 8) return 'Basic';
    return 'Minimal';
  }
}

// Star Rating Component
const StarRating: React.FC<{ score: number; maxScore: number; colorTheme: string }> = ({ 
  score, 
  maxScore, 
  colorTheme 
}) => {
  const stars = Array.from({ length: maxScore }, (_, index) => (
    <Star
      key={index}
      className={`w-4 h-4 ${
        index < score 
          ? `text-yellow-400 fill-yellow-400` 
          : 'text-gray-300'
      }`}
    />
  ));
  
  return <div className="flex items-center space-x-1">{stars}</div>;
};

// Main NSW Criteria Dashboard Component
export const NSWCriteriaDashboard: React.FC<NSWCriteriaDashboardProps> = ({
  content,
  textType,
  onCriterionTipRequest,
  className = "",
  darkMode = false
}) => {
  const [dashboardData, setDashboardData] = useState<NSWCriteriaDashboard | null>(null);
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);
  
  // Analyze content whenever it changes
  useEffect(() => {
    const analysis = NSWCriteriaAnalyzer.analyzeContent(content, textType);
    setDashboardData(analysis);
  }, [content, textType]);
  
  const toggleCriterion = (criterionName: string) => {
    setExpandedCriterion(expandedCriterion === criterionName ? null : criterionName);
  };
  
  const getCriterionTip = (criterion: string) => {
    onCriterionTipRequest(criterion);
  };
  
  if (!dashboardData) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    );
  }
  
  const criteriaArray = [
    { key: 'ideas', data: dashboardData.ideas },
    { key: 'language', data: dashboardData.language },
    { key: 'structure', data: dashboardData.structure },
    { key: 'grammar', data: dashboardData.grammar }
  ];
  
  return (
    <div className={`${className}`}>
      {/* Dashboard Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 NSW Writing Assessment
          </h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              dashboardData.estimatedGrade === 'Excellent' ? 'text-green-600' :
              dashboardData.estimatedGrade === 'High' ? 'text-blue-600' :
              dashboardData.estimatedGrade === 'Sound' ? 'text-yellow-600' :
              dashboardData.estimatedGrade === 'Basic' ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {dashboardData.overallScore}/20
            </div>
            <div className={`text-sm font-medium px-2 py-1 rounded-full ${
              dashboardData.estimatedGrade === 'Excellent' ? 'bg-green-100 text-green-800' :
              dashboardData.estimatedGrade === 'High' ? 'bg-blue-100 text-blue-800' :
              dashboardData.estimatedGrade === 'Sound' ? 'bg-yellow-100 text-yellow-800' :
              dashboardData.estimatedGrade === 'Basic' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {dashboardData.estimatedGrade}
            </div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(dashboardData.overallScore / 20) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Criteria Cards */}
      <div className="p-4 space-y-3">
        {criteriaArray.map(({ key, data }) => (
          <div
            key={key}
            className={`criterion-card ${key}-card rounded-lg overflow-hidden transition-all duration-300 ${
              expandedCriterion === key ? 'shadow-lg' : 'shadow-sm'
            }`}
            style={{
              background: key === 'ideas' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                         key === 'language' ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' :
                         key === 'structure' ? 'linear-gradient(135deg, #10B981, #059669)' :
                         'linear-gradient(135deg, #8B5CF6, #7C3AED)'
            }}
          >
            {/* Card Header */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleCriterion(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{data.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold text-base">{data.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <StarRating score={data.currentScore} maxScore={data.maxScore} colorTheme={key} />
                      <span className="text-white text-sm font-medium">
                        {data.currentScore}/{data.maxScore}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  {expandedCriterion === key ? 
                    <ChevronUp className="w-5 h-5 text-white" /> : 
                    <ChevronDown className="w-5 h-5 text-white" />
                  }
                </div>
              </div>
            </div>
            
            {/* Card Content */}
            {expandedCriterion === key && (
              <div className="px-4 pb-4">
                <div className="bg-white bg-opacity-90 rounded-lg p-4 space-y-3">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-1">📝 Current Feedback:</h5>
                    <p className="text-gray-700 text-sm">{data.feedback}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-1">🔧 To Improve:</h5>
                    <p className="text-gray-700 text-sm">{data.improvementTip}</p>
                  </div>
                  
                  <button
                    onClick={() => getCriterionTip(key)}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Get Tip in Chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NSWCriteriaDashboard;