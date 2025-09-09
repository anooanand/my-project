import React, { useState, useEffect } from 'react';
import { Eye, Zap, BarChart3, BookOpen, Lightbulb, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface WritingTechniqueModulesProps {
  essay: string;
  onTechniqueUpdate?: (technique: string, data: any) => void;
}

export function WritingTechniqueModules({ essay, onTechniqueUpdate }: WritingTechniqueModulesProps) {
  const [activeModule, setActiveModule] = useState('show-tell');
  const [showTellData, setShowTellData] = useState<any>(null);
  const [literaryDevicesData, setLiteraryDevicesData] = useState<any>(null);
  const [sentenceVarietyData, setSentenceVarietyData] = useState<any>(null);

  useEffect(() => {
    if (essay) {
      analyzeShowDontTell();
      analyzeLiteraryDevices();
      analyzeSentenceVariety();
    }
  }, [essay]);

  const analyzeShowDontTell = () => {
    // Analyze the essay for "showing" vs "telling"
    const tellingPhrases = [
      { phrase: "was happy", suggestion: "smiled broadly, eyes sparkling with joy" },
      { phrase: "was sad", suggestion: "tears welled up in his eyes" },
      { phrase: "was angry", suggestion: "clenched his fists, jaw tightening" },
      { phrase: "was scared", suggestion: "heart pounded against his ribs" },
      { phrase: "was tired", suggestion: "eyelids drooped, shoulders sagged" },
      { phrase: "was excited", suggestion: "bounced on his toes, unable to stand still" },
      { phrase: "felt nervous", suggestion: "palms grew sweaty, stomach churned" },
      { phrase: "was confused", suggestion: "furrowed his brow, tilted his head" }
    ];

    const showingIndicators = [
      "eyes", "smiled", "frowned", "whispered", "shouted", "trembled", "shivered",
      "heart", "breath", "hands", "fingers", "shoulders", "voice", "tears"
    ];

    const tellingInstances = [];
    const showingInstances = [];

    // Find telling instances
    tellingPhrases.forEach(item => {
      const regex = new RegExp(item.phrase, 'gi');
      const matches = essay.match(regex);
      if (matches) {
        matches.forEach(match => {
          tellingInstances.push({
            text: match,
            suggestion: item.suggestion,
            position: essay.indexOf(match)
          });
        });
      }
    });

    // Find showing instances
    showingIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b\\w*${indicator}\\w*\\b`, 'gi');
      const matches = essay.match(regex);
      if (matches) {
        matches.forEach(match => {
          const context = getContextAroundWord(essay, match);
          if (context && !showingInstances.some(instance => instance.includes(match))) {
            showingInstances.push(context);
          }
        });
      }
    });

    const showTellRatio = showingInstances.length / (tellingInstances.length + showingInstances.length + 1) * 100;

    const data = {
      ratio: showTellRatio,
      tellingInstances,
      showingInstances: showingInstances.slice(0, 5), // Limit to top 5
      recommendations: generateShowTellRecommendations(showTellRatio)
    };

    setShowTellData(data);
    onTechniqueUpdate?.('show-tell', data);
  };

  const analyzeLiteraryDevices = () => {
    const devices = {
      metaphor: { pattern: /is a|was a|are|were/, examples: [] },
      simile: { pattern: /like|as.*as/, examples: [] },
      personification: { pattern: /\b(wind|sun|moon|tree|flower|stone|light)\s+(whispered|danced|sang|smiled|frowned|watched|listened|spoke|called|reached|embraced)\b/gi, examples: [] },
      alliteration: { pattern: /\b(\w)\w*\s+\1\w*/gi, examples: [] },
      onomatopoeia: { pattern: /\b(bang|crash|whisper|buzz|hiss|pop|crack|splash|thud|whoosh)\b/gi, examples: [] },
      imagery: { pattern: /\b(crimson|golden|silver|emerald|azure|velvet|silk|rough|smooth|bitter|sweet|sour|fragrant|pungent)\b/gi, examples: [] }
    };

    const identifiedDevices = [];
    const suggestions = [];

    // Analyze each device type
    Object.entries(devices).forEach(([deviceName, deviceData]) => {
      const matches = essay.match(deviceData.pattern);
      if (matches && matches.length > 0) {
        identifiedDevices.push({
          name: deviceName,
          count: matches.length,
          examples: matches.slice(0, 3).map(match => getContextAroundWord(essay, match))
        });
      } else {
        suggestions.push(generateDeviceSuggestion(deviceName));
      }
    });

    const data = {
      identified: identifiedDevices,
      suggestions: suggestions.slice(0, 3), // Limit suggestions
      score: Math.min(identifiedDevices.length * 15, 100),
      recommendations: generateLiteraryDeviceRecommendations(identifiedDevices.length)
    };

    setLiteraryDevicesData(data);
    onTechniqueUpdate?.('literary-devices', data);
  };

  const analyzeSentenceVariety = () => {
    const sentences = essay.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let simple = 0;
    let compound = 0;
    let complex = 0;

    sentences.forEach(sentence => {
      const hasCoordinating = /\b(and|but|or|nor|for|so|yet)\b/.test(sentence);
      const hasSubordinating = /\b(because|since|when|while|if|although|though|unless|until|before|after|as)\b/.test(sentence);
      const hasRelative = /\b(who|whom|whose|which|that)\b/.test(sentence);

      if (hasSubordinating || hasRelative) {
        complex++;
      } else if (hasCoordinating || sentence.includes(',')) {
        compound++;
      } else {
        simple++;
      }
    });

    const total = simple + compound + complex;
    const varietyScore = calculateVarietyScore(simple, compound, complex, total);

    const data = {
      simple,
      compound,
      complex,
      total,
      varietyScore,
      recommendations: generateSentenceVarietyRecommendations(simple, compound, complex, total),
      suggestions: generateSentenceImprovements(sentences)
    };

    setSentenceVarietyData(data);
    onTechniqueUpdate?.('sentence-variety', data);
  };

  // Helper functions
  const getContextAroundWord = (text: string, word: string) => {
    const index = text.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return null;
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + word.length + 30);
    return text.substring(start, end).trim();
  };

  const generateShowTellRecommendations = (ratio: number) => {
    if (ratio >= 80) return ["Excellent use of 'showing'! Your writing is vivid and engaging."];
    if (ratio >= 60) return ["Good balance of showing and telling. Try to convert a few more 'telling' statements."];
    if (ratio >= 40) return ["You're on the right track. Focus on showing emotions through actions and sensory details."];
    return ["Try to show more through actions, dialogue, and sensory details rather than stating facts directly."];
  };

  const generateDeviceSuggestion = (device: string) => {
    const suggestions = {
      metaphor: "Try comparing two unlike things directly: 'Her voice was music to his ears'",
      simile: "Use 'like' or 'as' to make comparisons: 'The stone glowed like a captured star'",
      personification: "Give human qualities to non-human things: 'The wind whispered secrets'",
      alliteration: "Use words that start with the same sound: 'silent, silver moonlight'",
      onomatopoeia: "Include sound words: 'The door creaked open'",
      imagery: "Add sensory details: colors, textures, smells, sounds, tastes"
    };
    return suggestions[device] || `Consider adding ${device} to enhance your writing.`;
  };

  const generateLiteraryDeviceRecommendations = (count: number) => {
    if (count >= 4) return ["Excellent use of literary devices! Your writing is rich and engaging."];
    if (count >= 2) return ["Good use of literary devices. Try adding one or two more for even greater impact."];
    return ["Consider incorporating more literary devices to make your writing more vivid and engaging."];
  };

  const calculateVarietyScore = (simple: number, compound: number, complex: number, total: number) => {
    if (total === 0) return 0;
    
    const simpleRatio = simple / total;
    const compoundRatio = compound / total;
    const complexRatio = complex / total;
    
    // Ideal ratios: 40% simple, 30% compound, 30% complex
    const idealSimple = 0.4;
    const idealCompound = 0.3;
    const idealComplex = 0.3;
    
    const deviation = Math.abs(simpleRatio - idealSimple) + 
                     Math.abs(compoundRatio - idealCompound) + 
                     Math.abs(complexRatio - idealComplex);
    
    return Math.max(0, 100 - (deviation * 100));
  };

  const generateSentenceVarietyRecommendations = (simple: number, compound: number, complex: number, total: number) => {
    const recommendations = [];
    
    if (simple / total > 0.6) {
      recommendations.push("Try combining some simple sentences using conjunctions like 'and', 'but', or 'because'.");
    }
    
    if (compound / total < 0.2) {
      recommendations.push("Add more compound sentences by joining related ideas with coordinating conjunctions.");
    }
    
    if (complex / total < 0.2) {
      recommendations.push("Include more complex sentences using subordinating conjunctions like 'when', 'because', or 'although'.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Great sentence variety! Your writing has a good mix of simple, compound, and complex sentences.");
    }
    
    return recommendations;
  };

  const generateSentenceImprovements = (sentences: string[]) => {
    const improvements = [];
    
    // Check for repetitive sentence starters
    const starters = sentences.map(s => s.trim().split(' ')[0]?.toLowerCase()).filter(Boolean);
    const starterCounts = starters.reduce((acc, starter) => {
      acc[starter] = (acc[starter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const repetitiveStarters = Object.entries(starterCounts)
      .filter(([starter, count]) => count > 2)
      .map(([starter]) => starter);
    
    if (repetitiveStarters.length > 0) {
      improvements.push(`Vary your sentence beginnings. You start ${repetitiveStarters.length} sentences with "${repetitiveStarters[0]}".`);
    }
    
    // Check for very short sentences
    const shortSentences = sentences.filter(s => s.trim().split(' ').length < 5).length;
    if (shortSentences > sentences.length * 0.4) {
      improvements.push("Consider combining some short sentences to create more complex structures.");
    }
    
    // Check for very long sentences
    const longSentences = sentences.filter(s => s.trim().split(' ').length > 25).length;
    if (longSentences > 0) {
      improvements.push("Some sentences are quite long. Consider breaking them into shorter, clearer sentences.");
    }
    
    return improvements.slice(0, 3);
  };

  const ShowDontTellMeter = () => {
    if (!showTellData) return <div>Analyzing...</div>;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Show, Don't Tell Meter</h3>
            <div className="text-3xl font-bold">{showTellData.ratio.toFixed(0)}%</div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4">
            <div 
              className="bg-white h-4 rounded-full transition-all duration-1000"
              style={{ width: `${showTellData.ratio}%` }}
            />
          </div>
          <p className="mt-2 text-sm opacity-90">
            {showTellData.recommendations[0]}
          </p>
        </div>

        {showTellData.showingInstances.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h4 className="flex items-center text-green-700 dark:text-green-400 font-semibold mb-4">
              <Eye className="w-5 h-5 mr-2" />
              Great Examples of "Showing"
            </h4>
            <div className="space-y-2">
              {showTellData.showingInstances.map((instance: string, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-green-400">
                  <code className="text-sm text-green-800 dark:text-green-300">{instance}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {showTellData.tellingInstances.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
            <h4 className="flex items-center text-orange-700 dark:text-orange-400 font-semibold mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              Opportunities to "Show" Instead
            </h4>
            <div className="space-y-4">
              {showTellData.tellingInstances.slice(0, 3).map((instance: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded border-l-4 border-orange-400">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Instead of:</span>
                    <code className="block text-sm text-orange-700 dark:text-orange-300 mt-1">{instance.text}</code>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">Try:</span>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">{instance.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const LiteraryDevicesFeature = () => {
    if (!literaryDevicesData) return <div>Analyzing...</div>;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Literary Devices Scanner</h3>
            <div className="text-3xl font-bold">{literaryDevicesData.score}%</div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4">
            <div 
              className="bg-white h-4 rounded-full transition-all duration-1000"
              style={{ width: `${literaryDevicesData.score}%` }}
            />
          </div>
          <p className="mt-2 text-sm opacity-90">
            {literaryDevicesData.recommendations[0]}
          </p>
        </div>

        {literaryDevicesData.identified.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
            <h4 className="flex items-center text-purple-700 dark:text-purple-400 font-semibold mb-4">
              <Zap className="w-5 h-5 mr-2" />
              Literary Devices Found
            </h4>
            <div className="grid gap-4">
              {literaryDevicesData.identified.map((device: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded border-l-4 border-purple-400">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-purple-800 dark:text-purple-300 capitalize">
                      {device.name}
                    </h5>
                    <span className="text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                      {device.count} found
                    </span>
                  </div>
                  {device.examples.map((example: string, exIndex: number) => (
                    <code key={exIndex} className="block text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {example}
                    </code>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {literaryDevicesData.suggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h4 className="flex items-center text-blue-700 dark:text-blue-400 font-semibold mb-4">
              <Lightbulb className="w-5 h-5 mr-2" />
              Suggested Literary Devices to Try
            </h4>
            <div className="space-y-3">
              {literaryDevicesData.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SentenceVarietyAnalyzer = () => {
    if (!sentenceVarietyData) return <div>Analyzing...</div>;

    const { simple, compound, complex, total, varietyScore } = sentenceVarietyData;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Sentence Variety Analyzer</h3>
            <div className="text-3xl font-bold">{varietyScore.toFixed(0)}%</div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4">
            <div 
              className="bg-white h-4 rounded-full transition-all duration-1000"
              style={{ width: `${varietyScore}%` }}
            />
          </div>
          <p className="mt-2 text-sm opacity-90">
            {sentenceVarietyData.recommendations[0]}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{simple}</div>
            <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">Simple</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {total > 0 ? ((simple / total) * 100).toFixed(0) : 0}%
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: total > 0 ? `${(simple / total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{compound}</div>
            <div className="text-sm text-green-800 dark:text-green-300 font-medium">Compound</div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {total > 0 ? ((compound / total) * 100).toFixed(0) : 0}%
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: total > 0 ? `${(compound / total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{complex}</div>
            <div className="text-sm text-purple-800 dark:text-purple-300 font-medium">Complex</div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {total > 0 ? ((complex / total) * 100).toFixed(0) : 0}%
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: total > 0 ? `${(complex / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {sentenceVarietyData.suggestions.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
            <h4 className="flex items-center text-indigo-700 dark:text-indigo-400 font-semibold mb-4">
              <TrendingUp className="w-5 h-5 mr-2" />
              Suggestions for Better Variety
            </h4>
            <div className="space-y-3">
              {sentenceVarietyData.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-indigo-400">
                  <p className="text-sm text-indigo-800 dark:text-indigo-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const modules = [
    { id: 'show-tell', label: 'Show, Don\'t Tell', icon: Eye, component: ShowDontTellMeter },
    { id: 'literary-devices', label: 'Literary Devices', icon: Zap, component: LiteraryDevicesFeature },
    { id: 'sentence-variety', label: 'Sentence Variety', icon: BarChart3, component: SentenceVarietyAnalyzer }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Advanced Writing Technique Modules</h1>
        <p className="text-blue-100">Master the art of engaging narrative writing with these interactive tools</p>
      </div>

      {/* Module Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeModule === module.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{module.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div>
        {modules.find(m => m.id === activeModule)?.component()}
      </div>
    </div>
  );
}
