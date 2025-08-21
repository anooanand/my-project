import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Star, TrendingUp, Search, Plus, Check, X, Lightbulb, Zap, Target, RefreshCw } from 'lucide-react';

interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: string;
  synonyms?: string[];
  usage_tip?: string;
}

interface VocabularyCategory {
  category: string;
  words: VocabularyWord[];
  description: string;
}

interface VocabularyBuilderProps {
  textType: string;
  currentContent: string;
  onWordSelect: (word: string) => void;
  onWordReplace: (originalWord: string, newWord: string) => void;
  className?: string;
  selectedText?: string;
}

interface WordSuggestion {
  original: string;
  suggestions: string[];
  context: string;
  reason: string;
  position?: { start: number; end: number };
}

interface RealTimeHighlight {
  word: string;
  suggestions: string[];
  position: { start: number; end: number };
  confidence: number;
}

export const VocabularyBuilder: React.FC<VocabularyBuilderProps> = ({
  textType,
  currentContent,
  onWordSelect,
  onWordReplace,
  className = '',
  selectedText = ''
}) => {
  const [vocabularyData, setVocabularyData] = useState<VocabularyCategory[]>([]);
  const [wordSuggestions, setWordSuggestions] = useState<WordSuggestion[]>([]);
  const [realTimeHighlights, setRealTimeHighlights] = useState<RealTimeHighlight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'categories' | 'suggestions' | 'realtime' | 'search'>('realtime');
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState<boolean>(true);
  const [selectedTextSuggestions, setSelectedTextSuggestions] = useState<string[]>([]);
  
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Real-time vocabulary analysis
  const analyzeContentForVocabulary = useCallback(async (content: string) => {
    if (!content || content.length < 10 || !autoSuggestEnabled) {
      setRealTimeHighlights([]);
      return;
    }

    try {
      // Simple word analysis for demonstration
      const words = content.toLowerCase().match(/\b\w+\b/g) || [];
      const commonWords = ['good', 'bad', 'nice', 'big', 'small', 'said', 'went', 'got', 'very', 'really'];
      
      const highlights: RealTimeHighlight[] = [];
      
      commonWords.forEach(commonWord => {
        const regex = new RegExp(`\\b${commonWord}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const suggestions = getSuggestionsForWord(commonWord);
          if (suggestions.length > 0) {
            highlights.push({
              word: commonWord,
              suggestions,
              position: { start: match.index, end: match.index + match[0].length },
              confidence: 0.8
            });
          }
        }
      });
      
      setRealTimeHighlights(highlights.slice(0, 10)); // Limit to 10 highlights
    } catch (error) {
      console.error('Error analyzing content for vocabulary:', error);
    }
  }, [autoSuggestEnabled]);

  // Get suggestions for a specific word
  const getSuggestionsForWord = (word: string): string[] => {
    const suggestionMap: { [key: string]: string[] } = {
      'good': ['excellent', 'outstanding', 'remarkable', 'superb', 'exceptional'],
      'bad': ['terrible', 'awful', 'dreadful', 'appalling', 'atrocious'],
      'nice': ['delightful', 'pleasant', 'wonderful', 'charming', 'lovely'],
      'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense'],
      'small': ['tiny', 'minuscule', 'petite', 'compact', 'diminutive'],
      'said': ['exclaimed', 'declared', 'announced', 'whispered', 'muttered'],
      'went': ['traveled', 'journeyed', 'ventured', 'proceeded', 'departed'],
      'got': ['obtained', 'acquired', 'received', 'secured', 'gained'],
      'very': ['extremely', 'incredibly', 'remarkably', 'exceptionally', 'tremendously'],
      'really': ['genuinely', 'truly', 'absolutely', 'certainly', 'definitely']
    };
    
    return suggestionMap[word.toLowerCase()] || [];
  };

  // Analyze selected text for vocabulary suggestions
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 0) {
      const words = selectedText.toLowerCase().match(/\b\w+\b/g) || [];
      const suggestions: string[] = [];
      
      words.forEach(word => {
        const wordSuggestions = getSuggestionsForWord(word);
        suggestions.push(...wordSuggestions);
      });
      
      setSelectedTextSuggestions([...new Set(suggestions)].slice(0, 6));
    } else {
      setSelectedTextSuggestions([]);
    }
  }, [selectedText]);

  // Debounced content analysis
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      analyzeContentForVocabulary(currentContent);
    }, 1000);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentContent, analyzeContentForVocabulary]);

  // Fetch vocabulary data based on text type
  const fetchVocabularyData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call with local data for demonstration
      const mockData: VocabularyCategory[] = [
        {
          category: 'Descriptive Words',
          description: 'Words to enhance descriptions and imagery',
          words: [
            {
              word: 'magnificent',
              definition: 'Extremely beautiful, elaborate, or impressive',
              example: 'The magnificent sunset painted the sky in brilliant colors.',
              difficulty: 'advanced',
              category: 'Descriptive Words',
              synonyms: ['splendid', 'glorious', 'superb'],
              usage_tip: 'Use for describing something truly impressive'
            },
            {
              word: 'serene',
              definition: 'Calm, peaceful, and untroubled',
              example: 'The serene lake reflected the mountains perfectly.',
              difficulty: 'intermediate',
              category: 'Descriptive Words',
              synonyms: ['tranquil', 'peaceful', 'calm'],
              usage_tip: 'Perfect for describing peaceful scenes'
            }
          ]
        },
        {
          category: 'Action Words',
          description: 'Dynamic verbs to make your writing more engaging',
          words: [
            {
              word: 'scrutinize',
              definition: 'To examine or inspect closely and thoroughly',
              example: 'She scrutinized the document for any errors.',
              difficulty: 'advanced',
              category: 'Action Words',
              synonyms: ['examine', 'inspect', 'analyze'],
              usage_tip: 'Use when describing careful examination'
            },
            {
              word: 'meander',
              definition: 'To follow a winding course or wander aimlessly',
              example: 'The river meandered through the valley.',
              difficulty: 'intermediate',
              category: 'Action Words',
              synonyms: ['wander', 'wind', 'snake'],
              usage_tip: 'Great for describing movement or paths'
            }
          ]
        }
      ];
      
      setVocabularyData(mockData);
    } catch (error) {
      console.error('Error fetching vocabulary data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [textType]);

  // Fetch vocabulary enhancement suggestions
  const fetchVocabularySuggestions = useCallback(async () => {
    if (currentContent.trim().length < 50) return;

    try {
      // Simulate API call with analysis of current content
      const words = currentContent.toLowerCase().match(/\b\w+\b/g) || [];
      const suggestions: WordSuggestion[] = [];
      
      const commonWords = ['good', 'bad', 'nice', 'big', 'small', 'said'];
      
      commonWords.forEach(word => {
        if (words.includes(word)) {
          suggestions.push({
            original: word,
            suggestions: getSuggestionsForWord(word),
            context: `Found in your ${textType} writing`,
            reason: `"${word}" is a common word. Try using more sophisticated alternatives to enhance your writing.`
          });
        }
      });
      
      setWordSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching vocabulary suggestions:', error);
    }
  }, [currentContent, textType]);

  useEffect(() => {
    fetchVocabularyData();
  }, [fetchVocabularyData]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchVocabularySuggestions();
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [fetchVocabularySuggestions]);

  const handleWordSelect = (word: string) => {
    setSelectedWords(prev => new Set([...prev, word]));
    onWordSelect(word);
  };

  const handleWordReplace = (originalWord: string, newWord: string) => {
    onWordReplace(originalWord, newWord);
    setSelectedWords(prev => new Set([...prev, newWord]));
  };

  const getDifficultyColor = (difficulty: VocabularyWord['difficulty']) => {
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

  const getDifficultyIcon = (difficulty: VocabularyWord['difficulty']) => {
    switch (difficulty) {
      case 'basic':
        return <Star className="h-3 w-3" />;
      case 'intermediate':
        return <TrendingUp className="h-3 w-3" />;
      case 'advanced':
        return <BookOpen className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  const filteredWords = vocabularyData
    .filter(category => selectedCategory === 'all' || category.category === selectedCategory)
    .flatMap(category => category.words)
    .filter(word => 
      searchTerm === '' || 
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const categories = vocabularyData.map(cat => cat.category);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Vocabulary Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enhance your {textType} writing with intelligent suggestions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                autoSuggestEnabled 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title={`Auto-suggest: ${autoSuggestEnabled ? 'On' : 'Off'}`}
            >
              <Zap className="h-4 w-4" />
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedWords.size} words selected
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'realtime'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="inline-block h-4 w-4 mr-1" />
            Smart Suggestions ({realTimeHighlights.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Target className="inline-block h-4 w-4 mr-1" />
            Improvements ({wordSuggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Selected Text Suggestions */}
      {selectedText && selectedTextSuggestions.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Suggestions for selected text: "{selectedText}"
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedTextSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleWordReplace(selectedText, suggestion)}
                className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'realtime' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Real-time Vocabulary Analysis</h4>
              <button
                onClick={() => analyzeContentForVocabulary(currentContent)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh analysis"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {!autoSuggestEnabled && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Auto-suggestions are disabled. Click the lightning bolt icon to enable real-time vocabulary analysis.
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {realTimeHighlights.length > 0 ? (
                realTimeHighlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="p-4 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Consider replacing:
                          </span>
                          <span className="font-medium text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded">
                            "{highlight.word}"
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {highlight.suggestions.map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestionIndex}
                              onClick={() => handleWordReplace(highlight.word, suggestion)}
                              className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-700 transition-colors font-medium"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-orange-500 h-1 rounded-full" 
                              style={{ width: `${highlight.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(highlight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentContent.trim().length < 10 
                      ? 'Start writing to get real-time vocabulary suggestions.'
                      : autoSuggestEnabled 
                        ? 'Your vocabulary looks great! Keep writing for more suggestions.'
                        : 'Enable auto-suggestions to get real-time vocabulary analysis.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on your current writing, here are some vocabulary improvements:
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {wordSuggestions.length > 0 ? (
                wordSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Replace:</span>
                          <span className="font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                            "{suggestion.original}"
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">With:</span>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.suggestions.map((word, wordIndex) => (
                              <button
                                key={wordIndex}
                                onClick={() => handleWordReplace(suggestion.original, word)}
                                className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors font-medium"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.reason}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentContent.trim().length < 50 
                      ? 'Write more content to get vocabulary suggestions.'
                      : 'No vocabulary improvements suggested at this time. Your word choices look great!'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            {/* Category Filter */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Words Grid */}
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading vocabulary...</p>
                </div>
              ) : filteredWords.length > 0 ? (
                filteredWords.map((word, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{word.word}</h4>
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(word.difficulty)}`}>
                            {getDifficultyIcon(word.difficulty)}
                            <span>{word.difficulty}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{word.definition}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                          <span className="font-medium">Example:</span> {word.example}
                        </div>
                        {word.usage_tip && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            <span className="font-medium">Tip:</span> {word.usage_tip}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleWordSelect(word.word)}
                        className={`ml-3 p-2 rounded-lg transition-colors ${
                          selectedWords.has(word.word)
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-purple-900 dark:hover:text-purple-400'
                        }`}
                      >
                        {selectedWords.has(word.word) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No vocabulary words found for this category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for words, definitions, or categories..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchTerm && filteredWords.length > 0 ? (
                filteredWords.map((word, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{word.word}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">({word.category})</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{word.definition}</p>
                      </div>
                      <button
                        onClick={() => handleWordSelect(word.word)}
                        className="ml-3 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No words found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Start typing to search for vocabulary words</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
