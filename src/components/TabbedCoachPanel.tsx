import React, { useState, useEffect } from 'react';
import { User, RefreshCw, Sparkles, Wand, Star, Bot, MessageSquare, BarChart3, BookOpen, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { CoachPanel } from './CoachPanel';
import { ParaphrasePanel } from './ParaphrasePanel';
import { checkOpenAIConnectionStatus } from '../lib/openai';
import './improved-layout.css';
import './writing-area-fix.css';

interface TabbedCoachPanelProps {
  content: string;
  textType: string;
  assistanceLevel: string;
  selectedText: string;
  onNavigate?: (page: string) => void;
}

type TabType = 'coach' | 'analysis' | 'vocabulary' | 'progress';

interface AIConnectionStatus {
  connected: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

export function TabbedCoachPanel({
  content,
  textType,
  assistanceLevel,
  selectedText,
  onNavigate
}: TabbedCoachPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('coach');
  const [localAssistanceLevel, setLocalAssistanceLevel] = useState<string>(assistanceLevel);
  const [aiStatus, setAIStatus] = useState<AIConnectionStatus>({
    connected: false,
    loading: true,
    lastChecked: null
  });

  // Update local assistance level when prop changes
  useEffect(() => {
    setLocalAssistanceLevel(assistanceLevel);
  }, [assistanceLevel]);

  // Check AI connection status on mount and periodically
  useEffect(() => {
    checkAIConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkAIConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAIConnection = async () => {
    setAIStatus(prev => ({ ...prev, loading: true }));
    try {
      const connected = await checkOpenAIConnectionStatus();
      setAIStatus({
        connected,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Failed to check AI connection:', error);
      setAIStatus({
        connected: false,
        loading: false,
        lastChecked: new Date()
      });
    }
  };

  const tabs = [
    {
      id: 'coach' as TabType,
      label: 'Coach',
      icon: Bot,
      description: 'Chat with your AI writing assistant',
      badge: aiStatus.connected ? '🤖' : '⚠️'
    },
    {
      id: 'analysis' as TabType,
      label: 'Analysis',
      icon: BarChart3,
      description: 'Real-time writing analysis and feedback'
    },
    {
      id: 'vocabulary' as TabType,
      label: 'Vocabulary',
      icon: BookOpen,
      description: 'Enhance your word choice and sophistication'
    },
    {
      id: 'progress' as TabType,
      label: 'Progress',
      icon: TrendingUp,
      description: 'Track your writing improvement over time'
    }
  ];

  const getWordCount = () => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    return content.length;
  };

  const getReadingTime = () => {
    const wordCount = getWordCount();
    return Math.ceil(wordCount / 200); // Average reading speed
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with AI Status */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-blue-600" />
              Writing Buddy
            </h3>
            <p className="text-sm text-gray-600">Your AI writing assistant</p>
          </div>
          
          {/* AI Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {aiStatus.loading ? (
                <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
              ) : aiStatus.connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                aiStatus.loading ? 'text-yellow-600' : 
                aiStatus.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {aiStatus.loading ? 'Connecting...' : 
                 aiStatus.connected ? 'AI Connected' : 'AI Offline'}
              </span>
            </div>
            
            {/* Quality Score */}
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Quality: 75%</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                title={tab.description}
              >
                <div className="flex items-center space-x-1">
                  <Icon className="w-4 h-4" />
                  {tab.badge && (
                    <span className="text-xs">{tab.badge}</span>
                  )}
                </div>
                <span className="mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coach' && (
          <CoachPanel
            content={content}
            textType={textType}
            assistanceLevel={localAssistanceLevel}
          />
        )}

        {activeTab === 'analysis' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="space-y-4">
              {/* Writing Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Writing Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{getWordCount()}</div>
                    <div className="text-xs text-gray-600">Words</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{getCharCount()}</div>
                    <div className="text-xs text-gray-600">Characters</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{getReadingTime()}</div>
                    <div className="text-xs text-gray-600">Min Read</div>
                  </div>
                </div>
              </div>

              {/* AI Writing Analysis */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">AI Writing Analysis</h4>
                {aiStatus.connected ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Spelling</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">0 issues</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Grammar</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">0 issues</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Vocabulary</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Good</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Structure</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Clear</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <WifiOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">AI analysis unavailable</p>
                    <p className="text-xs text-gray-500">Check your connection</p>
                  </div>
                )}
              </div>

              {/* NSW Selective Criteria */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">NSW Selective Criteria</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Ideas & Content</span>
                    <div className="flex space-x-1">
                      {[1,2,3,4].map(i => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                      <Star className="w-3 h-3 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Structure</span>
                    <div className="flex space-x-1">
                      {[1,2,3].map(i => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                      {[4,5].map(i => (
                        <Star key={i} className="w-3 h-3 text-gray-300" />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Language Use</span>
                    <div className="flex space-x-1">
                      {[1,2,3,4].map(i => (
                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                      <Star className="w-3 h-3 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Vocabulary Enhancement
                </h4>
                {aiStatus.connected ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Suggestion:</strong> Instead of "said", try:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['whispered', 'exclaimed', 'muttered', 'declared'].map(word => (
                          <span key={word} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs cursor-pointer hover:bg-blue-200">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Advanced words for {textType}:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['magnificent', 'extraordinary', 'bewildering', 'captivating'].map(word => (
                          <span key={word} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs cursor-pointer hover:bg-purple-200">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">AI vocabulary help unavailable</p>
                    <button 
                      onClick={checkAIConnection}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Try reconnecting
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Writing Progress
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-700">Overall Quality</span>
                      <span className="text-indigo-800 font-medium">75%</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-700">Vocabulary Sophistication</span>
                      <span className="text-indigo-800 font-medium">68%</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-700">Structure & Flow</span>
                      <span className="text-indigo-800 font-medium">82%</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-3">Recent Achievements</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Used advanced vocabulary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Strong story structure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Engaging introduction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
