import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Clock, 
  Target, 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  Award,
  MessageCircle,
  Send,
  Bot,
  User,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Timer
} from 'lucide-react';

interface WritingAreaProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  onTimerStart: (shouldStart: boolean) => void;
  onSubmit: () => void;
  onTextTypeChange?: (textType: string) => void;
  onPopupCompleted?: () => void;
  onPromptGenerated?: (prompt: string) => void;
  prompt?: string;
}

export const WritingArea: React.FC<WritingAreaProps> = ({
  content,
  onChange,
  textType,
  onTimerStart,
  onSubmit,
  onTextTypeChange,
  onPopupCompleted,
  onPromptGenerated,
  prompt: externalPrompt
}) => {
  const [prompt, setPrompt] = useState('');
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'bot',
      message: "Hi! I'm your Writing Buddy. I can help you with text analysis, vocabulary suggestions, grammar tips, and writing structure advice. What would you like help with today?"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Load prompt from localStorage or use external prompt
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    } else {
      const savedPrompt = localStorage.getItem(`${textType}_prompt`);
      if (savedPrompt) {
        setPrompt(savedPrompt);
      }
    }
  }, [textType, externalPrompt]);

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);

    // Simulate AI response based on the question
    setTimeout(() => {
      let botResponse = '';
      
      if (userMessage.toLowerCase().includes('analyze') || userMessage.toLowerCase().includes('feedback')) {
        botResponse = `I've analyzed your ${textType} writing. Here's my feedback:\n\n• Word count: ${wordCount} words\n• Reading time: ${readingTime} minutes\n• Structure: Your writing shows good organization\n• Vocabulary: Consider using more varied sentence structures\n• Next steps: Focus on adding more descriptive details`;
      } else if (userMessage.toLowerCase().includes('vocabulary') || userMessage.toLowerCase().includes('synonym')) {
        botResponse = `Here are some vocabulary suggestions for your ${textType}:\n\n• Use "compelling" instead of "interesting"\n• Try "demonstrate" instead of "show"\n• Consider "elaborate" instead of "explain"\n• Use "consequently" instead of "so"`;
      } else if (userMessage.toLowerCase().includes('grammar') || userMessage.toLowerCase().includes('style')) {
        botResponse = `Grammar and style tips for your ${textType}:\n\n• Vary your sentence lengths for better flow\n• Use active voice when possible\n• Check for comma splices\n• Ensure subject-verb agreement\n• Consider using transition words between paragraphs`;
      } else if (userMessage.toLowerCase().includes('structure') || userMessage.toLowerCase().includes('organize')) {
        botResponse = getStructureAdvice(textType);
      } else if (userMessage.toLowerCase().includes('planning') || userMessage.toLowerCase().includes('plan')) {
        botResponse = getPlanningAdvice(textType);
      } else {
        botResponse = `I can help you with:\n\n• Text analysis and feedback\n• Vocabulary suggestions\n• Grammar and style tips\n• Writing structure advice\n• Planning and organization\n\nWhat specific aspect would you like help with?`;
      }

      setChatMessages(prev => [...prev, { type: 'bot', message: botResponse }]);
    }, 1000);
  };

  const getStructureAdvice = (textType: string) => {
    const advice = {
      narrative: "For narrative writing:\n\n• Start with a compelling hook\n• Develop characters with clear motivations\n• Use chronological or flashback structure\n• Include dialogue to show character\n• End with a satisfying resolution",
      persuasive: "For persuasive writing:\n\n• State your position clearly in the introduction\n• Present strongest arguments first\n• Use evidence and examples\n• Address counterarguments\n• End with a call to action",
      expository: "For expository writing:\n\n• Begin with a clear thesis statement\n• Organize main points logically\n• Use topic sentences for each paragraph\n• Include supporting details and examples\n• Conclude by restating key points"
    };
    return advice[textType as keyof typeof advice] || advice.narrative;
  };

  const getPlanningAdvice = (textType: string) => {
    const advice = {
      narrative: "Planning your narrative:\n\n• Character: Who is your protagonist?\n• Setting: Where and when does it take place?\n• Conflict: What problem drives the story?\n• Plot: What are the key events?\n• Theme: What message do you want to convey?",
      persuasive: "Planning your persuasive piece:\n\n• Position: What is your main argument?\n• Audience: Who are you trying to convince?\n• Evidence: What facts support your position?\n• Counterarguments: What objections might arise?\n• Call to action: What do you want readers to do?",
      expository: "Planning your expository text:\n\n• Topic: What are you explaining?\n• Purpose: Why is this information important?\n• Main points: What are the key concepts?\n• Organization: How will you structure the information?\n• Examples: What details will clarify your points?"
    };
    return advice[textType as keyof typeof advice] || advice.narrative;
  };

  const handleAnalyzeText = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const analysisMessage = `Analysis of your ${textType} (${wordCount} words):\n\n✅ Strengths:\n• Good use of descriptive language\n• Clear paragraph structure\n• Appropriate tone for ${textType}\n\n🎯 Areas for improvement:\n• Consider varying sentence length\n• Add more specific examples\n• Strengthen your conclusion\n\n📈 Score: 8/10 - Well done!`;
      
      setChatMessages(prev => [...prev, { type: 'bot', message: analysisMessage }]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleParaphrase = async (text: string) => {
    const paraphrased = `Here's a paraphrased version:\n\n"${text.substring(0, 100)}..." could be rewritten as:\n\n"${text.substring(0, 100).replace(/\b\w+\b/g, (word) => {
      const synonyms: { [key: string]: string } = {
        'good': 'excellent',
        'bad': 'poor',
        'big': 'large',
        'small': 'tiny',
        'said': 'stated',
        'went': 'traveled'
      };
      return synonyms[word.toLowerCase()] || word;
    })}..."`;
    
    setChatMessages(prev => [...prev, { type: 'bot', message: paraphrased }]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const tabs = [
    { id: 'analysis', label: 'Text Type Analysis', icon: BookOpen },
    { id: 'vocabulary', label: 'Vocabulary Sophistication', icon: Lightbulb },
    { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
    { id: 'coaching', label: 'Coaching Tips', icon: Award }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Writing Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
                  <div className="text-sm text-gray-600">Word Count</div>
                  <div className="text-xs text-gray-500 mt-1">Target: 250-300 words</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{readingTime}</div>
                  <div className="text-sm text-gray-600">Reading Time</div>
                  <div className="text-xs text-gray-500 mt-1">Based on 200 words/minute</div>
                </div>
              </div>

              <button
                onClick={handleAnalyzeText}
                disabled={isAnalyzing || wordCount === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Text Type
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'vocabulary':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Paraphrase Tool
              </h3>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Standard</h4>
                  <p className="text-sm text-gray-600">Balanced rewriting with natural flow</p>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Formal</h4>
                  <p className="text-sm text-gray-600">Academic and professional tone</p>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Creative</h4>
                  <p className="text-sm text-gray-600">Imaginative and expressive rewriting</p>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Concise</h4>
                  <p className="text-sm text-gray-600">Shorter, more direct version</p>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Expand</h4>
                  <p className="text-sm text-gray-600">Detailed, elaborated version</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Text
                </label>
                <textarea
                  placeholder="Enter or paste text to paraphrase..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={() => handleParaphrase("Sample text for paraphrasing")}
                  className="mt-2 w-full bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Paraphrase
                </button>
              </div>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Writing Progress
              </h3>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily Goal</span>
                    <span className="text-sm text-green-600">250 words</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((wordCount / 250) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {wordCount}/250 words ({Math.round((wordCount / 250) * 100)}%)
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Characters:</span>
                      <span className="font-medium ml-1">{charCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Paragraphs:</span>
                      <span className="font-medium ml-1">{content.split('\n\n').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Streak</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-orange-500">3</span>
                    <span className="text-sm text-gray-600 ml-2">days in a row!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'coaching':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                AI Writing Coach
              </h3>
              
              {/* Chat Interface */}
              <div className="bg-white rounded-lg border border-purple-200 h-64 flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'user' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {msg.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          {msg.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          <div className="text-sm whitespace-pre-line">{msg.message}</div>
                        </div>
                        {msg.type === 'bot' && (
                          <button
                            onClick={() => copyToClipboard(msg.message)}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center"
                          >
                            {copiedText === msg.message ? (
                              <><Check className="w-3 h-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3 mr-1" /> Copy</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 p-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="Ask me about your writing..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChatInput("Can you analyze my writing?")}
                  className="text-xs bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Analyze Writing
                </button>
                <button
                  onClick={() => setChatInput("Give me vocabulary suggestions")}
                  className="text-xs bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Vocabulary Help
                </button>
                <button
                  onClick={() => setChatInput("How can I improve my structure?")}
                  className="text-xs bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Structure Tips
                </button>
                <button
                  onClick={() => setChatInput("Help me plan my writing")}
                  className="text-xs bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Planning Help
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="writing-area-container h-full flex flex-col bg-gray-50">
      {/* Prompt Display */}
      {prompt && (
        <div className="prompt-section bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4 flex-shrink-0">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Writing Prompt</h3>
              <p className="text-blue-700 leading-relaxed">{prompt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Writing Area */}
        <div className="flex-1 flex flex-col p-4">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 leading-relaxed"
            style={{ minHeight: '400px', fontSize: '16px', lineHeight: '1.6' }}
          />
          
          {/* Stats Bar */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {wordCount} words
              </span>
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {charCount} characters
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Writing Buddy Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex-shrink-0">
            <h2 className="text-xl font-bold">Writing Buddy</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <tab.icon className="w-4 h-4" />
                    <span className="text-center leading-tight">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};