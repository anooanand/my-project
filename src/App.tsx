import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  TrendingUp, 
  Lightbulb,
  Send,
  PenTool,
  Eye,
  Target,
  HelpCircle,
  Play,
  CheckCircle,
  Zap,
  Brain,
  Star,
  Clock,
  FileText,
  Settings
} from 'lucide-react'

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAutomatic?: boolean;
  paragraphNumber?: number;
}

interface WritingStats {
  wordCount: number;
  charCount: number;
  readTime: number;
  qualityScore: number;
}

type TextType = 'Narrative' | 'Persuasive' | 'Expository' | 'Descriptive' | 'Creative';
type ActiveTab = 'coach' | 'analysis' | 'vocabulary' | 'progress';

function App(): JSX.Element {
  const [content, setContent] = useState<string>('')
  const [textType, setTextType] = useState<TextType>('Narrative')
  const [activeTab, setActiveTab] = useState<ActiveTab>('coach')
  const [chatInput, setChatInput] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isAIConnected, setIsAIConnected] = useState<boolean>(true) // Simulated for demo
  const [wordCount, setWordCount] = useState<number>(0)
  const [charCount, setCharCount] = useState<number>(0)
  const [readTime, setReadTime] = useState<number>(0)
  const [qualityScore, setQualityScore] = useState<number>(75)
  const [showPlanningModal, setShowPlanningModal] = useState<boolean>(false)
  const [showStructureGuide, setShowStructureGuide] = useState<boolean>(false)

  // Calculate stats
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length
    const readingTime = Math.ceil(words / 200) // Average reading speed
    
    setWordCount(words)
    setCharCount(chars)
    setReadTime(readingTime)
  }, [content])

  const handleSendMessage = (): void => {
    if (!chatInput.trim()) return
    
    const newMessage: ChatMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        text: "Great question! For narrative writing, try to show your character's emotions through their actions and thoughts rather than just telling us how they feel. This makes your story more engaging!",
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleSubmitForEvaluation = (): void => {
    alert('Your essay has been submitted for evaluation! You will receive detailed feedback shortly.')
  }

  const handleTextTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setTextType(e.target.value as TextType)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value)
  }

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setChatInput(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select 
                value={textType}
                onChange={handleTextTypeChange}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="Narrative">Narrative</option>
                <option value="Persuasive">Persuasive</option>
                <option value="Expository">Expository</option>
                <option value="Descriptive">Descriptive</option>
                <option value="Creative">Creative</option>
              </select>
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isAIConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  AI {isAIConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Writing Prompt */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Your Writing Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Write an engaging story about a character who discovers something unexpected that changes their life forever. 
              Include vivid descriptions, realistic dialogue, and show the character's emotional journey.
            </p>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPlanningModal(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Target className="w-4 h-4 mr-2" />
            Planning Phase
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Exam Mode
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStructureGuide(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          >
            <FileText className="w-4 h-4 mr-2" />
            Structure Guide
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Tips
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Focus
          </Button>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-300px)]">
          {/* Writing Area - Takes 3/5 of the space */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 p-0">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
                  className="w-full h-full p-6 border-none resize-none focus:outline-none focus:ring-0 text-base leading-relaxed font-['Inter'] bg-transparent"
                  style={{ minHeight: '500px' }}
                />
              </CardContent>
              
              {/* Writing Stats */}
              <div className="border-t p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-6">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{wordCount} words</span>
                    </span>
                    <span>{charCount} characters</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{readTime} min read</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={isAIConnected ? "default" : "secondary"}>
                      AI {isAIConnected ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button 
                      onClick={handleSubmitForEvaluation}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Evaluation Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Writing Buddy - Takes 2/5 of the space */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Writing Buddy
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Quality: {qualityScore}%</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mx-4">
                    <TabsTrigger value="coach" className="text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Coach
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="vocabulary" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Vocabulary
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Progress
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 p-4">
                    <TabsContent value="coach" className="h-full flex flex-col mt-0">
                      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <p className="text-purple-700 dark:text-purple-300 text-sm font-medium flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          I'll automatically give you AI feedback as you complete paragraphs!
                        </p>
                      </div>

                      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                        {chatMessages.map(message => (
                          <div key={message.id} className={`p-3 rounded-lg text-sm ${
                            message.sender === 'user' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ml-4' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 mr-4'
                          }`}>
                            {message.text}
                          </div>
                        ))}
                        
                        {chatMessages.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Start writing to get AI feedback!</p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={handleChatInputChange}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask your AI coach anything..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-0">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Writing Quality</h4>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-green-700 dark:text-green-400">Overall Quality:</span>
                            <span className="font-medium text-green-800 dark:text-green-300">{qualityScore}%</span>
                          </div>
                          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${qualityScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Grammar Score:</span>
                            <span className="font-medium text-green-600">85%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Vocabulary Level:</span>
                            <span className="font-medium text-blue-600">Advanced</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Structure:</span>
                            <span className="font-medium text-purple-600">Good</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="vocabulary" className="mt-0">
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Vocabulary Sophistication</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">Advanced Words:</span>
                              <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">Unique Words:</span>
                              <span className="font-medium">89%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-2">Suggested Improvements:</h5>
                          <div className="space-y-2">
                            <div className="text-xs bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
                              Try using "magnificent" instead of "big"
                            </div>
                            <div className="text-xs bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
                              Consider "whispered" instead of "said quietly"
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="progress" className="mt-0">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{wordCount}</div>
                            <div className="text-gray-600 dark:text-gray-400">Words</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">3</div>
                            <div className="text-gray-600 dark:text-gray-400">Paragraphs</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">AI Feedback:</span>
                            <span className="font-medium text-purple-600">5 tips</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Time Writing:</span>
                            <span className="font-medium">12 min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">AI Status:</span>
                            <span className={`font-medium ${isAIConnected ? 'text-green-600' : 'text-red-600'}`}>
                              {isAIConnected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Story Planning Helper</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPlanningModal(false)}
                >
                  ✕
                </Button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Let's plan your amazing story step by step!</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">Who are your characters?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Tell us about the main character in your story. What do they look like? What are they like?</p>
                <textarea
                  placeholder="Example: Sarah is a brave 12-year-old girl with curly red hair..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                  rows={4}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline">← Previous</Button>
                <Button onClick={() => setShowPlanningModal(false)} variant="destructive">Cancel</Button>
                <Button>Next →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Structure Guide Modal */}
      {showStructureGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{textType} Writing Structure</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowStructureGuide(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Narrative Story Structure</h3>
                <p className="text-blue-700 dark:text-blue-400 mb-3">A narrative tells a story with characters, setting, and events:</p>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-semibold">1. Beginning (Introduction)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">• Introduce your main character<br/>• Describe the setting (where and when)<br/>• Start with an exciting hook to grab attention</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-semibold">2. Middle (Problem & Events)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">• Present the main problem or challenge<br/>• Show what the character does to solve it<br/>• Include exciting events and dialogue</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-3">
                    <h4 className="font-semibold">3. End (Solution)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">• Show how the problem is solved<br/>• Describe how characters feel<br/>• End with a satisfying conclusion</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default App
