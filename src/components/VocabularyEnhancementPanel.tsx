import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, TrendingUp, ArrowRight, Lightbulb, Award } from 'lucide-react';

interface AIVocabularyEnhancement {
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
}

interface VocabularyWord {
  word: string;
  position: number;
  category: string;
  suggestions: string[];
  reason: string;
  context: string;
}

interface VocabularyEnhancementPanelProps {
  text: string;
  aiEnhancements?: AIVocabularyEnhancement[];
  onReplaceWord?: (position: number, originalWord: string, newWord: string) => void;
}

const BASIC_WORDS_TO_ENHANCE: { [key: string]: { suggestions: string[], reason: string } } = {
  // Verbs
  'said': { suggestions: ['exclaimed', 'whispered', 'announced', 'declared', 'stated'], reason: 'Use more descriptive dialogue tags' },
  'walked': { suggestions: ['strolled', 'wandered', 'marched', 'strode', 'meandered'], reason: 'Show how they moved' },
  'ran': { suggestions: ['sprinted', 'dashed', 'bolted', 'raced', 'hurried'], reason: 'Show the speed and urgency' },
  'looked': { suggestions: ['gazed', 'peered', 'glanced', 'stared', 'observed'], reason: 'Describe how they looked' },
  'went': { suggestions: ['traveled', 'journeyed', 'ventured', 'proceeded', 'advanced'], reason: 'Be more specific about movement' },
  'got': { suggestions: ['obtained', 'acquired', 'received', 'secured', 'gained'], reason: 'Use more formal vocabulary' },
  'made': { suggestions: ['created', 'constructed', 'crafted', 'formed', 'produced'], reason: 'Be more specific' },
  'put': { suggestions: ['placed', 'positioned', 'set', 'arranged', 'deposited'], reason: 'Show exactly how it was placed' },
  'saw': { suggestions: ['noticed', 'observed', 'witnessed', 'spotted', 'glimpsed'], reason: 'Describe what kind of seeing' },
  'felt': { suggestions: ['sensed', 'perceived', 'experienced', 'detected', 'recognized'], reason: 'Show the type of feeling' },

  // Adjectives
  'good': { suggestions: ['excellent', 'wonderful', 'outstanding', 'remarkable', 'exceptional'], reason: 'Use stronger positive words' },
  'bad': { suggestions: ['terrible', 'dreadful', 'awful', 'horrible', 'atrocious'], reason: 'Use stronger negative words' },
  'big': { suggestions: ['enormous', 'massive', 'gigantic', 'colossal', 'immense'], reason: 'Show exactly how big' },
  'small': { suggestions: ['tiny', 'minute', 'minuscule', 'petite', 'compact'], reason: 'Show exactly how small' },
  'nice': { suggestions: ['pleasant', 'delightful', 'charming', 'lovely', 'agreeable'], reason: 'Be more specific about what makes it nice' },
  'pretty': { suggestions: ['beautiful', 'lovely', 'attractive', 'elegant', 'gorgeous'], reason: 'Use more sophisticated descriptors' },
  'scary': { suggestions: ['terrifying', 'frightening', 'chilling', 'menacing', 'sinister'], reason: 'Show the intensity of fear' },
  'happy': { suggestions: ['joyful', 'delighted', 'elated', 'cheerful', 'content'], reason: 'Show the type of happiness' },
  'sad': { suggestions: ['sorrowful', 'melancholy', 'dejected', 'disheartened', 'downcast'], reason: 'Show the depth of sadness' },
  'old': { suggestions: ['ancient', 'antique', 'aged', 'elderly', 'weathered'], reason: 'Be more descriptive' },
  'new': { suggestions: ['fresh', 'novel', 'modern', 'recent', 'contemporary'], reason: 'Be more specific' },
  'cold': { suggestions: ['frigid', 'freezing', 'icy', 'chilly', 'frosty'], reason: 'Show the intensity of cold' },
  'hot': { suggestions: ['scorching', 'sweltering', 'blazing', 'searing', 'torrid'], reason: 'Show the intensity of heat' },

  // Adverbs
  'very': { suggestions: ['extremely', 'exceptionally', 'remarkably', 'tremendously', 'incredibly'], reason: 'Use stronger intensifiers' },
  'really': { suggestions: ['genuinely', 'truly', 'absolutely', 'undeniably', 'certainly'], reason: 'Be more emphatic' },
  'quickly': { suggestions: ['rapidly', 'swiftly', 'hastily', 'promptly', 'speedily'], reason: 'Show the pace more vividly' },
  'slowly': { suggestions: ['gradually', 'leisurely', 'unhurriedly', 'steadily', 'languidly'], reason: 'Show the pace more vividly' },

  // Nouns
  'thing': { suggestions: ['object', 'item', 'matter', 'element', 'aspect'], reason: 'Be specific about what it is' },
  'stuff': { suggestions: ['items', 'belongings', 'materials', 'possessions', 'objects'], reason: 'Use more formal language' },
  'lot': { suggestions: ['many', 'numerous', 'abundance', 'multitude', 'array'], reason: 'Be more precise' },
  'people': { suggestions: ['individuals', 'persons', 'citizens', 'residents', 'inhabitants'], reason: 'Be more specific about the group' },
  'kid': { suggestions: ['child', 'youngster', 'youth', 'juvenile', 'minor'], reason: 'Use more formal vocabulary' },
};

