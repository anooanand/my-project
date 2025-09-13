import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Star, TrendingUp, Search, Plus, Check, X, Eye, EyeOff, Lightbulb, Target, Brain } from 'lucide-react';

interface VocabWord {
  word: string;
  definition: string;
  example: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: string;
  synonyms?: string[];
  usage_tip?: string;
  isOverused?: boolean;
  contextAppropriate?: boolean;
}

interface VocabCoachProps {
  content: string;
  textType: string;
  onWordSelect: (word: string) => void;
  className?: string;
}

interface OverusedWord {
  word: string;
  count: number;
  suggestions: string[];
  context: string;
}

interface SynonymSuggestion {
  original: string;
  synonyms: string[];
  context: string;
  reason: string;
}

export const VocabCoach: React.FC<VocabCoachProps> = ({
  content,
  textType,
  onWordSelect,
  className = ''
}) => {
  const [overusedWords, setOverusedWords] = useState<OverusedWord[]>([]);
  const [synonymSuggestions, setSynonymSuggestions] = useState<SynonymSuggestion[]>([]);
  const [personalWordList, setPersonalWordList] = useState<VocabWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showOverused, setShowOverused] = useState<boolean>(true);

  // Analyze content for overused words
  const analyzeOverusedWords = useCallback(() => {
    if (!content || content.trim().length < 50) {
      setOverusedWords([]);
      return;
    }

    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Common words that are often overused in student writing
    const commonOverusedWords = ['good', 'bad', 'nice', 'big', 'small', 'very', 'really', 'thing', 'stuff', 'said', 'went', 'got', 'like', 'just'];
    
    const overused = Object.entries(wordCount)
      .filter(([word, count]) => {
        return (count >= 3 && commonOverusedWords.includes(word)) || count >= 5;
      })
      .map(([word, count]) => ({
        word,
        count,
        suggestions: getSynonymsForWord(word),
        context: getWordContext(word, content)
      }));

    setOverusedWords(overused);
  }, [content]);

  // Get synonyms for a word (simplified version)
  const getSynonymsForWord = (word: string): string[] => {
    const synonymMap: { [key: string]: string[] } = {
      'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb', 'magnificent'],
      'bad': ['terrible', 'awful', 'dreadful', 'appalling', 'atrocious', 'deplorable'],
      'nice': ['pleasant', 'delightful', 'charming', 'agreeable', 'lovely', 'wonderful'],
      'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense', 'vast'],
      'small': ['tiny', 'minuscule', 'compact', 'petite', 'diminutive', 'microscopic'],
      'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'tremendously'],
      'really': ['genuinely', 'truly', 'absolutely', 'certainly', 'undoubtedly'],
      'said': ['declared', 'announced', 'proclaimed', 'stated', 'expressed', 'articulated'],
      'went': ['traveled', 'journeyed', 'ventured', 'proceeded', 'departed', 'advanced'],
      'got': ['obtained', 'acquired', 'received', 'secured', 'gained', 'attained'],
      'like': ['enjoy', 'appreciate', 'admire', 'favor', 'prefer', 'cherish'],
      'thing': ['object', 'item', 'element', 'aspect', 'matter', 'component']
    };

    return synonymMap[word.toLowerCase()] || ['sophisticated alternative', 'enhanced vocabulary', 'precise term'];
  };

  // Get context for a word
  const getWordContext = (word: string, text: string): string => {
    const sentences = text.split(/[.!?]+/);
    const contextSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(word.toLowerCase())
    );
    return contextSentence ? contextSentence.trim().substring(0, 100) + '...' : '';
  };

  // Generate context-appropriate synonyms
  const generateSynonymSuggestions = useCallback(async () => {
    if (!content || content.trim().length < 50) {
      setSynonymSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call for context-appropriate synonyms
      const suggestions: SynonymSuggestion[] = overusedWords.map(overused => ({
        original: overused.word,
        synonyms: overused.suggestions.slice(0, 4),
        context: overused.context,
        reason: `Used ${overused.count} times - consider varying your vocabulary`
      }));

      setSynonymSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating synonym suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [overusedWords]);

  // Build personal word list based on text type
  const buildPersonalWordList = useCallback(() => {
    const wordsByTextType: { [key: string]: VocabWord[] } = {
      'narrative': [
        {
          word: 'vivid',
          definition: 'Producing powerful feelings or strong, clear images in the mind',
          example: 'The vivid description brought the scene to life.',
          difficulty: 'intermediate',
          category: 'descriptive',
          usage_tip: 'Use to enhance sensory details in your narrative'
        },
        {
          word: 'compelling',
          definition: 'Evoking interest, attention, or admiration in a powerfully irresistible way',
          example: 'The character\'s compelling backstory drew readers in.',
          difficulty: 'advanced',
          category: 'narrative technique',
          usage_tip: 'Perfect for describing engaging plot elements'
        },
        {
          word: 'poignant',
          definition: 'Evoking a keen sense of sadness or regret',
          example: 'The poignant farewell scene moved everyone to tears.',
          difficulty: 'advanced',
          category: 'emotional',
          usage_tip: 'Use for emotionally impactful moments'
        }
      ],
      'persuasive': [
        {
          word: 'compelling',
          definition: 'Convincing or persuasive',
          example: 'The evidence presented a compelling argument.',
          difficulty: 'intermediate',
          category: 'argumentation',
          usage_tip: 'Strengthen your persuasive points'
        },
        {
          word: 'substantiate',
          definition: 'Provide evidence to support or prove the truth of',
          example: 'Statistics substantiate the claim about climate change.',
          difficulty: 'advanced',
          category: 'evidence',
          usage_tip: 'Use when presenting supporting evidence'
        }
      ],
      'expository': [
        {
          word: 'elucidate',
          definition: 'Make something clear; explain',
          example: 'The diagram helps elucidate the complex process.',
          difficulty: 'advanced',
          category: 'explanation',
          usage_tip: 'Use when clarifying complex concepts'
        },
        {
          word: 'comprehensive',
          definition: 'Complete and including everything that is necessary',
          example: 'The report provides a comprehensive analysis.',
          difficulty: 'intermediate',
          category: 'analysis',
          usage_tip: 'Describes thorough examination or coverage'
        }
      ]
    };

    const relevantWords = wordsByTextType[textType.toLowerCase()] || wordsByTextType['narrative'];
    setPersonalWordList(relevantWords);
  }, [textType]);

  useEffect(() => {
    analyzeOverusedWords();
  }, [analyzeOverusedWords]);

  useEffect(() => {
    generateSynonymSuggestions();
  }, [generateSynonymSuggestions]);

  useEffect(() => {
    buildPersonalWordList();
  }, [buildPersonalWordList]);

  const handleWordSelect = (word: string) => {
    setSelectedWords(prev => new Set([...prev, word]));
    onWordSelect(word);
  };

  const getDifficultyColor = (difficulty: VocabWord['difficulty']) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vocab Coach</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">(placeholder)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Highlight overused words section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Highlight overused words</span>
            </div>
            <button
              onClick={() => setShowOverused(!showOverused)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {showOverused ? <Eye className="h-4 w-4 text-gray-500" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
            </button>
          </div>

          {showOverused && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {overusedWords.length > 0 ? (
                overusedWords.map((overused, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        "{overused.word}"
                      </span>
                      <span className="text-xs text-orange-600 dark:text-orange-300">
                        used {overused.count} times
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {overused.suggestions.slice(0, 2).map((suggestion, suggestionIndex) => (
                        <button
                          key={suggestionIndex}
                          onClick={() => handleWordSelect(suggestion)}
                          className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No overused words detected</p>
              )}
            </div>
          )}
        </div>

        {/* Suggest context-appropriate synonyms section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Suggest context-appropriate synonyms</span>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {synonymSuggestions.length > 0 ? (
              synonymSuggestions.map((suggestion, index) => (
                <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      Replace "{suggestion.original}" with:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.synonyms.map((synonym, synonymIndex) => (
                      <button
                        key={synonymIndex}
                        onClick={() => handleWordSelect(synonym)}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        {synonym}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {content.trim().length < 50 ? 'Write more to get synonym suggestions' : 'No synonym suggestions available'}
              </p>
            )}
          </div>
        </div>

        {/* Build a personal word list section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Build a personal word list</span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {personalWordList.map((word, index) => (
              <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-green-800 dark:text-green-200">{word.word}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(word.difficulty)}`}>
                        {word.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">{word.definition}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 italic">"{word.example}"</p>
                    {word.usage_tip && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        💡 {word.usage_tip}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleWordSelect(word.word)}
                    className={`ml-2 p-1 rounded transition-colors ${
                      selectedWords.has(word.word)
                        ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700'
                    }`}
                  >
                    {selectedWords.has(word.word) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabCoach;