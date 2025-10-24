import React, { useState, useEffect } from 'react';
import { List, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';

interface SentenceInfo {
  text: string;
  wordCount: number;
  type: string;
  lengthCategory: string;
  startsWithWord: string;
}

interface SentenceStructurePanelProps {
  text: string;
}

export const SentenceStructurePanel: React.FC<SentenceStructurePanelProps> = ({ text }) => {
  const [sentences, setSentences] = useState<SentenceInfo[]>([]);
  const [varietyScore, setVarietyScore] = useState<number>(0);
  const [averageLength, setAverageLength] = useState<number>(0);
  const [lengthDistribution, setLengthDistribution] = useState<{ [key: string]: number }>({});
  const [typeDistribution, setTypeDistribution] = useState<{ [key: string]: number }>({});
  const [repeatedStarters, setRepeatedStarters] = useState<{ word: string, count: number }[]>([]);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setSentences([]);
      setVarietyScore(0);
      setAverageLength(0);
      setLengthDistribution({});
      setTypeDistribution({});
      setRepeatedStarters([]);
      setIssues([]);
      return;
    }

    analyzeSentenceStructure(text);
  }, [text]);

  const analyzeSentenceStructure = (content: string) => {
    // Split into sentences
    const sentenceTexts = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const analyzedSentences: SentenceInfo[] = [];
    const starterCounts: { [key: string]: number } = {};
    const lengthCounts: { [key: string]: number } = { short: 0, medium: 0, long: 0 };
    const typeCounts: { [key: string]: number } = { simple: 0, compound: 0, complex: 0, 'compound-complex': 0 };
    let totalWords = 0;

    sentenceTexts.forEach(sentenceText => {
      const trimmed = sentenceText.trim();
      const words = trimmed.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      totalWords += wordCount;

      // Get sentence type
      const type = getSentenceType(trimmed);
      typeCounts[type]++;

      // Get length category
      const lengthCategory = getLengthCategory(wordCount);
      lengthCounts[lengthCategory]++;

      // Get starting word
      const startsWithWord = words[0]?.toLowerCase() || '';
      starterCounts[startsWithWord] = (starterCounts[startsWithWord] || 0) + 1;

      analyzedSentences.push({
        text: trimmed,
        wordCount,
        type,
        lengthCategory,
        startsWithWord
      });
    });

    // Calculate average length
    const avgLength = sentenceTexts.length > 0 ? totalWords / sentenceTexts.length : 0;

    // Find repeated sentence starters
    const repeated = Object.entries(starterCounts)
      .filter(([word, count]) => count >= 3 && word.length > 2)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate variety score and identify issues
    const varietyScore = calculateVarietyScore(
      lengthCounts,
      typeCounts,
      repeated,
      avgLength,
      sentenceTexts.length
    );

    const detectedIssues = identifyIssues(
      lengthCounts,
      typeCounts,
      repeated,
      avgLength,
      sentenceTexts.length
    );

    setSentences(analyzedSentences);
    setVarietyScore(Math.round(varietyScore));
    setAverageLength(Math.round(avgLength * 10) / 10);
    setLengthDistribution(lengthCounts);
    setTypeDistribution(typeCounts);
    setRepeatedStarters(repeated);
    setIssues(detectedIssues);
  };

  const getSentenceType = (sentence: string): string => {
    const coordinatingConjunctions = /(,\s*(and|but|or|nor|for|yet|so)\s+)/i;
    const subordinatingConjunctions = /(who|whom|whose|which|that|where|when|why|how|if|although|though|because|since|unless|while|as|after|before|until|whenever|wherever)\s+/i;

    const hasCoordinating = coordinatingConjunctions.test(sentence);
    const hasSubordinating = subordinatingConjunctions.test(sentence);

    if (hasCoordinating && hasSubordinating) {
      return 'compound-complex';
    } else if (hasCoordinating) {
      return 'compound';
    } else if (hasSubordinating) {
      return 'complex';
    } else {
      return 'simple';
    }
  };

  const getLengthCategory = (wordCount: number): string => {
    if (wordCount <= 8) return 'short';
    if (wordCount <= 18) return 'medium';
    return 'long';
  };

  const calculateVarietyScore = (
    lengthCounts: { [key: string]: number },
    typeCounts: { [key: string]: number },
    repeated: { word: string, count: number }[],
    avgLength: number,
    totalSentences: number
  ): number => {
    let score = 100;

    // Penalize for lack of length variety
    const totalLength = lengthCounts.short + lengthCounts.medium + lengthCounts.long;
    const lengthVariety = Object.values(lengthCounts).filter(c => c > 0).length;
    if (lengthVariety === 1) score -= 30;
    else if (lengthVariety === 2) score -= 15;

    // Penalize for lack of type variety
    const typeVariety = Object.values(typeCounts).filter(c => c > 0).length;
    if (typeVariety === 1) score -= 25;
    else if (typeVariety === 2) score -= 10;

    // Penalize for repeated starters
    score -= repeated.length * 5;

    // Penalize for extreme average length
    if (avgLength < 5 || avgLength > 25) score -= 15;

    // Penalize for too many simple sentences
    const simplePercent = (typeCounts.simple / totalSentences) * 100;
    if (simplePercent > 70) score -= 20;

    return Math.max(0, Math.min(100, score));
  };

  const identifyIssues = (
    lengthCounts: { [key: string]: number },
    typeCounts: { [key: string]: number },
    repeated: { word: string, count: number }[],
    avgLength: number,
    totalSentences: number
  ): string[] => {
    const issues: string[] = [];

    // Check length variety
    const lengthVariety = Object.values(lengthCounts).filter(c => c > 0).length;
    if (lengthVariety === 1) {
      issues.push('All sentences are the same length. Mix short, medium, and long sentences for better flow.');
    }

    // Check type variety
    const typeVariety = Object.values(typeCounts).filter(c => c > 0).length;
    if (typeVariety === 1) {
      issues.push('All sentences have the same structure. Try using compound, complex, or compound-complex sentences.');
    }

    // Check for too many simple sentences
    const simplePercent = (typeCounts.simple / totalSentences) * 100;
    if (simplePercent > 70) {
      issues.push(`${Math.round(simplePercent)}% of your sentences are simple. Add some compound or complex sentences for sophistication.`);
    }

    // Check for repeated starters
    if (repeated.length > 0) {
      issues.push(`You start multiple sentences with the same words (${repeated.map(r => `"${r.word}"`).join(', ')}). Vary your sentence beginnings.`);
    }

    // Check average length
    if (avgLength < 5) {
      issues.push('Your sentences are very short. Try combining some ideas for better flow.');
    } else if (avgLength > 25) {
      issues.push('Your sentences are quite long. Break some into shorter sentences for clarity.');
    }

    return issues;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreFeedback = (score: number): string => {
    if (score >= 90) return 'Outstanding sentence variety! Your writing has excellent rhythm and flow.';
    if (score >= 80) return 'Excellent variety! Your sentences are well-structured and diverse.';
    if (score >= 70) return 'Good variety. Consider adding more diverse sentence structures.';
    if (score >= 60) return 'Decent variety, but there\'s room for improvement in sentence structure.';
    return 'Your sentences need more variety. Try mixing different lengths and structures.';
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'simple': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
      case 'compound': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300';
      case 'complex': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300';
      case 'compound-complex': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300';
      default: return 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-300';
    }
  };

  const getLengthColor = (category: string): string => {
    switch (category) {
      case 'short': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'medium': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'long': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (sentences.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Start writing to see sentence structure analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <List className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Sentence Structure Variety
          </h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(varietyScore)}`}>
              {varietyScore}/100
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Variety Score</div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{getScoreFeedback(varietyScore)}</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{sentences.length}</div>
          <div className="text-xs text-blue-700 dark:text-blue-400">Total Sentences</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">{averageLength}</div>
          <div className="text-xs text-green-700 dark:text-green-400">Avg Words/Sentence</div>
        </div>
      </div>

      {/* Sentence Type Distribution */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-200">Sentence Types:</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(typeDistribution).map(([type, count]) => (
            count > 0 && (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 capitalize">{type}:</span>
                <span className="font-bold text-gray-900 dark:text-gray-200">{count}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Length Distribution */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-200">Sentence Lengths:</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-800 dark:text-yellow-400">{lengthDistribution.short || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Short (≤8)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-800 dark:text-green-400">{lengthDistribution.medium || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Medium (9-18)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-800 dark:text-blue-400">{lengthDistribution.long || 0}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Long (19+)</div>
          </div>
        </div>
      </div>

      {/* Issues and Recommendations */}
      {issues.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-red-900 dark:text-red-300 mb-2">Areas for Improvement:</h4>
              <ul className="space-y-1">
                {issues.map((issue, index) => (
                  <li key={index} className="text-xs text-red-800 dark:text-red-300 flex items-start gap-1">
                    <span className="mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Repeated Sentence Starters Warning */}
      {repeatedStarters.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm mb-2">Repeated Sentence Starters:</p>
              <div className="flex flex-wrap gap-2">
                {repeatedStarters.map(({ word, count }) => (
                  <span key={word} className="px-2 py-1 bg-white dark:bg-slate-700 border border-yellow-300 dark:border-yellow-600 rounded text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    "{word}" - {count} times
                  </span>
                ))}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Try starting sentences with different words or phrases for better variety.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Sentences */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-200 mb-2">Your Sentences:</h4>
        {sentences.map((sentence, index) => (
          <div key={index} className={`border rounded-lg p-2 ${getTypeColor(sentence.type)}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">#{index + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getLengthColor(sentence.lengthCategory)}`}>
                  {sentence.wordCount} words
                </span>
                <span className="text-xs font-medium capitalize">{sentence.type}</span>
              </div>
            </div>
            <p className="text-xs text-gray-700 italic mt-1">"{sentence.text}"</p>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p><strong>Tips for better sentence variety:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Mix short, punchy sentences with longer, flowing ones</li>
              <li>Start sentences with different words (avoid repeating the same starters)</li>
              <li>Use simple sentences for impact, compound for connection, complex for detail</li>
              <li>Aim for 12-18 words per sentence on average</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