const OVERUSED_WORDS = ['and', 'but', 'so', 'then', 'just', 'that', 'get', 'like'];

export const VocabularyEnhancementPanel: React.FC<VocabularyEnhancementPanelProps> = ({
  text,
  aiEnhancements,
  onReplaceWord
}) => {
  const [enhancements, setEnhancements] = useState<VocabularyWord[]>([]);
  const [vocabularyScore, setVocabularyScore] = useState<number>(0);
  const [overusedWords, setOverusedWords] = useState<{ word: string, count: number }[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIVocabularyEnhancement[]>([]);

  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setEnhancements([]);
      setVocabularyScore(0);
      setOverusedWords([]);
      setAiSuggestions([]);
      return;
    }

    // Prioritize AI enhancements if available
    if (aiEnhancements && aiEnhancements.length > 0) {
      setAiSuggestions(aiEnhancements);
      // Don't run hardcoded analysis when we have AI suggestions
      setEnhancements([]);
    } else {
      // Fall back to hardcoded analysis
      analyzeVocabulary(text);
      setAiSuggestions([]);
    }
  }, [text, aiEnhancements]);

  const analyzeVocabulary = (content: string) => {
    const words = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordPositions: { [key: string]: number[] } = {};
    const wordCounts: { [key: string]: number } = {};

    let currentPos = 0;
    words.forEach((word, index) => {
      const position = content.toLowerCase().indexOf(word, currentPos);
      if (!wordPositions[word]) {
        wordPositions[word] = [];
      }
      wordPositions[word].push(position);
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      currentPos = position + word.length;
    });

    // Find words that can be enhanced
    const foundEnhancements: VocabularyWord[] = [];

    Object.keys(BASIC_WORDS_TO_ENHANCE).forEach(basicWord => {
      if (wordPositions[basicWord]) {
        wordPositions[basicWord].forEach(position => {
          const { suggestions, reason } = BASIC_WORDS_TO_ENHANCE[basicWord];
          const contextStart = Math.max(0, position - 20);
          const contextEnd = Math.min(content.length, position + basicWord.length + 20);
          const context = content.substring(contextStart, contextEnd);

          foundEnhancements.push({
            word: basicWord,
            position,
            category: getWordCategory(basicWord),
            suggestions,
            reason,
            context
          });
        });
      }
    });

    // Find overused words
    const overused = OVERUSED_WORDS
      .filter(word => wordCounts[word] >= 3)
      .map(word => ({ word, count: wordCounts[word] }))
      .sort((a, b) => b.count - a.count);

    // Calculate vocabulary score
    const uniqueWords = new Set(words.filter(w => w.length > 3));
    const totalWords = words.length;
    const varietyRatio = uniqueWords.size / totalWords;
    const basicWordCount = foundEnhancements.length;
    const score = Math.max(0, Math.min(100,
      (varietyRatio * 50) +
      (Math.max(0, 1 - (basicWordCount / totalWords)) * 50)
    ));

    setEnhancements(foundEnhancements);
    setVocabularyScore(Math.round(score));
    setOverusedWords(overused);
  };

  const getWordCategory = (word: string): string => {
    const verbs = ['said', 'walked', 'ran', 'looked', 'went', 'got', 'made', 'put', 'saw', 'felt'];
    const adjectives = ['good', 'bad', 'big', 'small', 'nice', 'pretty', 'scary', 'happy', 'sad', 'old', 'new', 'cold', 'hot'];
    const adverbs = ['very', 'really', 'quickly', 'slowly'];
    const nouns = ['thing', 'stuff', 'lot', 'people', 'kid'];

    if (verbs.includes(word)) return 'Verb';
    if (adjectives.includes(word)) return 'Adjective';
    if (adverbs.includes(word)) return 'Adverb';
    if (nouns.includes(word)) return 'Noun';
    return 'Other';
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Verb': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Adjective': return 'bg-green-50 border-green-200 text-green-800';
      case 'Adverb': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'Noun': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreFeedback = (score: number): string => {
    if (score >= 90) return 'Outstanding vocabulary! Your word choice is sophisticated and varied.';
    if (score >= 80) return 'Excellent vocabulary! Keep using diverse and interesting words.';
    if (score >= 70) return 'Good vocabulary variety. Try replacing a few more basic words.';
    if (score >= 60) return 'Decent vocabulary, but there\'s room for improvement.';
    return 'Focus on replacing basic words with more sophisticated alternatives.';
  };

  const handleReplaceWord = (enhancement: VocabularyWord, newWord: string) => {
    if (onReplaceWord) {
      onReplaceWord(enhancement.position, enhancement.word, newWord);
    }
  };

  if (enhancements.length === 0 && overusedWords.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-green-500 dark:text-green-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Excellent Vocabulary!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your word choice is strong and varied. No basic words detected that need enhancement.
          </p>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Vocabulary Score: </strong>
              <span className="text-2xl font-bold">{vocabularyScore}/100</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Vocabulary Enhancement
          </h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(vocabularyScore)}`}>
              {vocabularyScore}/100
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Vocabulary Score</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{getScoreFeedback(vocabularyScore)}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Found <strong>{enhancements.length}</strong> words that can be enhanced with more sophisticated alternatives
        </p>
      </div>

      {/* Overused Words Warning */}
      {overusedWords.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm mb-2">Overused Words Detected:</p>
              <div className="flex flex-wrap gap-2">
                {overusedWords.map(({ word, count }) => (
                  <span key={word} className="px-2 py-1 bg-white dark:bg-slate-700 border border-yellow-300 dark:border-yellow-600 rounded text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    "{word}" used {count} times
                  </span>
                ))}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Try to vary your word choice and use these words less frequently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI-Powered Vocabulary Enhancements */}
      {aiSuggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI-Powered Enhancements</h4>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">AI</span>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-purple-200 dark:border-purple-700 rounded-lg p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded text-sm font-medium line-through">
                      {suggestion.original}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded text-sm font-semibold">
                      {suggestion.suggestion}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong className="text-purple-700 dark:text-purple-300">Why:</strong> {suggestion.explanation}
                </p>
                {onReplaceWord && (
                  <button
                    onClick={() => onReplaceWord(suggestion.position.start, suggestion.original, suggestion.suggestion)}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply This Enhancement
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {enhancements.map((enhancement, index) => (
          <div
            key={`${enhancement.word}-${index}`}
            className={`border rounded-lg p-3 ${getCategoryColor(enhancement.category)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">{enhancement.category}</span>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Current word:</span>
              <div className="mt-1 font-mono text-sm bg-white dark:bg-slate-700 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 inline-block dark:text-gray-200">
                "{enhancement.word}"
              </div>
            </div>

            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Context:</span>
              <p className="text-xs italic text-gray-700 dark:text-gray-300 mt-1 bg-white dark:bg-slate-700 p-2 rounded border border-gray-200 dark:border-slate-600">
                ...{enhancement.context}...
              </p>
            </div>

            <div className="mb-2">
              <div className="flex items-start gap-1">
                <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0 dark:text-gray-400" />
                <p className="text-xs text-gray-700 dark:text-gray-300">{enhancement.reason}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Suggested alternatives:</p>
              <div className="flex flex-wrap gap-2">
                {enhancement.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReplaceWord(enhancement, suggestion)}
                    className="group px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1"
                  >
                    {suggestion}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Click on any suggested word to replace it in your text. Using varied and sophisticated vocabulary makes your writing more engaging and impressive!
          </p>
        </div>
      </div>
    </div>
  );
};
