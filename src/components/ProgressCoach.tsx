import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, FileText, BarChart3, Target, TrendingUp, Award, Bot, User, MessageCircle, Lightbulb, Sparkles, ArrowRight, RefreshCcw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ProgressMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number;
  writingTime: number;
  targetWords: number;
  completionPercentage: number;
}

interface ProgressCoachProps {
  text: string;
  textType: 'narrative' | 'persuasive' | 'informative';
  targetWordCount?: number;
  onProgressUpdate?: (metrics: ProgressMetrics) => void;
}

interface StoryPhase {
  id: string;
  title: string;
  description: string;
  sentenceStarters: string[];
  powerWords: string[];
  sensoryDetails: {
    sight: string[];
    sound: string[];
    touch: string[];
    smell: string[];
    feelings: string[];
  };
}

interface SentenceExample {
  original: string;
  improved: string;
  explanation: string;
  type: 'clarity' | 'conciseness' | 'vocabulary' | 'structure';
}

interface FeedbackMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

const NARRATIVE_PHASES: StoryPhase[] = [
  {
    id: 'introduction',
    title: '1. Introduction: Setting the Scene',
    description: 'Introduce your main character, the setting (where and when the story takes place), and a hint of the problem or adventure to come.',
    sentenceStarters: [
      'One [adjective] morning/afternoon/evening...', 
      'In a place where [description of setting]...', 
      'Meet [character name], a [adjective] [noun] who...', 
      'Little did [character name] know that today would be different...'
    ],
    powerWords: ['suddenly', 'unexpectedly', 'curiously', 'peculiar', 'ancient', 'mysterious', 'eerie', 'sparkling', 'whispering'],
    sensoryDetails: {
      sight: ['gloomy shadows', 'flickering candlelight', 'dusty corners', 'gleaming object', 'cobweb-draped'],
      sound: ['creaking floorboards', 'distant rumble', 'soft rustle', 'heart pounding', 'silence'],
      touch: ['cold metal', 'rough wood', 'soft velvet', 'prickly bush', 'smooth stone'],
      smell: ['musty air', 'sweet scent', 'earthy aroma', 'faint perfume', 'smoky haze'],
      feelings: ['nervous', 'excited', 'curious', 'apprehensive', 'calm']
    }
  },
  {
    id: 'rising-action',
    title: '2. Rising Action: The Adventure Begins',
    description: 'The main character faces challenges, makes discoveries, and the plot thickens. Build suspense and show, don\'t just tell, what happens.',
    sentenceStarters: [
      'As [character name] ventured deeper...', 
      'Suddenly, a [event] occurred...', 
      'With a [sound/action], [character name] discovered...', 
      'The journey was fraught with [challenge]...'
    ],
    powerWords: ['bravely', 'cautiously', 'desperately', 'intense', 'perilous', 'shimmering', 'enormous', 'terrifying', 'courageous'],
    sensoryDetails: {
      sight: ['towering trees', 'winding path', 'glittering treasure', 'dark abyss', 'blinding light'],
      sound: ['howling wind', 'crashing waves', 'distant roar', 'footsteps echoing', 'gasp of surprise'],
      touch: ['sharp thorns', 'slippery rocks', 'warm embrace', 'chilling breeze', 'rough rope'],
      smell: ['fresh pine', 'salty air', 'foul odor', 'sweet blossoms', 'burning wood'],
      feelings: ['determined', 'fearful', 'hopeful', 'confused', 'exhausted']
    }
  },
  {
    id: 'climax',
    title: '3. Climax: The Turning Point',
    description: 'This is the most exciting part of your story where the main character confronts the biggest challenge or makes a crucial decision. The tension is at its peak!',
    sentenceStarters: [
      'Finally, [character name] stood before...', 
      'With a surge of [emotion], [character name]...', 
      'This was it. The moment of truth...', 
      'All at once, [event]...'
    ],
    powerWords: ['decisive', 'critical', 'momentous', 'shattering', 'overwhelming', 'triumphant', 'despair', 'furious', 'relentless'],
    sensoryDetails: {
      sight: ['blinding flash', 'crumbling walls', 'fierce glare', 'desperate struggle', 'victory in sight'],
      sound: ['deafening crash', 'piercing scream', 'triumphant shout', 'ominous silence', 'rapid heartbeat'],
      touch: ['burning heat', 'icy grip', 'shaking ground', 'painful blow', 'gentle touch'],
      smell: ['acrid smoke', 'sweet victory', 'metallic tang', 'fresh rain', 'fear in the air'],
      feelings: ['terrified', 'exhilarated', 'resolved', 'defeated', 'victorious']
    }
  },
  {
    id: 'resolution',
    title: '4. Resolution: Tying Up Loose Ends',
    description: 'Show how the character has changed and what happens after the main problem is solved. Conclude your story by reflecting on the adventure.',
    sentenceStarters: [
      'After the dust settled...', 
      'With a newfound sense of [emotion]...', 
      'Life in [setting] was never the same...', 
      'From that day forward, [character name]...'
    ],
    powerWords: ['transformed', 'reflecting', 'peaceful', 'content', 'grateful', 'wiser', 'haunting', 'cherished', 'legacy'],
    sensoryDetails: {
      sight: ['calm waters', 'setting sun', 'familiar faces', 'new beginnings', 'scarred landscape'],
      sound: ['gentle breeze', 'birds chirping', 'laughter echoing', 'soft whispers', 'peaceful quiet'],
      touch: ['warm sunlight', 'comforting hug', 'soft grass', 'cool breeze', 'gentle rain'],
      smell: ['fresh baked bread', 'clean air', 'fragrant flowers', 'old memories', 'new hope'],
      feelings: ['relieved', 'satisfied', 'changed', 'thoughtful', 'hopeful']
    }
  }
];

