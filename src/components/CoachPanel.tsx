import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  BookOpen, 
  Target, 
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Clock,
  User,
  Bot,
  Star,
  Award,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

interface NSWCoachPanelProps {
  content: string;
  textType: string;
  onContentChange?: (content: string) => void;
  onFeedbackReceived?: (feedback: any) => void;
  className?: string;
}

interface NSWCriterion {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tips: string[];
  currentScore?: number;
  maxScore: number;
}

interface CoachMessage {
  id: string;
  type: 'user' | 'ai' | 'tip' | 'criterion';
  content: string;
  timestamp: Date;
  criterion?: string;
  isExpanded?: boolean;
}

const NSWCoachPanel: React.FC<NSWCoachPanelProps> = ({
  content,
  textType,
  onContentChange,
  onFeedbackReceived,
  className = ""
}) => {
  // NSW Selective Writing Criteria
  const nswCriteria: NSWCriterion[] = [
    {
      id: 'ideas',
      name: 'Ideas & Content',
      shortName: 'Ideas',
      description: 'Creative, original ideas with clear central theme',
      icon: <Lightbulb className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      tips: [
        'Start with a unique, interesting idea',
        'Develop your main character\'s personality',
        'Add unexpected plot twists',
        'Show emotions through actions, not just words'
      ],
      maxScore: 5
    },
    {
      id: 'language',
      name: 'Language & Vocabulary',
      shortName: 'Language',
      description: 'Sophisticated vocabulary and varied sentence structure',
      icon: <BookOpen className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      tips: [
        'Use vivid, descriptive words',
        'Try metaphors and similes',
        'Vary your sentence lengths',
        'Include sensory details (sight, sound, smell, touch, taste)'
      ],
      maxScore: 5
    },
    {
      id: 'structure',
      name: 'Structure & Organization',
      shortName: 'Structure',
      description: 'Clear beginning, middle, end with logical flow',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700 border-green-200',
      tips: [
        'Hook your reader in the first sentence',
        'Build tension towards a climax',
        'Use paragraphs to organize your ideas',
        'End with a satisfying conclusion'
      ],
      maxScore: 5
    },
    {
      id: 'technical',
      name: 'Spelling & Grammar',
      shortName: 'Technical',
      description: 'Accurate spelling, punctuation, and grammar',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      tips: [
        'Check your spelling carefully',
        'Use correct punctuation',
        'Make sure sentences are complete',
        'Proofread before submitting'
      ],
      maxScore: 5
    }
  ];

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'criteria'>('chat');
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Update word count when content changes
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(content.trim() ? words : 0);
  }, [content]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: CoachMessage = {
        id: 'greeting',
        type: 'ai',
        content: `Hi! I'm your AI Writing Buddy! 🌟 I'm here to help you write amazing stories for the NSW Selective Test. Ask me anything about writing, or just start typing and I'll give you feedback!`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: CoachMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = generateAIResponse(currentInput, wordCount, textType);
      
      const aiMessage: CoachMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIResponse = (input: string, wordCount: number, textType: string): string => {
    // Simple response generation (replace with actual AI service)
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('character')) {
      return `Great question! 😊 To develop your main character, try using dialogue to show their voice and feelings—what they say can reveal a lot about who they are. You can also describe their actions and reactions; for example, are they brave, scared, or curious? Adding little details about their thoughts or memories can really help readers connect with them emotionally. Keep up the awesome work! 💪✨`;
    }
    
    if (lowerInput.includes('start') || lowerInput.includes('beginning')) {
      return `✨ Great start! To make your opening even more engaging, try starting with action, dialogue, or an intriguing question. Hook your reader from the very first sentence! For example, instead of "It was a dark night," try "The floorboards creaked as I tiptoed through the abandoned house." Keep going! 🌟`;
    }
    
    if (wordCount > 0) {
      return `You're making great progress with ${wordCount} words! 🎉 To make your writing even stronger, try adding sensory details - what can your character see, hear, smell, or feel? This helps readers feel like they're right there in the story. What happens next in your adventure?`;
    }
    
    return `I'm here to help you write an amazing ${textType}! You can ask me about character development, plot ideas, descriptive language, or anything else. What would you like to work on? 📝✨`;
  };

  const toggleCriterion = (criterionId: string) => {
    setExpandedCriteria(prev => {
      const newSet = new Set(prev);
      if (newSet.has(criterionId)) {
        newSet.delete(criterionId);
      } else {
        newSet.add(criterionId);
      }
      return newSet;
    });
  };

  const addCriterionTip = (criterion: NSWCriterion) => {
    const randomTip = criterion.tips[Math.floor(Math.random() * criterion.tips.length)];
    const tipMessage: CoachMessage = {
      id: `tip_${Date.now()}`,
      type: 'tip',
      content: `💡 **${criterion.shortName} Tip:** ${randomTip}`,
      timestamp: new Date(),
      criterion: criterion.id
    };
    setMessages(prev => [...prev, tipMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="font-semibold text-gray-800 mt-2 mb-1">{line.slice(2, -2)}</div>;
      }
      if (line.startsWith('💡 **')) {
        return <div key={index} className="font-semibold text-blue-700 mt-2 mb-1">{line}</div>;
      }
      return <div key={index} className="text-gray-700">{line}</div>;
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header with Tabs */}
      <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">AI Writing Buddy</h3>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{textType}</span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Coach Chat
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'criteria'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Award className="h-4 w-4 inline mr-2" />
            NSW Criteria
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          // Chat Interface
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-100 text-blue-600' 
                      : message.type === 'tip'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : message.type === 'tip' ? (
                      <Lightbulb className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-xs lg:max-w-md ${
                    message.type === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'tip'
                        ? 'bg-yellow-50 border border-yellow-200 text-gray-800'
                        : 'bg-gray-50 border border-gray-200 text-gray-800'
                    }`}>
                      {message.type === 'user' ? (
                        <div>{message.content}</div>
                      ) : (
                        <div className="space-y-1">
                          {formatMessageContent(message.content)}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 text-gray-600 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about writing..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    disabled={isProcessing}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isProcessing}
                  className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // NSW Criteria Interface
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">NSW Selective Writing Criteria</h4>
              <p className="text-sm text-gray-600">Click on each criterion to see tips and track your progress</p>
            </div>
            
            {nswCriteria.map((criterion) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCriterion(criterion.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${criterion.color}`}>
                        {criterion.icon}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">{criterion.name}</h5>
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(criterion.maxScore)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (currentScores[criterion.id] || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {expandedCriteria.has(criterion.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
                
                {expandedCriteria.has(criterion.id) && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h6 className="font-medium text-gray-800 mb-3">Tips to improve:</h6>
                    <div className="space-y-2 mb-4">
                      {criterion.tips.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{tip}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addCriterionTip(criterion)}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Get a tip in chat</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h6 className="font-medium text-blue-800 mb-1">How to use this guide:</h6>
                  <p className="text-sm text-blue-700">
                    Each criterion is worth up to 5 points. Focus on one area at a time, and use the tips to improve your writing. 
                    Click "Get a tip in chat" to receive personalized advice!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NSWCoachPanel;