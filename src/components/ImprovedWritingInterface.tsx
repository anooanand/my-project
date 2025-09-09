import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Download, 
  HelpCircle, 
  Lightbulb, 
  BookOpen, 
  Target, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  CheckCircle,
  Star,
  Smile,
  ThumbsUp,
  Zap,
  Heart,
  Award,
  Menu,
  X
} from 'lucide-react';

interface WritingInterfaceProps {
  prompt?: string;
  writingType?: string;
  onSave?: (content: string) => void;
  onSubmit?: (content: string) => void;
}

interface WritingBuddyMessage {
  id: string;
  type: 'user' | 'buddy';
  content: string;
  timestamp: Date;
}

export function ImprovedWritingInterface({ prompt, writingType, onSave, onSubmit }: WritingInterfaceProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showWritingBuddy, setShowWritingBuddy] = useState(true);
  const [buddyMessages, setBuddyMessages] = useState<WritingBuddyMessage[]>([]);
  const [buddyInput, setBuddyInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick help suggestions for kids
  const quickSuggestions = [
    { icon: <Lightbulb className="h-4 w-4" />, text: "Give me ideas", action: "ideas" },
    { icon: <BookOpen className="h-4 w-4" />, text: "Check my spelling", action: "spelling" },
    { icon: <Target className="h-4 w-4" />, text: "Make it better", action: "improve" },
    { icon: <Sparkles className="h-4 w-4" />, text: "Add more details", action: "details" }
  ];

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: WritingBuddyMessage = {
      id: '1',
      type: 'buddy',
      content: `Hi there! I'm your Writing Buddy! 🤖✨ I'm here to help you write an amazing ${writingType || 'story'}. Just ask me anything or click the quick help buttons below!`,
      timestamp: new Date()
    };
    setBuddyMessages([welcomeMessage]);

    // Check if user needs tutorial
    const hasSeenTutorial = localStorage.getItem('writing_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [writingType]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [buddyMessages]);

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
    // Show success message
    const saveMessage: WritingBuddyMessage = {
      id: Date.now().toString(),
      type: 'buddy',
      content: "Great job! Your work has been saved! 💾✨",
      timestamp: new Date()
    };
    setBuddyMessages(prev => [...prev, saveMessage]);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(content);
    }
  };

  const handleQuickSuggestion = async (action: string) => {
    const userMessage: WritingBuddyMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: quickSuggestions.find(s => s.action === action)?.text || '',
      timestamp: new Date()
    };
    setBuddyMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    
    // Simulate AI response (in real app, this would call your AI service)
    setTimeout(() => {
      let response = '';
      switch (action) {
        case 'ideas':
          response = "Here are some ideas to help your story: Try adding more characters, describe what they look like, or tell us what they're feeling! You could also add some exciting action or a surprise twist! 🌟";
          break;
        case 'spelling':
          response = "I'll help you check your spelling! Keep writing and I'll point out any words that might need fixing. Remember, it's okay to make mistakes - that's how we learn! 📝";
          break;
        case 'improve':
          response = "To make your writing even better, try using more describing words (adjectives) and action words (verbs). Show don't tell - instead of saying 'I was happy', try 'I smiled so wide my cheeks hurt!' 🚀";
          break;
        case 'details':
          response = "Great idea! Add details about what you can see, hear, smell, taste, or touch. This helps readers feel like they're right there in your story! What colors do you see? What sounds do you hear? 🎨";
          break;
        default:
          response = "I'm here to help! What would you like to know? 😊";
      }

      const buddyResponse: WritingBuddyMessage = {
        id: (Date.now() + 1).toString(),
        type: 'buddy',
        content: response,
        timestamp: new Date()
      };
      setBuddyMessages(prev => [...prev, buddyResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!buddyInput.trim()) return;

    const userMessage: WritingBuddyMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: buddyInput,
      timestamp: new Date()
    };
    setBuddyMessages(prev => [...prev, userMessage]);
    setBuddyInput('');

    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me help you with that. 🤔",
        "I love your creativity! Here's what I think... ✨",
        "Good thinking! You're on the right track. 👍",
        "That's an interesting idea! Let's explore it together. 🔍"
      ];
      
      const buddyResponse: WritingBuddyMessage = {
        id: (Date.now() + 1).toString(),
        type: 'buddy',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setBuddyMessages(prev => [...prev, buddyResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('writing_tutorial_seen', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Your Writing Space!</h2>
              <div className="text-left space-y-3 mb-6">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <span>Write your story in the big text box</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <span>Ask your Writing Buddy for help anytime</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <span>Use the quick help buttons for instant tips</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</div>
                  <span>Save your work often!</span>
                </div>
              </div>
              <button
                onClick={dismissTutorial}
                className="kid-btn kid-btn-primary kid-btn-large"
              >
                Let's Start Writing! ✨
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        
        {/* Main Writing Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Simplified Top Toolbar */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              
              {/* Left side - Writing info */}
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {writingType ? `${writingType.charAt(0).toUpperCase() + writingType.slice(1)} Writing` : 'My Writing'}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {wordCount} words
                  </span>
                  {wordCount >= 100 && (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Good length!
                    </span>
                  )}
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-2">
                
                {/* Tools Menu - Simplified */}
                <div className="relative">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className="kid-btn kid-btn-outline flex items-center gap-2"
                  >
                    <Menu className="h-4 w-4" />
                    Tools
                    {showToolsMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showToolsMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Structure Guide
                      </button>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Writing Tips
                      </button>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Examples
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  className="kid-btn kid-btn-success flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>

                <button
                  onClick={() => setShowWritingBuddy(!showWritingBuddy)}
                  className={`kid-btn ${showWritingBuddy ? 'kid-btn-primary' : 'kid-btn-outline'} flex items-center gap-2`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Writing Buddy
                </button>
              </div>
            </div>
          </div>

          {/* Writing Prompt */}
          {prompt && (
            <div className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Your Writing Prompt:</h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{prompt}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Text Area */}
          <div className="flex-1 p-6">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your amazing story here! Don't worry about making it perfect - just let your creativity flow..."
              className="w-full h-full resize-none border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-lg leading-relaxed focus:border-blue-500 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Keep going! You're doing great! 🌟
                </span>
                {wordCount >= 50 && (
                  <div className="flex items-center text-green-600">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Nice work!</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={wordCount < 50}
                className={`kid-btn ${wordCount >= 50 ? 'kid-btn-success' : 'kid-btn-outline'} flex items-center gap-2`}
              >
                <Award className="h-4 w-4" />
                Get Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Writing Buddy Sidebar - Improved */}
        {showWritingBuddy && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            
            {/* Buddy Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <Smile className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Writing Buddy</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Your helpful AI friend</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWritingBuddy(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Quick Help Buttons */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Help:</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion.action)}
                    className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
                  >
                    {suggestion.icon}
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {buddyMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={buddyInput}
                  onChange={(e) => setBuddyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!buddyInput.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