const SAMPLE_SENTENCE_EXAMPLES: SentenceExample[] = [
  {
    original: 'The student wrote a good essay.',
    improved: 'The diligent student crafted a compelling essay.',
    explanation: 'Replaced \'good\' with \'compelling\' and added \'diligent\' to describe the student, enhancing vocabulary and impact.',
    type: 'vocabulary',
  },
  {
    original: 'Because of the fact that it was raining, we stayed inside.',
    improved: 'As it was raining, we stayed inside.',
    explanation: 'Simplified the phrase \'Because of the fact that\' to \'As\', making the sentence more concise.',
    type: 'conciseness',
  },
  {
    original: 'He was very sad when his pet died.',
    improved: 'A profound sorrow enveloped him upon the demise of his beloved pet.',
    explanation: 'Used more sophisticated vocabulary (profound sorrow, enveloped, demise) and a more formal structure.',
    type: 'vocabulary',
  },
  {
    original: 'The book was interesting to read.',
    improved: 'The book offered a captivating narrative, engaging readers from the very first page.',
    explanation: 'Provided more specific details about why the book was interesting and improved sentence structure.',
    type: 'structure',
  },
];

const ProgressCoach: React.FC<ProgressCoachProps> = ({
  text,
  textType,
  targetWordCount = 300,
  onProgressUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'coach' | 'toolkit'>('coach');
  const [expandedPhases, setExpandedPhases] = useState<{ [key: string]: boolean }>({});
  const [chatMessages, setChatMessages] = useState<FeedbackMessage[]>([
    {
      id: '1',
      text: 'Hi I\'m your AI Writing Buddy! 🤖 I\'m here to help you write amazing stories. Ask me anything about writing, or just start typing and I\'ll give you feedback!',
      timestamp: new Date(),
      isUser: false
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [metrics, setMetrics] = useState<ProgressMetrics>({
    wordCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    readingTime: 0,
    writingTime: 0,
    targetWords: targetWordCount,
    completionPercentage: 0
  });
  const [startTime] = useState(Date.now());

  // Calculate metrics from text
  useEffect(() => {
    const calculateMetrics = () => {
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      const wordCount = words.length;
      const sentenceCount = sentences.length;
      const paragraphCount = Math.max(paragraphs.length, wordCount > 0 ? 1 : 0);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      const writingTime = Math.floor((Date.now() - startTime) / 60000); // Minutes
      const completionPercentage = Math.min((wordCount / targetWordCount) * 100, 100);

      const newMetrics = {
        wordCount,
        sentenceCount,
        paragraphCount,
        readingTime,
        writingTime,
        targetWords: targetWordCount,
        completionPercentage
      };

      setMetrics(newMetrics);
      onProgressUpdate?.(newMetrics);
    };

    calculateMetrics();
  }, [text, targetWordCount, startTime, onProgressUpdate]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: FeedbackMessage = {
        id: Date.now().toString(),
        text: newMessage,
        timestamp: new Date(),
        isUser: true
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: FeedbackMessage = {
          id: (Date.now() + 1).toString(),
          text: generateAIResponse(newMessage),
          timestamp: new Date(),
          isUser: false
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
      
      setNewMessage('');
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "That's a great question! 🌟 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "What a captivating start! 🎭 To make your paragraph even more engaging, try adding a few descriptive words. For example, describe the sounds of the whispering or the colors of the flickering light. This will help readers feel more immersed in your magical forest! Keep it up!",
      "I love your creativity! ✨ Try to identify sentences in your writing that could be improved using these techniques!",
      "Great work! 📝 Remember to vary your sentence length to keep readers engaged. Mix short, punchy sentences with longer, more descriptive ones.",
      "Excellent progress! 🚀 Don't forget to use the 'show, don't tell' technique - instead of saying 'he was scared', describe his trembling hands or racing heart."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleApplyImprovement = (original: string, improved: string) => {
    // This would typically update the text in the main editor
    console.log('Applying improvement:', { original, improved });
    
    // Add a chat message about the improvement
    const improvementMessage: FeedbackMessage = {
      id: Date.now().toString(),
      text: `Great! I've suggested changing "${original}" to "${improved}". This makes your writing more sophisticated and engaging! 🎯`,
      timestamp: new Date(),
      isUser: false
    };
    setChatMessages(prev => [...prev, improvementMessage]);
  };

  const renderCoachTab = () => (
    <div className="space-y-4">
      {/* Writing Buddy Chat */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="p-4 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">💬 Writing Buddy Chat</h3>
          </div>
        </div>
        
        <div className="p-4">
          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto mb-4 space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.isUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {!message.isUser && <Bot className="h-4 w-4 mt-0.5 text-blue-600" />}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.isUser && <User className="h-4 w-4 mt-0.5 text-blue-100" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Questions */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How can I improve my introduction?",
                "What's a good synonym for 'said'?",
                "Help me with my conclusion",
                "How do I make my characters more interesting?",
                "What makes a good story hook?"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setNewMessage(question)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
          
          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about writing..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Send
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            💡 Feedback given: 1 • Words: 132 • Last: 10:23 PM
          </p>
        </div>
      </div>
    </div>
  );

  const renderToolkitTab = () => (
    <div className="space-y-6">
      {/* Story Adventure Mission: Narrative Structure */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="p-4 border-b border-green-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">📚 Story Adventure Mission: Narrative Structure</h3>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {NARRATIVE_PHASES.map((phase) => (
            <div key={phase.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{phase.title}</span>
                {expandedPhases[phase.id] ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {expandedPhases[phase.id] && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-3">{phase.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Sentence Starters:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {phase.sentenceStarters.map((starter, index) => (
                          <li key={index}>• {starter}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Power Words:</h5>
                      <div className="flex flex-wrap gap-1">
                        {phase.powerWords.map((word, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sentence Improvement Lab */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <div className="p-4 border-b border-yellow-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">🔬 Sentence Improvement Lab</h3>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">
            See how you can transform simple sentences into more impactful and sophisticated ones.
          </p>

          {SAMPLE_SENTENCE_EXAMPLES.map((example, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="mb-2">
                <p className="font-medium text-gray-700 text-sm">Original:</p>
                <p className="text-red-600 italic text-sm">"{example.original}"</p>
              </div>
              <div className="mb-2 flex items-center space-x-2">
                <p className="font-medium text-gray-700 text-sm">Improved:</p>
                <ArrowRight className="h-4 w-4 text-green-600" />
                <p className="text-green-600 italic text-sm">"{example.improved}"</p>
              </div>
              <div className="mb-2">
                <p className="font-medium text-gray-700 text-sm">Explanation:</p>
                <p className="text-gray-600 text-xs">{example.explanation}</p>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleApplyImprovement(example.original, example.improved)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Apply Suggestion</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-800">💡 Pro Tip</span>
        </div>
        <p className="text-sm text-purple-700">
          Try to identify sentences in your writing that could be improved using these techniques!
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 p-1">
          {[
            { id: 'coach', label: 'Coach - Interactive AI chat and real-time feedback', color: 'purple' },
            { id: 'toolkit', label: 'Toolkit - Narrative structure guide + sentence improvement lab', color: 'blue' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1 text-left ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-200`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'coach' && renderCoachTab()}
        {activeTab === 'toolkit' && renderToolkitTab()}
      </div>
    </div>
  );
};

export default ProgressCoach;